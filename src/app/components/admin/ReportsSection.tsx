// src/app/components/admin/ReportsSection.tsx
import { useState } from 'react'
import { Download, FileText, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { generarReporteProfesional } from '../../utils/pdfReports.utils'

export function ReportsSection() {
  const [isGenerating, setIsGenerating] = useState<number | null>(null)
  
  // 🕒 ESTADOS PARA EL FILTRO DE FECHAS (Por defecto: Hoy)
  const hoy = new Date().toISOString().split('T')[0]
  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [fechaFin, setFechaFin] = useState(hoy)

  // 🛡️ FILTRO LOCAL DE SEGURIDAD: Corta las fechas exactas independientemente del backend
  const filtrarPorFecha = (lista: any[]) => {
    const inicio = new Date(`${fechaInicio}T00:00:00`)
    const fin = new Date(`${fechaFin}T23:59:59`)
    
    return lista.filter((item: any) => {
      // Intentamos usar createdAt, o fecha, dependiendo de cómo lo guarde tu BD
      const fechaItem = new Date(item.createdAt || item.fecha || item.updatedAt)
      return fechaItem >= inicio && fechaItem <= fin
    })
  }

  // 1. Reporte Diario de Ventas
  const handleReporteVentas = async () => {
    setIsGenerating(1)
    toast.loading(`Calculando ventas del ${fechaInicio} al ${fechaFin}...`, { id: 'rep1' })
    try {
      const res: any = await api.get('/pedidos')
      let data = res.data || res || []
      
      // Aplicar filtro de fechas real
      data = filtrarPorFecha(data)

      const pedidosCerrados = data.filter((p: any) => p.estado === 'CERRADO')
      if (pedidosCerrados.length === 0) {
        toast.info('No hay ventas cerradas en este rango de fechas.', { id: 'rep1' })
        setIsGenerating(null)
        return
      }

      let totalEfectivo = 0, totalTarjeta = 0, totalQR = 0
      let totalDescuentos = 0, totalPropinas = 0, totalVentas = 0, totalPagos = 0
      const statsPorCajero: Record<string, any> = {}

      pedidosCerrados.forEach((p: any) => {
        // CORRECCIÓN UNDEFINED: Usamos || '' para evitar imprimir la palabra
        const nombre = p.cajeroAsignado?.nombre || 'Cajero'
        const apellido = p.cajeroAsignado?.apellido || ''
        const cajero = p.cajeroAsignado ? `${nombre} ${apellido}`.trim() : 'Cajero Principal'
        
        const cajeroId = p.cajeroAsignado ? p.cajeroAsignado._id || p.cajeroAsignado : 'N/A'

        if (!statsPorCajero[cajero]) {
          statsPorCajero[cajero] = {
            id: String(cajeroId), ventas: 0, efectivo: 0, tarjeta: 0, qr: 0, propinas: 0, descuentos: 0, total: 0
          }
        }

        statsPorCajero[cajero].ventas += 1
        statsPorCajero[cajero].descuentos += p.montoDescuento || 0
        statsPorCajero[cajero].propinas += p.montoPropina || 0
        statsPorCajero[cajero].total += p.total || 0

        if (p.metodoPago === 'Efectivo') {
          statsPorCajero[cajero].efectivo += p.total || 0
          totalEfectivo += p.total || 0
        }
        if (p.metodoPago === 'Tarjeta') {
          statsPorCajero[cajero].tarjeta += p.total || 0
          totalTarjeta += p.total || 0
        }
        if (p.metodoPago === 'QR') {
          statsPorCajero[cajero].qr += p.total || 0
          totalQR += p.total || 0
        }

        totalDescuentos += p.montoDescuento || 0
        totalPropinas += p.montoPropina || 0
        totalVentas += p.total || 0
        totalPagos += 1
      })

      const datosTabla = Object.keys(statsPorCajero).map((cajero) => [
        cajero,
        statsPorCajero[cajero].id.slice(-6),
        statsPorCajero[cajero].ventas.toString(),
        `Bs. ${statsPorCajero[cajero].efectivo.toFixed(2)}`,
        `Bs. ${statsPorCajero[cajero].tarjeta.toFixed(2)}`,
        `Bs. ${statsPorCajero[cajero].qr.toFixed(2)}`,
        `Bs. ${statsPorCajero[cajero].descuentos.toFixed(2)}`,
        `Bs. ${statsPorCajero[cajero].propinas.toFixed(2)}`,
        `Bs. ${statsPorCajero[cajero].total.toFixed(2)}`
      ])

      const columnas = ['Cajero', 'ID', 'Cobros', 'Efectivo', 'Tarjeta', 'QR', 'Descuento', 'Propina', 'Total Vendido']
      const stringTotales = `Resumen del periodo: ${fechaInicio} al ${fechaFin}
Total Recaudado: Bs. ${totalVentas.toFixed(2)}
Efectivo: Bs. ${totalEfectivo.toFixed(2)} | Tarjeta: Bs. ${totalTarjeta.toFixed(2)} | QR: Bs. ${totalQR.toFixed(2)}
Propinas: Bs. ${totalPropinas.toFixed(2)} | Descuentos: Bs. ${totalDescuentos.toFixed(2)}
Total de Pagos Procesados: ${totalPagos}`

      generarReporteProfesional('Reporte de Ventas por Fechas', columnas, datosTabla, stringTotales)
      toast.success('Reporte generado exitosamente', { id: 'rep1' })
    } catch (error) {
      toast.error('Error al generar el reporte', { id: 'rep1' })
    } finally {
      setIsGenerating(null)
    }
  }

  // 2. Rendimiento de Meseros
  const handleReporteMeseros = async () => {
    setIsGenerating(2)
    toast.loading('Analizando rendimiento...', { id: 'rep2' })
    try {
      const res: any = await api.get('/pedidos')
      let pedidos = res.data || res || []
      pedidos = filtrarPorFecha(pedidos)

      const meserosStats: Record<string, { ventas: number; mesas: number }> = {}

      pedidos.forEach((p: any) => {
        if (p.estado === 'CERRADO') {
          // CORRECCIÓN UNDEFINED MESEROS
          const n = p.usuario?.nombre || ''
          const a = p.usuario?.apellido || ''
          const nombre = p.usuario ? `${n} ${a}`.trim() : 'Sin Mesero Asignado'
          
          if (!meserosStats[nombre]) meserosStats[nombre] = { ventas: 0, mesas: 0 }
          meserosStats[nombre].ventas += p.total || 0
          meserosStats[nombre].mesas += 1
        }
      })

      const datosTabla = Object.keys(meserosStats).map((nombre) => [
        nombre,
        meserosStats[nombre].mesas.toString(),
        `Bs. ${meserosStats[nombre].ventas.toFixed(2)}`
      ])

      datosTabla.sort((a, b) => Number(b[2].replace('Bs. ', '')) - Number(a[2].replace('Bs. ', '')))

      generarReporteProfesional(
        `Rendimiento de Meseros (${fechaInicio} a ${fechaFin})`,
        ['Nombre del Mesero', 'Mesas Atendidas', 'Total Vendido'],
        datosTabla
      )
      toast.success('Reporte de meseros generado', { id: 'rep2' })
    } catch (error) {
      toast.error('Error al generar estadísticas', { id: 'rep2' })
    } finally {
      setIsGenerating(null)
    }
  }

  // 3. Platos Más Vendidos
  const handleReportePlatos = async () => {
    setIsGenerating(3)
    toast.loading('Contando platos...', { id: 'rep3' })
    try {
      const res: any = await api.get('/pedidos')
      let pedidos = res.data || res || []
      pedidos = filtrarPorFecha(pedidos)

      const platosStats: Record<string, { cantidad: number; recaudado: number; categoria: string }> = {}

      pedidos.forEach((p: any) => {
        if (p.estado === 'CERRADO' && p.detalles) {
          p.detalles.forEach((item: any) => {
            const nombre = item.plato?.nombre || 'Plato/Bebida Eliminada'
            // CORRECCIÓN CATEGORÍA: Si no viene poblado, intentamos acceder como string
            const categoria = item.plato?.categoria?.nombre || (typeof item.plato?.categoria === 'string' ? 'Falta Populate en BD' : 'General')

            if (!platosStats[nombre]) platosStats[nombre] = { cantidad: 0, recaudado: 0, categoria }

            platosStats[nombre].cantidad += item.cantidad || 1
            platosStats[nombre].recaudado += item.subtotal || 0
          })
        }
      })

      const datosTabla = Object.keys(platosStats).map((nombre) => [
        nombre,
        platosStats[nombre].categoria,
        platosStats[nombre].cantidad.toString(), // Forzamos a String para jsPDF
        `Bs. ${platosStats[nombre].recaudado.toFixed(2)}` // Forzamos a String
      ])

      // Ordenar por cantidad vendida
      datosTabla.sort((a, b) => Number(b[2]) - Number(a[2]))

      generarReporteProfesional(
        `Top Platos Más Vendidos (${fechaInicio} a ${fechaFin})`,
        ['Nombre del Artículo', 'Categoría', 'Cant. Vendida', 'Total Recaudado'], // CABECERAS CORREGIDAS
        datosTabla
      )
      toast.success('Ranking generado', { id: 'rep3' })
    } catch (error) {
      toast.error('Error al procesar el menú', { id: 'rep3' })
    } finally {
      setIsGenerating(null)
    }
  }

  const REPORTS_LIST = [
    { id: 1, name: 'Reporte de Ventas por Fechas', description: 'Resumen de ingresos, propinas y descuentos.', icon: FileText, action: handleReporteVentas },
    { id: 2, name: 'Rendimiento de Meseros', description: 'Estadísticas de mesas atendidas y ventas.', icon: FileText, action: handleReporteMeseros },
    { id: 3, name: 'Artículos Más Vendidos', description: 'Ranking del menú con cantidades y categorías.', icon: FileText, action: handleReportePlatos }
  ]

  return (
    <>
      <header className="px-10 py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#4B2E2D]">Reportes y Análisis</h1>
          <p className="text-[#4B2E2D]/70 font-medium mt-2">Visualiza datos clave y descarga informes</p>
        </div>
        
        {/* NUEVO: CONTROLES DE FECHA EN LA CABECERA */}
        <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-[#E57C5D]/20">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#4B2E2D] ml-1 mb-1">Desde</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-[#4B2E2D] outline-none focus:border-[#D0543A]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-bold text-[#4B2E2D] ml-1 mb-1">Hasta</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-[#4B2E2D] outline-none focus:border-[#D0543A]"
            />
          </div>
        </div>
      </header>

      <div className="p-10 pt-4">
        <div className="flex flex-col gap-8">
          <div className="bg-white rounded-2xl shadow-xl border border-transparent overflow-hidden">
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-2xl font-bold text-[#4B2E2D]">Generar Informes</h2>
              <p className="text-[#4B2E2D]/60 font-medium mt-1 text-sm">
                Los datos filtrarán las ventas ocurridas entre el <b>{fechaInicio}</b> y el <b>{fechaFin}</b>.
              </p>
            </div>

            <div className="px-8 pb-8 space-y-3">
              {REPORTS_LIST.map((report) => {
                const IconComponent = report.icon
                const isLoading = isGenerating === report.id

                return (
                  <div key={report.id} className="group flex items-center gap-4 p-4 rounded-xl border-2 border-[#FCE4D6] hover:border-[#E57C5D]/40 hover:bg-[#FCE4D6]/30 transition-all duration-200">
                    <div className="w-11 h-11 rounded-xl bg-[#FCE4D6] flex items-center justify-center text-[#D0543A] shrink-0">
                      <IconComponent size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#4B2E2D]">{report.name}</p>
                      <p className="text-[#4B2E2D]/60 text-xs font-medium mt-0.5 truncate">{report.description}</p>
                    </div>
                    <button
                      onClick={report.action}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all shrink-0 ${
                        isLoading ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' : 'bg-[#D0543A] text-white hover:bg-[#b5462f]'
                      }`}
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      {isLoading ? 'Cargando...' : 'Descargar PDF'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}