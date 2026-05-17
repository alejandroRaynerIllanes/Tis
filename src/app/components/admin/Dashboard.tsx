import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Menu } from 'lucide-react'
import { api } from '../../services/api'

interface DashboardProps {
  onOpenSidebar: () => void
}

export function Dashboard({ onOpenSidebar }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.get('/dashboard/resumen')
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching dashboard', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading || !dashboardData) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#FCE4D6]">
        <div className="w-10 h-10 border-4 border-[#D0543A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#4B2E2D] font-bold">Generando métricas del restaurante...</p>
      </div>
    )
  }

  const { kpis, platosMasVendidos, categoriasPopulares, ordenesRecientes } = dashboardData

  // Asignar colores aleatorios a las categorías del gráfico
  const catColors = ['#D0543A', '#E6A23C', '#6B3E2E', '#F2A98A', '#8C3A3A']
  const categoriasFormateadas = categoriasPopulares.map((cat: any, i: number) => ({
    ...cat,
    color: catColors[i % catColors.length]
  }))

  return (
    <>
      {/* Dashboard Header */}
      <header className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 sticky top-0 bg-[#FCE4D6]/90 backdrop-blur-md z-10 flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2.5 rounded-xl bg-[#4B2E2D]/8 hover:bg-[#4B2E2D]/15 text-[#4B2E2D] transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4B2E2D]">Dashboard</h1>
          <p className="text-[#4B2E2D]/70 font-medium mt-0.5 lg:mt-2 text-sm sm:text-base">
            Visualiza métricas y estadísticas del restaurante
          </p>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-10 pt-2 sm:pt-3 lg:pt-4 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {/* Card 1 — Ventas Hoy */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-4 sm:p-5 lg:p-6 flex flex-col gap-3 lg:gap-4 border border-transparent hover:border-[#E57C5D]/20 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                  Ventas Hoy
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                  Bs. {kpis.ventasHoy?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#D0543A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#D0543A]/18 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D0543A"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <path d="M9 3.6C5.5 4.4 3 7.1 3 10.4c0 3.5 2.7 6.4 6.3 7.1" />
                  <path d="M15 3.6C18.5 4.4 21 7.1 21 10.4c0 3.5-2.7 6.4-6.3 7.1" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                +12.5%
              </span>
              <span className="text-xs text-[#4B2E2D]/45 font-medium">vs ayer</span>
            </div>
          </div>

          {/* Card 2 — Órdenes Hoy */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-4 sm:p-5 lg:p-6 flex flex-col gap-3 lg:gap-4 border border-transparent hover:border-[#E57C5D]/20 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                  Órdenes Hoy
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                  {kpis.ordenesHoy || 0}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#E57C5D]/10 flex items-center justify-center shrink-0 group-hover:bg-[#E57C5D]/18 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#E57C5D"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                +8.3%
              </span>
              <span className="text-xs text-[#4B2E2D]/45 font-medium">vs ayer</span>
            </div>
          </div>

          {/* Card 3 — Clientes Hoy */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-4 sm:p-5 lg:p-6 flex flex-col gap-3 lg:gap-4 border border-transparent hover:border-[#E57C5D]/20 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                  Clientes Hoy
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                  {kpis.clientesEstimados || 0}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#4B2E2D]/8 flex items-center justify-center shrink-0 group-hover:bg-[#4B2E2D]/14 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4B2E2D"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#4B2E2D]/55 font-medium">Ticket promedio:</span>
              <span className="text-xs font-bold text-[#D0543A]">Bs. {kpis.ordenesHoy > 0 ? (kpis.ventasHoy / kpis.ordenesHoy).toFixed(2) : '0.00'}</span>
            </div>
          </div>

          {/* Card 4 — Mesas Activas */}
          <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 p-4 sm:p-5 lg:p-6 flex flex-col gap-3 lg:gap-4 border border-transparent hover:border-[#E57C5D]/20 group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#4B2E2D]/55 uppercase tracking-wider">
                  Mesas Activas
                </p>
                <p className="text-2xl sm:text-3xl font-black text-[#4B2E2D] mt-1 leading-none">
                  {kpis.mesasActivas || 0}<span className="text-base sm:text-lg font-bold text-[#4B2E2D]/35"></span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#4B2E2D]/8 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis.ocupacionPorcentaje}%` }} />
              </div>
              <span className="text-xs font-bold text-emerald-600">{kpis.ocupacionPorcentaje || 0}% ocupación</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-8">
          {/* Platos Más Vendidos */}
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#4B2E2D]">
                Platos Más Vendidos
              </h2>
              <span className="text-[11px] font-bold text-[#4B2E2D]/45 uppercase tracking-wider bg-[#FCE4D6]/70 px-2.5 py-1 rounded-full shrink-0">
                Esta semana
              </span>
            </div>
            <div className="space-y-3.5">
              {platosMasVendidos.map((dish: any, idx: number) => (
                <div key={dish.nombre} className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                      idx === 0
                        ? 'bg-[#D0543A] text-white'
                        : idx === 1
                          ? 'bg-[#E57C5D] text-white'
                          : idx === 2
                            ? 'bg-[#F2A98A] text-white'
                            : 'bg-[#FCE4D6] text-[#4B2E2D]/50'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-[#4B2E2D] truncate pr-2 max-w-[160px]">
                        {dish.nombre}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm font-black text-[#4B2E2D]">{dish.cantidad} ventas</span>
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            <TrendingUp size={9} strokeWidth={2.5} />↑
                          </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#FCE4D6]/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min((dish.cantidad / 50) * 100, 100)}%`,
                          background:
                            idx === 0
                              ? '#D0543A'
                              : idx === 1
                                ? '#E57C5D'
                                : idx === 2
                                  ? '#F2A98A'
                                  : '#4B2E2D60'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categorías Más Populares */}
          <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#4B2E2D]">
                Categorías Más Populares
              </h2>
              <span className="text-[11px] font-bold text-[#4B2E2D]/45 uppercase tracking-wider bg-[#FCE4D6]/70 px-2.5 py-1 rounded-full shrink-0">
                Por pedidos
              </span>
            </div>
            <div className="flex flex-col gap-3 pt-1">
              {categoriasFormateadas.map((cat: any, index: number) => (
                <div key={cat.nombre} className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-black text-[#4B2E2D]/30 shrink-0">
                    {index + 1}
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-bold text-[#4B2E2D] w-32 shrink-0 truncate">
                    {cat.nombre}
                  </span>
                  <div className="flex-1 h-2 bg-[#FCE4D6] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.porcentaje}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#4B2E2D]/50 w-20 text-right shrink-0">
                    {cat.pedidos} pedidos
                  </span>
                  <span
                    className="text-sm font-black w-9 text-right shrink-0"
                    style={{ color: cat.color }}
                  >
                    {cat.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Órdenes Recientes */}
        <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border border-transparent hover:border-[#E57C5D]/30 transition-all">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#4B2E2D] mb-4 lg:mb-6">
            Órdenes Recientes
          </h2>

          {/* Mobile: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {ordenesRecientes.map((order: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between bg-[#FCE4D6]/30 rounded-xl px-4 py-3 border border-[#FCE4D6]"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#4B2E2D] text-sm">{order.id}</span>
                    <span className="text-[#4B2E2D]/60 text-xs">·</span>
                    <span className="font-medium text-[#4B2E2D] text-sm">{order.mesa}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#4B2E2D]/55">{order.hora}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        order.estado === 'Completada'
                          ? 'bg-green-100 text-green-700'
                          : order.estado === 'En preparación'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <span className="font-black text-[#D0543A] text-sm shrink-0 ml-3">
                  Bs. {order.total}
                </span>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b-2 border-[#FCE4D6]">
                  <th className="text-left py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                    ID
                  </th>
                  <th className="text-left py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                    Mesa
                  </th>
                  <th className="text-left py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                    Hora
                  </th>
                  <th className="text-left py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                    Estado
                  </th>
                  <th className="text-right py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordenesRecientes.map((order: any, index: number) => (
                  <tr
                    key={index}
                    className="border-b border-[#FCE4D6] hover:bg-[#FCE4D6]/30 transition-colors"
                  >
                    <td className="py-3 lg:py-4 px-3 lg:px-4 font-bold text-[#4B2E2D] text-sm lg:text-base">
                      {order.id}
                    </td>
                    <td className="py-3 lg:py-4 px-3 lg:px-4 font-medium text-[#4B2E2D] text-sm lg:text-base">
                      {order.mesa}
                    </td>
                    <td className="py-3 lg:py-4 px-3 lg:px-4 font-medium text-[#4B2E2D]/70 text-sm lg:text-base">
                      {order.hora}
                    </td>
                    <td className="py-3 lg:py-4 px-3 lg:px-4">
                      <span
                        className={`px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full text-xs lg:text-sm font-bold ${
                          order.estado === 'Completada'
                            ? 'bg-green-100 text-green-700'
                          : order.estado === 'En preparación'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.estado}
                      </span>
                    </td>
                    <td className="py-3 lg:py-4 px-3 lg:px-4 text-right font-black text-[#D0543A] text-sm lg:text-base">
                      Bs. {order.total?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
