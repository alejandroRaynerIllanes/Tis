import { useState, useEffect } from 'react'
import { ChefHat, Clock, Play, CheckCircle2, Flame, AlertCircle, LogOut, User, Bike, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { getStoredUser, api } from '../services/api'
import { ordersService } from '../services/orders.service'
import { useAppContext } from '../context/AppContext'
import { inventarioService, type Ingrediente } from '../services/inventario.service'
import { Order as GlobalOrder, User as GlobalUser, OrderDetail } from '../types'

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
  tableId?: string
  waiter: string
  time: string
  status: OrderStatus
  items: OrderItem[]
  rawId?: string
  isDelivery?: boolean
}

export function ChefView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [ingredients, setIngredients] = useState<Ingrediente[]>([])
  const navigate = useNavigate()
  const { socket } = useAppContext()

  const currentUser = getStoredUser()
  const chefName = currentUser
    ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim()
    : 'Cocinero'

  const formatOrder = (o: GlobalOrder): Order => ({
    // Si es un pedido antiguo sin código, generamos uno a partir del _id para que jamás se vea el hash largo
    id:
      o.codigo ||
      `PED-${String(o._id || '')
        .slice(-4)
        .toUpperCase()}`,
    rawId: o._id,
    table: typeof o.mesa === 'object' && o.mesa !== null ? (o.mesa.numero || o.mesa.name || 'Mesa ?') : ((o as any).metodoEntrega === 'delivery' ? 'Delivery' : 'Mesa ?'),
    tableId: typeof o.mesa === 'object' && o.mesa !== null ? o.mesa._id || o.mesa.id : String(o.mesa || ''),
    waiter: typeof o.usuario === 'object' && o.usuario !== null ? `${o.usuario.nombre} ${o.usuario.apellido || ''}`.trim() : 'Mesero',
    time: new Date(o.fechaHora || o.createdAt || Date.now()).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    status:
      o.estado === 'ABIERTO'
        ? 'Pendiente'
        : o.estado === 'EN_PREPARACION'
          ? 'En preparación'
          : 'Listo',
    isDelivery: (o as any).metodoEntrega === 'delivery',
    items: (o.detalles || []).map((d: OrderDetail, idx: number) => ({
      id: typeof d.plato === 'object' && d.plato !== null ? d.plato._id || d.plato.id || String(idx) : String(d.plato || idx),
      name: d.nombre || (typeof d.plato === 'object' && d.plato !== null ? d.plato.nombre : 'Plato') || 'Plato',
      quantity: d.cantidad,
      notes: d.observacion
    }))
  })

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get<GlobalOrder[]>('/pedidos?activo=true')
        const activeOrders = (res as any).data || res || []

        setOrders(activeOrders.map(formatOrder))
      } catch (err) {
        console.error('Error fetching orders', err)
      }
    }
    fetchOrders()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNuevoPedido = (o: GlobalOrder) => {
      setOrders((prev) => [formatOrder(o), ...prev])
      toast.info(`🔔 ¡Nuevo pedido recibido! (${o.codigo || 'Mesa'})`)
    }

    const handleActualizarTablero = (o: GlobalOrder) => {
      // Si el pedido fue cancelado o cobrado, desaparece de la vista.
      // Si está en 'ENTREGADO' (Listo), se queda en la última columna hasta que se pague.
      if (['CANCELADO', 'CERRADO'].includes(o.estado)) {
        setOrders((prev) => prev.filter((ord) => ord.rawId !== o._id))
      } else {
        setOrders((prev) => {
          const exists = prev.find((ord) => ord.rawId === o._id)
          if (exists) return prev.map((ord) => (ord.rawId === o._id ? formatOrder(o) : ord))
          return [formatOrder(o), ...prev]
        })
      }
    }

    const handleInventarioActualizado = () => {
      inventarioService.getInventarioEstado()
        .then((data) => setIngredients(data))
        .catch((err) => console.error('[ChefView] Error recargando inventario:', err))
    }

    const handleInventarioAlerta = (data: { ingrediente: string; stockActual: number; stockMinimo: number; estado: string }) => {
      setIngredients((prev) =>
        prev.map((ing) =>
          ing.nombre === data.ingrediente
            ? { ...ing, stockActual: data.stockActual, stockMinimo: data.stockMinimo, estado: data.estado as Ingrediente['estado'] }
            : ing
        )
      )
      if (data.estado === 'Bajo' || data.estado === 'Agotado') {
        toast.warning(`⚠️ Stock ${data.estado.toLowerCase()}: ${data.ingrediente} (${data.stockActual} restantes)`)
      }
    }

    socket.on('cocina:nuevo_pedido', handleNuevoPedido)
    socket.on('cocina:actualizar_tablero', handleActualizarTablero)
    socket.on('inventario:alerta', handleInventarioAlerta)
    socket.on('inventario:actualizado', handleInventarioActualizado)

    return () => {
      socket.off('cocina:nuevo_pedido', handleNuevoPedido)
      socket.off('cocina:actualizar_tablero', handleActualizarTablero)
      socket.off('inventario:alerta', handleInventarioAlerta)
      socket.off('inventario:actualizado', handleInventarioActualizado)
    }
  }, [socket])

  // Carga inicial: obtiene el estado real del inventario desde la API
  useEffect(() => {
    inventarioService.getInventarioEstado()
      .then((data) => setIngredients(data))
      .catch((err) => console.error('[ChefView] Error cargando inventario:', err))
  }, [])

  // Función para cambiar el estado del pedido
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order || !order.rawId) return
    const backendStatus =
      newStatus === 'Pendiente'
        ? 'ABIERTO'
        : newStatus === 'En preparación'
          ? 'EN_PREPARACION'
          : 'ENTREGADO'

    try {
      const response: any = await ordersService.updateStatus(order.rawId, backendStatus)
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )

      if (socket) {
        if (newStatus === 'Listo') {
          socket.emit('pedido:listo', {
            pedidoId: order.rawId,
            mesaId: order.tableId,
            mesaNombre: order.table
          })
          socket.emit('mesas:alerta_listo', {
            pedidoId: order.rawId,
            mesaId: order.tableId,
            mesaNombre: order.table
          })
        }
        socket.emit('cocina:actualizar_tablero', { _id: order.rawId, estado: backendStatus })
      }

      if (newStatus === 'En preparación') {
        toast.success(`Pedido ${orderId} en preparación 🔥`)
      } else if (newStatus === 'Listo') {
        const descontados = response?.ingredientesDescontados || response?.data?.ingredientesDescontados || []
        if (descontados.length > 0) {
          toast.success('Inventario actualizado', {
            description: (
              <div className="mt-1">
                <p className="font-medium text-sm mb-1">Pedido preparado correctamente. Se descontó:</p>
                <ul className="text-xs space-y-0.5 opacity-90">
                  {descontados.map((d: any, i: number) => (
                    <li key={i}>• {d.nombre}: -{d.cantidad} {d.unidad || ''}</li>
                  ))}
                </ul>
              </div>
            ),
            duration: 6000
          })
        } else {
          toast.success(`¡Pedido ${orderId} listo para entregar! ✅`)
        }
        // Sincronización proactiva adicional
        inventarioService.getInventarioEstado()
          .then((data) => setIngredients(data))
          .catch((err) => console.error('[ChefView] Error recargando inventario:', err))
      }
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
      } ${order.isDelivery ? 'ring-2 ring-blue-200 ring-offset-2 bg-blue-50/10' : ''}`}
    >
      {/* Cabecera de la tarjeta */}
      <div className={`flex justify-between items-start border-b ${order.isDelivery ? 'border-blue-100' : 'border-[#FCE4D6]'} pb-3`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-bold text-[#4B2E2D]/50 uppercase tracking-widest">
              Identificador
            </p>
            {order.isDelivery && (
              <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                <Bike size={10} /> Delivery
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-2xl sm:text-3xl text-[#D0543A] leading-none tracking-tight">
              {order.id}
            </h3>
          </div>
          <p className={`text-sm font-bold flex items-center gap-1 ${order.isDelivery ? 'text-blue-600' : 'text-[#4B2E2D]/60'}`}>
            {order.isDelivery ? <MapPin size={14} /> : null} {order.table}
          </p>
          <p className="text-xs font-semibold text-[#4B2E2D]/50 flex items-center gap-1 mt-0.5">
            <User size={12} /> {order.isDelivery ? 'Cliente / App' : order.waiter}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${order.isDelivery ? 'bg-blue-50 text-blue-700' : 'bg-[#FCE4D6]/50 text-[#4B2E2D]/80'}`}>
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

  const stockCritico = ingredients.filter((ing) => ing.stockActual <= 0)
  const stockBajo = ingredients.filter((ing) => ing.stockActual > 0 && ing.stockActual <= ing.stockMinimo)
  const disponibles = ingredients.filter((ing) => ing.stockActual > ing.stockMinimo)

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
              <span className="bg-white px-3 py-1 rounded-lg border border-[#E57C5D]/30 shadow-sm font-black text-[#D0543A]">
                👨‍🍳 Chef: {chefName}
              </span>
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

      {/* Panel Estado de Ingredientes */}
      {ingredients.length > 0 && (
        <div className="px-6 sm:px-10 pt-5 pb-4 shrink-0 overflow-y-auto max-h-[35vh] border-b border-[#E57C5D]/20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10">
          <div className="flex flex-col gap-6">
            {stockCritico.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-red-700 mb-3 flex items-center gap-2">
                  🔴 Stock Crítico ({stockCritico.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {stockCritico.map((ing) => (
                    <div key={ing._id} className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#4B2E2D] text-sm leading-tight line-clamp-1" title={ing.nombre}>{ing.nombre}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-inner animate-pulse shrink-0" />
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-xs font-semibold text-red-800/60">Stock:</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-red-600">{ing.stockActual}</span>
                          <span className="text-xs font-bold text-red-600/80 ml-1">{ing.unidad}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stockBajo.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-amber-700 mb-3 flex items-center gap-2">
                  🟡 Stock Bajo ({stockBajo.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {stockBajo.map((ing) => (
                    <div key={ing._id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#4B2E2D] text-sm leading-tight line-clamp-1" title={ing.nombre}>{ing.nombre}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-inner shrink-0" />
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-xs font-semibold text-amber-800/60">Stock:</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-amber-600">{ing.stockActual}</span>
                          <span className="text-xs font-bold text-amber-600/80 ml-1">{ing.unidad}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {disponibles.length > 0 && (
              <div>
                <h3 className="text-sm font-black text-emerald-700 mb-3 flex items-center gap-2">
                  🟢 Disponibles ({disponibles.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {disponibles.map((ing) => (
                    <div key={ing._id} className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#4B2E2D] text-sm leading-tight line-clamp-1" title={ing.nombre}>{ing.nombre}</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-inner shrink-0" />
                      </div>
                      <div className="flex items-end justify-between mt-1">
                        <span className="text-xs font-semibold text-emerald-800/60">Stock:</span>
                        <div className="text-right">
                          <span className="text-lg font-black text-emerald-600">{ing.stockActual}</span>
                          <span className="text-xs font-bold text-emerald-600/80 ml-1">{ing.unidad}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tablero Kanban */}
      <div className="flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 overflow-y-auto lg:overflow-hidden">
        {/* Columna: Pendientes */}
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex items-center justify-between pb-2 border-b-2 border-yellow-200 shrink-0">
            <h2 className="font-black text-lg text-[#4B2E2D] flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} /> Por hacer
            </h2>
            <span className="bg-yellow-100 text-yellow-800 font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
              {pendingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>

        {/* Columna: En Preparación */}
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex items-center justify-between pb-2 border-b-2 border-[#D0543A]/30 shrink-0">
            <h2 className="font-black text-lg text-[#4B2E2D] flex items-center gap-2">
              <Flame className="text-[#D0543A]" size={20} /> Cocinando
            </h2>
            <span className="bg-[#FCE4D6] text-[#D0543A] font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
              {prepOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {prepOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>

        {/* Columna: Listos */}
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-200 shrink-0">
            <h2 className="font-black text-lg text-[#4B2E2D] flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} /> Listos
            </h2>
            <span className="bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-xs shadow-sm">
              {readyOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
            {readyOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
