import {
  ChevronLeft,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  Receipt,
  MapPin,
  Search,
  X,
  ChefHat,
  Plus,
  UtensilsCrossed,
  Trash2,
  ShoppingBag,
  CreditCard,
  Edit2,
  MessageSquare,
  CalendarDays,
  UserCheck,
  Ban,
  XCircle,
  AlertTriangle,
  Banknote,
  QrCode,
  Wallet,
  Smartphone,
  Percent,
  Printer,
  Crown,
  Zap
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
  const [searchQuery, setSearchQuery] = useState('')
  const [menuPanelOpen, setMenuPanelOpen] = useState(false)

  const [activeTableId, setActiveTableId] = useState<string | null>(null)
  const [viewingMenu, setViewingMenu] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [editingNote, setEditingNote] = useState<{ productId: string; text: string } | null>(null)

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

  const filteredDishes = products.filter(
    (d) =>
      d.image &&
      d.image.trim() !== '' &&
      (d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleTableClick = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation()
    const clickedTable = tables.find((t) => t.id === id)

    // Si la mesa está Disponible: cambiar a Reservada y limpiar datos residuales
    if (clickedTable && clickedTable.status === 'Disponible') {
      resetTableOrder(id) // Eliminar cualquier pedido residual sin tocar el estado
      updateTableStatus(id, 'Reservada') // La mesa pasa a "siendo atendida"
    }

    setActiveTableId(id)
    setViewingMenu(false) // Mostrar panel de pedido al abrir
    setShowSummary(false)
    setEditingNote(null)
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

  // Detección VIP para la mesa activa
  const isVipTable = activeTable?.type === 'vip'
  const activeTableResArr = activeTableId ? reservations[activeTableId] || [] : []
  const hasVipReservation = activeTableResArr.some((r) => r.vip)
  const isVipOrder = isVipTable || hasVipReservation
  const vipClientNameGlobal = hasVipReservation
    ? activeTableResArr.find((r) => r.vip)?.clientName
    : undefined

  const handleConfirmOrder = () => {
    if (activeTableId) {
      confirmOrder(activeTableId)
      setViewingMenu(false) // Volver a la vista de pedido
      setShowSummary(false)
      toast.success(
        isVipOrder ? '⚡ Pedido VIP enviado con prioridad' : '¡Pedido enviado a cocina!',
        {
          description: isVipOrder
            ? `${activeTable?.name} — ${activeOrder.length} plato(s) · Prioridad máxima en cocina.`
            : `${activeTable?.name} — ${activeOrder.length} plato(s) en preparación.`,
          duration: 3500
        }
      )
    }
  }

  const handleRequestBill = () => {
    if (activeTableId) {
      requestBill(activeTableId)
    }
  }

  const handleClearOrder = () => {
    if (activeTableId) {
      clearOrder(activeTableId) // Limpia pedido y libera la mesa (→ Disponible)
      setViewingMenu(false)
      setShowSummary(false)
      setMenuPanelOpen(false)
      setActiveTableId(null)
      toast.success('Pedido cancelado', {
        description: 'La mesa ha vuelto a estar disponible.',
        duration: 3000
      })
    }
  }

  // ── Manejadores de reserva ──
  const openReserveModal = (e: MouseEvent<HTMLButtonElement>, tableId: string) => {
    e.stopPropagation()
    setReservingTableId(tableId)
  }

  const closeReserveModal = () => {
    setReservingTableId(null)
  }

  const handleConfirmReservation = (formData: ReservationFormData) => {
    if (!reservingTableId) return

    try {
      const reservingTable = tables.find((t) => t.id === reservingTableId)
      const tableName = reservingTable?.name || 'Mesa'

      // 🚀 CONEXIÓN AL BACKEND: Nuevo formato de Payload para la Base de Datos
      reserveTable(reservingTableId, {
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
    setShowSummary(false)
    setEditingNote(null)
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
      setShowSummary(false)
      setEditingNote(null)
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
    setShowSummary(false)
    setEditingNote(null)
  }

  const handlePrintOrder = () => {
    toast.success('Orden enviada a impresora', {
      description: 'El pedido se ha enviado a la impresora de cocina.',
      duration: 3000
    })
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
        {menuPanelOpen && activeTableId && activeTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:px-8">
            {/* Fondo oscuro difuminado (overlay del modal) */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-300"
              onClick={handleCloseModal}
            />

            {/* Contenedor del Modal */}
            <div
              className={`
              relative z-10 w-full max-w-[440px] lg:max-w-[480px] bg-white shadow-2xl rounded-3xl
              flex flex-col transform transition-all duration-300 ease-out overflow-hidden max-h-[90vh]
              animate-in zoom-in-95
            `}
            >
              {/* Header del panel derecho */}
              {(() => {
                const vipClientName = vipClientNameGlobal
                return (
                  <div
                    className={`pt-6 pb-4 px-5 border-b shrink-0 ${
                      isVipOrder
                        ? 'bg-gradient-to-b from-[#2C1A0E] to-[#3D2318] border-amber-800/40'
                        : activeTable.status === 'Esperando pago'
                          ? 'bg-[#FFF9F0] border-[#E6A23C]/30'
                          : 'bg-[#FFF5F0] border-[#FCE4D6]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-black text-2xl ${isVipOrder ? 'text-white' : 'text-[#4B2E2D]'}`}
                          >
                            {activeTable.name}
                          </h3>
                          {isVipOrder && (
                            <Crown
                              size={18}
                              className="text-yellow-300 drop-shadow"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                        <p
                          className={`text-sm font-bold mt-1 ${
                            isVipOrder
                              ? 'text-white/65'
                              : activeTable.status === 'Disponible'
                                ? 'text-[#2C2C2C]/80'
                                : activeTable.status === 'Ocupada'
                                  ? 'text-[#D96C4A]'
                                  : activeTable.status === 'Esperando pago'
                                    ? 'text-[#E6A23C]'
                                    : 'text-[#6B3E2E]'
                          }`}
                        >
                          {activeTable.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCloseModal}
                          className={`p-2 rounded-xl transition-colors ${isVipOrder ? 'text-white/50 hover:bg-white/10' : 'text-[#4B2E2D]/50 hover:bg-black/5'}`}
                        >
                          <X size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Banner de prioridad VIP */}
                    {isVipOrder && (
                      <div className="flex items-center gap-2.5 bg-amber-400/15 border border-amber-400/30 rounded-xl px-3.5 py-2.5 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400/25 flex items-center justify-center shrink-0">
                          <Zap size={14} className="text-yellow-300" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-yellow-200 font-black text-[11px] uppercase tracking-wider">
                            Pedido con Prioridad VIP
                          </p>
                          <p className="text-white/55 text-[10px] font-medium leading-snug mt-0.5">
                            {vipClientName ? `Cliente: ${vipClientName} · ` : ''}Este pedido
                            encabeza la cola de cocina
                          </p>
                        </div>
                        <span className="flex items-center gap-1 bg-yellow-400/25 text-yellow-300 text-[9px] font-black px-2 py-1 rounded-full border border-yellow-400/30 shrink-0">
                          <Crown size={8} strokeWidth={2.5} /> PRIORIDAD
                        </span>
                      </div>
                    )}

                    {/* Navegación interna del panel (Solo si no está pagando) */}
                    {activeTable.status !== 'Esperando pago' && (
                      <div
                        className={`flex p-1 rounded-xl shadow-inner border ${isVipOrder ? 'bg-white/10 border-white/15' : 'bg-white/60 border-[#FCE4D6]'}`}
                      >
                        <button
                          onClick={() => setViewingMenu(false)}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            !viewingMenu
                              ? isVipOrder
                                ? 'bg-white/20 text-white shadow-sm'
                                : 'bg-white text-[#4B2E2D] shadow-sm'
                              : isVipOrder
                                ? 'text-white/50 hover:bg-white/10'
                                : 'text-[#4B2E2D]/60 hover:bg-white/40'
                          }`}
                        >
                          Pedido Actual
                        </button>
                        <button
                          onClick={() => setViewingMenu(true)}
                          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                            viewingMenu
                              ? isVipOrder
                                ? 'bg-amber-500/80 text-white shadow-sm'
                                : 'bg-[#4B2E2D] text-white shadow-sm'
                              : isVipOrder
                                ? 'text-white/50 hover:bg-white/10'
                                : 'text-[#4B2E2D]/60 hover:bg-white/40'
                          }`}
                        >
                          Menú
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* CONTENIDO DEL PANEL */}
              <div className="flex-1 overflow-y-auto bg-gray-50/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {/* VISTA: ESPERANDO PAGO (PRE-CUENTA) */}
                {activeTable.status === 'Esperando pago' && (
                  <div className="p-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <div className="text-center mb-6 pb-6 border-b border-dashed border-gray-300">
                        <Receipt size={32} className="mx-auto text-[#E6A23C] mb-2" />
                        <h4 className="font-black text-xl text-[#4B2E2D]">Pre-cuenta</h4>
                        <p className="text-gray-500 text-sm font-medium mt-1">{activeTable.name}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                        {activeOrder.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex flex-col gap-1 border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="flex justify-between items-start text-sm">
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-gray-400 w-6">
                                  {item.quantity}x
                                </span>
                                <span className="font-bold text-[#4B2E2D]">
                                  {item.product.name}
                                </span>
                              </div>
                              <span className="font-bold text-[#4B2E2D] shrink-0">
                                Bs. {(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            {item.note && (
                              <div className="text-xs text-gray-500 italic ml-8 flex items-center gap-1">
                                <MessageSquare size={10} />
                                Nota: {item.note}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-dashed border-gray-300 flex justify-between items-center">
                        <span className="font-black text-lg text-[#4B2E2D]">Total</span>
                        <span className="font-black text-2xl text-[#D0543A]">
                          Bs. {orderTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={openPaymentModal}
                      className="w-full mt-6 py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black text-lg shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Procesar Pago
                    </button>
                  </div>
                )}

                {/* VISTA: CARTA DIGITAL (AGREGAR) */}
                {activeTable.status !== 'Esperando pago' && viewingMenu && (
                  <div className="p-4 space-y-4 pb-8">
                    <div className="relative group mb-4">
                      <Search
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4B2E2D]/40 group-focus-within:text-[#E57C5D] transition-colors"
                        size={18}
                        strokeWidth={2.5}
                      />
                      <input
                        type="text"
                        placeholder="Buscar platillo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-[#FCE4D6] rounded-xl text-sm font-semibold text-[#4B2E2D] placeholder:text-[#4B2E2D]/40 focus:outline-none focus:border-[#E57C5D] transition-all shadow-sm"
                      />
                    </div>

                    <div className="space-y-3">
                      {filteredDishes.map((dish) => {
                        const isActive = dish.status === 'Disponible'
                        return (
                          <div
                            key={dish.id}
                            className={`flex items-center gap-4 bg-white p-3 rounded-[16px] transition-all duration-300 border border-gray-100
                            ${!isActive ? 'opacity-60 bg-gray-50' : 'hover:border-[#D0543A]/30 hover:shadow-md'}
                          `}
                          >
                            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-gray-100">
                              <img
                                src={dish.image}
                                alt={dish.name}
                                className={`w-full h-full object-cover ${!isActive ? 'grayscale' : ''}`}
                              />
                              {!isActive && (
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                    AGOTADO
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center text-left py-0.5">
                              <h3
                                className={`text-[14px] font-black leading-tight truncate w-full ${!isActive ? 'text-gray-400 line-through' : 'text-[#4B2E2D]'}`}
                              >
                                {dish.name}
                              </h3>

                              <span
                                className="text-[11px] text-gray-400 truncate w-full"
                                title={dish.description || 'Sin descripción'}
                              >
                                {dish.description || 'Sin descripción'}
                              </span>
                              <span
                                className={`text-sm font-black mt-1 ${isActive ? 'text-[#D0543A]' : 'text-gray-400'}`}
                              >
                                Bs. {dish.price.toFixed(2)}
                              </span>
                            </div>

                            {isActive && (
                              <button
                                onClick={() => addOrderItem(activeTable.id, dish)}
                                className="w-10 h-10 rounded-full bg-[#FFF5F0] text-[#D0543A] hover:bg-[#D0543A] hover:text-white flex items-center justify-center transition-colors shadow-sm"
                              >
                                <Plus size={20} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* VISTA: PEDIDO ACTUAL DE LA MESA */}
                {activeTable.status !== 'Esperando pago' && !viewingMenu && (
                  <div className="p-4 flex flex-col h-full">
                    {activeOrder.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                        <ShoppingBag size={48} className="text-[#4B2E2D] mb-4 opacity-50" />
                        <p className="font-black text-lg text-[#4B2E2D]">Sin pedidos</p>
                        <p className="text-sm font-medium mt-1">
                          La mesa está vacía. Añade platillos desde la carta.
                        </p>
                        <button
                          onClick={() => setViewingMenu(true)}
                          className="mt-6 px-6 py-2 bg-[#4B2E2D] text-white rounded-xl font-bold text-sm shadow-md"
                        >
                          Ver Carta
                        </button>
                      </div>
                    ) : showSummary ? (
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4 text-[#4B2E2D]">
                          <button
                            onClick={() => setShowSummary(false)}
                            className="p-1 hover:bg-black/5 rounded-full transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <h4 className="font-black text-lg">Resumen del Pedido</h4>
                        </div>

                        <div className="space-y-3 pb-24 overflow-y-auto">
                          {activeOrder.map((item) => (
                            <div
                              key={item.product.id}
                              className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm flex flex-col gap-2"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-2">
                                  <span className="font-bold text-gray-400 w-6">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-bold text-[#4B2E2D]">
                                    {item.product.name}
                                  </span>
                                </div>
                                <span className="font-black text-[#4B2E2D] shrink-0">
                                  Bs. {(item.product.price * item.quantity).toFixed(2)}
                                </span>
                              </div>

                              {/* Visualización de Nota en Resumen */}
                              {item.note && (
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg flex items-start gap-2 border border-gray-100">
                                  <MessageSquare
                                    size={14}
                                    className="mt-0.5 text-gray-400 shrink-0"
                                  />
                                  <span className="italic leading-tight">{item.note}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-24 overflow-y-auto">
                        {activeOrder.map((item) => {
                          const isEditingNote = editingNote?.productId === item.product.id

                          return (
                            <div
                              key={item.product.id}
                              className="flex flex-col gap-2 bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FFF5F0] text-[#D0543A] font-black flex items-center justify-center shrink-0">
                                  {item.quantity}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-[#4B2E2D] truncate text-[15px]">
                                    {item.product.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs font-bold text-gray-400">
                                      Bs. {item.product.price.toFixed(2)} c/u
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span className="font-black text-[#4B2E2D]">
                                    Bs. {(item.product.price * item.quantity).toFixed(2)}
                                  </span>
                                  <button
                                    onClick={() => removeOrderItem(activeTable.id, item.product.id)}
                                    className="text-red-400 hover:text-red-600 p-1 font-bold text-xs flex items-center gap-1"
                                    title="Cancelar unidad"
                                  >
                                    <X size={14} /> Cancelar 1
                                  </button>
                                </div>
                              </div>

                              {/* Campo de Nota / Botón */}
                              {isEditingNote ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editingNote.text}
                                    onChange={(e) =>
                                      setEditingNote({ ...editingNote, text: e.target.value })
                                    }
                                    placeholder="Ej: Sin tomate, poco ají..."
                                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#D0543A]"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateOrderItemNote(
                                          activeTable.id,
                                          item.product.id,
                                          editingNote.text
                                        )
                                        setEditingNote(null)
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      updateOrderItemNote(
                                        activeTable.id,
                                        item.product.id,
                                        editingNote.text
                                      )
                                      setEditingNote(null)
                                    }}
                                    className="px-3 py-1.5 bg-[#4B2E2D] text-white text-xs font-bold rounded-lg"
                                  >
                                    OK
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setEditingNote({
                                      productId: item.product.id,
                                      text: item.note || ''
                                    })
                                  }
                                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#D0543A] self-start mt-1"
                                >
                                  {item.note ? (
                                    <>
                                      <MessageSquare size={12} />{' '}
                                      <span className="italic max-w-[200px] truncate">
                                        {item.note}
                                      </span>{' '}
                                      <Edit2 size={10} className="ml-1" />
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={12} /> Agregar observación
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER DEL PANEL (Acciones) */}
              {activeTable.status !== 'Esperando pago' && activeOrder.length > 0 && (
                <div className="p-5 sm:p-6 bg-white border-t border-[#FCE4D6]/60 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] shrink-0 flex flex-col gap-3">
                  {/* VIP Priority Notice in footer */}
                  {isVipOrder && (
                    <div className="flex items-center gap-2.5 bg-gradient-to-r from-[#2C1A0E] to-[#4B2E2D] rounded-xl px-3.5 py-2.5 -mt-1">
                      <Crown size={14} className="text-yellow-300 shrink-0" strokeWidth={2.5} />
                      <p className="text-yellow-200 font-black text-[11px] uppercase tracking-wider flex-1">
                        Prioridad VIP — Cocina primero
                      </p>
                      <Zap size={13} className="text-amber-400 shrink-0" strokeWidth={2.5} />
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-gray-500">Total a Pagar</span>
                    <span className="font-black text-2xl sm:text-3xl text-[#4B2E2D]">
                      Bs. {orderTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Botones de acción principales */}
                  <div className="flex flex-col gap-3">
                    {/* Botón Principal (Ver Resumen / Confirmar / Ver Pedido) */}
                    {viewingMenu ? (
                      <button
                        onClick={() => setViewingMenu(false)}
                        className="w-full py-4 rounded-2xl bg-[#F5E6D3] border-2 border-[#6B3E2E] text-[#2C2C2C] font-black shadow-sm transition-all text-[15px] flex items-center justify-center gap-2 hover:bg-[#E8D4BE]"
                      >
                        <ShoppingBag size={20} />
                        Ver Pedido Actual
                      </button>
                    ) : showSummary ? (
                      <button
                        onClick={handleConfirmOrder}
                        className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} />
                        Confirmar y Enviar a Cocina
                      </button>
                    ) : activeTable.status === 'Reservada' ? (
                      <button
                        onClick={() => setShowSummary(true)}
                        className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={20} />
                        Ver Resumen de Orden
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewingMenu(true)}
                        className="w-full py-4 rounded-2xl bg-[#F5E6D3] border-2 border-[#6B3E2E] text-[#2C2C2C] font-black shadow-sm transition-all text-[15px] flex items-center justify-center gap-2 hover:bg-[#E8D4BE]"
                      >
                        <Plus size={20} />
                        Añadir Más Platos
                      </button>
                    )}

                    {/* Botón Imprimir Pedido - Solo visible en modo pedido cuando la mesa está ocupada */}
                    {!viewingMenu && !showSummary && activeTable.status === 'Ocupada' && (
                      <button
                        onClick={handlePrintOrder}
                        className="w-full py-3 rounded-2xl bg-white border-2 border-[#6B3E2E] text-[#4B2E2D] hover:bg-[#F5E6D3] font-bold transition-all text-[14px] flex items-center justify-center gap-2"
                      >
                        <Printer size={18} />
                        Imprimir Pedido
                      </button>
                    )}

                    {/* Botón Principal/Secundario (Pedir Cuenta) - Solo en modo pedido cuando la mesa está ocupada */}
                    {!viewingMenu && !showSummary && activeTable.status === 'Ocupada' && (
                      <button
                        onClick={handleRequestBill}
                        className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/20 transition-all text-[15px] flex items-center justify-center gap-2"
                      >
                        <Receipt size={20} />
                        Pedir Cuenta
                      </button>
                    )}

                    {/* Botón Peligro (Cancelar Pedido Completo) - Solo visible en modo pedido cuando la mesa está ocupada */}
                    {!viewingMenu && !showSummary && activeTable.status === 'Ocupada' && (
                      <button
                        onClick={handleClearOrder}
                        className="w-full py-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2] hover:text-[#B91C1C] font-bold transition-all text-[15px] flex items-center justify-center gap-2 mt-1"
                      >
                        <Trash2 size={18} />
                        Cancelar Pedido Completo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
      {cancelingReservationTableId &&
        cancelingReservationId &&
        (() => {
          const cancelingTable = tables.find((t) => t.id === cancelingReservationTableId)
          const tableReservations = reservations[cancelingReservationTableId] || []
          const cancelingReservationInfo =
            tableReservations.find((r) => r.id === cancelingReservationId) || null
          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black/65 backdrop-blur-[5px] animate-in fade-in duration-200"
                onClick={closeCancelReservationModal}
              />
              {/* Modal card */}
              <div className="relative z-10 w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header del modal */}
                <div className="bg-gradient-to-r from-[#8C3A3A] to-[#7A2A2A] px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <XCircle size={20} className="text-white" strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 className="font-black text-white text-lg leading-tight">
                        Cancelar reserva
                      </h2>
                      <p className="text-[#F5E6D3] text-xs font-semibold mt-0.5">
                        {cancelingTable?.name}
                        {cancelingReservationInfo
                          ? ` · ${cancelingReservationInfo.clientName}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeCancelReservationModal}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
                      <AlertTriangle size={32} className="text-red-500" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="font-black text-[#4B2E2D] text-base">
                        ¿Estás seguro de que deseas cancelar esta reserva?
                      </p>
                      {cancelingReservationInfo && (
                        <div className="mt-3 p-3 bg-[#FFF5F0] rounded-xl border border-[#FCE4D6] text-left space-y-1.5">
                          <div className="flex items-center gap-2 text-[#4B2E2D]">
                            <UserCheck size={13} strokeWidth={2.5} />
                            <span className="text-sm font-black">
                              {cancelingReservationInfo.clientName}
                            </span>
                            {cancelingReservationInfo.vip && (
                              <Crown size={12} className="text-yellow-500" strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#4B2E2D]/80">
                              <Clock size={11} /> {cancelingReservationInfo.date} ·{' '}
                              {cancelingReservationInfo.startTime}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#4B2E2D]/80">
                              <Users size={11} /> {cancelingReservationInfo.guestCount} personas
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-gray-500 text-sm font-medium mt-3">
                        Esta reserva será eliminada del sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer con botones */}
                <div className="px-6 pb-6 flex gap-3">
                  <button
                    onClick={closeCancelReservationModal}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleConfirmCancelReservation}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    Confirmar cancelación
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

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
