import {
  Crown,
  Zap,
  MapPin,
  Shield,
  ChefHat,
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  BadgeCheck,
  TrendingUp,
  Calendar,
  User
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'
import { useEffect } from 'react'
import { api } from '../services/api'

export function VIPManagement() {
  const { tables } = useAppContext()
  const [vipZoneEnabled, setVipZoneEnabled] = useState(true)
  const [selectedSubscriber, setSelectedSubscriber] = useState<number | null>(null)
  const [incomingOrders, setIncomingOrders] = useState<any[]>([])
  const [vipSubscribers, setVipSubscribers] = useState<any[]>([])

  useEffect(() => {
    // Carga independiente de datos reales al montar la vista
    const fetchDynamicData = async () => {
      try {
        const resOrders: any = await api.get('/pedidos?activo=true')
        const ordersData = resOrders.data || resOrders || []
        const activeOrders = ordersData
          .map((o: any) => ({
            id: o.codigo || o._id,
            tableId: o.mesa?._id || '?',
            tableName: o.mesa?.numero || 'Mesa ?',
            clientName: o.usuario?.nombre || 'Cliente',
            isVip: o.mesa?.tipo === 'vip' || o.vip,
            items: (o.detalles || []).map((d: any) => `${d.plato?.nombre} ×${d.cantidad}`),
            time: new Date(o.fechaHora || o.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            estimatedTime: '15 min',
            priority: (o.mesa?.tipo === 'vip' || o.vip) ? 'ALTA' : 'NORMAL',
            status: o.estado === 'ABIERTO' ? 'Pendiente' : o.estado === 'EN_PREPARACION' ? 'En preparación' : 'Listo'
          }))
        setIncomingOrders(activeOrders)

        // Cargar clientes VIP reales desde la base de datos (Usuarios con rol 'Cliente')
        const resUsers: any = await api.get('/usuarios')
        const usersData = resUsers.data || resUsers || []
        const vipClients = usersData.filter((u: any) => u.rol === 'Cliente').map((c: any) => ({
          id: c._id || c.id,
          name: `${c.nombre} ${c.apellido || ''}`.trim(),
          email: c.email,
          plan: 'VIP Premium',
          status: c.estado ? 'Activo' : 'Inactivo',
          visits: Math.floor(Math.random() * 15) + 1, // Simulado hasta tener módulo de lealtad
          totalSpent: Math.floor(Math.random() * 2000) + 100, // Simulado
          joinDate: c.createdAt || new Date(),
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          avgTicket: 150
        }))
        setVipSubscribers(vipClients)
      } catch (error) {
        console.error('Error al cargar los datos VIP:', error)
      }
    }
    fetchDynamicData()
  }, [])

  // Obtener estadísticas de zona VIP
  const vipTables = tables.filter((t) => t.type === 'vip')
  const occupiedVipTables = vipTables.filter(
    (t) => t.status === 'Ocupada' || t.status === 'Reservada'
  )

  const handleToggleVipZone = () => {
    const newState = !vipZoneEnabled
    setVipZoneEnabled(newState)

    if (newState) {
      toast.success('Zona VIP habilitada', {
        description: 'Las mesas VIP están ahora disponibles para reservas.'
      })
    } else {
      toast.warning('Zona VIP deshabilitada', {
        description: 'Las mesas VIP no aceptarán nuevas reservas temporalmente.'
      })
    }
  }

  const handleViewSubscriber = (id: number) => {
    setSelectedSubscriber(selectedSubscriber === id ? null : id)
  }

  // Ordenar pedidos: VIP primero
  const sortedOrders = [...incomingOrders].sort((a, b) => {
    if (a.isVip && !b.isVip) return -1
    if (!a.isVip && b.isVip) return 1
    return 0
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ════════════════ HEADER CON STATS ════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Total Suscriptores */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 border border-transparent hover:border-amber-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                Suscriptores VIP
              </p>
              <p className="text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
            {vipSubscribers.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-400/15 flex items-center justify-center shrink-0">
              <Crown size={22} className="text-amber-500" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp size={11} strokeWidth={3} />
              +2 este mes
            </span>
          </div>
        </div>

        {/* Card 2 — Ingresos VIP */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 border border-transparent hover:border-[#D96C4A]/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                Ingresos VIP
              </p>
              <p className="text-3xl font-black text-[#4B2E2D] mt-1 leading-none">Bs. 9.7K</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#D96C4A]/10 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D96C4A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#4B2E2D]/45 font-medium">35% del total</span>
          </div>
        </div>

        {/* Card 3 — Mesas VIP */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 border border-transparent hover:border-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                Mesas VIP
              </p>
              <p className="text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                {occupiedVipTables.length}
                <span className="text-lg font-bold text-[#4B2E2D]/35">/{vipTables.length}</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <MapPin size={22} className="text-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#4B2E2D]/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(occupiedVipTables.length / vipTables.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-blue-600">
              {Math.round((occupiedVipTables.length / vipTables.length) * 100)}%
            </span>
          </div>
        </div>

        {/* Card 4 — Pedidos Prioritarios */}
        <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 border border-transparent hover:border-yellow-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                Pedidos VIP Hoy
              </p>
              <p className="text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                {sortedOrders.filter((o) => o.isVip).length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-yellow-400/15 flex items-center justify-center shrink-0">
              <Zap size={22} className="text-yellow-500" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#4B2E2D]/45 font-medium">40% más rápido</span>
          </div>
        </div>
      </div>

      {/* ════════════════ CONTROL DE ZONA VIP ════════════════ */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
        <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Control de Zona VIP</h3>
              <p className="text-white/65 text-xs font-medium mt-0.5">
                Administra la disponibilidad de las mesas VIP exclusivas
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleVipZone}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              vipZoneEnabled
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
          >
            {vipZoneEnabled ? (
              <>
                <ToggleRight size={18} strokeWidth={2.5} />
                Habilitada
              </>
            ) : (
              <>
                <ToggleLeft size={18} strokeWidth={2.5} />
                Deshabilitada
              </>
            )}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vipTables.map((table) => {
              const statusColor =
                table.status === 'Disponible'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : table.status === 'Ocupada'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : table.status === 'Reservada'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'

              return (
                <div
                  key={table.id}
                  className="bg-[#FCE4D6]/30 rounded-xl p-4 border border-[#E0D0C5]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown size={16} className="text-amber-500" />
                      <span className="font-black text-[#4B2E2D]">{table.name}</span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColor}`}
                    >
                      {table.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#4B2E2D]/60 font-medium">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>Capacidad: {table.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span>Zona VIP</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!vipZoneEnabled && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Zona VIP temporalmente deshabilitada
                </p>
                <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                  Las mesas VIP no aceptarán nuevas reservas hasta que vuelvas a habilitar esta
                  zona.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ PANEL DE PEDIDOS CON PRIORIDAD (SISTEMA BANCO) ════════════════ */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
        <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center shrink-0">
              <Zap size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Cola de Pedidos con Prioridad</h3>
              <p className="text-white/65 text-xs font-medium mt-0.5">
                Sistema de banco: Pedidos VIP siempre van primero
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-white">
                {sortedOrders.filter((o) => o.isVip).length} VIP
              </span>
            </div>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/50" />
              <span className="text-xs font-bold text-white/80">
                {sortedOrders.filter((o) => !o.isVip).length} Regular
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Explicación del sistema */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/25 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-800">Sistema de Prioridad tipo Banco</p>
              <p className="text-xs font-medium text-amber-700/80 mt-0.5 leading-relaxed">
                Al igual que en un banco donde los clientes preferenciales pasan primero, los
                pedidos VIP encabezan la cola de cocina independientemente del orden de llegada.
                Esto garantiza tiempos de entrega 40% más rápidos.
              </p>
            </div>
          </div>

          {/* Lista de pedidos ordenada */}
          <div className="space-y-3">
            {sortedOrders.map((order, idx) => (
              <div
                key={order.id}
                className={`rounded-xl p-4 border-2 transition-all ${
                  order.isVip
                    ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300 shadow-md hover:shadow-lg'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Posición en cola */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm ${
                      order.isVip ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Información del pedido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-[#4B2E2D]">{order.id}</span>
                          <span className="text-[#4B2E2D]/40">•</span>
                          <span className="font-bold text-[#4B2E2D]">{order.tableName}</span>

                          {order.isVip && (
                            <span className="flex items-center gap-1 bg-yellow-400/90 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm border border-yellow-500">
                              <Crown size={10} strokeWidth={3} />
                              PRIORIDAD ALTA
                            </span>
                          )}

                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              order.status === 'En preparación'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#4B2E2D]/60 font-medium mb-2">
                          <User size={12} />
                          <span>{order.clientName}</span>
                          <span className="text-[#4B2E2D]/30">•</span>
                          <Clock size={12} />
                          <span>Ingresó: {order.time}</span>
                        </div>

                        {/* Items del pedido */}
                        <div className="flex flex-wrap gap-1.5">
                          {order.items.map((item: string, i: number) => (
                            <span
                              key={i}
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                order.isVip
                                  ? 'bg-white/80 text-amber-900'
                                  : 'bg-white text-gray-700'
                              }`}
                            >
                              <ChefHat size={10} className="inline mr-1" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tiempo estimado */}
                      <div
                        className={`text-right shrink-0 ${order.isVip ? 'text-amber-700' : 'text-gray-600'}`}
                      >
                        <p className="text-xs font-bold opacity-60 uppercase tracking-wide">
                          Entrega
                        </p>
                        <p className="text-lg font-black leading-tight">{order.estimatedTime}</p>
                      </div>
                    </div>

                    {/* Indicador VIP adicional */}
                    {order.isVip && (
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mt-2">
                        <Zap size={11} strokeWidth={2.5} />
                        <span>Este pedido se prepara con prioridad absoluta</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedOrders.length === 0 && (
            <div className="text-center py-12 text-[#4B2E2D]/40">
              <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No hay pedidos en cola</p>
            </div>
          )}
        </div>
      </div>

      {/* ════════════════ GESTIÓN DE SUSCRIPTORES ════════════════ */}
      <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
        <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Users size={20} className="text-yellow-300" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Gestión de Suscriptores VIP</h3>
              <p className="text-white/65 text-xs font-medium mt-0.5">
                Visualiza y administra todos los clientes con suscripción activa
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg px-3 py-1.5">
        <span className="text-sm font-black text-white">{vipSubscribers.length} activos</span>
          </div>
        </div>

        <div className="p-6">
          {/* Tabla de suscriptores */}
          <div className="space-y-3">
            {vipSubscribers.map((subscriber: any) => (
              <div key={subscriber.id}>
                <div
                  className="bg-[#FCE4D6]/30 rounded-xl p-4 border border-[#E0D0C5] hover:bg-[#FCE4D6]/50 transition-all cursor-pointer"
                  onClick={() => handleViewSubscriber(subscriber.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Avatar + Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6B3E2E] to-[#4B2E2D] flex items-center justify-center shrink-0 shadow-md">
                        <span className="text-white font-black text-lg">
                          {subscriber.name.charAt(0)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-black text-[#4B2E2D]">{subscriber.name}</span>
                          <span className="flex items-center gap-1 bg-amber-400/15 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300/40">
                            <Crown size={9} strokeWidth={2.5} /> {subscriber.plan}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              subscriber.status === 'Activo'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {subscriber.status}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#4B2E2D]/50">{subscriber.email}</p>
                      </div>
                    </div>

                    {/* Stats rápidas */}
                    <div className="flex gap-6 shrink-0 text-right">
                      <div>
                        <p className="text-xs font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                          Visitas
                        </p>
                        <p className="text-lg font-black text-[#D96C4A]">{subscriber.visits}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                          Total
                        </p>
                        <p className="text-lg font-black text-[#4B2E2D]">
                          Bs. {subscriber.totalSpent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles expandibles */}
                {selectedSubscriber === subscriber.id && (
                  <div className="mt-2 bg-white rounded-xl p-4 border border-[#E0D0C5] shadow-inner">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="flex items-start gap-2">
                        <Calendar size={14} className="text-[#4B2E2D]/40 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                            Miembro desde
                          </p>
                          <p className="text-sm font-black text-[#4B2E2D]">
                            {new Date(subscriber.joinDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <BadgeCheck size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                            Próxima renovación
                          </p>
                          <p className="text-sm font-black text-[#4B2E2D]">
                            {new Date(subscriber.nextBilling).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <ChefHat size={14} className="text-[#D96C4A] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                            Ticket promedio
                          </p>
                          <p className="text-sm font-black text-[#4B2E2D]">
                            Bs. {subscriber.avgTicket.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Crown size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                            Nivel VIP
                          </p>
                          <p className="text-sm font-black text-amber-600">Premium</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {vipSubscribers.length === 0 && (
            <div className="text-center py-12 text-[#4B2E2D]/40">
              <Crown size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-bold">No hay suscriptores VIP activos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
