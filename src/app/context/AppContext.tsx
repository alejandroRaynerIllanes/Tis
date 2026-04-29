// src/app/context/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { io } from 'socket.io-client'
import { getToken } from '../services/api'
import type {
  Product,
  ProductStatus,
  Table,
  TableStatus,
  OrderItem,
  ReservationInfo
} from '../types'
import { defaultProducts, defaultTables } from '../data/mock-data'
import { tablesService } from '../services/tables.service'
import { VIP_CLIENT_NAMES } from '../data/constants'
import {
  calculateReservationDuration,
  calculateEndTime,
  timesOverlap,
  getCurrentActiveReservation
} from '../utils/reservations'

// Re-export types for backward compatibility
export type { Product, ProductStatus, Table, TableStatus, OrderItem, ReservationInfo }

interface AppContextType {
  products: Product[]
  tables: Table[]
  orders: Record<string, OrderItem[]>
  reservations: Record<string, ReservationInfo[]>
  updateProductStatus: (id: string, status: ProductStatus) => void
  updateTableStatus: (id: string, status: TableStatus) => void
  addOrderItem: (tableId: string, product: Product) => void
  removeOrderItem: (tableId: string, productId: string) => void
  clearOrder: (tableId: string) => void
  resetTableOrder: (tableId: string) => void
  updateOrderItemNote: (tableId: string, productId: string, note: string) => void
  confirmOrder: (tableId: string) => void
  requestBill: (tableId: string) => void
  closeTable: (tableId: string) => void
  reserveTable: (tableId: string, info: Omit<ReservationInfo, 'id' | 'endTime'>) => void
  cancelReservation: (tableId: string, reservationId: string) => void
  getActiveReservation: (tableId: string) => ReservationInfo | null
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  setTables: React.Dispatch<React.SetStateAction<Table[]>>
  createTable: (payload: {
    name: string
    capacity: number
    location: string
    type?: string
  }) => Promise<any>
  updateTable: (
    id: string,
    payload: { name?: string; capacity?: number; location?: string; type?: string }
  ) => Promise<any>
  deleteTable: (id: string) => Promise<boolean>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [tables, setTables] = useState<Table[]>(defaultTables)
  const [orders, setOrders] = useState<Record<string, OrderItem[]>>({})
  const [reservations, setReservations] = useState<Record<string, ReservationInfo[]>>({})

