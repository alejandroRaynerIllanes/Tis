import React, { useEffect, useState } from 'react'
import { X, Receipt, Clock, MapPin, Banknote, ChefHat } from 'lucide-react'
import { getStoredUser, api } from '../services/api'

interface WaiterHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WaiterHistoryModal({ isOpen, onClose }: WaiterHistoryModalProps) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, selectedDate])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      // Filtra por la fecha seleccionada en el calendario
      const selectedOrders = await api.get<any[]>(`/pedidos?fecha=${selectedDate}`)
      const currentUser = getStoredUser()
      
      const history = selectedOrders.filter((o: any) => {
        const isMyOrder = o.usuario?._id === currentUser?.id || o.usuario === currentUser?.id
        const isCompleted = o.estado === 'CERRADO' || o.estado === 'ENTREGADO'
        return isMyOrder && isCompleted
      })

      setOrders(history.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const totalVendido = orders.reduce((sum, o) => sum + (o.total || 0), 0)
  const totalPropinas = orders.reduce((sum, o) => sum + (o.montoPropina || 0), 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-[500px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] px-6 py-5 flex items-center justify-between text-white">
          <div>
            <h2 className="text-xl font-black">Mi Historial Diario</h2>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mt-1 bg-white/20 border border-white/30 text-white rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none" />
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <div className="flex bg-[#F5E6D3] p-4 gap-4 border-b border-[#E0D0C5]">
          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-[#E0D0C5]"><p className="text-[10px] uppercase text-[#4B2E2D]/60 font-bold mb-1">Pedidos Atendidos</p><p className="text-2xl font-black text-[#4B2E2D]">{orders.length}</p></div>
          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-[#E0D0C5]"><p className="text-[10px] uppercase text-[#4B2E2D]/60 font-bold mb-1">Total Vendido</p><p className="text-2xl font-black text-[#D96C4A]">Bs. {totalVendido.toFixed(2)}</p></div>
          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-[#E0D0C5]"><p className="text-[10px] uppercase text-[#4B2E2D]/60 font-bold mb-1">Tus Propinas</p><p className="text-2xl font-black text-emerald-600">Bs. {totalPropinas.toFixed(2)}</p></div>
        </div>
        <div className="p-4 max-h-[50vh] overflow-y-auto bg-gray-50">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Cargando historial...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center"><ChefHat size={40} className="text-gray-300 mb-3" /><p className="font-bold text-gray-500">No hay registros en esta fecha.</p></div>
          ) : (
            <div className="space-y-3">
              {orders.map((o, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Receipt size={14} className="text-[#D96C4A]" /><span className="font-black text-[#4B2E2D] text-sm">{o.codigo || `PED-${String(o._id || '').slice(-4).toUpperCase()}`}</span></div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><MapPin size={12}/> {o.mesa?.numero || o.mesa?.name || 'Mesa'}</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                  <div className="text-right"><p className="font-black text-lg text-[#4B2E2D]">Bs. {(o.total || 0).toFixed(2)}</p>{o.montoPropina > 0 && <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1">+ Bs. {o.montoPropina.toFixed(2)} propina</p>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}