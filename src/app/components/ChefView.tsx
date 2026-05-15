import { useState, useEffect } from 'react'
import { ChefHat, Clock, Play, CheckCircle2, Flame, AlertCircle, LogOut, User } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { getStoredUser, api } from '../services/api'
import { ordersService } from '../services/orders.service'
import { useAppContext } from '../context/AppContext'

type OrderStatus = 'Pendiente' | 'En preparación' | 'Listo'

interface OrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
}

interface Order {
  id: string
  table: string
  waiter: string
  time: string
  status: OrderStatus
  isVip?: boolean
  items: OrderItem[]
  rawId?: string
}

export function ChefView() {
  const [orders, setOrders] = useState<Order[]>([])
  const navigate = useNavigate()
  const { socket } = useAppContext()

  const currentUser = getStoredUser()
  const chefName = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Cocinero'

  const formatOrder = (o: any): Order => ({
    // Si es un pedido antiguo sin código, generamos uno a partir del _id para que jamás se vea el hash largo
    id: o.codigo || `PED-${String(o._id || '').slice(-4).toUpperCase()}`,
    rawId: o._id,
    table: o.mesa?.numero || o.mesa?.name || 'Mesa ?',
    waiter: o.usuario?.nombre ? `${o.usuario.nombre} ${o.usuario.apellido || ''}`.trim() : 'Mesero',
    time: new Date(o.fechaHora || o.createdAt || Date.now()).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    status: o.estado === 'ABIERTO' ? 'Pendiente' : o.estado === 'EN_PREPARACION' ? 'En preparación' : 'Listo',
    isVip: o.mesa?.tipo === 'vip' || o.vip,
    items: (o.detalles || []).map((d: any, idx: number) => ({
      id: d.plato?._id || String(idx),
      name: d.plato?.nombre || 'Plato',
      quantity: d.cantidad,
      notes: d.observacion
    }))
  })

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res: any = await api.get('/pedidos?activo=true')
        const activeOrders = res.data || res || []
        setOrders(activeOrders.map(formatOrder))
      } catch (err) {
        console.error('Error fetching orders', err)
      }
    }
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNuevoPedido = (o: any) => {
      setOrders(prev => [formatOrder(o), ...prev])
      toast.info(`🔔 ¡Nuevo pedido recibido! (${o.codigo || 'Mesa'})`)
    }

    const handleActualizarTablero = (o: any) => {
      // Si el pedido fue cancelado o cobrado, desaparece de la vista.
      // Si está en 'ENTREGADO' (Listo), se queda en la última columna hasta que se pague.
      if (['CANCELADO', 'CERRADO'].includes(o.estado)) {
        setOrders(prev => prev.filter(ord => ord.rawId !== o._id))
      } else {
        setOrders(prev => {
          const exists = prev.find(ord => ord.rawId === o._id)
          if (exists) return prev.map(ord => ord.rawId === o._id ? formatOrder(o) : ord)
          return [formatOrder(o), ...prev]
        })
      }
    }

    socket.on('cocina:nuevo_pedido', handleNuevoPedido)
    socket.on('cocina:actualizar_tablero', handleActualizarTablero)

    return () => { 
      socket.off('cocina:nuevo_pedido', handleNuevoPedido)
      socket.off('cocina:actualizar_tablero', handleActualizarTablero)
    }
  }, [socket])

  // Función para cambiar el estado del pedido
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId)
    if (!order || !order.rawId) return
    const backendStatus = newStatus === 'Pendiente' ? 'ABIERTO' : newStatus === 'En preparación' ? 'EN_PREPARACION' : 'ENTREGADO'
    
    try {
      await ordersService.updateStatus(order.rawId, backendStatus)
      setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
      if (newStatus === 'En preparación') toast.success(`Pedido ${orderId} en preparación 🔥`)
      else if (newStatus === 'Listo') toast.success(`¡Pedido ${orderId} listo para entregar! ✅`)
    } catch (e) {
      toast.error('Error al actualizar el estado en el servidor.')
    }
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  // Componente interno para renderizar cada Tarjeta de Pedido
  const OrderCard = ({ order }: { order: Order }) => (
    <div
      className={`bg-white rounded-2xl shadow-md border-l-[6px] p-4 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        order.status === 'Pendiente'
          ? 'border-l-yellow-400'
          : order.status === 'En preparación'
            ? 'border-l-[#D0543A]'
            : 'border-l-emerald-500 opacity-60 hover:opacity-100'
      }`}
    >
      {/* Cabecera de la tarjeta */}
      <div className="flex justify-between items-start border-b border-[#FCE4D6] pb-3">
        <div>
          <p className="text-[10px] font-bold text-[#4B2E2D]/50 uppercase tracking-widest mb-1">
            Identificador
          </p>
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-black text-2xl sm:text-3xl text-[#D0543A] leading-none tracking-tight">
              {order.id}
            </h3>
            {order.isVip && (
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                ★ VIP
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-[#4B2E2D]/60">{order.table}</p>
          <p className="text-xs font-semibold text-[#4B2E2D]/50 flex items-center gap-1 mt-0.5">
            <User size={12} /> {order.waiter}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#FCE4D6]/50 px-2 py-1 rounded-lg text-[#4B2E2D]/80">
          <Clock size={14} />
          <span className="text-xs font-bold">{order.time}</span>
        </div>
      </div>

      {/* Lista de Platos */}
      <div className="flex-1 flex flex-col gap-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <span className="font-bold text-[#4B2E2D] text-sm leading-tight">
                <span className="text-[#D0543A] mr-1.5">{item.quantity}x</span>
                {item.name}
              </span>
            </div>
            {item.notes && (
              <div className="flex items-start gap-1 mt-1 ml-5 bg-yellow-50 text-yellow-800 p-1.5 rounded-md border border-yellow-200 text-xs font-medium">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                <span>{item.notes}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botones de Acción */}
      <div className="pt-3 mt-auto">
        {order.status === 'Pendiente' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'En preparación')}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Play size={16} /> Preparar
          </button>
        )}
        {order.status === 'En preparación' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'Listo')}
            className="w-full flex items-center justify-center gap-2 bg-[#D0543A] hover:bg-[#b5462f] text-white font-black py-2.5 rounded-xl transition-colors shadow-md shadow-[#D0543A]/30"
          >
            <CheckCircle2 size={16} /> ¡Terminado!
          </button>
        )}
        {order.status === 'Listo' && (
          <p className="text-center text-emerald-600 font-bold text-sm bg-emerald-50 py-2.5 rounded-xl border border-emerald-100 flex justify-center items-center gap-1.5">
            <CheckCircle2 size={16} /> Esperando al mesero
          </p>
        )}
      </div>
    </div>
  )

  // Filtrar pedidos por estado
  const pendingOrders = orders.filter((o) => o.status === 'Pendiente')
  const prepOrders = orders.filter((o) => o.status === 'En preparación')
  const readyOrders = orders.filter((o) => o.status === 'Listo')

  return (
    <div className="h-[100dvh] bg-[#FCE4D6]/30 flex flex-col overflow-hidden">
      {/* Cabecera */}
      <header className="px-6 sm:px-10 py-6 shrink-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 border-b border-[#E57C5D]/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D0543A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#D0543A]/30 shrink-0">
            <ChefHat size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-[#4B2E2D]">Cocina (KDS)</h1>
            <p className="text-[#4B2E2D]/70 font-medium text-sm mt-1">
              <span className="bg-white px-3 py-1 rounded-lg border border-[#E57C5D]/30 shadow-sm font-black text-[#D0543A]">👨‍🍳 Chef: {chefName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/50 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl font-bold transition-colors shadow-sm border border-red-100"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Tablero Kanban */}
      <div className="flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 overflow-y-auto lg:overflow-hidden min-h-0">
        {/* Columna 1: Pendientes */}
        <div className="flex flex-col bg-white/50 rounded-3xl border-2 border-yellow-200/50 h-[500px] lg:h-full overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-yellow-200/50 shrink-0 bg-white/40">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <Clock className="text-yellow-500" /> Por hacer
            </h2>
            <span className="bg-yellow-200 text-yellow-800 font-black px-3 py-1 rounded-full text-sm">
              {pendingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/20">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-center text-[#4B2E2D]/40 font-medium py-10">
                No hay pedidos pendientes
              </p>
            )}
          </div>
        </div>

        {/* Columna 2: En Preparación */}
        <div className="flex flex-col bg-[#FCE4D6]/40 rounded-3xl border-2 border-[#D0543A]/20 h-[500px] lg:h-full overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#D0543A]/10 shrink-0 bg-white/20">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <Flame className="text-[#D0543A]" /> Cocinando
            </h2>
            <span className="bg-[#D0543A] text-white font-black px-3 py-1 rounded-full text-sm">
              {prepOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/20">
            {prepOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {prepOrders.length === 0 && (
              <p className="text-center text-[#4B2E2D]/40 font-medium py-10">
                No hay platos en preparación
              </p>
            )}
          </div>
        </div>

        {/* Columna 3: Listos */}
        <div className="flex flex-col bg-emerald-50/50 rounded-3xl border-2 border-emerald-200/50 h-[500px] lg:h-full overflow-hidden shadow-sm">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-emerald-200/50 shrink-0 bg-white/40">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" /> Listos
            </h2>
            <span className="bg-emerald-200 text-emerald-800 font-black px-3 py-1 rounded-full text-sm">
              {readyOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-black/20">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-[#4B2E2D]/40 font-medium py-10">
                No hay pedidos para recoger
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