  // Cargar mesas desde backend al montar (solo si hay token)
  useEffect(() => {
    let mounted = true
    const token = getToken()
    if (!token) {
      // Evitar peticiones que devuelvan 401 cuando no esté autenticado
      return () => {
        mounted = false
      }
    }

    ;(async () => {
      try {
        const fetched = await tablesService.getAll()
        if (mounted && Array.isArray(fetched)) {
          setTables(fetched)
        }
      } catch (err) {
        console.warn('No se pudieron cargar mesas desde backend, usando datos locales', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const getTableId = (table: any) => table?.id || table?._id

  // Socket.io: sincronizar mesas en tiempo real (solo si hay token)
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const baseApi = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const socketUrl = baseApi.replace(/\/api\/?$/, '')
    let socket: any = null

    try {
      socket = io(socketUrl, { auth: { token } })
      socket.on('connect', () => console.log('Socket connected', socket.id))

      socket.on('mesas:created', (payload: any) => {
        setTables((current) => {
          const items = Array.isArray(payload) ? payload : [payload]
          const existingIds = new Set(current.map((t: any) => getTableId(t)))
          const additions = items.filter((item: any) => !existingIds.has(getTableId(item)))
          if (additions.length === 0) return current
          return [...current, ...additions.map((item: any) => ({ ...item, id: getTableId(item) }))]
        })
      })

      socket.on('mesas:updated', (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload]
        setTables((current) => {
          const next = [...current]
          items.forEach((item: any) => {
            const itemId = getTableId(item)
            const index = next.findIndex((t: any) => getTableId(t) === itemId)
            if (index !== -1) {
              next[index] = { ...item, id: itemId }
            } else {
              next.push({ ...item, id: itemId })
            }
          })
          return next
        })
      })

      socket.on('mesas:deleted', (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload]
        const idsToRemove = new Set(items.map((item: any) => getTableId(item)))
        setTables((current) => current.filter((t: any) => !idsToRemove.has(getTableId(t))))
      })
    } catch (err) {
      console.warn('Socket init failed', err)
    }

    return () => {
      try {
        socket?.disconnect()
      } catch (e) {}
    }
  }, [])

  const updateProductStatus = (id: string, status: ProductStatus) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const addTableIfMissing = (newTable: Table) => {
    const newId = getTableId(newTable)
    setTables((current) => {
      if (current.some((t) => getTableId(t) === newId)) {
        return current
      }
      return [...current, { ...newTable, id: newId }]
    })
  }

  const mergeTable = (newTable: Table) => {
    const newId = getTableId(newTable)
    setTables((current) => {
      const exists = current.some((t) => getTableId(t) === newId)
      if (exists) {
        return current.map((t) => (getTableId(t) === newId ? { ...newTable, id: newId } : t))
      }
      return [...current, { ...newTable, id: newId }]
    })
  }

  const updateTableStatus = (id: string, status: TableStatus) => {
    // Actualización optimista en frontend
    setTables((current) => current.map((t) => (t.id === id ? { ...t, status } : t)))

    // Persistir en backend (no await para mantener UX responsiva)
    tablesService
      .updateState(id, status)
      .then((updated) => {
        if (updated) {
          mergeTable(updated)
        }
      })
      .catch((err) => {
        console.error('Error actualizando estado de mesa:', err)
      })
  }

  const createTable = async (payload: {
    name: string
    capacity: number
    location: string
    type?: string
  }) => {
    try {
      const created = await tablesService.create({
        name: payload.name,
        capacity: payload.capacity,
        location: payload.location,
        type: payload.type
      })
      addTableIfMissing(created)
      return created
    } catch (err) {
      console.error('Error creando mesa:', err)
      throw err
    }
  }

  const updateTable = async (
    id: string,
    payload: { name?: string; capacity?: number; location?: string; type?: string }
  ) => {
    try {
      const updated = await tablesService.update(id, payload)
      setTables((current) => current.map((t) => (t.id === id ? updated : t)))
      return updated
    } catch (err) {
      console.error('Error actualizando mesa:', err)
      throw err
    }
  }

  const deleteTable = async (id: string) => {
    try {
      await tablesService.remove(id)
      setTables((current) => current.filter((t) => t.id !== id))
      return true
    } catch (err) {
      console.error('Error eliminando mesa:', err)
      throw err
    }
  }

  const addOrderItem = (tableId: string, product: Product) => {
    setOrders((prev) => {
      const tableOrder = prev[tableId] || []
      const existingItem = tableOrder.find((item) => item.product.id === product.id)

      if (existingItem) {
        return {
          ...prev,
          [tableId]: tableOrder.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        }
      }
      return {
        ...prev,
        [tableId]: [...tableOrder, { product, quantity: 1 }]
      }
    })
  }

  const removeOrderItem = (tableId: string, productId: string) => {
    setOrders((prev) => {
      const tableOrder = prev[tableId] || []
      const updatedOrder = tableOrder
        .map((item) => {
          if (item.product.id === productId) {
            return { ...item, quantity: item.quantity - 1 }
          }
          return item
        })
        .filter((item) => item.quantity > 0)

      if (updatedOrder.length === 0) {
        setTimeout(() => {
          setReservations((currentReservations) => {
            const hasReservations =
              currentReservations[tableId] && currentReservations[tableId].length > 0

            if (!hasReservations) {
              setTables((current) =>
                current.map((t) => (t.id === tableId ? { ...t, status: 'Disponible' } : t))
              )
            }

            return currentReservations
          })
        }, 0)
      }

      return {
        ...prev,
        [tableId]: updatedOrder
      }
    })
  }

  const clearOrder = (tableId: string) => {
    setOrders((prev) => {
      const newOrders = { ...prev }
      delete newOrders[tableId]
      return newOrders
    })

    setTimeout(() => {
      setReservations((currentReservations) => {
        const hasReservations =
          currentReservations[tableId] && currentReservations[tableId].length > 0

        if (!hasReservations) {
          setTables((current) =>
            current.map((t) => (t.id === tableId ? { ...t, status: 'Disponible' } : t))
          )
        }

        return currentReservations
      })
    }, 0)
  }

  const resetTableOrder = (tableId: string) => {
    setOrders((prev) => {
      const newOrders = { ...prev }
      delete newOrders[tableId]
      return newOrders
    })
  }

  const updateOrderItemNote = (tableId: string, productId: string, note: string) => {
    setOrders((prev) => {
      const tableOrder = prev[tableId] || []
      return {
        ...prev,
        [tableId]: tableOrder.map((item) =>
          item.product.id === productId ? { ...item, note } : item
        )
      }
    })
  }

  const confirmOrder = (tableId: string) => {
    const tableOrder = orders[tableId]
    if (tableOrder && tableOrder.length > 0) {
      updateTableStatus(tableId, 'Ocupada')
    }
  }

  const requestBill = (tableId: string) => {
    updateTableStatus(tableId, 'Esperando pago')
  }

  const closeTable = (tableId: string) => {
    updateTableStatus(tableId, 'Disponible')
    setOrders((prev) => {
      const newOrders = { ...prev }
      delete newOrders[tableId]
      return newOrders
    })
  }

  const reserveTable = (tableId: string, info: Omit<ReservationInfo, 'id' | 'endTime' | 'vip'>) => {
    const isVipClient = VIP_CLIENT_NAMES.includes(info.clientName.toLowerCase().trim())

    const table = tables.find((t) => t.id === tableId)
    const tableType = table?.type || 'normal'

    if (tableType === 'vip' && !isVipClient) {
      const isVipZone = table?.location === 'zona-vip'
      const errorMessage = isVipZone
        ? 'Solo clientes VIP pueden reservar en Zona VIP'
        : 'Solo clientes VIP pueden reservar esta mesa'
      throw new Error(errorMessage)
    }

    const duration = calculateReservationDuration(info.guestCount)
    const endTime = calculateEndTime(info.startTime, duration)
    const reservationId = `${tableId}-${Date.now()}`

    const newReservation: ReservationInfo = {
      id: reservationId,
      clientName: info.clientName,
      guestCount: info.guestCount,
      date: info.date,
      startTime: info.startTime,
      endTime,
      vip: isVipClient
    }

    const existingReservations = reservations[tableId] || []
    const hasOverlap = existingReservations.some((existing) => {
      if (existing.date !== info.date) return false
      return timesOverlap(existing.startTime, existing.endTime, info.startTime, endTime)
    })

    if (hasOverlap) {
      throw new Error('Ya existe una reserva en este horario')
    }

    setReservations((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), newReservation]
    }))

