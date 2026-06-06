//src/app/hooks/useWaiterLogic.ts
import { useState, useMemo, MouseEvent, useEffect } from 'react'
import { toast } from 'sonner'
import { generateReservationPDF } from '../utils/pdf.utils'
import { useAppContext } from '../context/AppContext'
import type { ReservationFormData } from '../components/ReserveTableModal'
import type { Table } from '../context/AppContext'
import { locationsService } from '../services/locations.service'
import { getStoredUser } from '../services'
import { api } from '../services/api'
import { ordersService } from '../services/orders.service'

export type StateFilter = 'all' | 'Disponible' | 'Ocupada' | 'Esperando pago' | 'Reservada'

export type TableWithFallbacks = Table & {
  _id?: string
  nombre?: string
  numero?: string | number
  ubicacion?: string
  isActive?: boolean
}

export const getTableLocation = (table: Table) => {
  const tableWithFallbacks = table as TableWithFallbacks
  return tableWithFallbacks.location || tableWithFallbacks.ubicacion || ''
}

export const getTableDisplayName = (table: Table) => {
  const tableWithFallbacks = table as TableWithFallbacks
  return tableWithFallbacks.name || tableWithFallbacks.nombre || tableWithFallbacks.numero
}

// ─── Hook Interno 1: Gestión de Filtros y Ubicaciones ──────────────────────
function useTableFilters(tables: Table[]) {
  const [dbLocations, setDbLocations] = useState<string[]>([])

  const LOCATIONS = useMemo(() => {
    const hasVipTables = tables.some((t) => t.type === 'vip')
    const baseLocations = ['Todas', ...Array.from(new Set(dbLocations)).sort()]
    const cleanedLocations = baseLocations.filter(
      (loc) => loc.toLowerCase() !== 'zona vip' && loc.toLowerCase() !== 'vip'
    )
    if (hasVipTables) cleanedLocations.push('VIP')
    return cleanedLocations
  }, [tables, dbLocations])

  const [activeLocation, setActiveLocation] = useState(LOCATIONS[0] || 'Todas')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')

  useEffect(() => {
    const fetchLocations = () => {
      locationsService
        .getAll()
        .then((data) => {
          const validNames = data.map((l) => l.name?.trim() || '').filter(Boolean)
          setDbLocations(validNames)
        })
        .catch(() => {})
    }
    fetchLocations()
    window.addEventListener('locations_updated', fetchLocations)
    return () => window.removeEventListener('locations_updated', fetchLocations)
  }, [])

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const isVIPLocation = activeLocation.toLowerCase() === 'vip'
      const tableLoc = getTableLocation(t).toLowerCase()
      const locationMatch =
        activeLocation === 'Todas' ||
        (isVIPLocation ? t.type === 'vip' : tableLoc === activeLocation.toLowerCase())
      return locationMatch && (stateFilter === 'all' || t.status === stateFilter)
    })
  }, [tables, activeLocation, stateFilter])

  const locationTables = useMemo(() => {
    return activeLocation === 'Todas'
      ? tables
      : tables.filter((t) =>
          activeLocation.toLowerCase() === 'vip'
            ? t.type === 'vip'
            : getTableLocation(t).toLowerCase() === activeLocation.toLowerCase()
        )
  }, [tables, activeLocation])

  const tableCounts = useMemo(() => {
    return locationTables.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1
        return acc
      },
      {} as Record<string, number>
    )
  }, [locationTables])

  const totalInLocation = locationTables.length

  return {
    LOCATIONS,
    activeLocation,
    setActiveLocation,
    stateFilter,
    setStateFilter,
    filteredTables,
    tableCounts,
    totalInLocation
  }
}

