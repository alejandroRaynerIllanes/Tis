import {
  ChevronLeft,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  Receipt,
  MapPin,
  Search,
  ChefHat,
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
  UserCheck,
  Crown,
} from 'lucide-react'
import { useNavigate } from 'react-router'
// ✅ CORRECCIÓN: Añadido useMemo
import { useState, MouseEvent, useMemo } from 'react'
import { toast } from 'sonner'
import { generateReservationPDF } from '../utils/pdf.utils'

import { useAppContext, Product, TableStatus, Table, ReservationInfo } from '../context/AppContext'
import { ReservationsListModal } from './ReservationsListModal'
import { PaymentModal } from './PaymentModal'
import { ReserveTableModal, type ReservationFormData } from './ReserveTableModal'
import { CancelReservationModal } from './CancelReservationModal'
import { TableSidePanel } from './TableSidePanel'

// ─── Tipos y helpers ─────────────────────────────────────────────────────────

type StateFilter = 'all' | 'Disponible' | 'Ocupada' | 'Esperando pago' | 'Reservada'

interface TableConfig {
  bgClass: string
  borderClass: string
  cardStyle: React.CSSProperties
  textClass: string
  iconClass: string
  badgeStyle: React.CSSProperties
  statusLabel: string
  dotColor: string
}

type TableWithFallbacks = Table & {
  _id?: string
  nombre?: string
  numero?: string | number
  ubicacion?: string
  isActive?: boolean
}

const getTableDisplayName = (table: Table) => {
  const tableWithFallbacks = table as TableWithFallbacks
  return tableWithFallbacks.name || tableWithFallbacks.nombre || tableWithFallbacks.numero
}

const getTableLocation = (table: Table) => {
  const tableWithFallbacks = table as TableWithFallbacks
  return tableWithFallbacks.location || tableWithFallbacks.ubicacion || ''
}

function getTableConfig(state: string): TableConfig {
  switch (state) {
    case 'disponible':
      return {
        bgClass: 'bg-[#F5E6D3]',
        borderClass: 'border-[#6B3E2E]/15',
        cardStyle: {
          background: '#F5E6D3',
          boxShadow: '0 4px 14px -4px rgba(44,44,44,0.1), inset 0 1px 0 rgba(255,255,255,0.6)',
          border: '1px solid rgba(107,62,46,0.15)'
        },
        textClass: 'text-[#2C2C2C]',
        iconClass: 'opacity-70 text-[#2C2C2C]',
        badgeStyle: {
          background: 'rgba(44,44,44,0.08)',
          border: '1px solid rgba(44,44,44,0.2)',
          color: '#2C2C2C'
        },
        statusLabel: 'Disponible',
        dotColor: '#F5E6D3'
      }
    case 'ocupada':
      return {
        bgClass: 'bg-[#D96C4A]',
        borderClass: 'border-[#D96C4A]',
        cardStyle: {
          background: '#D96C4A',
          boxShadow: '0 6px 18px -4px rgba(217,108,74,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
          border: '1px solid rgba(217,108,74,0.8)'
        },
        textClass: 'text-[#FFFFFF]',
        iconClass: 'opacity-90 text-[#FFFFFF]',
        badgeStyle: {
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#FFFFFF'
        },
        statusLabel: 'Ocupada',
        dotColor: '#D96C4A'
      }
    case 'esperando pago':
      return {
        bgClass: 'bg-[#E6A23C]',
        borderClass: 'border-[#E6A23C]',
        cardStyle: {
          background: '#E6A23C',
          boxShadow: '0 6px 18px -4px rgba(230,162,60,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          border: '1px solid rgba(230,162,60,0.8)'
        },
        textClass: 'text-[#2C2C2C]',
        iconClass: 'opacity-80 text-[#2C2C2C]',
        badgeStyle: {
          background: 'rgba(44,44,44,0.1)',
          border: '1px solid rgba(44,44,44,0.3)',
          color: '#2C2C2C'
        },
        statusLabel: 'Esperando Pago',
        dotColor: '#E6A23C'
      }
    case 'reservada':
      return {
        bgClass: 'bg-[#6B3E2E]',
        borderClass: 'border-[#6B3E2E]',
        cardStyle: {
          background: '#6B3E2E',
          boxShadow: '0 6px 18px -4px rgba(107,62,46,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(107,62,46,0.9)'
        },
        textClass: 'text-[#FFFFFF]',
        iconClass: 'opacity-90 text-[#FFFFFF]',
        badgeStyle: {
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#FFFFFF'
        },
        statusLabel: 'Reservada',
        dotColor: '#6B3E2E'
      }
    default:
      return {
        bgClass: 'bg-white',
        borderClass: 'border-gray-200',
        cardStyle: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB'
        },
        textClass: 'text-gray-700',
        iconClass: 'opacity-60 text-gray-700',
        badgeStyle: {
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          color: '#374151'
        },
        statusLabel: '',
        dotColor: '#ccc'
      }
  }
}

