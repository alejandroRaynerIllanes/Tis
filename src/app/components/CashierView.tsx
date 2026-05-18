//src/app/components/CashierView.tsx
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
import jsPDF from "jspdf";
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
      
      // Descargamos las pendientes usando el nuevo endpoint y las cerradas para las estadísticas
      const [pendientesRes, cerradasRes]: any = await Promise.all([
        api.get('/pedidos/pendientes-cobro'),
        api.get(`/pedidos?hoy=true&cajero=${cajeroId}`)
      ])
      
      // El nuevo endpoint trae un JSON mapeado { pedidoId, codigo, mesaNombre, meseroNombre, total, items }
      let pending = pendientesRes.data || pendientesRes || []
      
      // Cerradas: Para las estadísticas del día
      const myOrders = cerradasRes.data || cerradasRes || []
      const closed = myOrders.filter((o: any) => o.estado === 'CERRADO')
      
      let totalDia = 0, efectivo = 0, tarjeta = 0, qr = 0;
      closed.forEach((o: any) => {
        totalDia += (o.total || 0)
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
      setStats({ totalDia, efectivo, tarjeta, qr })
      
      // Actualizar vista seleccionada si sigue pendiente
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

    const handleActualizarTablero = () => {
      fetchDashboardData()
    }

    socket.on('caja:nueva_cuenta', handleNuevaCuenta)
    socket.on('cuenta:solicitada', handleCuentaSolicitada)
    socket.on('cocina:actualizar_tablero', handleActualizarTablero)

    return () => { 
      socket.off('caja:nueva_cuenta', handleNuevaCuenta)
      socket.off('cuenta:solicitada', handleCuentaSolicitada)
      socket.off('cocina:actualizar_tablero', handleActualizarTablero)
    }
  }, [socket])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/', { replace: true })
  }

  const executePayment = async () => {
    setIsProcessing(true)
    try {
      const pId = selectedBill.pedidoId || selectedBill._id
      let comprobanteBackend = null; // 1. NUEVA VARIABLE PARA ATRAPAR EL COMPROBANTE
      
      try {
        // 2. ATRAPAMOS LA RESPUESTA
        const response: any = await api.post(`/pagos/${pId}/procesar`, {
          metodoPago: selectedMethod
        })
        comprobanteBackend = response.comprobante; // Aquí viene el meseroNombre real
      } catch (err: any) {
        // Fallback: If endpoint doesn't exist, we close the order and release table manually
        await api.put(`/pedidos/${pId}`, {
          estado: 'CERRADO',
          paymentStatus: 'paid',
          metodoPago: selectedMethod
        });
      }

      toast.success(`Pago procesado con éxito para ${selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}`, { description: 'Se liberó la mesa.' })
      
      const tableId = selectedBill.mesaId || selectedBill.mesa?._id || selectedBill.mesa;
      if (socket) {
        socket.emit('mesas:updated', { tableId, status: 'Disponible' });
        socket.emit('cocina:actualizar_tablero');
      }

      // 3. INYECTAMOS EL COMPROBANTE DEL BACKEND EN EL PROCESSED BILL
      setProcessedBill({ 
        ...selectedBill, 
        ...comprobanteBackend, // Esto sobrescribe cualquier nombre erróneo con el real
        paymentMethod: selectedMethod 
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
    
    // Si es pago QR, se detiene el cobro automático y se abre el Modal de QR
    if (selectedMethod === 'QR') {
      setIsQRModalOpen(true)
      return
    }

    // Para otros métodos (Efectivo, Tarjeta) cobra normalmente
    await executePayment()
  }

  const handleDownloadQRPDF = async () => {
    if (!selectedBill) return;
    setIsProcessing(true);
    try {
      const doc = new jsPDF({ format: [80, 200] });
      let y = 10;
      doc.setFontSize(16);
      doc.text("SABOR & GESTION", 40, y, { align: "center" });
      y += 8;
      doc.setFontSize(12);
      doc.text("Pago con QR", 40, y, { align: "center" });
      y += 5;
      doc.setFontSize(10);
      doc.text("Escanee para pagar desde su mesa", 40, y, { align: "center" });
      y += 8;
      doc.text("-----------------------------------------", 40, y, { align: "center" });
      y += 6;
      
      doc.text(`Mesa: ${selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}`, 5, y);
      y += 5;
      doc.text(`Cliente: ${selectedBill.clienteNombre || 'Consumidor Final'}`, 5, y);
      y += 5;
      doc.text(`Pedido: ${selectedBill.codigo || `PED-${String(selectedBill.pedidoId || selectedBill._id).slice(-4).toUpperCase()}`}`, 5, y);
      y += 5;
      
      const total = ((selectedBill.subtotalCierre || selectedBill.total || 0) - (selectedBill.montoDescuento || 0) + (selectedBill.montoPropina || 0)).toFixed(2);
      doc.setFontSize(12);
      doc.text(`Total a pagar: Bs. ${total}`, 5, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.text("-----------------------------------------", 40, y, { align: "center" });
      y += 6;

      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAGO-TIS-${selectedBill.pedidoId || selectedBill._id}&color=4B2E2D`;
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = qrUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, 'PNG', 15, y, 50, 50);
        y += 55;
      } catch (error) {
        doc.text("[ QR NO DISPONIBLE ]", 40, y + 20, { align: "center" });
        y += 55;
      }

      doc.setFontSize(8);
      const splitMsg = doc.splitTextToSize("Escanee este codigo QR con su aplicacion bancaria para realizar el pago de forma segura", 70);
      doc.text(splitMsg, 40, y, { align: "center" });
      y += 15;
      doc.text("Gracias por su preferencia", 40, y, { align: "center" });

      doc.save(`QR-Mesa-${selectedBill.mesaNombre || selectedBill.mesa?.numero || 'Mesa'}.pdf`);
    } catch (err) {
      toast.error("Error al generar el PDF del QR");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDownloadPDF = () => {
    if (!processedBill) return;
    const doc = new jsPDF({ format: [80, 250] });
    let y = 10;
    doc.setFontSize(14);
    doc.text("Sabor & Gestion", 40, y, { align: "center" });
    y += 6;
    doc.setFontSize(10);
    doc.text("Comprobante de Pago", 40, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.text(`Pedido: ${processedBill.codigo || `PED-${String(processedBill.pedidoId || processedBill._id).slice(-4).toUpperCase()}`}`, 40, y, { align: "center" });
    y += 6;
    doc.text("-----------------------------------------", 40, y, { align: "center" });
    y += 6;
    
    const mesaName = processedBill.mesaNombre || processedBill.mesa?.numero || 'Barra';
    const waiterName = processedBill.meseroNombre || (processedBill.usuario?.nombre ? `${processedBill.usuario.nombre} ${processedBill.usuario.apellido || ''}` : 'Mesero');
    const locationName = processedBill.mesa?.ubicacion?.nombre || processedBill.mesa?.location || 'Principal';

    doc.text(`Mesa: ${mesaName}`, 5, y);
    y += 5;
    doc.text(`Area/Sala: ${locationName}`, 5, y);
    y += 5;
    doc.text(`Mesero: ${waiterName}`, 5, y);
    y += 5;
    doc.text(`Cajero: ${cashierName}`, 5, y);
    y += 6;
    doc.text("-----------------------------------------", 40, y, { align: "center" });
    y += 6;

    doc.text(`Cliente: ${processedBill.clienteNombre || 'Consumidor Final'}`, 5, y);
    y += 5;
    if (processedBill.clienteCI || processedBill.clienteNIT) {
      doc.text(`CI/NIT: ${processedBill.clienteCI || processedBill.clienteNIT || 'S/N'}`, 5, y);
      y += 5;
    }
    doc.text("-----------------------------------------", 40, y, { align: "center" });
    y += 6;

    doc.text("CANT   DESCRIPCION       P.U   SUBT", 5, y);
    y += 5;
    (processedBill.items || processedBill.detalles || []).forEach((item: any) => {
      const name = item.nombre || item.plato?.nombre || 'Plato';
      const qty = item.cantidad || 1;
      const pu = (item.precioUnitario || item.plato?.precio || 0).toFixed(2);
      const sub = (item.subtotal || ((item.precioUnitario || item.plato?.precio || 0) * qty)).toFixed(2);
      doc.text(`${qty}`, 5, y);
      doc.text(`${name.substring(0, 12)}`, 15, y);
      doc.text(`${pu}`, 55, y, { align: "right" });
      doc.text(`Bs. ${sub}`, 75, y, { align: "right" });
      y += 5;
    });
    
    y += 3;
    doc.text("-----------------------------------------", 40, y, { align: "center" });
    y += 6;
    
    const subtotal = (processedBill.subtotalCierre || processedBill.total || 0).toFixed(2);
    const discount = (processedBill.montoDescuento || 0).toFixed(2);
    const tip = (processedBill.montoPropina || 0).toFixed(2);
    const total = ((processedBill.subtotalCierre || processedBill.total || 0) - (processedBill.montoDescuento || 0) + (processedBill.montoPropina || 0)).toFixed(2);

    doc.text(`Subtotal:`, 5, y);
    doc.text(`Bs. ${subtotal}`, 75, y, { align: "right" });
    y += 5;
    if (Number(discount) > 0) {
      doc.text(`Descuento:`, 5, y);
      doc.text(`- Bs. ${discount}`, 75, y, { align: "right" });
      y += 5;
    }
    if (Number(tip) > 0) {
      doc.text(`Propina:`, 5, y);
      doc.text(`+ Bs. ${tip}`, 75, y, { align: "right" });
      y += 5;
    }
    
    doc.setFontSize(12);
    doc.text(`TOTAL FINAL:`, 5, y);
    doc.text(`Bs. ${total}`, 75, y, { align: "right" });
    y += 8;
    
    doc.setFontSize(10);
    doc.text(`Metodo Pago: ${processedBill.paymentMethod || 'Efectivo'}`, 5, y);
    y += 5;
    
    const now = new Date();
    doc.text(`Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 5, y);
    y += 10;
    
    doc.text("¡Gracias por su preferencia!", 40, y, { align: "center" });
    doc.save(`Factura-${processedBill.codigo || processedBill.pedidoId || 'Pago'}.pdf`);
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
                const bId = bill.pedidoId || bill._id
                const isSelected = (selectedBill?.pedidoId || selectedBill?._id) === bId
                const mesaName = bill.mesaNombre || bill.mesa?.numero || 'Barra'
                const waiterName = bill.meseroNombre || (bill.usuario?.nombre ? `${bill.usuario.nombre} ${bill.usuario.apellido || ''}` : 'Mesero')
                const timeWaiting = bill.tiempoEsperaMinutos !== undefined ? `Hace ${bill.tiempoEsperaMinutos} min` : new Date(bill.updatedAt || bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                
                return (
                  <div 
                    key={bId}
                    onClick={async () => { 
                      // Opcional: Como el endpoint 'pendientes-cobro' devuelve un payload simplificado sin datos del cliente,
                      // intentamos recuperar la versión completa del pedido para la facturación.
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

              {/* Lista de Consumo (Scrollable) */}
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

      {/* ─── MODALES DE PAGO Y FACTURACIÓN ─── */}
      
      {/* 1. Modal QR */}
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
              {/* Datos */}
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

              {/* QR */}
              <div className="bg-white p-3 rounded-3xl shadow-sm border-2 border-gray-100 mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PAGO-TIS-${selectedBill.pedidoId || selectedBill._id}&color=4B2E2D`}
                  alt="Código QR"
                  className="w-[180px] h-[180px] object-contain"
                />
              </div>
              <p className="text-xs font-bold text-gray-500 text-center max-w-[280px] leading-relaxed">
                Escanee este código QR con su aplicación bancaria para realizar el pago de forma segura
              </p>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
              <button onClick={handleDownloadQRPDF} disabled={isProcessing} className="w-full py-3.5 rounded-xl bg-white border-2 border-[#D96C4A] text-[#D96C4A] hover:bg-[#FFF5F0] font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                {isProcessing ? <div className="w-5 h-5 border-2 border-[#D96C4A]/30 border-t-[#D96C4A] rounded-full animate-spin" /> : <Printer size={20} />} Imprimir QR para Mesa
              </button>
              <button onClick={executePayment} disabled={isProcessing} className="w-full py-4 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {isProcessing ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Procesando...</> : <><CheckCircle2 size={22} /> Confirmar Pago QR</>}
              </button>
              <button onClick={() => setIsQRModalOpen(false)} disabled={isProcessing} className="w-full py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-all disabled:opacity-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Comprobante (Factura PDF) */}
      {isInvoiceModalOpen && processedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header Comprobante */}
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
              
              {/* Badge Mesa */}
              <div className="flex justify-center mb-6">
                <span className="bg-[#FCE4D6] text-[#4B2E2D] px-4 py-1.5 rounded-full font-black text-sm border border-[#E0D0C5] shadow-sm">
                  {processedBill.mesaNombre || processedBill.mesa?.numero || 'Mesa'}
                </span>
              </div>

              {/* Detalles Administrativos */}
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

              {/* Cliente */}
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

              {/* Productos (Resumido en scroll pequeño) */}
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

              {/* Totales */}
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

            {/* Footer de Acciones (Fijo Abajo) */}
            <div className="p-5 sm:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0 mt-auto">
              <button 
                onClick={() => {
                  setIsInvoiceModalOpen(false);
                  setProcessedBill(null);
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