import React, { createContext, useContext, useState, ReactNode } from 'react'
import type {
  Product,
  ProductStatus,
  Table,
  TableStatus,
  OrderItem,
  ReservationInfo
} from '../types'
import { defaultProducts, defaultTables } from '../data/mock-data'
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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(defaultProducts)
  const [tables, setTables] = useState<Table[]>(defaultTables)
  const [orders, setOrders] = useState<Record<string, OrderItem[]>>({})
  const [reservations, setReservations] = useState<Record<string, ReservationInfo[]>>({})

  const updateProductStatus = (id: string, status: ProductStatus) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const updateTableStatus = (id: string, status: TableStatus) => {
    setTables(tables.map((t) => (t.id === id ? { ...t, status } : t)))
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
    setTables
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