function getStateIcon(state: TableStatus, size = 22) {
  switch (state) {
    case 'Disponible':
      return <CheckCircle2 size={size} strokeWidth={2.2} />
    case 'Ocupada':
      return <Users size={size} strokeWidth={2.2} />
    case 'Esperando pago':
      return <Receipt size={size} strokeWidth={2.2} />
    case 'Reservada':
      return <CalendarDays size={size} strokeWidth={2.2} />
    default:
      return null
  }
}

const STATE_FILTERS: { key: StateFilter; label: string; dot: string | null }[] = [
  { key: 'all', label: 'Todos', dot: null },
  { key: 'Disponible', label: 'Disponible', dot: '#F5E6D3' },
  { key: 'Ocupada', label: 'Ocupada', dot: '#D96C4A' },
  { key: 'Esperando pago', label: 'Esperando pago', dot: '#E6A23C' },
  { key: 'Reservada', label: 'Reservada', dot: '#6B3E2E' }
]

// ─── Componente principal ─────────────────────────────────────────────────────

export function WaiterView({
  isEmbedded = false,
  onAddTable,
  onManageLocations,
  onEditTable,
  onDeleteTable
}: {
  isEmbedded?: boolean
  onAddTable?: () => void
  onManageLocations?: () => void
  onEditTable?: (table: Table) => void
  onDeleteTable?: (tableId: string) => void
} = {}) {
  console.log('[WaiterView] Rendering...')

  const {
    products,
    tables,
    orders,
    reservations,
    addOrderItem,
    removeOrderItem,
    clearOrder,
    updateOrderItemNote,
    confirmOrder,
    requestBill,
    closeTable,
    reserveTable,
    cancelReservation,
    getActiveReservation,
    updateTableStatus,
    resetTableOrder
  } = useAppContext()

  console.log('[WaiterView] Context OK - tables:', tables.length)

  const navigate = useNavigate()

  // ✅ CORRECCIÓN: LOCATIONS derivado dinámicamente
  const LOCATIONS = useMemo(
    () => ['Todas', ...Array.from(new Set(tables.map(getTableLocation).filter(Boolean))).sort()],
    [tables]
  )

  const [activeLocation, setActiveLocation] = useState(LOCATIONS[0])
  const [stateFilter, setStateFilter] = useState<StateFilter>('all')
  const [menuPanelOpen, setMenuPanelOpen] = useState(false)

  const [activeTableId, setActiveTableId] = useState<string | null>(null)

  // ── Estado del modal de reserva ──
  const [reservingTableId, setReservingTableId] = useState<string | null>(null)

  // ── Estado del modal de lista de reservas ──
  const [viewingReservationsTableId, setViewingReservationsTableId] = useState<string | null>(null)

  // ── Estado del modal de cancelación de reserva ──
  const [cancelingReservationTableId, setCancelingReservationTableId] = useState<string | null>(
    null
  )
  const [cancelingReservationId, setCancelingReservationId] = useState<string | null>(null)

  // ── Estado del modal de pago ──
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const role = localStorage.getItem('userRole')
  const isAdmin = role === 'admin' || role === 'administrador'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  // ✅ CORRECCIÓN: filtro null-safe para las ubicaciones dinámicas
  const filteredTables = tables.filter((t) => {
    const tableLoc = getTableLocation(t).toLowerCase()
    const locationMatch = activeLocation === 'Todas' || tableLoc === activeLocation.toLowerCase()
    return locationMatch && (stateFilter === 'all' || t.status === stateFilter)
  })

  const handleTableClick = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation()
    const clickedTable = tables.find((t) => t.id === id)

    // Si la mesa está Disponible: cambiar a Reservada y limpiar datos residuales
    if (clickedTable && clickedTable.status === 'Disponible') {
      resetTableOrder(id) // Eliminar cualquier pedido residual sin tocar el estado
      updateTableStatus(id, 'Reservada') // La mesa pasa a "siendo atendida"
    }

    setActiveTableId(id)
    setMenuPanelOpen(true)
  }

  // Conteos para los badges de filtro (Añadido `?? ''` por seguridad preventiva)
  const locationTables =
    activeLocation === 'Todas'
      ? tables
      : tables.filter((t) => getTableLocation(t).toLowerCase() === activeLocation.toLowerCase())
  const tableCounts = locationTables.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const totalInLocation = locationTables.length

  const activeTable = tables.find((t) => t.id === activeTableId)
  const activeOrder = activeTableId ? orders[activeTableId] || [] : []
  const orderTotal = activeOrder.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  // ── Manejadores de reserva ──
  const openReserveModal = (e: MouseEvent<HTMLButtonElement>, tableId: string) => {
    e.stopPropagation()
    setReservingTableId(tableId)
  }

  const closeReserveModal = () => {
    setReservingTableId(null)
  }

  const handleConfirmReservation = async (formData: ReservationFormData) => {
    if (!reservingTableId) return

    try {
      const reservingTable = tables.find((t) => t.id === reservingTableId)
      const tableName = reservingTable?.name || 'Mesa'

      // 🚀 CONEXIÓN AL BACKEND: Nuevo formato de Payload para la Base de Datos
      await reserveTable(reservingTableId, {
        clientName: formData.clientName,
        guestCount: formData.guestCount,
        date: formData.date,
        time: formData.time,
        vip: reservingTable?.type === 'vip' || false
      } as any)

      // Generar PDF automáticamente
      generateReservationPDF(
        tableName,
        formData.clientName,
        formData.guestCount,
        formData.date,
        formData.time
      )

      // Cerrar modal solo si la reserva fue exitosa
      setReservingTableId(null)

      // Mostrar notificación de éxito
      toast.success('Reserva creada exitosamente. PDF descargado.')
    } catch (error) {
      // Mostrar error al usuario
      toast.error(error instanceof Error ? error.message : 'Error al crear la reserva')
    }
  }

  // ── Manejadores de lista de reservas ──
  const openReservationsListModal = (
    e: MouseEvent<HTMLButtonElement | HTMLDivElement>,
    tableId: string
  ) => {
    e.stopPropagation()
    setViewingReservationsTableId(tableId)
  }

  const closeReservationsListModal = () => {
    setViewingReservationsTableId(null)
  }

  // ── Manejadores de cancelación de reserva ──
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
    setViewingReservationsTableId(null) // Cerrar también el modal de lista

    toast.success('Reserva cancelada correctamente', {
      description: 'La reserva ha sido eliminada.',
      duration: 3500
    })
  }

  // ── Manejadores de pago ──
  const openPaymentModal = () => {
    setShowPaymentModal(true)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)
  }

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

  const handleCloseTable = () => {
    if (activeTableId) {
      closeTable(activeTableId)
      setActiveTableId(null)
      setMenuPanelOpen(false)
    }
  }

  // Cierra el modal de forma inteligente:
  // Si la mesa está "Reservada" por click (sin pedido y sin reserva formal) → vuelve a Disponible
  const handleCloseModal = () => {
    if (activeTableId && activeTable) {
      const hasNoOrder = !activeOrder || activeOrder.length === 0
      const tableReservations = reservations[activeTableId]
      const hasFormalReservation = !!(tableReservations && tableReservations.length > 0)
      if (activeTable.status === 'Reservada' && hasNoOrder && !hasFormalReservation) {
        updateTableStatus(activeTableId, 'Disponible')
        resetTableOrder(activeTableId)
      }
    }
    setMenuPanelOpen(false)
    setActiveTableId(null)
  }

  console.log('DEPURACIÓN - Totales:', tables?.length, 'Filtradas:', filteredTables?.length)
  console.log('[WaiterView] About to return JSX...')

  return (
    <div
      className={`flex flex-col ${isEmbedded ? 'h-full bg-transparent' : 'h-[100dvh] bg-[#FCE4D6]'} font-sans selection:bg-[#E57C5D] selection:text-white relative overflow-hidden`}
    >
      {/* Background Image Wrapper */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] pointer-events-none"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1771574205963-0c1d84ac7354?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwYW1iaWFuY2V8ZW58MXx8fHwxNzc1NjgxNTU2fDA&ixlib=rb-4.1.0&q=80&w=1080)'
        }}
      />
      {/* Overlay oscuro cálido */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: 'rgba(44, 25, 15, 0.65)' }}
      />

      {/* ══════════════════════════════════════════════════════════════
          HEADER MODO ADMIN (EMBEDDED)
      ══════════════════════════════════════════════════════════════ */}
      {isEmbedded && isAdmin ? (
        <header className="px-6 lg:px-10 py-6 lg:py-8 flex flex-row justify-between items-center gap-6 sticky top-0 bg-black/40 backdrop-blur-md z-20 shrink-0 transition-all">
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1.5 drop-shadow-sm">
              Gestión de Mesas
            </h1>
            <p className="text-white/80 font-medium drop-shadow-sm text-sm sm:text-base">
              Administra los espacios físicos de tu local y su capacidad
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {onManageLocations && (
              <button
                onClick={onManageLocations}
                className="flex items-center justify-center gap-2 bg-[#F5E6D3] border-2 border-[#6B3E2E] hover:bg-[#E8D4BE] text-[#2C2C2C] px-5 sm:px-6 h-[48px] rounded-xl font-bold transition-colors shadow-sm"
              >
                <MapPin size={18} />
                Ubicaciones
              </button>
            )}
            {onAddTable && (
              <button
                onClick={onAddTable}
                className="flex items-center justify-center gap-2 bg-[#D96C4A] hover:bg-[#C25838] text-white px-5 sm:px-6 h-[48px] rounded-xl font-bold transition-colors shadow-sm"
              >
                <Plus size={18} />
                Añadir Mesa
              </button>
            )}
          </div>
        </header>
      ) : (
        /* ══════════════════════════════════════════════════════════════
            NAVBAR — izquierda: logo + subtítulo | derecha: acciones
        ══════════════════════════════════════════════════════════════ */
        <header className="bg-[#4B2E2D] text-white flex items-center justify-between px-4 sm:px-6 py-0 h-14 sm:h-16 shadow-[0_4px_20px_-4px_rgba(75,46,45,0.50)] z-20 shrink-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#E57C5D] flex items-center justify-center shadow-lg shadow-[#E57C5D]/30 shrink-0">
              <ChefHat size={18} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex flex-col items-start gap-0 leading-none">
              <span className="font-black text-sm sm:text-[15px] tracking-wide text-white whitespace-nowrap">
                Sabor &amp; Gestión
              </span>
              <span className="text-[10px] sm:text-[11px] text-white/60 font-semibold uppercase tracking-widest mt-[3px] whitespace-nowrap">
                Vista de Mesero
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate('/catalog')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/75 hover:text-white text-sm font-medium"
              >
                <ChevronLeft size={18} />
                <span className="hidden md:block">Admin</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/25 transition-colors text-white/80 hover:text-red-300 text-sm font-medium"
            >
              <LogOut size={17} />
              <span className="hidden sm:block font-semibold">Cerrar Sesión</span>
            </button>
          </div>
        </header>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CONTENIDO PRINCIPAL
      ══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* ────────────────────────────────────────────────────────────
            PANEL IZQUIERDO — Plano de Mesas (~70%)
        ──────────────────────────────────────────────────────────── */}
        <section className="relative z-10 flex-1 min-w-0 flex flex-col overflow-y-auto p-4 sm:p-5 lg:p-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-300">
          {/* ── BARRA DE FILTROS INTEGRADA ── */}
          <div
            className={`
            flex flex-row flex-nowrap gap-3 md:gap-5 items-center w-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory
            bg-black/35 backdrop-blur-md rounded-[20px] p-2 sm:p-2.5 mb-6 sm:mb-8 shadow-lg border border-white/5
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
            ${isEmbedded && isAdmin ? '-mt-2 sm:-mt-4 lg:-mt-6' : '-mt-1 sm:-mt-2'}
          `}
          >
            {/* Tabs de ubicación */}
            {/* Spacer for proper left scroll padding */}
            <div className="w-1 sm:w-2 shrink-0" aria-hidden="true" />
            <div className="flex gap-1.5 sm:gap-2 items-center shrink-0">
              {LOCATIONS.map((loc, index) => (
                <button
                  key={loc || index}
                  onClick={() => setActiveLocation(loc)}
                  className={`
                    px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2 shrink-0 snap-center
                    ${
                      activeLocation === loc
                        ? 'bg-white text-[#4B2E2D] border-transparent shadow-md'
                        : 'bg-transparent text-white/70 border-transparent hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {loc}
                </button>
              ))}
            </div>

            {/* Separador visual */}
            <div className="hidden md:block w-px h-8 bg-white/20 rounded-full mx-1 shrink-0"></div>

            {/* Filtros de estado */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {STATE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStateFilter(f.key)}
                  className={`
                    group flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-[13px] font-bold border transition-all duration-300 whitespace-nowrap shrink-0 snap-center
                    ${
                      stateFilter === f.key
                        ? 'bg-white/20 text-white border-transparent shadow-md backdrop-blur-sm'
                        : 'bg-transparent text-white/70 border-transparent hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  {f.dot && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full shadow-inner ${stateFilter === f.key ? 'opacity-90' : 'opacity-70'}`}
                      style={{ backgroundColor: f.dot }}
                    />
                  )}
                  {f.label}
                  <span
                    className={`
                    px-2 py-0.5 rounded-full text-[11px] font-black
                    ${
                      stateFilter === f.key
                        ? 'bg-white text-[#4B2E2D] shadow-sm'
                        : 'bg-white/20 text-white group-hover:bg-white/30'
                    }
                  `}
                  >
                    {f.key === 'all' ? totalInLocation : tableCounts[f.key as TableStatus] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Spacer for proper right scroll padding */}
            <div className="w-2 sm:w-4 shrink-0" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} className="text-[#D0543A]" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#ffffff]">
              {activeLocation}
            </h2>
          </div>

          {/* ── Grid de Mesas ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 pb-20">
            {filteredTables.map((t, index) => {
              const cfg = getTableConfig((t.status || '').toLowerCase())
              const isSelected = activeTableId === t.id
              const tableKey = t.id || (t as TableWithFallbacks)._id || index
              const tableName = getTableDisplayName(t)
              const tableLocation = getTableLocation(t)
              const tableIsActive = (t as TableWithFallbacks).isActive
              // Obtener todas las reservas de esta mesa
              const tableReservations = reservations[t.id] || []
              // Mostrar la primera reserva activa, o la primera de la lista
              const activeRes = getActiveReservation(t.id)
              const tableReservation =
                activeRes || (tableReservations.length > 0 ? tableReservations[0] : null)

              return (
                <div
                  key={tableKey}
                  onClick={(e) => handleTableClick(e as any, t.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleTableClick(e as any, t.id)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className={`
                    relative min-h-[100px] min-w-[100px] bg-white p-5 rounded-[22px] border flex flex-col justify-between transition-all duration-300 group overflow-hidden cursor-pointer
                    hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#E57C5D]/50
                    ${isSelected ? 'ring-4 ring-[#4B2E2D] ring-offset-4 ring-offset-[#FCE4D6] shadow-2xl scale-[1.02]' : 'hover:shadow-xl'}
                    ${tableIsActive === false ? 'opacity-70' : 'opacity-100'}
                    ${cfg.bgClass} ${cfg.borderClass}
                  `}
                  style={cfg.cardStyle}
                >
                  {/* Fila superior: Nombre e Ícono */}
                  <div className="flex justify-between items-start w-full mb-6 relative z-10">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-black text-xl sm:text-2xl tracking-tight drop-shadow-sm leading-none mt-1 ${cfg.textClass}`}
                      >
                        {tableName}
                      </span>
                      {t.type === 'vip' && (
                        <Crown
                          size={16}
                          className="text-yellow-300 drop-shadow-sm shrink-0 mt-1"
                          strokeWidth={2.5}
                        />
                      )}
                    </div>
                    {tableLocation && (
                      <div
                        className={`absolute left-0 top-8 flex items-center gap-1 text-[11px] font-bold ${cfg.textClass} opacity-80`}
                      >
                        <MapPin size={11} />
                        {tableLocation}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => openReserveModal(e, t.id)}
                          className="p-2 rounded-xl text-blue-600/60 hover:text-blue-700 hover:bg-blue-500/10 transition-all bg-black/5"
                          aria-label="Reservar mesa"
                          title="Reservar mesa"
                        >
                          <CalendarDays size={16} />
                        </button>
                        {isEmbedded && isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditTable?.(t)
                              }}
                              className="p-2 rounded-xl text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-white/40 transition-all bg-black/5"
                              aria-label="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTable?.(t.id)
                              }}
                              className="p-2 rounded-xl text-[#4B2E2D]/50 hover:text-red-600 hover:bg-red-500/10 transition-all bg-black/5"
                              aria-label="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                      <div
                        className={`p-2 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${cfg.iconClass} bg-black/5`}
                      >
                        {getStateIcon(t.status, 28)}
                      </div>
                    </div>
                  </div>

                  {/* Info de reserva (si existe) */}
                  {t.status === 'Reservada' && tableReservation && (
                    <div
                      className="mb-3 px-2.5 py-1.5 bg-white/15 rounded-lg border border-white/20 relative z-10 cursor-pointer hover:bg-white/20 transition-all"
                      onClick={(e) => openReservationsListModal(e, t.id)}
                      title={
                        tableReservations.length > 1
                          ? `Ver ${tableReservations.length} reservas`
                          : 'Ver reserva'
                      }
                    >
                      <div className="flex items-center gap-1.5 text-white justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserCheck size={11} strokeWidth={2.5} className="shrink-0" />
                          <span className="text-[11px] font-black truncate">
                            {tableReservation.clientName}
                          </span>
                          {tableReservation.vip && (
                            <Crown
                              size={10}
                              className="shrink-0 text-yellow-300"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                        {tableReservations.length > 1 && (
                          <span className="text-[9px] font-black bg-white/25 px-1.5 py-0.5 rounded-full shrink-0">
                            +{tableReservations.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white/90">
                          <Clock size={9} /> {tableReservation.startTime}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white/90">
                          <Users size={9} /> {tableReservation.guestCount} pax
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Fila inferior: Badge de estado */}
                  <div className="flex justify-between items-end w-full relative z-10">
                    <span
                      className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border shadow-sm ${cfg.textClass}`}
                      style={cfg.badgeStyle}
                    >
                      {cfg.statusLabel}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded bg-black/5 ${cfg.textClass}`}
                    >
                      <Users size={12} /> {t.capacity} pax
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ────────────────────────────────────────────────────────────
            PANEL DERECHO — Detalle de Mesa y Carta Digital (MODAL)
        ──────────────────────────────────────────────────────────── */}
      <TableSidePanel
        isOpen={menuPanelOpen && !!activeTableId}
        tableId={activeTableId}
        onClose={handleCloseModal}
        onOpenPayment={openPaymentModal}
      />
      </main>

      {/* ══════════════════════════════════════════════════════════════
          MODAL DE RESERVA
      ══════════════════════════════════════════════════════════════ */}
      <ReserveTableModal
        isOpen={!!reservingTableId}
        table={tables.find((t) => t.id === reservingTableId) || null}
        onClose={closeReserveModal}
        onConfirm={handleConfirmReservation}
      />

      {/* ══════════════════════════════════════════════════════════════
          MODAL DE CONFIRMACIÓN: CANCELAR RESERVA
      ══════════════════════════════════════════════════════════════ */}
      <CancelReservationModal
        isOpen={!!(cancelingReservationTableId && cancelingReservationId)}
        table={tables.find((t) => t.id === cancelingReservationTableId) || null}
        reservation={(reservations[cancelingReservationTableId || ''] || []).find((r) => r.id === cancelingReservationId) || null}
        onClose={closeCancelReservationModal}
        onConfirm={handleConfirmCancelReservation}
      />

      {/* ══════════════════════════════════════════════════════════════
          MODAL DE PAGO
      ══════════════════════════════════════════════════════════════ */}
      <PaymentModal
        isOpen={showPaymentModal && !!activeTableId}
        onClose={closePaymentModal}
        onProcessPayment={handleProcessPayment}
        tableName={activeTable?.name || 'Mesa'}
        activeOrder={activeOrder}
        orderTotal={orderTotal}
      />

      <ReservationsListModal
        viewingTableId={viewingReservationsTableId}
        tables={tables}
        reservations={reservations}
        onClose={closeReservationsListModal}
        onCancelReservation={openCancelReservationModal}
      />
    </div>
  )
}
