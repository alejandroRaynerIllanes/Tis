//SRC/app/components/WaiterView.tsx
import {
  ChevronLeft,
  LogOut,
  Users,
  Clock,
  CheckCircle2,
  Receipt,
  MapPin,
  ChefHat,
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
  UserCheck,
  Crown,
  Bell,
  History
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { MouseEvent, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { TableStatus, Table, useAppContext } from '../context/AppContext'
import { useNotifications } from '../context/NotificationsContext'
import {
  useWaiterLogic,
  getTableDisplayName,
  getTableLocation,
  type StateFilter,
  type TableWithFallbacks
} from '../hooks/useWaiterLogic'
import { ReservationsListModal } from './ReservationsListModal'
import { PreCuentaModal } from './PreCuentaModal'
import { ReserveTableModal } from './ReserveTableModal'
import { CancelReservationModal } from './CancelReservationModal'
import { TableSidePanel } from './TableSidePanel'
import { getStoredUser, setStoredUser, api } from '../services/api'
import { ordersService } from '../services/orders.service'
import { WaiterHistoryModal } from './WaiterHistoryModal'
// ─── Tipos y helpers ─────────────────────────────────────────────────────────

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
  const navigate = useNavigate()

  const waiterLogic = useWaiterLogic()
  const {
    tables,
    reservations,
    LOCATIONS,
    activeLocation,
    setActiveLocation,
    stateFilter,
    setStateFilter,
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
  } = waiterLogic

  const { loadInitialData } = useAppContext()
  const { notifications, markNotificationAsRead, clearNotifications } = useNotifications()

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const role = localStorage.getItem('userRole')
  const isAdmin = role === 'admin' || role === 'administrador'

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [fetchedLocation, setFetchedLocation] = useState<string>('')

  // Extraer el nombre real del mesero autenticado
  const currentUser = getStoredUser()
  const waiterName = currentUser
    ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim()
    : 'Mesero'
  const userLocation =
    (currentUser as any)?.zona || (currentUser as any)?.ubicacion || fetchedLocation

  // Helper para normalizar nombres de zonas/ubicaciones y evitar problemas de mayúsculas/minúsculas/espacios
  const normalizeZone = (z: string | null | undefined) =>
    String(z || '')
      .toLowerCase()
      .trim()

  // Identificar si el mesero es de la zona VIP
  const isUserVipZone =
    normalizeZone(userLocation) === 'vip' || normalizeZone(userLocation) === 'zona vip'

  // Buscar la ubicación exacta en el sistema (con sus mayúsculas originales) que coincide con la zona del mesero
  const matchedUserLocation = isUserVipZone
    ? 'VIP'
    : LOCATIONS.find((loc: string) => normalizeZone(loc) === normalizeZone(userLocation)) ||
      userLocation

  // Respaldo dinámico: Si el backend no envió la zona al hacer login, la buscamos
  useEffect(() => {
    if (!isAdmin && !userLocation && (currentUser?.id || (currentUser as any)?._id)) {
      api
        .get('/usuarios')
        .then((res: any) => {
          const targetId = currentUser?.id || (currentUser as any)?._id
          const me = res.data.find((u: any) => u._id === targetId || u.id === targetId)
          if (me && me.zona) {
            setFetchedLocation(me.zona)
            // Actualizamos la sesión localmente SIN crear llaves duplicadas (fantasmas)
            const updatedUser = { ...(currentUser || {}), zona: me.zona, ubicacion: me.zona }
            setStoredUser(updatedUser as any) // Usamos solo la función oficial
          }
        })
        .catch(() => {})
    }
  }, [isAdmin, currentUser])

  // Filtrar ubicaciones según el rol (Los admin ven todo, los meseros solo su área asignada)
  const displayLocations = isAdmin ? LOCATIONS : matchedUserLocation ? [matchedUserLocation] : []

  // Si es mesero y tiene un área, forzar la selección de su área automáticamente
  useEffect(() => {
    if (!isAdmin && matchedUserLocation && activeLocation !== matchedUserLocation) {
      setActiveLocation(matchedUserLocation)
    }
  }, [isAdmin, matchedUserLocation, activeLocation, setActiveLocation])

  // Identificamos las mesas que le pertenecen a este mesero basado en su zona
  const myAllowedTables = tables.filter((t) => {
    if (isUserVipZone) {
      return (
        t.type === 'vip' ||
        normalizeZone(getTableLocation(t)) === 'vip' ||
        normalizeZone(getTableLocation(t)) === 'zona vip'
      )
    }
    return normalizeZone(getTableLocation(t)) === normalizeZone(userLocation)
  })

  // Filtro ESTRICTO final: Garantiza que un mesero NUNCA vea mesas que no le pertenecen
  const finalFilteredTables = isAdmin
    ? filteredTables
    : myAllowedTables.filter((t) => stateFilter === 'all' || t.status === stateFilter)

  // Recalculamos los contadores para los meseros (así no dependen de la ubicación del hook)
  const customTotalInLocation = isAdmin ? totalInLocation : myAllowedTables.length
  const customTableCounts = isAdmin
    ? tableCounts
    : myAllowedTables.reduce(
        (acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // 🚀 Función Inteligente para las Notificaciones
  const handleNotificationAction = async (e: React.MouseEvent, n: any) => {
    e.stopPropagation()
    if (n.meta?.actionType === 'deliver_order' && n.meta?.pedidoId) {
      try {
        await ordersService.updateStatus(n.meta.pedidoId, 'ENTREGADO')
        await loadInitialData()
        toast.success('Pedido entregado al cliente', {
          description: 'Ya puedes solicitar la cuenta desde la mesa.'
        })
      } catch (err) {
        console.error(err)
        // Fallback to SERVIDO if ENTREGADO is not accepted
        try {
          await ordersService.updateStatus(n.meta.pedidoId, 'SERVIDO')
          await loadInitialData()
          toast.success('Pedido entregado al cliente', {
            description: 'Ya puedes solicitar la cuenta desde la mesa.'
          })
        } catch (e2) {}
      }
    } else if (n.meta?.actionType === 'process_payment' && n.meta?.tableId) {
      handleTableClick(e as any, n.meta.tableId)
      setIsNotificationsOpen(false)
    }
    markNotificationAsRead(n.id)
  }

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
              <span className="font-black text-sm sm:text-[16px] text-[#4B2E2D] bg-white px-2.5 py-1 rounded-md shadow-sm flex items-center gap-2 whitespace-nowrap">
                {waiterName}
                {userLocation && (
                  <span className="bg-[#FCE4D6] text-[#D96C4A] text-[10px] px-1.5 py-0.5 rounded uppercase tracking-widest font-black border border-[#D96C4A]/20">
                    {userLocation}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* 🔔 Centro de Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`relative p-2 rounded-xl transition-colors mr-1 sm:mr-2 ${isNotificationsOpen ? 'bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'}`}
                title="Centro de Notificaciones"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-[#4B2E2D] rounded-full animate-pulse shadow-sm"></span>
                )}
              </button>

              {/* Panel Desplegable */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-4 w-[340px] sm:w-[420px] bg-[#F8F9FA] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-gray-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-4 duration-200 origin-top-right">
                  <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell size={18} className="text-white/80" />
                      <h3 className="font-black text-white text-base tracking-wide">
                        Notificaciones
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearNotifications()}
                        className="text-white/70 hover:text-white text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95"
                      >
                        Limpiar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10 p-3">
                    {notifications.length === 0 ? (
                      <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <Bell size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-bold text-sm">Tu bandeja está vacía</p>
                        <p className="text-gray-400 text-xs mt-1">
                          No tienes nuevas alertas por ahora.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationAsRead(n.id)}
                            className={`relative p-4 rounded-2xl transition-all cursor-pointer group shadow-sm ${n.read ? 'bg-white hover:bg-gray-50 border border-gray-100' : 'bg-white border-2 border-[#D96C4A]/30 hover:shadow-md'}`}
                          >
                            {!n.read && (
                              <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#D96C4A] shadow-[0_0_8px_rgba(217,108,74,0.8)] animate-pulse" />
                            )}
                            <div className="flex gap-3.5 items-start">
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-inner ${n.type === 'success' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600' : 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600'}`}
                              >
                                {n.type === 'success' ? (
                                  <CheckCircle2 size={20} />
                                ) : (
                                  <Receipt size={20} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-4">
                                <p
                                  className={`text-[15px] leading-tight mb-1 truncate ${n.read ? 'font-bold text-gray-500' : 'font-black text-[#4B2E2D]'}`}
                                >
                                  {n.title}
                                </p>
                                <p
                                  className={`text-[13px] leading-relaxed mb-2.5 line-clamp-2 ${n.read ? 'text-gray-400 font-medium' : 'text-[#4B2E2D]/80 font-semibold'}`}
                                >
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Clock size={11} />{' '}
                                  {new Date(n.time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            {!n.read && (
                              <div className="mt-3.5 ml-[58px] flex flex-wrap gap-2">
                                {n.meta?.actionType === 'deliver_order' && (
                                  <button
                                    onClick={(e) => handleNotificationAction(e, n)}
                                    className="text-[12px] font-black px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                                  >
                                    <ChefHat size={14} /> Entregar Pedido
                                  </button>
                                )}
                                {n.meta?.actionType === 'process_payment' && (
                                  <button
                                    onClick={(e) => handleNotificationAction(e, n)}
                                    className="text-[12px] font-black px-4 py-2 bg-[#D96C4A] hover:bg-[#C25838] text-white rounded-xl shadow-md shadow-[#D96C4A]/20 transition-all active:scale-95 flex items-center gap-1.5"
                                  >
                                    <Receipt size={14} /> Ver mesa
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markNotificationAsRead(n.id)
                                  }}
                                  className="text-[12px] font-bold px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
                                >
                                  Ocultar
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white mr-1 sm:mr-2"
              title="Historial Diario"
            >
              <History size={18} />
            </button>

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
              {displayLocations.map((loc, index) => (
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
                    {f.key === 'all'
                      ? customTotalInLocation
                      : customTableCounts[f.key as TableStatus] || 0}
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
              {activeLocation === 'VIP' ? 'Zona VIP' : activeLocation}
            </h2>
          </div>

          {/* ── Grid de Mesas ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 pb-20">
            {finalFilteredTables.map((t, index) => {
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
                  <div className="flex justify-between items-start w-full mb-4 relative z-10">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black text-xl sm:text-2xl tracking-tight drop-shadow-sm leading-none mt-1 truncate block ${cfg.textClass}`}
                          title={String(tableName)}
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
                          className={`flex items-center gap-1 text-[11px] font-bold ${cfg.textClass} opacity-80 truncate`}
                          title={tableLocation}
                        >
                          <MapPin size={11} className="shrink-0" />
                          <span className="truncate">{tableLocation}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => openReserveModal(e, t.id)}
                          className={`p-2 rounded-xl transition-all bg-black/5 ${t.status === 'Reservada' || t.status === 'Ocupada' ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-blue-600/60 hover:text-blue-700 hover:bg-blue-500/10'}`}
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
                              className={`p-2 rounded-xl transition-all bg-black/5 ${t.status === 'Reservada' || t.status === 'Ocupada' ? 'text-white/80 hover:text-white hover:bg-white/20' : 'text-[#4B2E2D]/50 hover:text-[#D0543A] hover:bg-white/40'}`}
                              aria-label="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteTable?.(t.id)
                              }}
                              className={`p-2 rounded-xl transition-all bg-black/5 ${t.status === 'Reservada' || t.status === 'Ocupada' ? 'text-white/80 hover:text-red-300 hover:bg-red-500/20' : 'text-[#4B2E2D]/50 hover:text-red-600 hover:bg-red-500/10'}`}
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

            {finalFilteredTables.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-80 text-center">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                  <MapPin size={32} className="text-white/60" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">No hay mesas visibles</h3>
                <p className="text-white/70 font-medium max-w-md">
                  {!userLocation
                    ? 'Aún no tienes una zona asignada. Por favor, pide al administrador que te asigne una ubicación (ej: Terraza).'
                    : `No se encontraron mesas registradas en tu zona asignada (${userLocation}).`}
                </p>
              </div>
            )}
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
        reservation={
          (reservations[cancelingReservationTableId || ''] || []).find(
            (r) => r.id === cancelingReservationId
          ) || null
        }
        onClose={closeCancelReservationModal}
        onConfirm={handleConfirmCancelReservation}
      />

      {/* ══════════════════════════════════════════════════════════════
          MODAL DE PAGO
      ══════════════════════════════════════════════════════════════ */}
      <PreCuentaModal
        isOpen={showPaymentModal && !!activeTableId}
        onClose={closePaymentModal}
        tableId={activeTableId || ''}
        tableName={activeTable?.name || 'Mesa'}
        activeOrder={activeOrder}
        orderTotal={orderTotal}
        onSuccess={() => {
          closePaymentModal()
          handleCloseModal()
        }}
      />

      <ReservationsListModal
        viewingTableId={viewingReservationsTableId}
        tables={tables}
        reservations={reservations}
        onClose={closeReservationsListModal}
        onCancelReservation={openCancelReservationModal}
      />

      <WaiterHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}