// ─── Hook Interno 2: Gestión de Modales de Reserva ─────────────────────────
function useReservationManager(tables: Table[], reserveTable: any, cancelReservation: any) {
  const [reservingTableId, setReservingTableId] = useState<string | null>(null)
  const [viewingReservationsTableId, setViewingReservationsTableId] = useState<string | null>(null)
  const [cancelingReservationTableId, setCancelingReservationTableId] = useState<string | null>(
    null
  )
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null)

  const openReserveModal = (e: MouseEvent<HTMLButtonElement>, tableId: string) => {
    e.stopPropagation()
    setReservingTableId(tableId)
  }

  const closeReserveModal = () => setReservingTableId(null)

  // 🚀 Mejora: Asincronía agregada para seguridad del PDF
  const handleConfirmReservation = async (formData: ReservationFormData) => {
    if (!reservingTableId) return
    try {
      const reservingTable = tables.find((t) => t.id === reservingTableId)
      const tableName = reservingTable?.name || 'Mesa'

      if (reservingTable && formData.guestCount > (reservingTable.capacity || 0)) {
        toast.error(
          `La cantidad de personas supera la capacidad de la mesa (${reservingTable.capacity}).`
        )
        return
      }

      const result = await reserveTable(reservingTableId, {
        location: formData.location,
        clientName: formData.clientName,
        guestCount: formData.guestCount,
        date: formData.date,
        startTime: formData.time, // Soluciona el error de "split" al coincidir con ReservationInfo
        vip: reservingTable?.type === 'vip' || false
      } as any)

      const currentUser = getStoredUser()
      const userName = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Usuario'
      const resCode = result?.codigo || `RES-${Math.floor(1000 + Math.random() * 9000)}`

      generateReservationPDF(
        resCode,
        tableName,
        formData.location,
        formData.clientName,
        formData.guestCount,
        formData.date,
        formData.time,
        userName
      )

      setReservingTableId(null)
      toast.success('Reserva creada exitosamente. PDF descargado.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear la reserva')
    }
  }

  const openReservationsListModal = (
    e: MouseEvent<HTMLButtonElement | HTMLDivElement>,
    tableId: string
  ) => {
    e.stopPropagation()
    setViewingReservationsTableId(tableId)
  }

  const closeReservationsListModal = () => setViewingReservationsTableId(null)

  const openCancelReservationModal = (
    e: MouseEvent<HTMLButtonElement>,
    tableId: string,
    reservationId: string
  ) => {
    e.stopPropagation()
    setCancelingReservationTableId(tableId)
    setCancelingReservationId(reservationId)
  }

  const closeCancelReservationModal = () => {
    setCancelingReservationTableId(null)
    setCancelingReservationId(null)
  }

  const handleConfirmCancelReservation = () => {
    if (!cancelingReservationTableId || !cancelingReservationId) return
    cancelReservation(cancelingReservationTableId, cancelingReservationId)
    setCancelingReservationTableId(null)
    setCancelingReservationId(null)
    setViewingReservationsTableId(null)
    toast.success('Reserva cancelada correctamente', {
      description: 'La reserva ha sido eliminada.',
      duration: 3500
    })
  }

  return {
    reservingTableId,
    viewingReservationsTableId,
    cancelingReservationTableId,
    cancelingReservationId,
    openReserveModal,
    closeReserveModal,
    handleConfirmReservation,
    openReservationsListModal,
    closeReservationsListModal,
    openCancelReservationModal,
    closeCancelReservationModal,
    handleConfirmCancelReservation
  }
}

// ─── Hook Principal (Composición) ──────────────────────────────────────────
export function useWaiterLogic() {
  const context = useAppContext()
  const {
    tables,
    orders,
    reservations,
    closeTable,
    reserveTable,
    cancelReservation,
    getActiveReservation,
    resetTableOrder
  } = context

  const tableFilters = useTableFilters(tables)
  const resManager = useReservationManager(tables, reserveTable, cancelReservation)

  const [menuPanelOpen, setMenuPanelOpen] = useState(false)
  const [activeTableId, setActiveTableId] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const activeTable = tables.find((t) => t.id === activeTableId)
  const activeOrder = activeTableId ? orders[activeTableId] || [] : []
  const orderTotal = activeOrder.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handleTableClick = (e: MouseEvent<HTMLButtonElement | HTMLDivElement>, id: string) => {
    e.stopPropagation()
    const clickedTable = tables.find((t) => t.id === id)
    if (clickedTable && clickedTable.status === 'Disponible') {
      resetTableOrder(id)
    }
    setActiveTableId(id)
    setMenuPanelOpen(true)
  }

  const openPaymentModal = () => setShowPaymentModal(true)
  const closePaymentModal = () => setShowPaymentModal(false)

  const handleProcessPayment = async (
    method: string,
    discountPercent: number,
    tipPercent: number
  ) => {
    if (!activeTableId) return

    try {
      const allOrders = await ordersService.getAll()
      const tableOrder = allOrders.find(
        (o) =>
          (o.mesa?._id === activeTableId || o.mesa === activeTableId) &&
          ['ABIERTO', 'EN_PREPARACION', 'ENTREGADO', 'SERVIDO'].includes(o.estado)
      )
      if (tableOrder) {
        await api.post(`/pagos/procesar-final/${tableOrder._id || tableOrder.id}`, {
          metodoPago: method,
          porcentajeDescuento: discountPercent,
          porcentajePropina: tipPercent
        })
      }
    } catch (e) {
      console.error('Error al procesar pago en BD', e)
    }

    closeTable(activeTableId)
    setActiveTableId(null)
    setMenuPanelOpen(false)
    setShowPaymentModal(false)
    toast.success('Pago procesado correctamente', {
      description: `La mesa ha sido liberada. Método: ${method}`,
      duration: 4000
    })
  }

  const handleCloseModal = () => {
    setMenuPanelOpen(false)
    setActiveTableId(null)
  }

  return {
    tables,
    reservations,
    menuPanelOpen,
    activeTableId,
    showPaymentModal,
    activeTable,
    activeOrder,
    orderTotal,
    handleTableClick,
    openPaymentModal,
    closePaymentModal,
    handleProcessPayment,
    handleCloseModal,
    getActiveReservation,
    ...tableFilters,
    ...resManager
  }
}
