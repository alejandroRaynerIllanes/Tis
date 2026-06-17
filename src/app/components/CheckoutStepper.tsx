import React, { useState, useEffect } from 'react'
import { Bike, MapPin, Info, Clock, ArrowRight, QrCode, Banknote, ChevronLeft, X, CheckCircle2, Building2, Loader2 } from 'lucide-react'
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
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmedResponse, setConfirmedResponse] = useState<any>(null)
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
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

      setConfirmedResponse(response)
      setIsConfirmed(true)
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al procesar el pedido')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAcceptConfirmation = () => {
    toast.success('¡Pedido realizado con éxito!')
    onOrderSuccess()
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConfirmed) {
        handleAcceptConfirmation()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isConfirmed, confirmedResponse])

  const baseUrl = String((import.meta as any).env.VITE_APP_URL || window.location.origin)
  const totalStr = (cartTotal + deliveryInfo.cost).toFixed(2)
  const simUrl = `${baseUrl}/pay-simulator?id=delivery_temp&mesa=Delivery&total=${encodeURIComponent(totalStr)}&codigo=PED-TEMP`
  const deliveryQRImage = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(simUrl)}&color=4B2E2D`

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      {/* Header del Stepper */}
      <div className="p-6 border-b flex items-center justify-between bg-[#FCE4D6]/30">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="p-1 text-[#4B2E2D]/50 hover:text-[#D96C4A] transition-colors rounded-full hover:bg-white">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-[#4B2E2D]">Paso {step} de 5</h2>
        </div>
        <button onClick={onClose} className="p-2 text-[#4B2E2D]/50 hover:text-[#D96C4A] transition-colors bg-white rounded-full shadow-sm">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
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
            <button disabled={!deliveryInfo.address || deliveryInfo.distance === 0} onClick={() => setStep(3)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black disabled:opacity-50">Confirmar Ubicación</button>
          </div>
        )}

        {/* PASO 3: DATOS */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-xl font-black text-[#4B2E2D]">Tus datos</h3>
            <input placeholder="Nombre completo" value={billingInfo.name} onChange={e => setBillingInfo({...billingInfo, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <input placeholder="Teléfono" type="tel" value={billingInfo.phone} onChange={e => setBillingInfo({...billingInfo, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <input placeholder="Correo (Opcional)" type="email" value={billingInfo.email} onChange={e => setBillingInfo({...billingInfo, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            <button disabled={!billingInfo.name || !billingInfo.phone} onClick={() => setStep(4)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black">Continuar a Pago</button>
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
            <button onClick={() => setStep(5)} className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black mt-4">Revisar Pedido</button>
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
            <button
              onClick={() => {
                if (paymentMethod === 'QR') {
                  setIsQRModalOpen(true)
                } else {
                  processCheckout()
                }
              }}
              disabled={isProcessing}
              className="w-full py-4 bg-[#D96C4A] text-white rounded-xl font-black text-lg shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {isConfirmed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-emerald-500 px-6 py-6 text-center shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <button onClick={handleAcceptConfirmation} className="absolute -top-2 -right-2 p-2 text-white/80 hover:text-white transition-colors" title="Cerrar">
                  <X size={24} />
                </button>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <CheckCircle2 size={36} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">¡Pedido Confirmado!</h2>
                {confirmedResponse?.pedido && (
                  <p className="text-emerald-100 font-black mt-2 bg-emerald-600/50 inline-block px-4 py-1 rounded-full shadow-inner border border-emerald-400/30">
                    {confirmedResponse.pedido.codigo || `PED-${String(confirmedResponse.pedido._id).slice(-4).toUpperCase()}`}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5 bg-gray-50/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10">
              <div className="flex items-center gap-3 bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-200 shadow-sm">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-sm shrink-0" />
                <span className="font-bold text-sm">Estado: En preparación</span>
              </div>

              <div>
                <h4 className="font-black text-gray-400 mb-2 uppercase text-[11px] tracking-widest">Productos Solicitados</h4>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-2.5">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex gap-2">
                        <span className="font-black text-gray-400">{item.quantity}x</span>
                        <span className="font-black text-[#4B2E2D] flex-1">{item.product.nombre || item.product.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Método</span>
                  <span className="font-black text-[#4B2E2D] text-sm">{paymentMethod}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo</span>
                  <span className="font-black text-[#4B2E2D] text-sm">Delivery</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                <span className="block text-[10px] uppercase font-bold text-gray-400">Dirección</span>
                <span className="font-black text-[#4B2E2D] text-sm leading-tight">{deliveryInfo.address}</span>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-2 text-blue-700 shadow-sm">
                <Clock size={18} className="shrink-0" />
                <span className="font-black text-sm">Tiempo estimado: ~{deliveryInfo.time} min</span>
              </div>

              <div className="bg-[#FFF5F0] p-5 rounded-2xl border border-[#FCE4D6] space-y-2.5 shadow-sm">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-500">Subtotal</span>
                  <span className="font-black text-[#4B2E2D]">Bs. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-500">Costo Delivery</span>
                  <span className="font-black text-[#D96C4A]">Bs. {deliveryInfo.cost.toFixed(2)}</span>
                </div>
                <div className="pt-3 mt-1 border-t border-[#D96C4A]/20 flex justify-between items-end">
                  <span className="font-black text-[#4B2E2D] uppercase text-xs">Total</span>
                  <span className="font-black text-2xl text-[#D0543A] leading-none">Bs. {(cartTotal + deliveryInfo.cost).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 bg-white border-t border-gray-100 shrink-0">
              <button
                onClick={handleAcceptConfirmation}
                className="w-full py-4 bg-[#D96C4A] hover:bg-[#C25838] text-white rounded-xl font-black text-lg shadow-lg shadow-[#D96C4A]/30 transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                <CheckCircle2 size={22} /> Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO QR PARA DELIVERY */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative bg-gradient-to-b from-gray-50 to-white px-6 pt-6 pb-4 border-b border-gray-100 text-center">
              <button
                onClick={() => setIsQRModalOpen(false)}
                disabled={isProcessing}
                className="absolute left-6 top-6 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-bold disabled:opacity-50"
              >
                <X size={18} /> Cancelar
              </button>
              <div className="w-14 h-14 bg-gradient-to-br from-[#4B2E2D] to-[#6B3E2E] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#4B2E2D]/20">
                <QrCode size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-[#4B2E2D]">Pago con QR</h2>
              <p className="text-sm font-bold text-gray-400 mt-1">Escanee el código para pagar</p>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-500">Negocio</span>
                  <span className="font-black text-[#4B2E2D]">Sabor & Gestión</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-500">Cliente</span>
                  <span className="font-black text-[#4B2E2D] truncate max-w-[150px]">
                    {billingInfo.name}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="font-black text-[#4B2E2D] uppercase tracking-wider text-xs">
                    Total a Pagar
                  </span>
                  <span className="font-black text-2xl text-[#4B2E2D]">
                    Bs. {(cartTotal + deliveryInfo.cost).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200 mb-6"></div>

              <div className="bg-white p-3 rounded-3xl shadow-sm border-2 border-gray-100 mb-6">
                <a href={simUrl} target="_blank" rel="noopener noreferrer" title="Haz clic para abrir el simulador">
                  <img
                    src={deliveryQRImage}
                    alt="Código QR de pago"
                    className="w-[180px] h-[180px] object-contain hover:scale-105 transition-transform"
                  />
                </a>
              </div>
              <p className="text-xs font-bold text-gray-500 text-center max-w-[280px] leading-relaxed">
                Escanee este código QR con su aplicación bancaria (o cámara del celular) para acceder al pago seguro simulado. También puede hacer clic sobre la imagen.
              </p>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              <button
                onClick={async () => {
                  setIsQRModalOpen(false)
                  await processCheckout()
                }}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={22} />}
                {isProcessing ? 'Confirmando pago...' : 'He realizado el pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}