    setTables((current) =>
      current.map((t) => (t.id === tableId ? { ...t, status: 'Reservada' } : t))
    )
  }

  const cancelReservation = (tableId: string, reservationId: string) => {
    setReservations((prev) => {
      const tableReservations = prev[tableId] || []
      const updatedReservations = tableReservations.filter((r) => r.id !== reservationId)

      if (updatedReservations.length === 0) {
        const next = { ...prev }
        delete next[tableId]
        return next
      }

      return {
        ...prev,
        [tableId]: updatedReservations
      }
    })

    const remainingReservations = (reservations[tableId] || []).filter(
      (r) => r.id !== reservationId
    )

    if (remainingReservations.length === 0) {
      setOrders((prev) => {
        const next = { ...prev }
        delete next[tableId]
        return next
      })
      setTables((current) =>
        current.map((t) => (t.id === tableId ? { ...t, status: 'Disponible' } : t))
      )
    }
  }

  const getActiveReservation = (tableId: string): ReservationInfo | null => {
    const tableReservations = reservations[tableId]
    if (!tableReservations) return null

    const now = new Date()
    return getCurrentActiveReservation(tableReservations, now)
  }

  const contextValue = {
    products,
    tables,
    orders,
    reservations,
    updateProductStatus,
    updateTableStatus,
    addOrderItem,
    removeOrderItem,
    clearOrder,
    resetTableOrder,
    updateOrderItemNote,
    confirmOrder,
    requestBill,
    closeTable,
    reserveTable,
    cancelReservation,
    getActiveReservation,
    setProducts,
    setTables,
    createTable,
    updateTable,
    deleteTable
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}
