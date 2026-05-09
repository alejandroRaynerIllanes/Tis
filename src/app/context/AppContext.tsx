import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { getToken, api } from '../services/api'
import { toast } from 'sonner'
import type {
  Product,
  ProductStatus,
  Table,
  TableStatus,
  OrderItem,
  ReservationInfo
} from '../types'
import { tablesService } from '../services/tables.service'
import { reservationsService } from '../services/reservations.service'
import { platosService } from '../services/platos.service'
import { ordersService } from '../services/orders.service'
import {
  calculateReservationDuration,
  calculateEndTime,
  timesOverlap,
  getCurrentActiveReservation
} from '../utils/reservations'

// Re-export types for backward compatibility
export type { Product, ProductStatus, Table, TableStatus, OrderItem, ReservationInfo }

export interface AppNotification {
  id: string
  title: string
  message: string
  time: Date
  read: boolean
  type: 'success' | 'warning'
  meta?: {
    pedidoId?: string
    tableId?: string
    actionType?: 'deliver_order' | 'process_payment'
  }
}

interface AppContextType {
  products: Product[]
  tables: Table[]
  orders: Record<string, OrderItem[]>
  reservations: Record<string, ReservationInfo[]>
  notifications: AppNotification[]
  updateProductStatus: (id: string, status: ProductStatus) => void
  updateTableStatus: (id: string, status: TableStatus) => void
  addOrderItem: (tableId: string, product: Product) => void
  removeOrderItem: (tableId: string, productId: string) => void
  clearOrder: (tableId: string) => void
  resetTableOrder: (tableId: string) => void
  updateOrderItemNote: (tableId: string, productId: string, note: string) => void
  confirmOrder: (tableId: string) => Promise<void>
  requestBill: (tableId: string) => void
  closeTable: (tableId: string) => void
  reserveTable: (tableId: string, info: Omit<ReservationInfo, 'id' | 'endTime'>) => void
  cancelReservation: (tableId: string, reservationId: string) => void
  getActiveReservation: (tableId: string) => ReservationInfo | null
  markNotificationAsRead: (id: string) => void
  clearNotifications: () => void
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
  loadInitialData: () => Promise<void>
}

