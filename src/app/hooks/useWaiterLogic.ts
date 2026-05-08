import { useState, useMemo, MouseEvent, useEffect } from 'react'
import { toast } from 'sonner'
import { generateReservationPDF } from '../utils/pdf.utils'
import { useAppContext } from '../context/AppContext'
import type { ReservationFormData } from '../components/ReserveTableModal'
import type { Table } from '../context/AppContext'
import { locationsService } from '../services/locations.service'
import { getStoredUser } from '../services'

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
    updateTableStatus,
    resetTableOrder
  } = context

  const [dbLocations, setDbLocations] = useState<string[]>([])
  useEffect(() => {
    const fetchLocations = () => {
      locationsService.getAll()
        .then(data => {
          const validNames = data.map((l: any) => (l.nombre || l.name || '').trim()).filter(Boolean)
          setDbLocations(validNames)
        })
        .catch(() => {})
    }
    fetchLocations()
    window.addEventListener('locations_updated', fetchLocations)
    return () => window.removeEventListener('locations_updated', fetchLocations)
  }, [])

  const LOCATIONS = useMemo(
    () => {
      const hasVipTables = tables.some(t => t.type === 'vip')
      const baseLocations = ['Todas', ...Array.from(new Set(dbLocations)).sort()]
      if (hasVipTables && !baseLocations.includes('Zona VIP')) {
        baseLocations.push('Zona VIP')
      }
      return baseLocations
    },
    [tables, dbLocations]
  )

  const [activeLocation, setActiveLocation] = useState(LOCATIONS[0] || 'Todas')
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [menuPanelOpen, setMenuPanelOpen] = useState(false)
  const [activeTableId, setActiveTableId] = useState<string | null>(null)
  const [reservingTableId, setReservingTableId] = useState<string | null>(null)
  const [viewingReservationsTableId, setViewingReservationsTableId] = useState<string | null>(null)
  const [cancelingReservationTableId, setCancelingReservationTableId] = useState<string | null>(null)
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      const isVIPLocation = activeLocation.toLowerCase().includes('vip')
      const tableLoc = getTableLocation(t).toLowerCase()
      const locationMatch = activeLocation === 'Todas' || 
        (isVIPLocation ? t.type === 'vip' : tableLoc === activeLocation.toLowerCase() && t.type !== 'vip')
      return locationMatch && (stateFilter === 'all' || t.status === stateFilter)
    })
  }, [tables, activeLocation, stateFilter])

  const locationTables = useMemo(() => {
    return activeLocation === 'Todas'
      ? tables
      : tables.filter((t) => activeLocation.toLowerCase().includes('vip') ? t.type === 'vip' : getTableLocation(t).toLowerCase() === activeLocation.toLowerCase() && t.type !== 'vip')
  }, [tables, activeLocation])

  const tableCounts = useMemo(() => {
    return locationTables.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [locationTables])

  const totalInLocation = locationTables.length
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
      
      const result: any = await reserveTable(reservingTableId, {
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

  const openReservationsListModal = (e: MouseEvent<HTMLButtonElement | HTMLDivElement>, tableId: string) => {
    e.stopPropagation()
    setViewingReservationsTableId(tableId)
  }

  const closeReservationsListModal = () => setViewingReservationsTableId(null)

  const openCancelReservationModal = (e: MouseEvent<HTMLButtonElement>, tableId: string, reservationId: string) => {
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

  const openPaymentModal = () => setShowPaymentModal(true)
  const closePaymentModal = () => setShowPaymentModal(false)

  const handleProcessPayment = (method: string) => {
    if (!activeTableId) return
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
    LOCATIONS,
    activeLocation,
    stateFilter,
    menuPanelOpen,
    activeTableId,
    reservingTableId,
    viewingReservationsTableId,
    cancelingReservationTableId,
    cancelingReservationId,
    showPaymentModal,
    filteredTables,
    tableCounts,
    totalInLocation,
    activeTable,
    activeOrder,
    orderTotal,
    setActiveLocation,
    setStateFilter,
    handleTableClick,
    openReserveModal,
    closeReserveModal,
    handleConfirmReservation,
    openReservationsListModal,
    closeReservationsListModal,
    openCancelReservationModal,
    closeCancelReservationModal,
    handleConfirmCancelReservation,
    openPaymentModal,
    closePaymentModal,
    handleProcessPayment,
    handleCloseModal,
    getActiveReservation
  }
}