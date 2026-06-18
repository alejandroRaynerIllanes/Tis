import React, { useState, useEffect } from 'react'
import { Bike, MapPin, Info, Clock, ArrowRight, QrCode, Banknote, ChevronLeft, X } from 'lucide-react'
import { MapPicker } from './MapPicker'
import { api } from '../services/api'
import { toast } from 'sonner'
import { User } from '../types'

interface CheckoutStepperProps {
  cart: any[]
  cartTotal: number
  currentUser: User | null
  onClose: () => void
  onOrderSuccess: () => void
}

export function CheckoutStepper({ cart, cartTotal, currentUser, onClose, onOrderSuccess }: CheckoutStepperProps) {
  const [step, setStep] = useState(1)
  const [deliveryInfo, setDeliveryInfo] = useState({
    address: '', reference: '', lat: -17.3895, lng: -66.1568, distance: 0, time: 0, cost: 0
  })
  const [billingInfo, setBillingInfo] = useState({ name: '', phone: '', email: '' })
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'Efectivo'>('QR')

  // Estados para mostrar el QR integrado
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [qrUrl, setQrUrl] = useState<string>('')
  const [simulatorUrl, setSimulatorUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setBillingInfo({
        name: currentUser.nombre || '',
        phone: (currentUser as any).telefono || '',
        email: currentUser.email || ''
      })
    }
  }, [currentUser])

  const processCheckout = async () => {
    setIsProcessing(true)

    try {
      const items = cart.map(c => ({
        platoId: c.product.id,
        cantidad: c.quantity,
        precioUnitario: c.product.precio || c.product.price
      }))

      const response: any = await api.post('/pedidos/checkout', {
        items,
        metodoPago: paymentMethod,
        metodoEntrega: 'delivery',
        coordenadasEntrega: { lat: deliveryInfo.lat, lng: deliveryInfo.lng },
        direccionEntrega: deliveryInfo.address,
        referenciaEntrega: deliveryInfo.reference,
        costoDelivery: deliveryInfo.cost,
        clienteNombre: billingInfo.name,
        clienteTelefono: billingInfo.phone,
        total: cartTotal + deliveryInfo.cost
      })

      toast.success('¡Pedido realizado con éxito!')
      onOrderSuccess()

      // Si eligió QR, le abrimos el simulador de pago con los datos de su pedido
      if (paymentMethod === 'QR' && response.pedido) {
        const pId = response.pedido.codigo || response.pedido._id
        const totalStr = (cartTotal + deliveryInfo.cost).toFixed(2)
        const baseUrl = String((import.meta as any).env.VITE_APP_URL || window.location.origin)
        const simUrl = `${baseUrl}/pay-simulator?id=${encodeURIComponent(response.pedido._id)}&mesa=Delivery&total=${encodeURIComponent(totalStr)}&codigo=${encodeURIComponent(pId)}`
        window.open(simUrl, '_blank')
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al procesar el pedido')
    }
  }

  return (
    <div className="flex flex-col h-full flex-1 min-h-0 animate-in slide-in-from-right duration-300">
      {/* Header del Stepper */}
      <div className="p-6 border-b flex items-center justify-between bg-[#FCE4D6]/30 shrink-0">
        <div className="flex items-center gap-3">
          {step < 6 && (
            <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="p-1 text-[#4B2E2D]/50 hover:text-[#D96C4A] transition-colors rounded-full hover:bg-white">
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-black text-[#4B2E2D]">{step === 6 ? 'Pago Pendiente' : `Paso ${step} de 5`}</h2>
        </div>
        <button onClick={onClose} className="p-2 text-[#4B2E2D]/50 hover:text-[#D96C4A] transition-colors bg-white rounded-full shadow-sm">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* PASO 1: METODO */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-[#4B2E2D]">¿Cómo deseas tu pedido?</h3>
            <button onClick={() => setStep(2)} className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-[#D96C4A] bg-[#FCE4D6]/30 hover:bg-[#FCE4D6]/60 transition-all text-left group">
              <div className="w-12 h-12 rounded-full bg-[#D96C4A] text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Bike size={24} /></div>
              <div>
                <h4 className="font-black text-[#4B2E2D] text-lg">Delivery</h4>
                <p className="text-sm font-medium text-gray-600">Envío directo a tu domicilio</p>
              </div>
            </button>
          </div>
        )}

        {/* PASO 2: MAPA */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-[#4B2E2D]">Selecciona tu ubicación</h3>
            <MapPicker onLocationSelect={(data) => setDeliveryInfo(prev => ({ ...prev, ...data }))} />
            
            <div className="space-y-3 mt-4">
              <input placeholder="Dirección (Ej. Av. América #456)" value={deliveryInfo.address} onChange={e => setDeliveryInfo({...deliveryInfo, address: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A]/20 outline-none" />
              <input placeholder="Referencia (Ej. Portón azul)" value={deliveryInfo.reference} onChange={e => setDeliveryInfo({...deliveryInfo, reference: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D96C4A]/20 outline-none" />
            </div>

            {deliveryInfo.distance > 0 && (
              <div className="grid grid-cols-3 gap-2 bg-[#FCE4D6]/30 p-4 rounded-xl border border-[#FCE4D6]">
                <div className="text-center"><p className="text-[10px] font-bold text-gray-500 uppercase">Distancia</p><p className="font-black text-[#4B2E2D]">{deliveryInfo.distance} km</p></div>
                <div className="text-center border-x border-[#E0D0C5]"><p className="text-[10px] font-bold text-gray-500 uppercase">Tiempo</p><p className="font-black text-[#4B2E2D]">{deliveryInfo.time} min</p></div>
                <div className="text-center"><p className="text-[10px] font-bold text-gray-500 uppercase">Costo</p><p className="font-black text-[#D96C4A]">Bs. {deliveryInfo.cost}</p></div>
              </div>
            )}
          </div>
        )}

        {/* PASO 3: DATOS */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-xl font-black text-[#4B2E2D]">Tus datos</h3>
            <input placeholder="Nombre completo" value={billingInfo.name} onChange={e => setBillingInfo({...billingInfo, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <input placeholder="Teléfono" type="tel" value={billingInfo.phone} onChange={e => setBillingInfo({...billingInfo, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <input placeholder="Correo (Opcional)" type="email" value={billingInfo.email} onChange={e => setBillingInfo({...billingInfo, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
          </div>
        )}

        {/* PASO 4: PAGO */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-[#4B2E2D]">Método de Pago</h3>
            <button onClick={() => setPaymentMethod('QR')} className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'QR' ? 'border-[#D96C4A] bg-[#FCE4D6]/30' : 'border-gray-200'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'QR' ? 'border-[#D96C4A]' : 'border-gray-300'}`}>
                {paymentMethod === 'QR' && <div className="w-3 h-3 bg-[#D96C4A] rounded-full"></div>}
              </div>
              <div><h4 className="font-black text-[#4B2E2D] flex items-center gap-2"><QrCode size={18} /> Pago QR</h4><p className="text-xs text-gray-500">Procesado automáticamente al confirmar.</p></div>
            </button>
            <button onClick={() => setPaymentMethod('Efectivo')} className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'Efectivo' ? 'border-[#D96C4A] bg-[#FCE4D6]/30' : 'border-gray-200'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === 'Efectivo' ? 'border-[#D96C4A]' : 'border-gray-300'}`}>
                {paymentMethod === 'Efectivo' && <div className="w-3 h-3 bg-[#D96C4A] rounded-full"></div>}
              </div>
              <div><h4 className="font-black text-[#4B2E2D] flex items-center gap-2"><Banknote size={18} /> Efectivo</h4><p className="text-xs text-gray-500">Pago contra entrega del pedido.</p></div>
            </button>
          </div>
        )}

        {/* PASO 5: RESUMEN */}
        {step === 5 && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#4B2E2D]">Resumen Final</h3>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-start">
                <div><p className="text-[10px] font-bold text-[#D96C4A] uppercase tracking-widest"><Bike size={12} className="inline mr-1"/> Delivery</p><p className="font-black text-[#4B2E2D]">{billingInfo.name}</p></div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Pago {paymentMethod}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div className="flex gap-3 text-sm"><MapPin size={18} className="text-[#D96C4A] shrink-0" /><div><p className="font-bold text-[#4B2E2D]">Dirección</p><p className="text-gray-600 text-xs">{deliveryInfo.address}</p></div></div>
                <div className="flex gap-3 text-sm"><Info size={18} className="text-blue-500 shrink-0" /><div><p className="font-bold text-[#4B2E2D]">Referencia</p><p className="text-gray-600 text-xs uppercase">{deliveryInfo.reference}</p></div></div>
              </div>
              <div className="bg-blue-50 text-blue-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold border border-blue-100"><Clock size={16} /> Tiempo: ~{deliveryInfo.time} min</div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm"><span className="font-bold text-gray-500">Subtotal</span><span className="font-bold text-[#4B2E2D]">Bs. {cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm text-[#D96C4A]"><span className="font-bold">Costo Delivery</span><span className="font-bold">Bs. {deliveryInfo.cost.toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-200"><span className="font-black text-lg text-[#4B2E2D]">Total</span><span className="font-black text-3xl text-[#D0543A]">Bs. {(cartTotal + deliveryInfo.cost).toFixed(2)}</span></div>
            </div>
          </div>
        )}

        {/* PASO 6: PAGO QR */}
        {step === 6 && createdOrder && (
          <div className="space-y-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-300 pb-4">
            <div>
              <h3 className="text-2xl font-black text-[#4B2E2D]">Escanea y Paga</h3>
              <p className="text-gray-500 text-sm mt-1">Usa tu aplicación bancaria para realizar el pago</p>
            </div>
            
            <div className="bg-white p-4 rounded-3xl shadow-sm border-2 border-gray-100 relative">
               <img src={qrUrl} alt="QR de Pago" className="w-[200px] h-[200px] object-contain" />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 w-full text-left space-y-2">
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                 <span className="font-semibold text-gray-500">Nro. Pedido</span>
                 <span className="font-black text-[#D96C4A]">{createdOrder.codigo || 'PENDIENTE'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 pb-2">
                 <span className="font-semibold text-gray-500">Monto a Pagar</span>
                 <span className="font-black text-[#4B2E2D]">Bs. {(cartTotal + deliveryInfo.cost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="font-semibold text-gray-500">Delivery a</span>
                 <span className="font-black text-[#4B2E2D] truncate max-w-[150px]">{billingInfo.name}</span>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 mt-2">
              ¿Estás desde el celular y no puedes escanear la pantalla?
            </p>
            <button 
              onClick={() => window.open(simulatorUrl, '_blank')} 
              className="px-6 py-2.5 bg-[#4B2E2D] text-white rounded-xl font-bold shadow-md hover:bg-[#3A2222] transition-colors w-full"
            >
              Simular Pago Manual
            </button>
          </div>
        )}
      </div>

      {/* FOOTER FIJO PARA ACCIONES */}
      {step > 1 && (
        <div className="p-5 sm:p-6 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
          {step === 2 && (
            <button disabled={!deliveryInfo.address || deliveryInfo.distance === 0} onClick={() => setStep(3)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black disabled:opacity-50 transition-all hover:bg-[#b5462f]">Confirmar Ubicación</button>
          )}
          {step === 3 && (
            <button disabled={!billingInfo.name || !billingInfo.phone} onClick={() => setStep(4)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black disabled:opacity-50 transition-all hover:bg-[#b5462f]">Continuar a Pago</button>
          )}
          {step === 4 && (
            <button onClick={() => setStep(5)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black transition-all hover:bg-[#b5462f]">Revisar Pedido</button>
          )}
          {step === 5 && (
            <button
              onClick={processCheckout}
              disabled={isProcessing}
              className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black text-lg shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:bg-[#b5462f]"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          )}
          {step === 6 && (
            <button onClick={() => {
              onOrderSuccess()
            }} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black text-lg shadow-lg hover:bg-[#b5462f] transition-all">Terminar y Cerrar</button>
          )}
        </div>
      )}
    </div>
  )
}