const validarNombreMesa = (nombre: string): { valido: boolean; mensaje?: string } => {
  if (!nombre) return { valido: false, mensaje: 'El nombre de la mesa es requerido.' }
  const nom = nombre.toLowerCase().trim()

  if (nombre.length > 25) {
    return { valido: false, mensaje: 'El identificador de mesa no puede superar los 25 caracteres.' }
  }

  // 1. Caracteres especiales (solo letras, números y espacios)
  const regexEspeciales = /^[a-záéíóúñ0-9\s]+$/i
  if (!regexEspeciales.test(nom)) {
    return { valido: false, mensaje: 'No se permiten símbolos especiales.' }
  }
  // 2. Palabra clave
  if (!nom.includes('mesa')) {
    return { valido: false, mensaje: 'El nombre debe incluir la palabra "mesa".' }
  }
  // 3. Ubicación válida
  const ubicaciones = ['interior', 'patio', 'terraza']
  if (!ubicaciones.some((ub) => nom.includes(ub))) {
    return { valido: false, mensaje: 'El nombre debe incluir una ubicación válida (interior, patio, terraza).' }
  }
  // 4. Validación numérica (máximo 3 dígitos, no mayor a 50)
  const numeros = nom.match(/\d+/g)
  if (numeros) {
    for (const numStr of numeros) {
      if (numStr.length > 3) return { valido: false, mensaje: 'No se permiten más de 3 dígitos numéricos consecutivos.' }
      if (parseInt(numStr, 10) > 50) return { valido: false, mensaje: 'El número de mesa no puede ser mayor a 50.' }
    }
  }
  return { valido: true }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [orders, setOrders] = useState<Record<string, OrderItem[]>>({})
  const [reservations, setReservations] = useState<Record<string, ReservationInfo[]>>({})
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const socketRef = useRef<any>(null)

  // 🚀 REPARACIÓN CRÍTICA: Función para inicializar Sockets SOLO cuando ya hay sesión
  const initSocket = useCallback(() => {
    const token = getToken()
    if (!token) return // Si no hay token, aborta

    if (socketRef.current) {
      // Actualizamos el token en la instancia existente por si el usuario cambió de sesión
      socketRef.current.auth = { token }
      if (!socketRef.current.connected) {
        console.log('🔄 Forzando reconexión del socket...');
        socketRef.current.connect()
      }
      return
    }

    const baseApi = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api'
    const socketUrl = baseApi.replace(/\/api\/?$/, '')

    try {
      const socket = io(socketUrl, { 
        auth: { token },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000
      })
      socketRef.current = socket
      socket.on('connect', () => console.log('🟢 Socket conectado correctamente:', socket.id))
      socket.on('disconnect', (reason) => console.warn('🔴 Socket desconectado:', reason))

      socket.on('mesas:created', (payload: any) => {
        setTables((current) => {
          const items = Array.isArray(payload) ? payload : [payload]
          const existingIds = new Set(current.map((t: any) => getTableId(t)))
          const additions = items.filter((item: any) => !existingIds.has(getTableId(item)))
          if (additions.length === 0) return current
          return [...current, ...additions.map(normalizarMesa)]
        })
      })

      socket.on('mesas:updated', (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload]
        items.forEach((item: any) => {
          const newStatus = item.status || item.estado
          if (newStatus === 'Cuenta Solicitada' || newStatus === 'Esperando pago') {
            toast.info('¡Atención: Cuenta Solicitada!', {
              description: `La ${item.name || item.numero || 'Mesa'} está esperando para pagar.`,
              duration: 8000,
              icon: '💳'
            })
            setNotifications((prev) => [{
              id: Date.now().toString() + Math.random(),
              title: 'Cuenta Solicitada',
              message: `La ${item.name || item.numero || 'Mesa'} está esperando para pagar.`,
              time: new Date(),
              read: false,
              type: 'warning',
              meta: {
                tableId: item.id || item._id || item.numero,
                actionType: 'process_payment'
              }
            }, ...prev])
          }
        })

        setTables((current) => {
          const next = [...current]
          items.forEach((item: any) => {
            const itemId = getTableId(item)
            const index = next.findIndex((t: any) => getTableId(t) === itemId)
            if (index !== -1) {
              const existing = next[index]
              next[index] = {
                ...existing,
                status: item.status || item.estado || existing.status,
                name: item.name || item.numero || existing.name,
                capacity: item.capacity || item.capacidad || existing.capacity,
                location: item.location || (typeof item.ubicacion === 'object' ? item.ubicacion?.nombre : item.ubicacion) || existing.location,
                type: item.type || item.tipo || existing.type,
                locationId: item.locationId || (typeof item.ubicacion === 'object' ? item.ubicacion?._id?.toString() : item.ubicacion) || item.location || (existing as any).locationId
              } as any
            } else {
              next.push(normalizarMesa(item))
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

      socket.on('mesas:alerta_listo', (payload: any) => {
        console.log('🔔 [WEBSOCKET] Alerta de pedido listo recibida en frontend:', payload);
        toast.success('¡Pedido Listo para Recoger!', {
          description: `El plato para la Mesa ${payload.mesaNombre || '?'} ya está terminado en cocina.`,
          duration: 15000,
          icon: '🔔',
          action: {
            label: '✔ Entregado',
            onClick: () => { 
              ordersService.updateStatus(payload.pedidoId, 'SERVIDO')
                .then(() => toast.success('Pedido entregado', { description: 'Ya puedes cobrar la cuenta.' }))
                .catch(console.error) 
            }
          }
        })
        setNotifications((prev) => {
          // Evitar duplicar notificaciones idénticas si el socket dispara dos veces rápido
          if (prev.some(n => n.meta?.pedidoId === payload.pedidoId && n.title === 'Pedido Listo')) return prev;
          return [{
            id: Date.now().toString() + Math.random(),
            title: 'Pedido Listo',
            message: `El plato de la Mesa ${payload.mesaNombre || '?'} ya está terminado en cocina.`,
            time: new Date(),
            read: false,
            type: 'success',
            meta: {
              pedidoId: payload.pedidoId,
              tableId: payload.mesaId,
              actionType: 'deliver_order'
            }
          }, ...prev]
        })
      })

      socket.on('nueva_reserva', (r: any) => {
        const { tableId, resInfo } = normalizarReserva(r)
        setReservations((prev) => ({ ...prev, [tableId]: [...(prev[tableId] || []), resInfo] }))
        toast.success('Nueva Reserva Asignada', { description: `${resInfo.clientName} ha reservado para las ${resInfo.startTime}`, duration: 10000, icon: '📅' })
        setNotifications((prev) => [{ id: Date.now().toString() + Math.random(), title: 'Nueva Reserva', message: `El cliente ${resInfo.clientName} tiene una reserva asignada a las ${resInfo.startTime}.`, time: new Date(), read: false, type: 'success' }, ...prev])
      })

      socket.on('reserva_eliminada', (payload: { id: string, tableId: string }) => {
        setReservations((prev) => {
          const currentTableRes = prev[payload.tableId] || []
          return { ...prev, [payload.tableId]: currentTableRes.filter(r => r.id !== payload.id) }
        })
      })
    } catch (err) {
      console.warn('Socket init failed', err)
    }
  }, [])

  // Cargador maestro sincronizado
  const loadInitialData = useCallback(async () => {
    const token = getToken()
    if (!token) return

    // Conectamos el socket justo cuando estamos seguros de que tenemos sesión
    initSocket()

    try {
      const [fetchedTables, fetchedProducts, fetchedOrders, fetchedReservations] = await Promise.all([
        tablesService.getAll(),
        platosService.getAll(),
        ordersService.getAll().catch(() => []), // Evita fallos si no hay ordenes
        reservationsService.getAll().catch(() => [])
      ])

      if (Array.isArray(fetchedTables)) {
        setTables(fetchedTables.map(normalizarMesa))
      }

      if (Array.isArray(fetchedProducts)) {
        const formattedProducts = fetchedProducts.map((p: any) => ({
          id: p._id || p.id,
          name: p.nombre || p.name || 'Plato',
          description: p.descripcion || p.description || '',
          price: p.precio || p.price || 0,
          image: p.imagenUrl || p.imagen || p.image || '',
          category: typeof p.categoria === 'object' && p.categoria !== null ? p.categoria.nombre || p.categoria._id : p.categoria || 'General',
          status: ((p.disponible === false || p.estado === false || p.estado === 'Inactivo') ? 'Agotado' : 'Disponible') as ProductStatus
        }))
        setProducts(formattedProducts)
      }

      // Sincronizar órdenes activas desde el backend
      if (Array.isArray(fetchedOrders)) {
        const activeOrders = fetchedOrders.filter((o: any) => o.estado === 'ABIERTO' || o.estado === 'EN_PREPARACION' || o.estado === 'ENTREGADO' || o.estado === 'SERVIDO')
        const ordersMap: Record<string, OrderItem[]> = {}
        
        activeOrders.forEach((o: any) => {
          const tId = o.mesa?._id || o.mesa?.id || o.mesa
          if (!tId) return
          if (!ordersMap[tId]) ordersMap[tId] = []
          
          o.detalles?.forEach((d: any) => {
            const productId = d.plato?._id || d.plato || 'unknown'
            const product: Product = {
              id: productId,
              name: d.plato?.nombre || 'Plato',
              description: d.plato?.descripcion || '',
              price: d.precioUnitario || d.plato?.precio || 0,
              image: d.plato?.imagenUrl || d.plato?.imagen || '',
              category: d.plato?.categoria?.nombre || 'General',
              status: 'Disponible'
            }
            
            // Evitar duplicación visual: si el plato ya está en la lista de esta mesa, solo sumamos la cantidad
            const existingItem = ordersMap[tId].find(item => item.product.id === productId)
            if (existingItem) {
              existingItem.quantity += (d.cantidad || 1)
              if (d.observacion) existingItem.note = existingItem.note ? `${existingItem.note} | ${d.observacion}` : d.observacion
            } else {
              ordersMap[tId].push({ product, quantity: d.cantidad || 1, note: d.observacion || '' })
            }
          })
        })
        setOrders(ordersMap)
      }

      // Sincronizar reservas activas desde el backend
      if (Array.isArray(fetchedReservations)) {
        const resMap: Record<string, ReservationInfo[]> = {}
        fetchedReservations.forEach((r: any) => {
          const { tableId, resInfo } = normalizarReserva(r)
          if (!tableId) return
          if (!resMap[tableId]) resMap[tableId] = []
          resMap[tableId].push(resInfo)
        })
        setReservations(resMap)
      }
    } catch (err) {
      console.warn('Error cargando datos iniciales:', err)
    }
  }, [])

  // Cargar mesas desde backend al montar (solo si hay token)
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const getTableId = (table: any) => table?.id || table?._id

  const normalizarReserva = (r: any) => {
    const tId = r.mesa?._id || r.mesa?.id || r.mesa || ''
    let dateStr = ''
    try {
      if (r.date && typeof r.date === 'string') dateStr = r.date.split('T')[0]
      else if (r.fecha) dateStr = new Date(r.fecha).toISOString().split('T')[0]
    } catch (e) {
      dateStr = new Date().toISOString().split('T')[0] // Fallback seguro
    }

    const duration = calculateReservationDuration(r.guestCount || r.cantidadPersonas || 1)
    const startTime = r.time || r.hora || '00:00'

    const resInfo: ReservationInfo = {
      id: (r.id || r._id)?.toString() || '',
      clientName: r.clientName || r.clienteNombre || 'Sin nombre',
      guestCount: r.guestCount || r.cantidadPersonas || 1,
      date: dateStr,
      startTime,
      endTime: calculateEndTime(startTime, duration),
      vip: Boolean(r.vip)
    }
    return { tableId: tId.toString(), resInfo }
  }

  // ─── Añadir después de getTableId (línea 92) ─────────────────────────────────
  const normalizarMesa = (item: any): Table => {
    const rawStatus = item?.status || item?.estado || 'Libre'
    const status: TableStatus =
      rawStatus === 'Libre' ? 'Disponible'
      : rawStatus === 'Cuenta Solicitada' ? 'Esperando pago'
      : rawStatus

    return {
      id: (item?.id || item?._id)?.toString(),
      name: item?.name || item?.numero || '—',
      capacity: item?.capacity ?? item?.capacidad ?? 2,
      location:
        typeof item?.ubicacion === 'object'
          ? item?.ubicacion?.nombre || item?.ubicacion?._id?.toString() || ''
          : item?.location || item?.ubicacion || '',
      type: item?.type || item?.tipo || 'normal',
      status,
      locationId: item?.locationId || (typeof item?.ubicacion === 'object' ? item?.ubicacion?._id?.toString() : item?.ubicacion) || item?.location
    } as any
  }

  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const updateProductStatus = (id: string, status: ProductStatus) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const addTableIfMissing = (newTable: Table) => {
    const newId = getTableId(newTable)
    setTables((current) => {
      if (current.some((t) => getTableId(t) === newId)) {
        return current
      }
      return [...current, normalizarMesa(newTable)] // También aplicado aquí por precaución
    })
  }

  const mergeTable = (newTable: Table) => {
    const newId = getTableId(newTable)
    setTables((current) => {
      const exists = current.some((t) => getTableId(t) === newId)
      // ✅ CORRECCIÓN: mergeTable
      if (exists) {
        return current.map((t) => (getTableId(t) === newId ? normalizarMesa(newTable) : t))
      }
      return [...current, normalizarMesa(newTable)]
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
    const validacion = validarNombreMesa(payload.name)
    if (!validacion.valido) {
      toast.error(validacion.mensaje)
      throw new Error(validacion.mensaje)
    }

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
      // Limpiamos el prefijo "Error: " si viene desde el interceptor de la API
      const errMsg = ((err as any)?.response?.data?.mensaje || (err as any)?.message || 'Error al crear la mesa').replace(/^Error:\s*/, '')
      toast.error(errMsg)
      throw err
    }
  }

  const updateTable = async (
    id: string,
    payload: { name?: string; capacity?: number; location?: string; type?: string }
  ) => {
    if (payload.name) {
      const validacion = validarNombreMesa(payload.name)
      if (!validacion.valido) {
        toast.error(validacion.mensaje)
        throw new Error(validacion.mensaje)
      }
    }

    try {
      const updated = await tablesService.update(id, payload)
      // Usamos normalizarMesa para evitar problemas de compatibilidad también aquí
      setTables((current) => current.map((t) => (t.id === id ? normalizarMesa(updated) : t)))
      return updated
    } catch (err) {
      console.error('Error actualizando mesa:', err)
      // Limpiamos el prefijo "Error: "
      const errMsg = ((err as any)?.response?.data?.mensaje || (err as any)?.message || 'Error al actualizar la mesa').replace(/^Error:\s*/, '')
      toast.error(errMsg)
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
            // GUARDAR EN LA BASE DE DATOS
            updateTableStatus(tableId, 'Disponible')

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

  const clearOrder = async (tableId: string) => {
    try {
      const allOrders = await ordersService.getAll()
      const tableOrder = allOrders.find((o: any) => (o.mesa?._id === tableId || o.mesa === tableId) && ['ABIERTO', 'EN_PREPARACION', 'ENTREGADO', 'SERVIDO'].includes(o.estado))
      if (tableOrder) {
        await ordersService.updateStatus(tableOrder._id || tableOrder.id, 'CANCELADO')
      }
    } catch (e) { console.error('Error al cancelar pedido en BD', e) }

    setOrders((prev) => {
      const newOrders = { ...prev }
      delete newOrders[tableId]
      return newOrders
    })

    setTimeout(() => {
      setReservations((currentReservations) => {
        // GUARDAR EN LA BASE DE DATOS
        updateTableStatus(tableId, 'Disponible')

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

  const confirmOrder = async (tableId: string) => {
    const tableOrder = orders[tableId]
    if (tableOrder && tableOrder.length > 0) {
      try {
        // 1. Obtener usuario creador del pedido
        let userId = ''

        // Intento 1: Extraer ID directamente del token JWT (Método más seguro)
        const token = getToken()
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            userId = payload.id || payload._id || payload.usuarioId || ''
          } catch (e) {
            console.warn('No se pudo decodificar el token:', e)
          }
        }

        // Intento 2: Fallback a localStorage por si el token no se pudo leer
        if (!userId) {
          const storedUserStr = localStorage.getItem('user') || localStorage.getItem('usuario')
          if (storedUserStr) {
            try {
              const storedUser = JSON.parse(storedUserStr)
              userId = storedUser.id || storedUser._id || ''
            } catch (e) {}
          }
        }

        if (!userId) {
          throw new Error('No se pudo identificar al usuario para registrar el pedido.')
        }

        // 2. Formatear payload según modelo IPedido / IDetallePedido
        const total = tableOrder.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        const payload = {
          mesa: tableId,
          usuario: userId,
          total: total,
          detalles: tableOrder.map((item) => ({
            plato: item.product.id,
            cantidad: item.quantity,
            precioUnitario: item.product.price,
            subtotal: item.product.price * item.quantity,
            observacion: item.note || ''
          }))
        }

        // 3. INTELIGENCIA: Revisar si la mesa ya tiene un pedido activo
        const allOrders = await ordersService.getAll()
        const existingOrder = allOrders.find((o: any) => 
          (o.mesa?._id === tableId || o.mesa === tableId) && 
          ['ABIERTO', 'EN_PREPARACION', 'ENTREGADO', 'SERVIDO'].includes(o.estado)
        )

        if (existingOrder) {
          const targetId = existingOrder._id || existingOrder.id;
          if (!targetId) {
            throw new Error("Error de sincronización: El pedido activo no tiene ID válido.");
          }
          
          // Si ya existe, lo actualizamos usando la nueva ruta
          await api.put(`/pedidos/${targetId}`, payload)
          // REPARACIÓN CRÍTICA: Forzar el cambio de color visual inmediatamente
          updateTableStatus(tableId, 'Ocupada')
        } else {
          // Si es un pedido nuevo, lo creamos
          await ordersService.create(payload)
          updateTableStatus(tableId, 'Ocupada')
        }
      } catch (error) {
        console.error('Error al confirmar pedido:', error)
        throw error
      }
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

  const reserveTable = async (tableId: string, info: Omit<ReservationInfo, 'id' | 'endTime' | 'vip'>) => {
    const table = tables.find((t) => t.id === tableId)
    const tableType = table?.type || 'normal'
    const isVipClient = tableType === 'vip'

    if (!info.startTime) throw new Error('Falta la hora de la reserva (startTime).')
    if (!info.date) throw new Error('Falta la fecha de la reserva.')

    const duration = calculateReservationDuration(info.guestCount)
    const endTime = calculateEndTime(info.startTime, duration)

    const existingReservations = reservations[tableId] || []
    const hasOverlap = existingReservations.some((existing) => {
      if (existing.date !== info.date) return false
      return timesOverlap(existing.startTime, existing.endTime, info.startTime, endTime)
    })

    if (hasOverlap) {
      throw new Error('Ya existe una reserva en este horario')
    }

    const payload = {
      tableId,
      clientName: info.clientName,
      guestCount: info.guestCount,
      date: info.date,
      time: info.startTime,
      vip: isVipClient
    }

    const created = await reservationsService.create(payload)
    const { resInfo } = normalizarReserva(created)

    setReservations((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), resInfo]
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
      // GUARDAR EN LA BASE DE DATOS
      updateTableStatus(tableId, 'Disponible')
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
    notifications,
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
    markNotificationAsRead,
    clearNotifications,
    setProducts,
    setTables,
    createTable,
    updateTable,
    deleteTable,
    loadInitialData
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