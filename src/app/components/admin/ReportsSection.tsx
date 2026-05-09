import { Download, FileText } from 'lucide-react'

const REPORTS_LIST = [
  { id: 1, name: 'Reporte Diario de Ventas', description: 'Resumen de todas las ventas, propinas y descuentos del día.', icon: FileText },
  { id: 2, name: 'Rendimiento de Meseros', description: 'Estadísticas de mesas atendidas y ventas por personal.', icon: FileText },
  { id: 3, name: 'Platos Más Vendidos', description: 'Ranking del menú con cantidades y categorías.', icon: FileText },
  { id: 4, name: 'Reporte de Clientes VIP', description: 'Historial de visitas y consumo de clientes preferenciales.', icon: FileText }
]

export function ReportsSection() {
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
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = '#'
                        link.download = `${report.name.replace(/\s+/g, '_')}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#D0543A] text-white rounded-lg font-bold text-sm shadow-md shadow-[#D0543A]/20 hover:bg-[#b5462f] hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97] transition-all shrink-0"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mx-8 mb-8 p-4 bg-[#FCE4D6]/50 rounded-xl border border-[#E57C5D]/20">
              <div className="flex items-start gap-3">
                <FileText size={16} className="text-[#E57C5D] mt-0.5 shrink-0" />
                <p className="text-[#4B2E2D]/70 text-xs font-medium leading-relaxed">
                  Los reportes se generan con datos actualizados al momento de la descarga. Para
                  reportes personalizados, contacta con el administrador del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
