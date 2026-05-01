import { useState } from 'react'
import { ChefHat, Clock, Play, CheckCircle2, Flame, AlertCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'

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
  time: string
  status: OrderStatus
  isVip?: boolean
  items: OrderItem[]
}

// Datos simulados (Mock Data)
const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    table: 'Mesa 4',
    time: '14:30',
    status: 'Pendiente',
    items: [
      { id: 'i1', name: 'Lomo Saltado', quantity: 2, notes: 'Sin cebolla' },
      { id: 'i2', name: 'Ceviche Clásico', quantity: 1 }
    ]
  },
  {
    id: 'ORD-002',
    table: 'VIP 1',
    time: '14:35',
    status: 'Pendiente',
    isVip: true,
    items: [
      { id: 'i3', name: 'Risotto de Hongos', quantity: 1, notes: 'Extra queso parmesano' },
      { id: 'i4', name: 'Vino Tinto Copa', quantity: 2 }
    ]
  },
  {
    id: 'ORD-003',
    table: 'Mesa 12',
    time: '14:15',
    status: 'En preparación',
    items: [
      { id: 'i5', name: 'Hamburguesa Doble', quantity: 3 },
      { id: 'i6', name: 'Papas Fritas', quantity: 2, notes: 'Bien crujientes' }
    ]
  },
  {
    id: 'ORD-004',
    table: 'Terraza 2',
    time: '14:05',
    status: 'Listo',
    items: [{ id: 'i7', name: 'Ensalada César', quantity: 1 }]
  }
]

export function ChefView() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const navigate = useNavigate()

  // Función para cambiar el estado del pedido
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    )

    if (newStatus === 'En preparación') {
      toast.success(`Pedido ${orderId} en preparación 🔥`)
    } else if (newStatus === 'Listo') {
      toast.success(`¡Pedido ${orderId} listo para entregar! ✅`)
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
    <div className="min-h-full bg-[#FCE4D6]/30 flex flex-col">
      {/* Cabecera */}
      <header className="px-6 sm:px-10 py-6 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 border-b border-[#E57C5D]/20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D0543A] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#D0543A]/30 shrink-0">
            <ChefHat size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#4B2E2D]">Cocina (KDS)</h1>
            <p className="text-[#4B2E2D]/70 font-medium text-sm">
              Panel de control de comandas en tiempo real
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/50 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl font-bold transition-colors shadow-sm border border-red-100"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </header>

      {/* Tablero Kanban */}
      <div className="flex-1 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Columna 1: Pendientes */}
        <div className="flex flex-col gap-4 bg-white/50 p-4 rounded-3xl border-2 border-yellow-200/50 min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <Clock className="text-yellow-500" /> Por hacer
            </h2>
            <span className="bg-yellow-200 text-yellow-800 font-black px-3 py-1 rounded-full text-sm">
              {pendingOrders.length}
            </span>
          </div>
          {pendingOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {pendingOrders.length === 0 && (
            <p className="text-center text-[#4B2E2D]/40 font-medium py-10">
              No hay pedidos pendientes
            </p>
          )}
        </div>

        {/* Columna 2: En Preparación */}
        <div className="flex flex-col gap-4 bg-[#FCE4D6]/40 p-4 rounded-3xl border-2 border-[#D0543A]/20 min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <Flame className="text-[#D0543A]" /> Cocinando
            </h2>
            <span className="bg-[#D0543A] text-white font-black px-3 py-1 rounded-full text-sm">
              {prepOrders.length}
            </span>
          </div>
          {prepOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {prepOrders.length === 0 && (
            <p className="text-center text-[#4B2E2D]/40 font-medium py-10">
              No hay platos en preparación
            </p>
          )}
        </div>

        {/* Columna 3: Listos */}
        <div className="flex flex-col gap-4 bg-emerald-50/50 p-4 rounded-3xl border-2 border-emerald-200/50 min-h-[500px]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-[#4B2E2D] flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" /> Listos
            </h2>
            <span className="bg-emerald-200 text-emerald-800 font-black px-3 py-1 rounded-full text-sm">
              {readyOrders.length}
            </span>
          </div>
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
  )
}
