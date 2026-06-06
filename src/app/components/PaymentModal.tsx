import React, { useState } from 'react'
import {
  X,
  Receipt,
  Percent,
  Wallet,
  Banknote,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface PaymentItem {
  quantity: number
  product: {
    id: string
    name: string
    price: number
  }
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onProcessPayment: (method: string, discountPercent: number, tipPercent: number) => void
  tableName: string
  activeOrder: PaymentItem[]
  orderTotal: number
}

export function PaymentModal({
  isOpen,
  onClose,
  onProcessPayment,
  tableName,
  activeOrder,
  orderTotal
}: PaymentModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    if (paymentProcessing) return
    setSelectedPaymentMethod(null)
    setDiscountPercent(0)
    setTipPercent(0)
    onClose()
  }

  const handleProcess = () => {
    if (!selectedPaymentMethod) {
      toast.error('Selecciona un método de pago')
      return
    }

    setPaymentProcessing(true)

    // Simulamos el tiempo de procesamiento de la pasarela/caja
    setTimeout(() => {
      setPaymentProcessing(false)
      setSelectedPaymentMethod(null)
      setDiscountPercent(0)
      setTipPercent(0)
      onProcessPayment(selectedPaymentMethod, discountPercent, tipPercent)
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-[500px] bg-white shadow-2xl rounded-3xl flex flex-col transform transition-all ease-out overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 bg-gradient-to-br from-[#D96C4A] to-[#C25838] text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="font-black text-2xl">Procesar Pago</h3>
                <p className="text-sm font-medium text-white/90 mt-0.5">{tableName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={paymentProcessing}
              className="p-2 text-white/80 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* Resumen de cuenta */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <h4 className="font-black text-[#4B2E2D] mb-4 flex items-center gap-2">
              <Receipt size={18} />
              Resumen de Consumo
            </h4>

            <div className="space-y-2 mb-4">
              {activeOrder.map((item, index) => (
                <div
                  key={item.product.id || index}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400 w-6">{item.quantity}x</span>
                    <span className="font-medium text-[#4B2E2D]">{item.product.name}</span>
                  </div>
                  <span className="font-bold text-[#4B2E2D]">
                    Bs. {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-gray-600">Subtotal</span>
                <span className="font-bold text-[#4B2E2D]">Bs. {orderTotal.toFixed(2)}</span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span className="font-semibold">Descuento ({discountPercent}%)</span>
                  <span className="font-bold">
                    - Bs. {((orderTotal * discountPercent) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              {tipPercent > 0 && (
                <div className="flex justify-between items-center text-sm text-[#D96C4A]">
                  <span className="font-semibold">Propina ({tipPercent}%)</span>
                  <span className="font-bold">
                    + Bs. {((orderTotal * tipPercent) / 100).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-black text-lg text-[#4B2E2D]">Total Final</span>
                <span className="font-black text-2xl text-[#D96C4A]">
                  Bs.{' '}
                  {(orderTotal * (1 - discountPercent / 100) * (1 + tipPercent / 100)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Descuentos y Propinas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-[#4B2E2D] mb-3">
                <Percent size={16} className="text-green-600" /> Descuento
              </label>
              <div className="flex gap-2">
                {[0, 5, 10, 15].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setDiscountPercent(percent)}
                    disabled={paymentProcessing}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${discountPercent === percent ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 text-sm font-bold text-[#4B2E2D] mb-3">
                <Wallet size={16} className="text-[#D96C4A]" /> Propina
              </label>
              <div className="flex gap-2">
                {[0, 5, 10, 15].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setTipPercent(percent)}
                    disabled={paymentProcessing}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${tipPercent === percent ? 'bg-[#D96C4A] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} disabled:opacity-50`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-black text-[#4B2E2D] mb-4">Método de Pago</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={20} /> },
                { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={20} /> },
                { id: 'qr', label: 'QR', icon: <QrCode size={20} /> },
                { id: 'transferencia', label: 'Transferencia', icon: <Smartphone size={20} /> }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={paymentProcessing}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl font-bold transition-all ${selectedPaymentMethod === method.id ? 'bg-[#D96C4A] text-white shadow-lg ring-2 ring-[#D96C4A] ring-offset-2' : 'bg-gray-50 text-[#4B2E2D] hover:bg-gray-100 border border-gray-200'} disabled:opacity-50`}
                >
                  {method.icon} <span className="text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={handleClose}
            disabled={paymentProcessing}
            className="flex-1 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcess}
            disabled={!selectedPaymentMethod || paymentProcessing}
            className="flex-1 py-3.5 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} /> Confirmar Pago
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
