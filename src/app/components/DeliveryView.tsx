import { useState, useEffect } from 'react'
import {
  Bike,
  CheckCircle2,
  LogOut,
  Navigation,
  Package
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { api, getStoredUser } from '../services/api'
import { toast } from 'sonner'
import { useAppContext } from '../context/AppContext'
import { Order as GlobalOrder, ChatMessage } from '../types'

// ─── Sub-componentes de Delivery ─────────────────────────────────────────────
import { ActiveOrderCard } from './delivery/ActiveOrderCard'
import { DeliveryChat } from './delivery/DeliveryChat'

export function DeliveryView() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const { socket } = useAppContext()

  const userIdStr = user?.id?.toString() || (user as any)?._id?.toString()

  // ─── Estado global de la vista ───
  const [activeTab, setActiveTab] = useState<'disponibles' | 'activos' | 'historial'>('disponibles')
  const [orders, setOrders] = useState<GlobalOrder[]>([])
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({})

  // ─── Estado de modales ───
  const [activeMapId, setActiveMapId] = useState<string | null>(null)
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  // ─── Carga inicial y Socket ───
  const loadOrders = async () => {
    try {
      const res = await api.get<GlobalOrder[]>('/pedidos')
      const allOrders = (res as any).data || res || []
      setOrders(allOrders.filter((o: GlobalOrder) => (o as any).metodoEntrega === 'delivery'))
    } catch (e) {
      console.error('Error cargando pedidos de delivery:', e)
    }
  }

  useEffect(() => { loadOrders() }, [])

  useEffect(() => {
    if (activeChatId && socket) {
      socket.emit('join_order_room', activeChatId)
    }
  }, [activeChatId, socket])

  useEffect(() => {
    if (!socket) return

    const handleNuevo = (pedido: GlobalOrder) => {
      setOrders((prev) => [pedido, ...prev.filter((p) => p._id !== pedido._id)])
      if (isOnline) toast.info('¡Nuevo pedido de Delivery disponible!')
    }

    const handlePagoQR = (data: { pedidoId: string }) => {
      setOrders((prev) => {
        const isMine = prev.some(
          (o) => o._id === data.pedidoId && o.repartidorId === userIdStr
        )
        if (isMine) toast.success('📱 ¡El cliente acaba de pagar el pedido mediante QR!', { duration: 8000 })
        return prev
      })
    }

    const handleChatMsg = (msg: ChatMessage) => {
      setChatMessages(prev => ({ ...prev, [msg.pedidoId]: [...(prev[msg.pedidoId] || []), msg] }))
      if (msg.sender !== 'Repartidor' && isOnline) {
        toast.info(`💬 Mensaje del cliente (Pedido ${msg.pedidoId.slice(-4).toUpperCase()})`)
      }
    }

    const handleHistorial = (data: { pedidoId: string; mensajes: ChatMessage[] }) => {
      setChatMessages((prev) => ({ ...prev, [data.pedidoId]: data.mensajes }))
    }

    socket.on('delivery:nuevo_pedido', handleNuevo)
    socket.on('cocina:actualizar_tablero', loadOrders)
    socket.on('delivery:pago_confirmado', handlePagoQR)
    socket.on('chat:nuevo_mensaje', handleChatMsg)
    socket.on('chat:historial', handleHistorial)

    return () => {
      socket.off('delivery:nuevo_pedido', handleNuevo)
      socket.off('cocina:actualizar_tablero', loadOrders)
      socket.off('delivery:pago_confirmado', handlePagoQR)
      socket.off('chat:nuevo_mensaje', handleChatMsg)
      socket.off('chat:historial', handleHistorial)
    }
  }, [socket, isOnline])

  // ─── Acciones ───
  const handleUpdateStatus = async (orderId: string, status: string, assignMe = false) => {
    setIsLoading(true)
    try {
      const payload: any = { estado: status }
      if (assignMe) payload.repartidorId = userIdStr

      await api.put(`/pedidos/${orderId}`, payload)
      toast.success(status === 'ABIERTO' ? '¡Pedido aceptado!' : `Estado actualizado a: ${status}`)

      if (status === 'ABIERTO' && socket) {
        socket.emit('cocina:nuevo_pedido', { _id: orderId })
        setActiveTab('activos')
      }

      await loadOrders()
    } catch {
      toast.error('Error al actualizar el pedido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const handleToggleMap = (id: string) => {
    setActiveMapId((prev) => (prev === id ? null : id))
  }

  // ─── Derivados ───
  const disponibles = orders.filter(
    (o) => o.estado === 'Pendiente_de_Aceptacion' && 
           (!o.repartidorId || o.repartidorId === userIdStr) &&
           (o.metodoPago !== 'QR' || (o as any).pagoConfirmado)
  )
  const activos = orders.filter(
    (o) => ['ABIERTO', 'EN_PREPARACION', 'ENTREGADO', 'EN_CAMINO'].includes(o.estado) && o.repartidorId === userIdStr
  )
  const historial = orders.filter((o) => o.estado === 'CERRADO' && o.repartidorId === userIdStr)

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col pb-20 relative overflow-x-hidden">
      {/* ── Header ── */}
      <header className="bg-[#4B2E2D] px-6 pt-10 pb-6 rounded-b-3xl shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#D96C4A] to-[#C25838] rounded-full flex items-center justify-center shadow-inner border-2 border-white/20">
                <Bike className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-white font-black text-xl leading-tight">
                  {user?.nombre} {user?.apellido}
                </h1>
                <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Repartidor Oficial</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Toggle En Línea / Desconectado */}
            <div className="flex bg-white/10 p-1.5 rounded-2xl relative w-full md:w-64 shrink-0">
              <div
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${
                  isOnline ? 'translate-x-0' : 'translate-x-[calc(100%+6px)]'
                }`}
              />
              <button
                onClick={() => setIsOnline(true)}
                className={`flex-1 py-2 text-sm font-black z-10 transition-colors ${isOnline ? 'text-[#4B2E2D]' : 'text-white/70 hover:text-white'}`}
              >
                En Línea
              </button>
              <button
                onClick={() => setIsOnline(false)}
                className={`flex-1 py-2 text-sm font-black z-10 transition-colors ${!isOnline ? 'text-[#4B2E2D]' : 'text-white/70 hover:text-white'}`}
              >
                Desconectado
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2.5 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ganancias Hoy</span>
          <span className="text-3xl font-black text-[#D96C4A]">
            Bs. {historial.reduce((acc, o) => acc + (o.total || 0), 0).toFixed(2)}
          </span>
        </div>
        <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Entregas Hoy</span>
          <span className="text-3xl font-black text-[#4B2E2D]">{historial.length}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto w-full px-6 mb-6 flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('disponibles')}
          className={`px-5 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap ${activeTab === 'disponibles' ? 'bg-[#4B2E2D] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
        >
          Nuevos <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full">{disponibles.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('activos')}
          className={`px-5 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap ${activeTab === 'activos' ? 'bg-[#D96C4A] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
        >
          En Curso <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full">{activos.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-5 py-2.5 rounded-full text-sm font-black transition-all whitespace-nowrap ${activeTab === 'historial' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200'}`}
        >
          Historial
        </button>
      </div>

      {/* ── Contenido de Tabs ── */}
      <div className="max-w-7xl mx-auto w-full px-6">
        {/* Tab: Disponibles */}
        {!isOnline && activeTab === 'disponibles' ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bike size={32} className="text-gray-400" />
            </div>
            <h3 className="font-black text-gray-600 text-lg">Estás desconectado</h3>
            <p className="text-sm font-medium text-gray-400">Conéctate para recibir nuevos pedidos.</p>
          </div>
        ) : activeTab === 'disponibles' ? (
          disponibles.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold">Buscando pedidos cercanos...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {disponibles.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-5 shadow-lg border border-[#FCE4D6]/50 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="absolute top-0 right-0 bg-[#D96C4A] text-white text-[10px] font-black px-3 py-1 rounded-bl-xl tracking-widest uppercase">
                  Nuevo
                </div>
                <div className="flex justify-between items-start mb-4 pt-2">
                  <div>
                    <h3 className="font-black text-lg text-[#4B2E2D]">{order.codigo}</h3>
                    <p className="text-xs font-bold text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-xl font-black text-emerald-600">Bs. {order.total?.toFixed(2)}</span>
                </div>

                {/* Ruta visual */}
                <div className="relative pl-6 mb-5 space-y-4">
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 border-l-2 border-dashed border-gray-300" />
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#4B2E2D] border-2 border-white shadow-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Recoger en</p>
                    <p className="text-sm font-black text-[#4B2E2D]">Sabor & Gestión (Restaurante)</p>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#D96C4A] border-2 border-white shadow-sm flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Entregar a</p>
                    <p className="text-sm font-black text-[#4B2E2D] line-clamp-1">
                      {typeof order.usuario === 'object' ? order.usuario?.nombre : 'Cliente'} -{' '}
                      {(order as any).coordenadasEntrega ? 'Ubicación GPS' : 'Dirección'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Detalle del pedido</p>
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {order.detalles
                      ?.map(
                        (d: any) =>
                          `${d.cantidad}x ${d.nombre || (typeof d.plato === 'object' ? d.plato?.nombre : 'Plato')}`
                      )
                      .join(', ')}
                  </p>
                </div>

                <button
                  onClick={() => handleUpdateStatus(String(order._id), 'ABIERTO', true)}
                  disabled={isLoading}
                  className="w-full py-4 bg-[#D96C4A] hover:bg-[#C25838] text-white rounded-xl font-black text-lg shadow-xl shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  Aceptar Pedido <Navigation size={18} className="ml-1" />
                </button>
              </div>
            ))}
            </div>
          )
        ) : activeTab === 'activos' ? (
          activos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Package size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold">No tienes entregas en curso.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activos.map((order) => (
              <ActiveOrderCard
                key={order._id}
                order={order}
                isLoading={isLoading}
                activeMapId={activeMapId}
                onToggleMap={handleToggleMap}
                onOpenChat={(id) => setActiveChatId(id)}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
            </div>
          )
        ) : (
          // Tab: Historial
          historial.length === 0 ? (
            <p className="text-center py-10 text-gray-400 font-bold">Aún no hay historial de entregas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historial.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-black text-[#4B2E2D]">{order.codigo}</p>
                    <p className="text-xs font-bold text-gray-400">
                      {new Date(order.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className="font-black text-[#D96C4A]">Bs. {order.total?.toFixed(2)}</span>
              </div>
            ))}
            </div>
          )
        )}
      </div>

      {/* ── Modal de Chat (montado solo cuando hay un pedido activo en chat) ── */}
      {activeChatId && (
        <DeliveryChat
          pedidoId={activeChatId}
          messages={chatMessages[activeChatId] || []}
          onSendMessage={(text) => {
            const msg: ChatMessage = {
              pedidoId: activeChatId,
              sender: 'Repartidor',
              text: text.trim(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
            socket?.emit('chat:enviar_mensaje', msg)
            setChatMessages(prev => ({ ...prev, [activeChatId]: [...(prev[activeChatId] || []), msg] }))
          }}
          onClose={() => setActiveChatId(null)}
        />
      )}
    </div>
  )
}