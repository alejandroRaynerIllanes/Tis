import React, { useState, useEffect } from 'react'
import { Bike, MapPin, Info, Clock, ArrowRight, QrCode, Banknote, ChevronLeft, X, CheckCircle2, Loader2 } from 'lucide-react'
import { MapPicker } from './MapPicker'
import { api } from '../services/api'
import { toast } from 'sonner'
import { User } from '../types'
import { useAppContext } from '../context/AppContext'

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
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  
  const { socket } = useAppContext()

  useEffect(() => {
    if (currentUser) {
      setBillingInfo({
        name: currentUser.nombre || '',
        phone: (currentUser as any).telefono || '',
        email: currentUser.email || ''
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (!socket || !createdOrder?._id) return

    const handlePagoRecibido = (data: { pedidoId: string }) => {
      if (data.pedidoId === createdOrder._id) {
        setIsQRModalOpen(false)
        setIsConfirmed(true)
      }
    }

    const eventName = `pedido:pago_recibido:${createdOrder._id}`
    socket.on(eventName, handlePagoRecibido)

    return () => {
      socket.off(eventName, handlePagoRecibido)
    }
  }, [socket, createdOrder])

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

      // Si eligió QR, abrimos el modal de QR integrado
      if (paymentMethod === 'QR' && response.pedido) {
        const pId = response.pedido.codigo || response.pedido._id
        const totalStr = (cartTotal + deliveryInfo.cost).toFixed(2)
        const baseUrl = String(window.location.origin)
        const simUrl = `${baseUrl}/pay-simulator?id=${encodeURIComponent(response.pedido._id)}&mesa=Delivery&total=${encodeURIComponent(totalStr)}&codigo=${encodeURIComponent(pId)}`
        
        // Generamos el QR codificando la URL del simulador para que se abra al escanear con el celular
        const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simUrl)}&color=4B2E2D`
        
        try {
          await api.post(`/pagos/generar-qr/${response.pedido._id}`, { qrUrl: qrCodeImageUrl })
        } catch (qrErr) {
          console.warn('No se pudo reportar el link de QR al backend:', qrErr)
        }

        setCreatedOrder(response.pedido)
        setQrUrl(qrCodeImageUrl)
        setSimulatorUrl(simUrl)
        setIsQRModalOpen(true)
      } else {
        setCreatedOrder(response.pedido)
        setIsConfirmed(true)
      }
      
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al procesar el pedido')
    } finally {
      setIsProcessing(false)
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
                <a href={simulatorUrl} target="_blank" rel="noopener noreferrer" title="Haz clic para abrir el simulador">
                  <img
                    src={qrUrl}
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
                  try {
                    // Fallback para marcar el pago como confirmado en el backend durante pruebas
                    await api.post(`/pagos/notificar-qr/${createdOrder._id}`, undefined, { skipAuth: true })
                  } catch (e) {
                    console.warn('No se pudo notificar el pago manual al backend')
                  }
                  setIsQRModalOpen(false)
                  setIsConfirmed(true)
                }}
                className="w-full py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={22} /> He realizado el pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE PEDIDO */}
      {isConfirmed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col relative">
            
            {/* Header Verde de Éxito */}
            <div className="relative bg-[#00B274] px-6 pt-8 pb-6 text-center text-white shrink-0">
              <button
                onClick={onOrderSuccess}
                className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 size={36} className="text-[#00B274]" />
              </div>
              <h2 className="text-2xl font-black mb-1">¡Pedido Confirmado!</h2>
              <div className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                {createdOrder?.codigo || `PED-${String(createdOrder?._id || '').slice(-4).toUpperCase()}`}
              </div>
            </div>

            {/* Contenido del Pedido */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh] shrink">
              {/* Productos */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Productos Solicitados
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-700">
                      <span>{item.quantity}x {item.product.nombre || item.product.name}</span>
                      <span className="text-gray-400">
                        Bs. {((item.product.precio || item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid Método & Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Método
                  </p>
                  <p className="text-sm font-black text-[#4B2E2D]">{paymentMethod}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Tipo
                  </p>
                  <p className="text-sm font-black text-[#4B2E2D]">Delivery</p>
                </div>
              </div>

              {/* Dirección */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                  Dirección
                </p>
                <p className="text-sm font-black text-[#4B2E2D] line-clamp-2">
                  {deliveryInfo.address || 'Ubicación seleccionada'}
                </p>
              </div>

              {/* Tiempo Estimado */}
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold border border-blue-100">
                <Clock size={18} className="shrink-0" />
                <span>Tiempo estimado: ~{deliveryInfo.time || 20} min</span>
              </div>

              {/* Desglose de Precios */}
              <div className="bg-[#FCE4D6]/20 border border-[#FCE4D6]/50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span>Bs. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Costo Delivery</span>
                  <span>Bs. {deliveryInfo.cost.toFixed(2)}</span>
                </div>
                <div className="border-t border-[#FCE4D6]/30 my-2"></div>
                <div className="flex justify-between items-center text-sm font-black text-[#4B2E2D]">
                  <span>TOTAL</span>
                  <span className="text-xl text-[#D0543A]">
                    Bs. {(cartTotal + deliveryInfo.cost).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Acción */}
            <div className="p-6 border-t border-gray-50 bg-white shrink-0">
              <button
                onClick={onOrderSuccess}
                className="w-full py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black text-lg shadow-xl shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 size={20} /> Aceptar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}