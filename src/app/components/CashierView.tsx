import React, { useState, useEffect } from 'react'
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
  AlertCircle,
  IdCard
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getStoredUser, api } from '../services/api'
import { useAppContext } from '../context/AppContext'

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export function CashierView() {
  const navigate = useNavigate()
  
  // Estados reales
  const [pendingBills, setPendingBills] = useState<any[]>([])
  const [stats, setStats] = useState({ totalDia: 0, efectivo: 0, tarjeta: 0, qr: 0 })
  const [selectedBill, setSelectedBill] = useState<any | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRegisterClosed, setIsRegisterClosed] = useState(false)

  const { socket } = useAppContext()
  const currentUser = getStoredUser()
  const cashierName = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Cajero de Turno'

  const fetchDashboardData = async () => {
    try {
      const cajeroId = currentUser?.id || (currentUser as any)?._id
      const resData: any = await api.get(`/pedidos?hoy=true&cajero=${cajeroId}`)
      const myOrders = resData.data || resData || []
      
      // Pendientes: Asignadas a mí y que aún no están cerradas
      const pending = myOrders.filter((o: any) => o.estado !== 'CERRADO' && o.estado !== 'CANCELADO')
      
      // Cerradas: Para las estadísticas del día
      const closed = myOrders.filter((o: any) => o.estado === 'CERRADO')
      
      let totalDia = 0, efectivo = 0, tarjeta = 0, qr = 0;
      closed.forEach((o: any) => {
        totalDia += (o.total || 0)
        if (o.metodoPago === 'Efectivo') efectivo += (o.total || 0)
        if (o.metodoPago === 'Tarjeta') tarjeta += (o.total || 0)
        if (o.metodoPago === 'QR') qr += (o.total || 0)
      })
      
      setPendingBills(pending)
      setStats({ totalDia, efectivo, tarjeta, qr })
      
      // Actualizar vista seleccionada si sigue pendiente
      if (selectedBill) {
        const stillPending = pending.find((p: any) => p._id === selectedBill._id)
        if (!stillPending) setSelectedBill(null)
      }
    } catch (error) {
      console.error('Error fetching cashier data', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNuevaCuenta = (pedido: any) => {
      if (pedido.cajeroAsignado === currentUser?.id || pedido.cajeroAsignado === (currentUser as any)?._id) {
        toast.info(`¡Nueva cuenta recibida de la ${pedido.mesa?.numero || 'Mesa'}!`)
        fetchDashboardData()
      }
    }

    const handleActualizarTablero = () => {
      fetchDashboardData()
    }

    socket.on('caja:nueva_cuenta', handleNuevaCuenta)
    socket.on('cocina:actualizar_tablero', handleActualizarTablero)

    return () => { 
      socket.off('caja:nueva_cuenta', handleNuevaCuenta)
      socket.off('cocina:actualizar_tablero', handleActualizarTablero)
    }
  }, [socket])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      toast.error('Selecciona un método de pago antes de continuar.')
      return
    }
    
    setIsProcessing(true)
    try {
      await api.post(`/pagos/procesar/${selectedBill._id}`, {
        metodoPago: selectedMethod
      })
      toast.success(`Pago procesado con éxito para ${selectedBill.mesa?.numero || 'Mesa'}`, { description: 'Se liberó la mesa.' })
      setSelectedMethod(null)
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCloseRegister = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    try {
      await api.patch(`/usuarios/${currentUser.id || (currentUser as any)._id}/estado`, { estado: false });
      toast.success('Caja cerrada exitosamente');
      setIsRegisterClosed(true);
      // Eliminamos el token para que, si recarga la página, lo expulse al login y el cajero NO pueda volver a entrar
      localStorage.removeItem('authToken');
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || 'Error al cerrar la caja');
    } finally {
      setIsProcessing(false);
    }
  }

  if (isRegisterClosed) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#FCE4D6] p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[6px] scale-[1.02] pointer-events-none opacity-40" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)' }} />
        <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[32px] shadow-2xl border-2 border-[#D96C4A]/20 max-w-lg w-full animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-3xl font-black text-[#4B2E2D] mb-4 tracking-tight">Caja en reparación</h1>
          <p className="text-[#4B2E2D]/70 text-lg font-medium mb-8 leading-snug">
            Disculpe las molestias. Esta caja se encuentra inactiva y no puede recibir ni procesar operaciones.
          </p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 bg-[#4B2E2D] hover:bg-[#3A2222] text-white rounded-xl font-black transition-all shadow-lg active:scale-95 text-lg">
            <LogOut size={22} /> Salir del sistema
          </button>
        </div>
      </div>
    )
  }

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
          <button 
            onClick={handleCloseRegister}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
          >
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
              { label: 'Caja Actual (Total)', amount: stats.totalDia, icon: <TrendingUp size={20} className="text-emerald-600" />, bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Efectivo', amount: stats.efectivo, icon: <Banknote size={20} className="text-[#D96C4A]" />, bg: 'bg-white border-[#FCE4D6]' },
              { label: 'Tarjeta', amount: stats.tarjeta, icon: <CreditCard size={20} className="text-blue-600" />, bg: 'bg-white border-[#FCE4D6]' },
              { label: 'Pago QR', amount: stats.qr, icon: <QrCode size={20} className="text-purple-600" />, bg: 'bg-white border-[#FCE4D6]' }
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
                {pendingBills.length} pendientes
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-black/10">
              {pendingBills.map(bill => {
                const isSelected = selectedBill?._id === bill._id
                const mesaName = bill.mesa?.numero || 'Barra'
                const waiterName = bill.usuario?.nombre ? `${bill.usuario.nombre} ${bill.usuario.apellido || ''}` : 'Mesero'
                const timeWaiting = new Date(bill.updatedAt || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                return (
                  <div 
                    key={bill._id}
                    onClick={() => { setSelectedBill(bill); setSelectedMethod(null); }}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-[#FFF5F0] border-[#D96C4A] shadow-md transform scale-[1.01]' 
                        : 'bg-white border-gray-100 hover:border-[#D96C4A]/40 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${isSelected ? 'bg-[#D96C4A] text-white' : 'bg-[#FCE4D6] text-[#4B2E2D]'}`}>
                        {mesaName.replace('Mesa ', '').replace('VIP ', 'V')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-[#4B2E2D] text-lg leading-none">{mesaName}</h3>
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                          <User size={12} /> {waiterName} <span className="mx-1">•</span> <Clock size={12} /> {timeWaiting}
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
              
              {pendingBills.length === 0 && (
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
                    <h2 className="text-2xl font-black">{selectedBill.mesa?.numero || 'Mesa'}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">N° Pedido</p>
                    <p className="text-lg font-black text-[#E57C5D]">{selectedBill.codigo || `PED-${selectedBill._id.slice(-4).toUpperCase()}`}</p>
                  </div>
                </div>
                <div className="mt-3 bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1"><User size={14} className="text-[#E57C5D]" /> <span className="font-bold text-sm">{selectedBill.clienteNombre || 'Consumidor Final'}</span></div>
                  <div className="flex gap-4"><div className="flex items-center gap-1.5"><IdCard size={12} className="text-white/60" /> <span className="text-xs font-medium text-white/80">CI: {selectedBill.clienteCI || 'S/N'}</span></div>{selectedBill.clienteNIT && <div className="flex items-center gap-1.5"><Receipt size={12} className="text-white/60" /> <span className="text-xs font-medium text-white/80">NIT: {selectedBill.clienteNIT}</span></div>}</div>
                </div>
              </div>

              {/* Lista de Consumo (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Detalle de consumo</h4>
                <div className="space-y-3">
                  {(selectedBill.detalles || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-400 w-5">{item.cantidad}x</span>
                        <span className="font-bold text-[#4B2E2D]">{item.plato?.nombre || 'Plato'}</span>
                      </div>
                      <span className="font-bold text-[#4B2E2D] shrink-0">Bs. {((item.plato?.precio || 0) * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel de Descuentos, Propinas y Totales */}
              <div className="p-5 shrink-0 bg-white space-y-4">
                {/* Resumen matemático */}
                <div className="bg-[#F9F9F9] rounded-xl p-4 border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-500">Subtotal</span>
                    <span className="font-bold text-[#4B2E2D]">Bs. {(selectedBill.subtotalCierre || selectedBill.total || 0).toFixed(2)}</span>
                  </div>
                  {(selectedBill.montoDescuento || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600">
                      <span className="font-semibold flex items-center gap-1"><Percent size={12} /> Descuento aplicado</span>
                      <span className="font-bold">- Bs. {(selectedBill.montoDescuento || 0).toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedBill.montoPropina || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm text-[#D96C4A]">
                      <span className="font-semibold flex items-center gap-1"><Wallet size={12} /> Propina sugerida</span>
                      <span className="font-bold">+ Bs. {(selectedBill.montoPropina || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-dashed border-gray-300 flex justify-between items-end">
                    <span className="font-black text-[#4B2E2D] uppercase tracking-wider text-xs mb-1">Total a Cobrar</span>
                    <span className="font-black text-3xl text-[#D0543A] leading-none">Bs. {((selectedBill.subtotalCierre || selectedBill.total || 0) - (selectedBill.montoDescuento || 0) + (selectedBill.montoPropina || 0)).toFixed(2)}</span>
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div>
                  <label className="block text-[11px] font-bold text-[#4B2E2D] uppercase mb-2">Método de pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Efectivo', label: 'Efectivo', icon: <Banknote size={18} /> },
                      { id: 'Tarjeta', label: 'Tarjeta', icon: <CreditCard size={18} /> },
                      { id: 'QR', label: 'QR', icon: <QrCode size={18} /> }
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