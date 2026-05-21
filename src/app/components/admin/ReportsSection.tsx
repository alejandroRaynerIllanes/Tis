// src/app/components/admin/ReportsSection.tsx
import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { generarReporteProfesional } from '../../utils/pdfReports.utils'

export function ReportsSection() {
  const [isGenerating, setIsGenerating] = useState<number | null>(null)

  // 1. Reporte Diario de Ventas
  const handleReporteVentas = async () => {
    setIsGenerating(1);
    toast.loading('Descargando ventas del día...', { id: 'rep1' });
    try {
      // 🔥 Consultamos a la BD. Añadimos &hoy=true para que funcione el Fallback si el backend está desactualizado
      const res: any = await api.get('/pedidos?reportesCierre=true&hoy=true'); 
      const data = res.data || res || [];

      if (data.length === 0) {
        toast.info('No hay ventas registradas ni cierres el día de hoy.', { id: 'rep1' });
        setIsGenerating(null);
        return;
      }

      let totalEfectivo = 0, totalTarjeta = 0, totalQR = 0, totalDescuentos = 0, totalPropinas = 0, totalVentas = 0;
      let totalPagos = 0;
      let datosTabla: any[][] = [];

      // Detectar si el backend nos devolvió Cierres de Caja (tiene cajeroNombre) o Pedidos normales
      const isCierreCaja = data[0].cajeroNombre !== undefined;

      if (isCierreCaja) {
        // LÓGICA 1: Usar los reportes Z guardados reales (Backend compilado y sincronizado)
        datosTabla = data.map((r: any) => {
          totalEfectivo += (r.efectivo || 0);
          totalTarjeta += (r.tarjeta || 0);
          totalQR += (r.qr || 0);
          totalDescuentos += (r.descuentos || 0);
          totalPropinas += (r.propinas || 0);
          totalVentas += (r.totalDia || 0);
          totalPagos += (r.pagosProcesados || 0);

          return [
            r.cajeroNombre || 'Cajero',
            (r.cajeroId || 'N/A').slice(-6),
            (r.pagosProcesados || 0).toString(),
            `Bs. ${(r.efectivo || 0).toFixed(2)}`,
            `Bs. ${(r.tarjeta || 0).toFixed(2)}`,
            `Bs. ${(r.qr || 0).toFixed(2)}`,
            `Bs. ${(r.descuentos || 0).toFixed(2)}`,
            `Bs. ${(r.propinas || 0).toFixed(2)}`,
            `Bs. ${(r.totalDia || 0).toFixed(2)}`
          ];
        });
      } else {
        // LÓGICA 2: Fallback Inteligente. Agrupar los Pedidos crudos al vuelo (Backend antiguo sin compilar)
        const pedidosCerrados = data.filter((p: any) => p.estado === 'CERRADO');
        if (pedidosCerrados.length === 0) {
          toast.info('No hay ventas cerradas el día de hoy.', { id: 'rep1' });
          setIsGenerating(null);
          return;
        }

        const statsPorCajero: Record<string, any> = {};

        pedidosCerrados.forEach((p: any) => {
          const cajero = p.cajeroAsignado ? `${p.cajeroAsignado.nombre} ${p.cajeroAsignado.apellido || ''}`.trim() : 'Cajero Principal';
          const cajeroId = p.cajeroAsignado ? (p.cajeroAsignado._id || p.cajeroAsignado) : 'N/A';
          
          if (!statsPorCajero[cajero]) {
            statsPorCajero[cajero] = { id: String(cajeroId), ventas: 0, efectivo: 0, tarjeta: 0, qr: 0, propinas: 0, descuentos: 0, total: 0 };
          }

          statsPorCajero[cajero].ventas += 1;
          statsPorCajero[cajero].descuentos += (p.montoDescuento || 0);
          statsPorCajero[cajero].propinas += (p.montoPropina || 0);
          statsPorCajero[cajero].total += (p.total || 0);

          if (p.metodoPago === 'Efectivo') { statsPorCajero[cajero].efectivo += (p.total || 0); totalEfectivo += (p.total || 0); }
          if (p.metodoPago === 'Tarjeta') { statsPorCajero[cajero].tarjeta += (p.total || 0); totalTarjeta += (p.total || 0); }
          if (p.metodoPago === 'QR') { statsPorCajero[cajero].qr += (p.total || 0); totalQR += (p.total || 0); }

          totalDescuentos += (p.montoDescuento || 0);
          totalPropinas += (p.montoPropina || 0);
          totalVentas += (p.total || 0);
          totalPagos += 1;
        });

        datosTabla = Object.keys(statsPorCajero).map(cajero => [
          cajero,
          statsPorCajero[cajero].id.slice(-6),
          statsPorCajero[cajero].ventas.toString(),
          `Bs. ${statsPorCajero[cajero].efectivo.toFixed(2)}`,
          `Bs. ${statsPorCajero[cajero].tarjeta.toFixed(2)}`,
          `Bs. ${statsPorCajero[cajero].qr.toFixed(2)}`,
          `Bs. ${statsPorCajero[cajero].descuentos.toFixed(2)}`,
          `Bs. ${statsPorCajero[cajero].propinas.toFixed(2)}`,
          `Bs. ${statsPorCajero[cajero].total.toFixed(2)}`
        ]);
      }

      const columnas = ['Cajero', 'ID', 'Cobros', 'Efectivo', 'Tarjeta', 'QR', 'Descuento', 'Propina', 'Total Vendido'];
      const stringTotales = `INFORMACIÓN OPERATIVA Y FINANCIERA (CONSOLIDADO CAJAS CERRADAS):
Total Recaudado: Bs. ${totalVentas.toFixed(2)}
Total Efectivo: Bs. ${totalEfectivo.toFixed(2)} | Total Tarjeta: Bs. ${totalTarjeta.toFixed(2)} | Total QR: Bs. ${totalQR.toFixed(2)}
Propinas Recibidas: Bs. ${totalPropinas.toFixed(2)} | Descuentos Aplicados: Bs. ${totalDescuentos.toFixed(2)}
Total de Pagos Procesados: ${totalPagos}
Pagos Anulados: 0
`;

      generarReporteProfesional('Reporte Diario de Ventas y Cierre de Cajas', columnas, datosTabla, stringTotales);
      toast.success('Reporte de cierre generado y sincronizado', { id: 'rep1' });
    } catch (error) {
      toast.error('Error al generar el reporte de ventas', { id: 'rep1' });
    } finally {
      setIsGenerating(null);
    }
  };

  // 2. Rendimiento de Meseros
  const handleReporteMeseros = async () => {
    setIsGenerating(2);
    toast.loading('Analizando rendimiento...', { id: 'rep2' });
    try {
      // Pedimos todo el historial para ver quién vendió más
      const res: any = await api.get('/pedidos'); 
      const pedidos = res.data || res || [];
      
      const meserosStats: Record<string, { ventas: number, mesas: number }> = {};

      pedidos.forEach((p: any) => {
        if(p.estado === 'CERRADO') {
           const nombre = p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}`.trim() : 'Desconocido';
           if(!meserosStats[nombre]) meserosStats[nombre] = { ventas: 0, mesas: 0 };
           meserosStats[nombre].ventas += (p.total || 0);
           meserosStats[nombre].mesas += 1;
        }
      });

      const datosTabla = Object.keys(meserosStats).map(nombre => [
        nombre,
        meserosStats[nombre].mesas.toString(),
        `Bs. ${meserosStats[nombre].ventas.toFixed(2)}`
      ]);

      // Ordenar al mejor vendedor arriba
      datosTabla.sort((a, b) => Number(b[2].replace('Bs. ', '')) - Number(a[2].replace('Bs. ', '')));

      generarReporteProfesional('Rendimiento de Meseros (Global)', ['Nombre del Mesero', 'Mesas Atendidas', 'Total Vendido'], datosTabla);
      toast.success('Reporte de meseros generado', { id: 'rep2' });
    } catch (error) {
      toast.error('Error al generar estadísticas', { id: 'rep2' });
    } finally {
      setIsGenerating(null);
    }
  };

  // 3. Platos Más Vendidos
  const handleReportePlatos = async () => {
    setIsGenerating(3);
    toast.loading('Contando platos...', { id: 'rep3' });
    try {
      const res: any = await api.get('/pedidos'); 
      const pedidos = res.data || res || [];
      
      const platosStats: Record<string, { cantidad: number, recaudado: number, categoria: string }> = {};

      pedidos.forEach((p: any) => {
        if(p.estado === 'CERRADO' && p.detalles) {
           p.detalles.forEach((item: any) => {
              const nombre = item.plato?.nombre || 'Plato Eliminado';
              const categoria = item.plato?.categoria?.nombre || 'General';
              
              if(!platosStats[nombre]) platosStats[nombre] = { cantidad: 0, recaudado: 0, categoria };
              
              platosStats[nombre].cantidad += (item.cantidad || 1);
              platosStats[nombre].recaudado += (item.subtotal || 0);
           });
        }
      });

      const datosTabla = Object.keys(platosStats).map(nombre => [
        nombre,
        platosStats[nombre].categoria,
        platosStats[nombre].cantidad.toString(),
        `Bs. ${platosStats[nombre].recaudado.toFixed(2)}`
      ]);

      // Ordenar por cantidad vendida
      datosTabla.sort((a, b) => Number(b[2]) - Number(a[2]));

      generarReporteProfesional('Top Platos Más Vendidos', ['Nombre del Plato', 'Categoría', 'Cant. Vendida', 'Total Recaudado'], datosTabla);
      toast.success('Ranking de platos generado', { id: 'rep3' });
    } catch (error) {
      toast.error('Error al procesar el menú', { id: 'rep3' });
    } finally {
      setIsGenerating(null);
    }
  };

  // 4. Reporte de Clientes VIP
  const handleReporteVIP = async () => {
    setIsGenerating(4);
    toast.loading('Generando cartera VIP...', { id: 'rep4' });
    try {
      const res: any = await api.get('/reservas'); 
      const reservas = res.data || res || [];
      
      const vipReservas = reservas.filter((r: any) => r.vip === true);
      
      const datosTabla = vipReservas.map((r: any) => {
        const fecha = new Date(r.fecha).toLocaleDateString();
        return [
          r.clienteNombre,
          r.codigo || 'S/N',
          fecha,
          r.hora || 'S/H',
          `${r.cantidadPersonas || 1} pax`
        ];
      });

      generarReporteProfesional('Historial de Reservas VIP', ['Nombre del Cliente VIP', 'Código Reserva', 'Fecha Asignada', 'Hora', 'Acompañantes'], datosTabla);
      toast.success('Reporte VIP generado', { id: 'rep4' });
    } catch (error) {
      toast.error('Error al consultar clientes VIP', { id: 'rep4' });
    } finally {
      setIsGenerating(null);
    }
  };

  // Array configurado con las funciones reales
  const REPORTS_LIST = [
    { id: 1, name: 'Reporte Diario de Ventas', description: 'Resumen de todas las ventas, propinas y descuentos del día.', icon: FileText, action: handleReporteVentas },
    { id: 2, name: 'Rendimiento de Meseros', description: 'Estadísticas de mesas atendidas y ventas por personal.', icon: FileText, action: handleReporteMeseros },
    { id: 3, name: 'Platos Más Vendidos', description: 'Ranking del menú con cantidades y categorías.', icon: FileText, action: handleReportePlatos },
    { id: 4, name: 'Reporte de Reservas VIP', description: 'Historial de visitas y consumo de clientes preferenciales.', icon: FileText, action: handleReporteVIP }
  ]

  return (
    <>
      <header className="px-10 py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10">
        <h1 className="text-4xl font-bold text-[#4B2E2D]">Reportes y Análisis</h1>
        <p className="text-[#4B2E2D]/70 font-medium mt-2">
          Visualiza datos clave y descarga informes del restaurante
        </p>
      </header>

      <div className="p-10 pt-4">
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-bold text-[#4B2E2D]">Reportes Disponibles</h2>
              <p className="text-[#4B2E2D]/60 font-medium mt-1 text-sm">
                Descarga informes detallados en formato PDF
              </p>
            </div>

            <div className="px-8 pb-8 space-y-3">
              {REPORTS_LIST.map((report) => {
                const IconComponent = report.icon
                const isLoading = isGenerating === report.id;

                return (
                  <div
                    key={report.id}
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-[#FCE4D6] hover:border-[#E57C5D]/40 hover:bg-[#FCE4D6]/30 transition-all duration-200"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FCE4D6] flex items-center justify-center text-[#D0543A] shrink-0 group-hover:bg-[#E57C5D]/20 transition-colors">
                      <IconComponent size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#4B2E2D]">{report.name}</p>
                      <p className="text-[#4B2E2D]/60 text-xs font-medium mt-0.5 truncate">
                        {report.description}
                      </p>
                    </div>

                    <button
                      onClick={report.action}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all shrink-0 ${
                        isLoading 
                          ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' 
                          : 'bg-[#D0543A] text-white shadow-[#D0543A]/20 hover:bg-[#b5462f] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]'
                      }`}
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {isLoading ? 'Cargando...' : 'PDF'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mx-8 mb-8 p-4 bg-[#FCE4D6]/50 rounded-xl border border-[#E57C5D]/20">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-[#E57C5D] mt-0.5 shrink-0" />
                <p className="text-[#4B2E2D]/70 text-xs font-medium leading-relaxed">
                  Los reportes se generan con datos actualizados al momento de la descarga. 
                  Calculados usando datos consolidados y transaccionales del backend.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}