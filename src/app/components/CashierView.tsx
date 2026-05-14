import React, { useState } from 'react'
import {
  Calculator,
  CreditCard,
  Wallet,
  QrCode,
  Smartphone,
  LogOut,
  Receipt,
  Clock,
  CheckCircle2,
  Percent,
  Banknote,
  TrendingUp,
  User,
  Printer,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getStoredUser } from '../services/api'

// ─── DATOS SIMULADOS (MOCKS) PARA EL DISEÑO ─────────────────────────────────

const MOCK_STATS = {
  totalDia: 4250.5,
  efectivo: 1250.0,
  tarjeta: 2100.5,
  qr: 900.0,
  operaciones: 24
}

const MOCK_PENDING_BILLS = [
  {
    id: 'PED-A1B2',
    table: 'Mesa 4',
    waiter: 'Juan Pérez',
    timeWaiting: '5 min',
    isVip: false,
    total: 350.0,
    items: [
      { id: '1', name: 'Lomo Saltado', quantity: 2, price: 120.0 },
      { id: '2', name: 'Ceviche Clásico', quantity: 1, price: 80.0 },
      { id: '3', name: 'Limonada', quantity: 3, price: 10.0 }
    ]
  },
  {
    id: 'PED-C3D4',
    table: 'Mesa VIP 1',
    waiter: 'María Gómez',
    timeWaiting: '2 min',
    isVip: true,
    total: 890.5,
    items: [
      { id: '4', name: 'Vino Tinto Reserva', quantity: 1, price: 450.0 },
      { id: '5', name: 'Pique Macho Premium', quantity: 2, price: 220.25 }
    ]
  },
  {
    id: 'PED-E5F6',
    table: 'Mesa 12',
    waiter: 'Carlos Roca',
    timeWaiting: '10 min',
    isVip: false,
    total: 125.0,
    items: [
      { id: '6', name: 'Hamburguesa Doble', quantity: 2, price: 50.0 },
      { id: '7', name: 'Refresco', quantity: 2, price: 12.5 }
    ]
  }
]

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export function CashierView() {
  const navigate = useNavigate()
  
  // Estados del diseño
  const [selectedBill, setSelectedBill] = useState<typeof MOCK_PENDING_BILLS[0] | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [tipPercent, setTipPercent] = useState<number>(0)
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const currentUser = getStoredUser()
  const cashierName = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Cajero de Turno'

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const handleProcessPayment = () => {
    if (!selectedMethod) {
      toast.error('Selecciona un método de pago antes de continuar.')
      return
    }
    
    setIsProcessing(true)
    
    // Simulamos un retraso de procesamiento
    setTimeout(() => {
      toast.success(`Pago procesado con éxito para ${selectedBill?.table}`, {
        description: 'Se ha emitido la factura y liberado la mesa.'
      })
      setIsProcessing(false)
      setSelectedBill(null)
      setSelectedMethod(null)
      setTipPercent(0)
      setDiscountPercent(0)
    }, 1500)
  }

  // Cálculos matemáticos reactivos
  const subtotal = selectedBill?.total || 0
  const discountAmount = subtotal * (discountPercent / 100)
  const subtotalWithDiscount = subtotal - discountAmount
  const tipAmount = subtotalWithDiscount * (tipPercent / 100)
  const finalTotal = subtotalWithDiscount + tipAmount

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FCE4D6] font-sans selection:bg-[#E57C5D] selection:text-white relative overflow-hidden">
      {/* Fondo estético (opcional para mantener la línea) */}
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] pointer-events-none opacity-20"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)' }}
      />
      
      {/* ─── CABECERA ─── */}
      <header className="px-6 py-5 bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] text-white flex items-center justify-between z-10 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#D96C4A] rounded-xl flex items-center justify-center shadow-lg border border-[#E57C5D]/50">
            <Calculator size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none mb-1">Caja Principal</h1>
            <p className="text-white/70 font-medium text-xs flex items-center gap-1.5">
              <User size={12} /> {cashierName} · Turno Mañana
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm">
            <Printer size={16} /> <span className="hidden sm:inline">Cerrar Caja</span>
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl font-bold transition-all text-sm border border-red-500/30">
            <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ─── CUERPO PRINCIPAL ─── */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 overflow-hidden z-10">
        
        {/* Panel Izquierdo: Estadísticas y Cola de cobro */}
        <section className="flex-1 flex flex-col min-w-0 gap-6 overflow-hidden">
          
          {/* Tarjetas de Resumen (Stats) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            {[
              { label: 'Caja Actual (Total)', amount: MOCK_STATS.totalDia, icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Efectivo', amount: MOCK_STATS.efectivo, icon: <Banknote size={20} className="text-[#D96C4A]" />, bg: 'bg-white border-[#FCE4D6]' },
              { label: 'Tarjeta', amount: MOCK_STATS.tarjeta, icon: <CreditCard size={20} className="text-blue-600" />, bg: 'bg-white border-[#FCE4D6]' },
              { label: 'Transferencia / QR', amount: MOCK_STATS.qr, icon: <QrCode size={20} className="text-purple-600" />, bg: 'bg-white border-[#FCE4D6]' }
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-2xl border shadow-sm ${stat.bg} flex flex-col gap-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4B2E2D]/60 uppercase">{stat.label}</span>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">{stat.icon}</div>
                </div>
                <span className="text-xl font-black text-[#4B2E2D]">Bs. {stat.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Lista de Mesas por Cobrar */}
          <div className="flex-1 bg-white/80 backdrop-blur-md rounded-3xl border border-[#E0D0C5] shadow-lg flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-white border-b border-[#E0D0C5] flex justify-between items-center shrink-0">
              <h2 className="font-black text-lg text-[#4B2E2D] flex items-center gap-2">
                <Receipt className="text-[#D96C4A]" /> Mesas esperando pago
              </h2>
              <span className="bg-[#FCE4D6] text-[#D96C4A] font-black px-3 py-1 rounded-full text-sm">
                {MOCK_PENDING_BILLS.length} pendientes
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10">
              {MOCK_PENDING_BILLS.map(bill => {
                const isSelected = selectedBill?.id === bill.id
                return (
                  <div 
                    key={bill.id}
                    onClick={() => { setSelectedBill(bill); setSelectedMethod(null); setTipPercent(0); setDiscountPercent(0); }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-[#FFF5F0] border-[#D96C4A] shadow-md transform scale-[1.01]' 
                        : 'bg-white border-gray-100 hover:border-[#D96C4A]/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isSelected ? 'bg-[#D96C4A] text-white' : 'bg-[#FCE4D6] text-[#4B2E2D]'}`}>
                        {bill.table.replace('Mesa ', '').replace('VIP ', 'V')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-[#4B2E2D] text-lg leading-none">{bill.table}</h3>
                          {bill.isVip && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">VIP</span>}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                          <User size={12} /> {bill.waiter} <span className="mx-1">•</span> <Clock size={12} /> {bill.timeWaiting}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                      <p className={`font-black text-xl ${isSelected ? 'text-[#D96C4A]' : 'text-[#4B2E2D]'}`}>Bs. {bill.total.toFixed(2)}</p>
                    </div>
                  </div>
                )
              })}
              
              {MOCK_PENDING_BILLS.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle2 size={48} className="mb-3 opacity-50 text-emerald-500" />
                  <p className="font-bold text-lg">Todo al día</p>
                  <p className="text-sm">No hay mesas esperando la cuenta.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Panel Derecho: POS / Terminal de Cobro */}
        <aside className="w-full lg:w-[420px] xl:w-[480px] bg-white rounded-3xl border border-[#E0D0C5] shadow-2xl flex flex-col overflow-hidden shrink-0">
          {selectedBill ? (
            <>
              {/* Header POS */}
              <div className="bg-[#4B2E2D] p-5 text-white shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Comprobante / Ticket</p>
                    <h2 className="text-2xl font-black">{selectedBill.table}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">N° Pedido</p>
                    <p className="text-lg font-black text-[#E57C5D]">{selectedBill.id}</p>
                  </div>
                </div>
              </div>

              {/* Lista de Consumo (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Detalle de consumo</h4>
                <div className="space-y-3">
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-400 w-5">{item.quantity}x</span>
                        <span className="font-bold text-[#4B2E2D]">{item.name}</span>
                      </div>
                      <span className="font-bold text-[#4B2E2D] shrink-0">Bs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel de Descuentos, Propinas y Totales */}
              <div className="p-5 shrink-0 bg-white space-y-4">
                {/* Controles rápidos */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Descuento */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B2E2D] uppercase mb-2">
                      <Percent size={12} className="text-green-600" /> Descuento
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[0, 10, 15].map(pct => (
                        <button 
                          key={pct} 
                          onClick={() => setDiscountPercent(pct)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${discountPercent === pct ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Propina */}
                  <div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#4B2E2D] uppercase mb-2">
                      <Wallet size={12} className="text-[#D96C4A]" /> Propina
                    </label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                      {[0, 5, 10].map(pct => (
                        <button 
                          key={pct} 
                          onClick={() => setTipPercent(pct)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${tipPercent === pct ? 'bg-white shadow-sm text-[#D96C4A]' : 'text-gray-500 hover:bg-gray-200'}`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Resumen matemático */}
                <div className="bg-[#F9F9F9] rounded-xl p-4 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-500">Subtotal</span>
                    <span className="font-bold text-[#4B2E2D]">Bs. {subtotal.toFixed(2)}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="font-semibold">Descuento (-{discountPercent}%)</span>
                      <span className="font-bold">- Bs. {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {tipPercent > 0 && (
                    <div className="flex justify-between items-center text-sm text-[#D96C4A]">
                      <span className="font-semibold">Propina (+{tipPercent}%)</span>
                      <span className="font-bold">+ Bs. {tipAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between items-end">
                    <span className="font-black text-[#4B2E2D] uppercase tracking-wider text-xs mb-1">Total a Cobrar</span>
                    <span className="font-black text-3xl text-[#D0543A] leading-none">Bs. {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B2E2D] uppercase mb-2">Método de pago</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'efectivo', label: 'Efectivo', icon: <Banknote size={18} /> },
                      { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard size={18} /> },
                      { id: 'qr', label: 'QR', icon: <QrCode size={18} /> },
                      { id: 'transferencia', label: 'Transf.', icon: <Smartphone size={18} /> }
                    ].map((method) => (
                      <button 
                        key={method.id} 
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all border-2 ${
                          selectedMethod === method.id 
                            ? 'bg-[#FFF5F0] border-[#D96C4A] text-[#D96C4A] shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                        }`}
                      >
                        {method.icon}
                        <span className="text-[10px] font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botón de Acción Principal */}
                <button 
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className={`w-full py-4 rounded-xl text-white font-black shadow-lg transition-all text-lg flex items-center justify-center gap-2 ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : selectedMethod 
                        ? 'bg-gradient-to-r from-[#D96C4A] to-[#C25838] hover:shadow-xl hover:scale-[1.02]' 
                        : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</>
                  ) : (
                    <><CheckCircle2 size={22} /> Cobrar y Facturar</>
                  )}
                </button>
              </div>
            </>
          ) : (
            // Pantalla Vacía
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 border border-gray-100">
                <Calculator size={40} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-[#4B2E2D] mb-2">Caja Registradora</h3>
              <p className="text-sm font-medium text-gray-500 max-w-[250px]">
                Selecciona una mesa de la lista de pendientes para procesar su pago y emitir la factura.
              </p>
            </div>
          )}
        </aside>
        
      </main>
    </div>
  )
}