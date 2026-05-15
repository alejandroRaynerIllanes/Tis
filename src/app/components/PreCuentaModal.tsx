import React, { useState, useEffect } from 'react'
import { X, User, CreditCard, Send, Percent, Wallet, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { usersService } from '../services/users.service'

interface PreCuentaModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  tableName: string
  activeOrder: any
  orderTotal: number
  onSuccess: () => void
}

export function PreCuentaModal({ isOpen, onClose, tableId, tableName, activeOrder, orderTotal, onSuccess }: PreCuentaModalProps) {
  const [nombre, setNombre] = useState('')
  const [ci, setCi] = useState('')
  const [nit, setNit] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [tipPercent, setTipPercent] = useState(0)
  const [cajeros, setCajeros] = useState<any[]>([])
  const [selectedCajero, setSelectedCajero] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCajeros, setIsLoadingCajeros] = useState(true)

  // Limpiar y cargar cajeros al abrir
  useEffect(() => {
    if (isOpen) {
      setNombre('')
      setCi('')
      setNit('')
      setDiscountPercent(0)
      setTipPercent(0)
      setSelectedCajero('')
      setIsSubmitting(false)
      
      const fetchCajeros = async () => {
        setIsLoadingCajeros(true)
        try {
          const data = await usersService.getAll()
          const cajerosActivos = data.filter((u: any) => u.rol.toLowerCase() === 'cajero' && u.estado)
          setCajeros(cajerosActivos)
        } catch (error) {
          toast.error('Error al cargar la lista de cajeros')
        } finally {
          setIsLoadingCajeros(false)
        }
      }
      fetchCajeros()
    }
  }, [isOpen])

  if (!isOpen) return null

  const subtotal = orderTotal
  const montoDescuento = subtotal * (discountPercent / 100)
  const subtotalConDescuento = subtotal - montoDescuento
  const montoPropina = subtotalConDescuento * (tipPercent / 100)
  const totalFinal = subtotalConDescuento + montoPropina

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(val)) setNombre(val)
  }

  const handleNumerosChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const val = e.target.value
    if (val === '' || /^\d+$/.test(val)) setter(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim() || !ci.trim() || !selectedCajero) {
      toast.error('Completa los campos obligatorios y selecciona un cajero.')
      return
    }

    setIsSubmitting(true)
    try {
      // Buscar el pedido real en la base de datos para obtener su ID
      const resData: any = await api.get(`/pedidos?mesa=${tableId}&activo=true`)
      const tableOrders = resData.data || resData || []
      const activeBackendOrder = tableOrders[0] // Como filtramos en backend, el primero es el correcto

      if (!activeBackendOrder) {
        toast.error('No hay un pedido activo en la base de datos (Posiblemente ya fue cobrado). Cierra el panel y usa "Liberar mesa".')
        setIsSubmitting(false)
        return
      }

      const orderId = activeBackendOrder._id || activeBackendOrder.id
      // 1. Actualizamos el pedido con los datos del cliente, cajero y finanzas
      await api.put(`/pedidos/${orderId}`, {
        clienteNombre: nombre.trim(),
        clienteCI: ci.trim(),
        clienteNIT: nit.trim() || undefined,
        cajeroAsignado: selectedCajero,
        montoDescuento,
        montoPropina,
        subtotalCierre: subtotal
      })

      // 2. Cambiamos el estado de la mesa a Esperando pago
      await api.patch(`/mesas/${tableId}/estado`, { estado: 'Esperando pago' })

      toast.success(`Cuenta enviada exitosamente al cajero.`)
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al enviar la cuenta al cajero.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[500px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] p-5 text-white flex justify-between items-center relative">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Send size={20} /> Pre-cuenta: {tableName}
            </h2>
            <p className="text-white/70 text-xs font-medium mt-1">Completa los datos y asigna un cajero</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
          {/* 1. Datos del Cliente */}
          <div className="space-y-4 mb-6">
            <h3 className="font-bold text-[#4B2E2D] border-b pb-2 text-sm uppercase tracking-wider">Datos de Facturación</h3>
            <div>
              <label className="block text-xs font-bold text-[#4B2E2D] mb-1.5 ml-1">Nombre Completo <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" required value={nombre} onChange={handleNombreChange} placeholder="Ej: Juan Perez" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A] focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] mb-1.5 ml-1">CI <span className="text-red-500">*</span></label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" required value={ci} onChange={(e) => handleNumerosChange(e, setCi)} placeholder="Ej: 1234567" className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A] focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4B2E2D] mb-1.5 ml-1">NIT <span className="text-gray-400 font-normal">(Opcional)</span></label>
                <input type="text" value={nit} onChange={(e) => handleNumerosChange(e, setNit)} placeholder="Solo números" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A] focus:outline-none" />
              </div>
            </div>
          </div>

          {/* 2. Ajustes de Cobro */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4B2E2D] uppercase mb-2"><Percent size={14} className="text-green-600"/> Descuento</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[0, 10, 15].map(pct => (
                  <button type="button" key={pct} onClick={() => setDiscountPercent(pct)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${discountPercent === pct ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>{pct}%</button>
                ))}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-[#4B2E2D] uppercase mb-2"><Wallet size={14} className="text-[#D96C4A]"/> Propina</label>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                {[0, 5, 10].map(pct => (
                  <button type="button" key={pct} onClick={() => setTipPercent(pct)} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${tipPercent === pct ? 'bg-white shadow-sm text-[#D96C4A]' : 'text-gray-500'}`}>{pct}%</button>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-[#FFF5F0] rounded-xl p-4 mb-6 border border-[#FCE4D6]">
            <div className="flex justify-between text-sm mb-1 text-gray-600"><span>Subtotal</span> <span className="font-bold">Bs. {subtotal.toFixed(2)}</span></div>
            {discountPercent > 0 && <div className="flex justify-between text-sm mb-1 text-green-600"><span>Descuento ({discountPercent}%)</span> <span className="font-bold">-Bs. {montoDescuento.toFixed(2)}</span></div>}
            {tipPercent > 0 && <div className="flex justify-between text-sm mb-2 text-[#D96C4A]"><span>Propina ({tipPercent}%)</span> <span className="font-bold">+Bs. {montoPropina.toFixed(2)}</span></div>}
            <div className="flex justify-between items-end border-t border-[#D96C4A]/20 pt-2">
              <span className="font-black text-[#4B2E2D] uppercase text-xs">Total a enviar</span>
              <span className="font-black text-2xl text-[#D0543A]">Bs. {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          {/* 3. Selección de Cajero */}
          <div className="mb-6">
            <h3 className="font-bold text-[#4B2E2D] border-b pb-2 text-sm uppercase tracking-wider mb-3">Enviar A:</h3>
            {isLoadingCajeros ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-[#D96C4A]" /></div>
            ) : cajeros.length === 0 ? (
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-red-600 text-sm flex gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" /> No hay cajeros activos disponibles en el sistema.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cajeros.map(c => (
                  <button
                    type="button"
                    key={c._id || c.id}
                    onClick={() => setSelectedCajero(c._id || c.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col ${selectedCajero === (c._id || c.id) ? 'border-[#D96C4A] bg-[#FFF5F0]' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <span className={`font-bold text-sm ${selectedCajero === (c._id || c.id) ? 'text-[#D96C4A]' : 'text-[#4B2E2D]'}`}>{c.nombre}</span>
                    <span className="text-xs text-gray-500">Caja</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
            <button type="submit" disabled={isSubmitting || cajeros.length === 0} className="flex-[2] flex items-center justify-center gap-2 py-3.5 font-black text-white bg-gradient-to-r from-[#D96C4A] to-[#C25838] hover:opacity-90 rounded-xl shadow-lg disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Enviar al Cajero</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}