import {
  Bike,
  ChefHat,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  Phone,
  ShieldCheck,
  User
} from 'lucide-react'
import { DeliveryMap } from './DeliveryMap'
import type { Order as GlobalOrder } from '../../types'

// ─── Utilidad de badge ────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: string }) {
  switch (estado) {
    case 'ABIERTO':
      return (
        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
          <Clock size={12} /> Esperando a cocina
        </span>
      )
    case 'EN_PREPARACION':
      return (
        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
          <ChefHat size={12} /> Cocinando
        </span>
      )
    case 'ENTREGADO':
      return (
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
          <Package size={12} /> Listo para recoger
        </span>
      )
    case 'EN_CAMINO':
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
          <Bike size={12} /> En camino al cliente
        </span>
      )
    default:
      return null
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActiveOrderCardProps {
  order: GlobalOrder
  isLoading: boolean
  activeMapId: string | null
  onToggleMap: (id: string) => void
  onOpenChat: (id: string) => void
  onUpdateStatus: (orderId: string, status: string) => void
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ActiveOrderCard({
  order,
  isLoading,
  activeMapId,
  onToggleMap,
  onOpenChat,
  onUpdateStatus
}: ActiveOrderCardProps) {
  const orderId = order._id || ''
  const coordenadas = (order as any).coordenadasEntrega as
    | { lat: number; lng: number }
    | undefined

  return (
    <div className="bg-white rounded-3xl p-5 shadow-md border border-gray-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-black text-lg text-[#4B2E2D]">{order.codigo}</h3>
          <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-0.5">
            <User size={12} />
            {typeof order.usuario === 'object' ? order.usuario?.nombre : 'Cliente'}
          </p>
        </div>
        <StatusBadge estado={order.estado} />
      </div>

      {/* Monto a cobrar */}
      <div className="bg-[#F8F9FA] rounded-xl p-3 flex justify-between items-center border border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={16} />
          </div>
          <span className="text-xs font-black text-gray-600 uppercase">A Cobrar</span>
        </div>
        <span className="text-xl font-black text-[#D96C4A]">Bs. {order.total?.toFixed(2)}</span>
      </div>

      {/* Acciones rápidas */}
      <div className="flex gap-2 mt-2">
        {coordenadas && (
          <button
            onClick={() => onToggleMap(orderId)}
            className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors text-sm"
          >
            <MapPin size={16} />
            {activeMapId === orderId ? 'Ocultar Ruta' : 'Ver Ruta'}
          </button>
        )}
        <button
          onClick={() => onOpenChat(orderId)}
          className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors text-sm"
        >
          <MessageSquare size={16} /> Chat
        </button>
        {(order as any).clienteTelefono && (
          <a
            href={`tel:${(order as any).clienteTelefono}`}
            className="w-12 py-3 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Phone size={16} />
          </a>
        )}
      </div>

      {/* Mapa GPS embebido */}
      {activeMapId === orderId && coordenadas && (
        <div className="h-56 w-full mt-2 rounded-2xl overflow-hidden border-2 border-blue-100 z-0 relative shadow-inner">
          <DeliveryMap destination={[coordenadas.lat, coordenadas.lng]} />
        </div>
      )}

      {/* Botones de estado */}
      <div className="flex gap-2 mt-2">
        {(order.estado === 'ABIERTO' || order.estado === 'EN_PREPARACION') && (
          <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-black text-center border-2 border-dashed border-gray-300 flex items-center justify-center gap-2">
            <ChefHat size={18} /> Chef preparando...
          </div>
        )}

        {order.estado === 'ENTREGADO' && (
          <button
            onClick={() => onUpdateStatus(orderId, 'EN_CAMINO')}
            disabled={isLoading}
            className="w-full py-4 bg-[#4B2E2D] text-white rounded-xl font-black shadow-lg hover:bg-[#3A2222] transition-all flex items-center justify-center gap-2"
          >
            <Package size={20} /> Marcar como Recogido
          </button>
        )}

        {order.estado === 'EN_CAMINO' && (
          <button
            onClick={() => onUpdateStatus(orderId, 'CERRADO')}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} /> Entregado y Pagado
          </button>
        )}
      </div>
    </div>
  )
}
