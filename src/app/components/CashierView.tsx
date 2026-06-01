// src/app/components/CashierView.tsx
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
  IdCard,
  X,
  FileText
} from 'lucide-react'
import { generateQrPdf, generateReceiptPdf, generateZReportPdf } from '../utils/pdf.utils'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getStoredUser, api } from '../services/api'
import { authService } from '../services/auth.service'
import { useAppContext } from '../context/AppContext'

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────

export function CashierView() {
  const navigate = useNavigate()
  
  // Estados reales
  const [pendingBills, setPendingBills] = useState<any[]>([])
  const [stats, setStats] = useState({ totalDia: 0, efectivo: 0, tarjeta: 0, qr: 0, descuentos: 0, propinas: 0, pagosProcesados: 0 })
  const [selectedBill, setSelectedBill] = useState<any | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRegisterClosed, setIsRegisterClosed] = useState(false)

  const [customerEmail, setCustomerEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Nuevos estados para el flujo de QR y Facturación
  const [isQRModalOpen, setIsQRModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [processedBill, setProcessedBill] = useState<any | null>(null)

  const { socket } = useAppContext()
  const currentUser = getStoredUser()
  const cashierName = currentUser ? `${currentUser.nombre} ${currentUser.apellido || ''}`.trim() : 'Cajero de Turno'

  const fetchDashboardData = async () => {
    try {
      const cajeroId = currentUser?.id || (currentUser as any)?._id
      
      const [pendientesRes, cerradasRes]: any = await Promise.all([
        api.get(`/pedidos/pendientes-cobro?cajero=${cajeroId}`),
        api.get(`/pedidos?hoy=true&cajero=${cajeroId}`) // SOLUCIÓN BUG 2: Solo obtenemos las ventas de ESTE cajero específico
      ])
      
      let pending = pendientesRes.data || pendientesRes || []
      const myOrders = cerradasRes.data || cerradasRes || []
      const closed = myOrders.filter((o: any) => o.estado === 'CERRADO')
      
      let totalDia = 0, efectivo = 0, tarjeta = 0, qr = 0, descuentos = 0, propinas = 0, pagosProcesados = 0;
      closed.forEach((o: any) => {
        totalDia += (o.total || 0)
        descuentos += (o.montoDescuento || 0)
        propinas += (o.montoPropina || 0)
        pagosProcesados += 1;
        if (o.metodoPago === 'Efectivo') efectivo += (o.total || 0)
        if (o.metodoPago === 'Tarjeta') tarjeta += (o.total || 0)
        if (o.metodoPago === 'QR') qr += (o.total || 0)
      })
      
      setPendingBills(prev => {
        const mergedList = [...pending];
        prev.forEach((localItem) => {
          const existeEnFetch = mergedList.find((fetchItem) => (fetchItem.pedidoId || fetchItem._id) === (localItem.pedidoId || localItem._id));
          if (!existeEnFetch && (localItem.estado === 'CUENTA_SOLICITADA' || localItem.paymentStatus === 'pending')) {
            mergedList.unshift(localItem);
          }
        });
        return mergedList;
      });
      setStats({ totalDia, efectivo, tarjeta, qr, descuentos, propinas, pagosProcesados })
      
      if (selectedBill) {
        const stillPending = pending.find((p: any) => p.pedidoId === selectedBill.pedidoId || p._id === selectedBill._id)
        if (!stillPending) setSelectedBill(null)
      }
    } catch (error) {
      console.error('Error fetching cashier data', error)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // 1. Escuchas generales de Socket
  useEffect(() => {
    if (!socket) return

    const handleNuevaCuenta = (pedido: any) => {
      if (!pedido) return;
      if (pedido.cajeroAsignado === currentUser?.id || pedido.cajeroAsignado === (currentUser as any)?._id || !pedido.cajeroAsignado) {
        toast.info(`¡Nueva cuenta recibida de la ${pedido.mesa?.numero || pedido.mesaNombre || 'Mesa'}!`)
        
        setPendingBills((prev: any[]) => {
          const existe = prev.some((p) => (p.pedidoId || p._id) === (pedido.pedidoId || pedido._id));
          if (existe) return prev.map((p) => (p.pedidoId || p._id) === (pedido.pedidoId || pedido._id) ? pedido : p);
          return [pedido, ...prev];
        });
      }
    }

    const handleCuentaSolicitada = (pedidoActualizado: any) => {
      if (!pedidoActualizado?._id) return;
      setPendingBills((prev: any[]) => {
        const existe = prev.some((p) => (p.pedidoId || p._id) === (pedidoActualizado.pedidoId || pedidoActualizado._id));
        if (existe) return prev.map((p) => (p.pedidoId || p._id) === (pedidoActualizado.pedidoId || pedidoActualizado._id) ? pedidoActualizado : p);
        return [pedidoActualizado, ...prev];
      });
    };

    const handleActualizarTablero = () => fetchDashboardData()

    socket.on('caja:nueva_cuenta', handleNuevaCuenta)
    socket.on('cuenta:solicitada', handleCuentaSolicitada)
    socket.on('cocina:actualizar_tablero', handleActualizarTablero)

    return () => { 
      socket.off('caja:nueva_cuenta', handleNuevaCuenta)
      socket.off('cuenta:solicitada', handleCuentaSolicitada)
      socket.off('cocina:actualizar_tablero', handleActualizarTablero)
    }
  }, [socket])

  // 2. NUEVA ESCUCHA: El simulador de QR disparará este evento
  useEffect(() => {
    if (!socket) return;

    const handlePagoQRConfirmado = (data: any) => {
      const paidId = data.pedidoId;
      const currentSelectedId = selectedBill?.pedidoId || selectedBill?._id;
      
      // Si el tribunal acaba de pagar la mesa que el cajero tiene abierta en pantalla:
      if (currentSelectedId === paidId) {
        toast.success('📱 ¡Transferencia QR detectada desde el celular!', { 
          description: 'Generando comprobante automáticamente...' 
        });
        executePayment(); // Lanza el cobro de forma automática
      } else {
        // Si pagaron una mesa que el cajero no está viendo, solo recargamos la lista
        fetchDashboardData();
      }
    };

    socket.on('caja:pago_confirmado', handlePagoQRConfirmado);
    return () => {
      socket.off('caja:pago_confirmado', handlePagoQRConfirmado);
    }
  }, [socket, selectedBill, selectedMethod]); // Importante pasar las dependencias

  // ─── FUNCIONES DE ACCIÓN ───

  const handleSendEmail = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      toast.error('Ingrese un correo electrónico válido');
      return;
    }
    setIsSendingEmail(true);
    try {
      const pId = processedBill?.pedidoId || processedBill?._id;
      if (!pId) {
        throw new Error('No se encontró el ID del pedido procesado.');
      }

      // 1. Capturamos los datos EXACTOS que ves en la pantalla
      const nombrePantalla = processedBill.clienteNombre || 'Consumidor Final';
      const ciPantalla = processedBill.clienteCI || processedBill.clienteNIT || 'S/N';

      // 2. Se los enviamos al backend junto con el correo
      await api.post(`/pagos/${pId}/enviar-recibo`, { 
        email: customerEmail,
        clienteNombre: nombrePantalla,
        clienteCI: ciPantalla
      });
      
      toast.success('¡Recibo enviado por correo!');
      setCustomerEmail(''); 
    } catch (error: any) {
      console.error('Error JS al enviar correo:', error);
      toast.error(error.response?.data?.mensaje || error.message || 'Error al enviar el correo');
    } finally {
      setIsSendingEmail(false);
    }
  }

  const handleLogout = () => {
    authService.logout()
    navigate('/', { replace: true })
  }

  const executePayment = async () => {
    setIsProcessing(true)
    try {
      const pId = selectedBill.pedidoId || selectedBill._id
      let comprobanteBackend = null; 
      
      try {
        const response: any = await api.post(`/pagos/${pId}/procesar`, {
          metodoPago: selectedMethod || 'QR' // Fallback a QR si se autoejecutó
        })
        comprobanteBackend = response.comprobante; 
      } catch (err: any) {
        await api.put(`/pedidos/${pId}`, {
          estado: 'CERRADO',
          paymentStatus: 'paid',
          metodoPago: selectedMethod || 'QR'
        });
      }

      toast.success(`Pago procesado con éxito para ${selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}`, { description: 'Se liberó la mesa.' })
      
      const tableId = selectedBill.mesaId || selectedBill.mesa?._id || selectedBill.mesa;
      if (socket) {
        socket.emit('mesas:updated', { tableId, status: 'Disponible' });
        socket.emit('cocina:actualizar_tablero');
      }

      setProcessedBill({ 
        ...selectedBill, 
        ...comprobanteBackend,
        paymentMethod: selectedMethod || 'QR' 
      })

      setPendingBills(prev => prev.filter(p => (p.pedidoId || p._id) !== pId));
      setSelectedBill(null);
      setSelectedMethod(null)
      setIsQRModalOpen(false)
      setIsInvoiceModalOpen(true)
      fetchDashboardData()
    } catch (error: any) {
      toast.error(error.response?.data?.mensaje || error.message || 'Error al procesar el pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessPayment = async () => {
    if (!selectedMethod) {
      toast.error('Selecciona un método de pago antes de continuar.')
      return
    }
    
    if (selectedMethod === 'QR') {
      setIsQRModalOpen(true)
      return
    }

    await executePayment()
  }

  const handleDownloadQRPDF = async () => {
    if (!selectedBill) return;
    setIsProcessing(true);
    try {
      const pId = selectedBill.pedidoId || selectedBill._id;
      const mesaNameStr = selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa';
      const codigoStr = selectedBill.codigo || `PED-${String(pId).slice(-4).toUpperCase()}`;
      const totalStr = ((selectedBill.subtotalCierre || selectedBill.total || 0) - (selectedBill.montoDescuento || 0) + (selectedBill.montoPropina || 0)).toFixed(2);
      await generateQrPdf({
        pedidoId: pId,
        mesaNombre: mesaNameStr,
        codigo: codigoStr,
        totalStr,
        clienteNombre: selectedBill.clienteNombre
      });
    } catch (err) {
      toast.error('Error al generar el PDF del QR');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDownloadPDF = () => {
    if (!processedBill) return;
    generateReceiptPdf({ pedido: processedBill, cashierName });
  }

  const handleCloseRegister = async () => {
    if (!currentUser) return;
    
    // VALIDACIÓN: Solo generar reporte si procesó pagos
    if (stats.pagosProcesados === 0 && stats.totalDia === 0) {
      toast.info('La caja no registró ventas durante esta sesión.');
    } else {
      generateZReportPDF();
      toast.success('Reporte de cierre de caja generado y sincronizado automáticamente.');
    }

    setIsProcessing(true);
    try {
      const userId = currentUser.id || (currentUser as any)._id;
      // SOLUCIÓN BUG 1: Enviamos el "reporte" con los stats para que el backend cree el CierreCaja en MongoDB
      await api.patch(`/usuarios/${userId}/estado`, { estado: false, reporte: stats });
      toast.success('Caja inhabilitada. Un administrador debe volver a habilitarla.');
      authService.logout();
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error('Error cerrando caja:', error);
      toast.error(error.response?.data?.mensaje || 'Error al cerrar la caja. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  }

  const generateZReportPDF = () => {
    generateZReportPdf({
      cashierName,
      cajeroId: currentUser?.id || (currentUser as any)?._id || 'N/A',
      stats
    });
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

  let modalQRImage = '';
  if (selectedBill) {
    const pId = selectedBill.pedidoId || selectedBill._id;
    const mesaNameStr = selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa';
    const codigoStr = selectedBill.codigo || `PED-${String(pId).slice(-4).toUpperCase()}`;
    const totalStr = ((selectedBill.subtotalCierre || selectedBill.total || 0) - (selectedBill.montoDescuento || 0) + (selectedBill.montoPropina || 0)).toFixed(2);
    
    const baseUrl = (import.meta as any).env.VITE_APP_URL || window.location.origin;
    const simUrl = `${baseUrl}/pay-simulator?id=${pId}&mesa=${encodeURIComponent(mesaNameStr)}&total=${totalStr}&codigo=${codigoStr}`;
    modalQRImage = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(simUrl)}&color=4B2E2D`;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FCE4D6] font-sans selection:bg-[#E57C5D] selection:text-white relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] pointer-events-none opacity-20"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)' }}
      />
      
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

      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 overflow-hidden z-10">
        
        <section className="flex-1 flex flex-col min-w-0 gap-6 overflow-hidden">
          
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
                const bId = bill.pedidoId || bill._id
                const isSelected = (selectedBill?.pedidoId || selectedBill?._id) === bId
                const mesaName = bill.mesaNombre || bill.mesa?.numero || 'Barra'
                const waiterName = bill.meseroNombre || (bill.usuario?.nombre ? `${bill.usuario.nombre} ${bill.usuario.apellido || ''}` : 'Mesero')
                const timeWaiting = bill.tiempoEsperaMinutos !== undefined ? `Hace ${bill.tiempoEsperaMinutos} min` : new Date(bill.updatedAt || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                
                return (
                  <div 
                    key={bId}
                    onClick={async () => { 
                      try {
                        const res: any = await api.get(`/pedidos?mesa=${bill.mesaId || bill.mesa?._id}&activo=true`);
                        const fullOrder = (res.data || res)[0];
                        setSelectedBill(fullOrder || bill);
                      } catch {
                        setSelectedBill(bill);
                      }
                      setSelectedMethod(null); 
                    }}
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
                        <p className="text-[11px] font-black text-[#D96C4A] mt-1 tracking-tight" title="ID del Pedido">{bill.codigo || `PED-${String(bId).slice(-4).toUpperCase()}`}</p>
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

        <aside className="w-full lg:w-[420px] xl:w-[480px] bg-white rounded-3xl border border-[#E0D0C5] shadow-2xl flex flex-col overflow-hidden shrink-0">
          {selectedBill ? (
            <>
              <div className="bg-[#4B2E2D] p-5 text-white shrink-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Comprobante / Ticket</p>
                    <h2 className="text-2xl font-black">{selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">N° Pedido</p>
                    <p className="text-lg font-black text-[#E57C5D]">{selectedBill.codigo || `PED-${String(selectedBill.pedidoId || selectedBill._id).slice(-4).toUpperCase()}`}</p>
                  </div>
                </div>
                <div className="mt-3 bg-white/10 p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1"><User size={14} className="text-[#E57C5D]" /> <span className="font-bold text-sm">{selectedBill.clienteNombre || 'Consumidor Final'}</span></div>
                  <div className="flex gap-4"><div className="flex items-center gap-1.5"><IdCard size={12} className="text-white/60" /> <span className="text-xs font-medium text-white/80">CI: {selectedBill.clienteCI || 'S/N'}</span></div>{selectedBill.clienteNIT && <div className="flex items-center gap-1.5"><Receipt size={12} className="text-white/60" /> <span className="text-xs font-medium text-white/80">NIT: {selectedBill.clienteNIT}</span></div>}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 border-b border-gray-100">
                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Detalle de consumo</h4>
                <div className="space-y-3">
                  {(selectedBill.items || selectedBill.detalles || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-100 pb-2 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-gray-400 w-5">{item.cantidad}x</span>
                        <span className="font-bold text-[#4B2E2D]">{item.nombre || item.plato?.nombre || 'Plato'}</span>
                      </div>
                      <span className="font-bold text-[#4B2E2D] shrink-0">Bs. {(item.subtotal || ((item.precioUnitario || item.plato?.precio || 0) * item.cantidad)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 shrink-0 bg-white space-y-4">
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

      {isQRModalOpen && selectedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative bg-gradient-to-b from-gray-50 to-white px-6 pt-6 pb-4 border-b border-gray-100 text-center">
              <button 
                onClick={() => setIsQRModalOpen(false)} 
                disabled={isProcessing} 
                className="absolute left-6 top-6 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-bold disabled:opacity-50"
              >
                <X size={18} /> Volver
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
                  <span className="font-semibold text-gray-500">Mesa</span>
                  <span className="font-black text-[#4B2E2D]">{selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-500">Cliente</span>
                  <span className="font-black text-[#4B2E2D] truncate max-w-[150px]">{selectedBill.clienteNombre || 'Consumidor Final'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-500">Pedido</span>
                  <span className="font-black text-[#D96C4A]">{selectedBill.codigo || `PED-${String(selectedBill.pedidoId || selectedBill._id).slice(-4).toUpperCase()}`}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="font-black text-[#4B2E2D] uppercase tracking-wider text-xs">Total a Pagar</span>
                  <span className="font-black text-2xl text-[#4B2E2D]">Bs. {((selectedBill.subtotalCierre || selectedBill.total || 0) - (selectedBill.montoDescuento || 0) + (selectedBill.montoPropina || 0)).toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full border-t border-dashed border-gray-200 mb-6"></div>

              <div className="bg-white p-3 rounded-3xl shadow-sm border-2 border-gray-100 mb-6">
                <img
                  src={modalQRImage}
                  alt="Código QR dinámico"
                  className="w-[180px] h-[180px] object-contain"
                />
              </div>
              <p className="text-xs font-bold text-gray-500 text-center max-w-[280px] leading-relaxed">
                Escanee este código QR con su aplicación bancaria (o cámara del celular) para acceder al pago seguro simulado.
              </p>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              <button onClick={handleDownloadQRPDF} disabled={isProcessing} className="w-full py-3.5 rounded-xl bg-white border-2 border-[#D96C4A] text-[#D96C4A] hover:bg-[#FFF5F0] font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                {isProcessing ? <div className="w-5 h-5 border-2 border-[#D96C4A]/30 border-t-[#D96C4A] rounded-full animate-spin" /> : <Printer size={20} />} Imprimir QR para Mesa
              </button>
              <button onClick={executePayment} disabled={isProcessing} className="w-full py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</> : <><CheckCircle2 size={22} /> Forzar Pago Manual</>}
              </button>
              <button onClick={() => setIsQRModalOpen(false)} disabled={isProcessing} className="w-full py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-all disabled:opacity-50">
                Cerrar QR
              </button>
            </div>
          </div>
        </div>
      )}

      {isInvoiceModalOpen && processedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            <div className="bg-[#4B2E2D] px-6 py-6 text-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mb-3 backdrop-blur-sm">
                  <FileText size={28} className="text-white" />
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">SABOR & GESTIÓN</p>
                <h2 className="text-2xl font-black text-white leading-tight">Comprobante de Pago</h2>
                <p className="text-[#D96C4A] text-sm font-black mt-1 bg-[#D96C4A]/10 px-3 py-1 rounded-full border border-[#D96C4A]/20">
                  {processedBill.codigo || `PED-${String(processedBill.pedidoId || processedBill._id).slice(-4).toUpperCase()}`}
                </p>
              </div>
            </div>
            <div className="p-6 bg-white relative flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10">
              <div className="absolute -top-3 left-0 right-0 h-3 flex justify-around overflow-hidden">
                {Array.from({ length: 25 }).map((_, i) => (<div key={i} className="w-3 h-3 bg-white rounded-full -mt-1.5 shadow-inner"></div>))}
              </div>
              
              <div className="flex justify-center mb-6">
                <span className="bg-[#FCE4D6] text-[#4B2E2D] px-4 py-1.5 rounded-full font-black text-sm border border-[#E0D0C5] shadow-sm">
                  {processedBill.mesaNombre || processedBill.mesa?.numero || 'Mesa'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Área / Sala</p>
                  <p className="text-xs font-black text-[#4B2E2D] truncate">{processedBill.mesa?.ubicacion?.nombre || processedBill.mesa?.location || 'Principal'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Mesero</p>
                  <p className="text-xs font-black text-[#4B2E2D] truncate">{processedBill.meseroNombre || (processedBill.usuario?.nombre ? `${processedBill.usuario.nombre} ${processedBill.usuario.apellido || ''}` : 'Mesero')}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200/60 mt-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Cajero</p>
                  <p className="text-xs font-black text-[#4B2E2D] truncate">{cashierName}</p>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-500">Cliente</span>
                  <span className="font-black text-[#4B2E2D]">{processedBill.clienteNombre || 'Consumidor Final'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                  <span className="font-semibold text-gray-500">CI / NIT</span>
                  <span className="font-black text-[#4B2E2D]">{processedBill.clienteCI || processedBill.clienteNIT || 'S/N'}</span>
                </div>
              </div>

              <div className="mb-6 max-h-[120px] overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-black/10">
                {(processedBill.items || processedBill.detalles || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-400">{item.cantidad}x</span>
                      <span className="font-bold text-[#4B2E2D]">{item.nombre || item.plato?.nombre || 'Plato'}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#4B2E2D]">Bs. {(item.subtotal || ((item.precioUnitario || item.plato?.precio || 0) * item.cantidad)).toFixed(2)}</span>
                      <p className="text-[9px] text-gray-400 font-medium">Bs. {(item.precioUnitario || item.plato?.precio || 0).toFixed(2)} c/u</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#FFF5F0] rounded-2xl p-4 border border-[#FCE4D6] space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-500">Subtotal</span>
                  <span className="font-bold text-[#4B2E2D]">Bs. {(processedBill.subtotalCierre || processedBill.total || 0).toFixed(2)}</span>
                </div>
                {(processedBill.montoDescuento || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-green-600">
                    <span className="font-bold">Descuento</span>
                    <span className="font-bold">- Bs. {(processedBill.montoDescuento || 0).toFixed(2)}</span>
                  </div>
                )}
                {(processedBill.montoPropina || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-[#D96C4A]">
                    <span className="font-bold">Propina</span>
                    <span className="font-bold">+ Bs. {(processedBill.montoPropina || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#D96C4A]/20 flex justify-between items-end">
                  <div>
                    <span className="font-black text-[#4B2E2D] uppercase text-[10px] tracking-wider block mb-0.5">Método de Pago</span>
                    <span className="bg-white text-[#D96C4A] font-black text-[10px] px-2 py-0.5 rounded uppercase border border-[#D96C4A]/30">{processedBill.paymentMethod || 'QR'}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-gray-400 uppercase text-[10px] tracking-wider block mb-0.5">Total Final</span>
                    <span className="font-black text-2xl text-[#D0543A] leading-none">Bs. {((processedBill.subtotalCierre || processedBill.total || 0) - (processedBill.montoDescuento || 0) + (processedBill.montoPropina || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-3 text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Clock size={12} /> {new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-2 pt-4 bg-white">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="correo@cliente.com" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 text-sm focus:outline-none focus:border-[#D96C4A] focus:ring-1 focus:ring-[#D96C4A]"
                />
                <button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail || !customerEmail}
                  className="bg-[#FCE4D6] text-[#D96C4A] px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#E57C5D] hover:text-white transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSendingEmail ? 'Enviando...' : 'Enviar Recibo'}
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0 mt-auto">
              <button 
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  setProcessedBill(null);
                  setCustomerEmail(''); 
                }} 
                className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-black hover:bg-gray-50 transition-all text-sm"
              >
                Cerrar
              </button>
              <button 
                onClick={handleDownloadPDF} 
                className="flex-1 py-3.5 rounded-xl bg-[#4B2E2D] hover:bg-[#3A2222] text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <FileText size={18} /> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}