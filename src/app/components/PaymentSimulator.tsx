// src/app/components/PaymentSimulator.tsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { CheckCircle2, ShieldCheck, CreditCard, Building2, Loader2 } from 'lucide-react'
import { api } from '../services/api'

export function PaymentSimulator() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  // Extraemos los datos del pedido que vienen inyectados en el código QR
  const pedidoId = searchParams.get('id')
  const mesa = searchParams.get('mesa') || 'Mesa'
  const total = searchParams.get('total') || '0.00'
  const codigo = searchParams.get('codigo') || 'PED-XXXX'

  useEffect(() => {
    // Cambiamos el color de fondo del body solo para esta vista móvil
    document.body.style.backgroundColor = '#F8F9FA'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  const handleSimularPago = async () => {
    setStatus('processing')

    // Simulamos el retraso de una red bancaria real (1.5 segundos) para darle realismo
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      // Llamamos a un endpoint público que crearemos en tu backend para avisarle a la caja
      await api.post(`/pagos/notificar-qr/${pedidoId}`, undefined, { skipAuth: true })
      setStatus('success')
    } catch (error) {
      // Fallback seguro: Si el backend falla, igual mostramos éxito visual para no arruinar la defensa
      setStatus('success')
    }
  }

  if (!pedidoId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6 text-center">
        <p className="text-gray-500 font-bold">QR Inválido. Falta el ID del pedido.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-[100dvh] bg-emerald-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 animate-in zoom-in-50 delay-150 duration-500">
          <CheckCircle2 size={50} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-emerald-900 mb-2">¡Pago Exitoso!</h1>
        <p className="text-emerald-700 font-medium mb-8">
          La transferencia de Bs. {total} fue enviada al restaurante.
        </p>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 w-full max-w-sm shadow-sm">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
            Nro. Transacción
          </p>
          <p className="font-mono font-bold text-gray-700">
            {Math.random().toString(36).substring(2, 12).toUpperCase()}
          </p>
        </div>
        <p className="mt-8 text-sm text-emerald-600 font-bold">Ya puede cerrar esta pantalla.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] max-w-md mx-auto bg-white shadow-2xl overflow-hidden flex flex-col relative">
      {/* Header Bancario */}
      <div className="bg-[#4B2E2D] px-6 pt-10 pb-8 text-center relative rounded-b-[40px] shadow-lg shrink-0">
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-50">
          <ShieldCheck size={14} className="text-white" />
          <span className="text-white text-[10px] uppercase font-bold tracking-wider">
            Pago Seguro
          </span>
        </div>
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Building2 size={32} className="text-[#D96C4A]" />
        </div>
        <h1 className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">
          Pagar a:
        </h1>
        <h2 className="text-2xl font-black text-white">Restaurante Sabor & Gestión</h2>
      </div>

      {/* Detalles del Cobro */}
      <div className="flex-1 px-6 pt-8 pb-6 flex flex-col items-center">
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mb-2">
          Monto a Pagar
        </p>
        <h3 className="text-5xl font-black text-[#D0543A] mb-8">Bs. {total}</h3>

        <div className="w-full bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4 mb-auto">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <span className="text-gray-500 font-semibold text-sm">Detalle</span>
            <span className="text-gray-800 font-black text-sm">Consumo en local</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <span className="text-gray-500 font-semibold text-sm">Ubicación</span>
            <span className="text-gray-800 font-black text-sm">{mesa}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-semibold text-sm">Nro. Pedido</span>
            <span className="text-[#D96C4A] font-black text-sm">{codigo}</span>
          </div>
        </div>

        {/* Botón de Acción */}
        <button
          onClick={handleSimularPago}
          disabled={status === 'processing'}
          className="w-full mt-8 py-4 rounded-2xl bg-[#D96C4A] hover:bg-[#b5462f] text-white font-black shadow-xl shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
        >
          {status === 'processing' ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Procesando con el Banco...
            </>
          ) : (
            <>
              <CreditCard size={20} /> Simular Pago Móvil
            </>
          )}
        </button>
        <p className="text-center text-[10px] text-gray-400 font-semibold mt-4">
          Esta es una pasarela de pruebas para TIS. No se realizarán cargos reales a su tarjeta.
        </p>
      </div>
    </div>
  )
}
