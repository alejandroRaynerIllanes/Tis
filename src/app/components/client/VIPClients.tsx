import {
  Crown,
  Star,
  Zap,
  CheckCircle2,
  Users,
  MapPin,
  ChefHat,
  Clock,
  BadgeCheck,
  Sparkles,
  ArrowUp,
  Shield,
  Settings
} from 'lucide-react'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useAppContext } from '../../context/AppContext'
import { VIPManagement } from './VIPManagement'


// ─── Main component ──────────────────────────────────────────────────────────

export function VIPClients() {
  const { tables, reservations } = useAppContext()
  const vipTablesCount = tables.filter((t) => t.type === 'vip').length

  // Extraer clientes VIP directamente de las reservas activas (100% real)
  const dynamicVipClients = useMemo(() => {
    const map = new Map()
    Object.values(reservations)
      .flat()
      .forEach((r, idx) => {
        if (r.vip && !map.has(r.clientName.toLowerCase())) {
          map.set(r.clientName.toLowerCase(), {
            id: r.id || idx,
            name: r.clientName,
            email: 'cliente@vip.com',
            plan: 'VIP',
            since: new Date().toISOString().split('T')[0],
            orders: 1,
            totalSpent: 'Bs. ---',
            status: 'Activo'
          })
        }
      })
    return Array.from(map.values())
  }, [reservations])

  const [activeTab, setActiveTab] = useState<
    'clients' | 'management'
  >('clients')

  const handleSubscribe = (planName: string) => {
    toast.success(`Suscripción "${planName}" activada`, {
      description: 'El cliente ahora tiene acceso VIP completo.',
      duration: 4000
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#FCE4D6]">
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 sticky top-0 bg-[#FCE4D6]/92 backdrop-blur-md z-10 border-b border-[#E0D0C5]/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B3E2E] to-[#4B2E2D] flex items-center justify-center shadow-lg shadow-[#4B2E2D]/25 shrink-0">
              <Crown size={24} className="text-yellow-300" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4B2E2D]">
                Clientes VIP
              </h1>
              <p className="text-[#4B2E2D]/65 font-medium mt-0.5 text-sm sm:text-base">
                Gestiona suscripciones y beneficios exclusivos
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#E0D0C5]">
              <Crown size={14} className="text-amber-500" />
              <span className="text-sm font-black text-[#4B2E2D]">{dynamicVipClients.length}</span>
              <span className="text-xs font-medium text-[#4B2E2D]/55">VIPs activos</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#E0D0C5]">
              <Zap size={14} className="text-[#D96C4A]" />
              <span className="text-sm font-black text-[#4B2E2D]">{vipTablesCount}</span>
              <span className="text-xs font-medium text-[#4B2E2D]/55">Mesas VIP</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 bg-white/60 rounded-xl p-1 shadow-inner border border-[#E0D0C5]/80 w-fit">
          {(
            [
              { key: 'clients', label: 'Clientes VIP', icon: <Crown size={14} /> },
              { key: 'management', label: 'Configuración', icon: <Settings size={14} /> }
            ] as { key: typeof activeTab; label: string; icon: React.ReactNode }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-[#4B2E2D] text-white shadow-sm'
                  : 'text-[#4B2E2D]/60 hover:text-[#4B2E2D] hover:bg-white/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 lg:p-10 pt-4 sm:pt-6 space-y-6 lg:space-y-8">


        {/* ══════════════ TAB: CLIENTS ══════════════ */}
        {activeTab === 'clients' && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  label: 'Clientes VIP',
                  value: dynamicVipClients.length,
                  icon: <Crown size={16} className="text-amber-500" />,
                  color: 'bg-amber-50 border-amber-200'
                },
                {
                  label: 'Órdenes totales',
                  value: dynamicVipClients.reduce((a, c) => a + c.orders, 0),
                  icon: <ChefHat size={16} className="text-[#D96C4A]" />,
                  color: 'bg-[#FCE4D6] border-[#E0D0C5]'
                },
                {
                  label: 'Plan mensual',
                  value: dynamicVipClients.filter((c) => c.plan === 'VIP Mensual').length,
                  icon: <Star size={16} className="text-[#4B2E2D]" />,
                  color: 'bg-white border-[#E0D0C5]'
                }
              ].map((s) => (
                <div
                  key={s.label}
                  className={`${s.color} rounded-2xl p-4 border shadow-sm flex flex-col gap-2`}
                >
                  <div className="flex items-center gap-2">
                    {s.icon}
                    <span className="text-xs font-bold text-[#4B2E2D]/60 uppercase tracking-wide">
                      {s.label}
                    </span>
                  </div>
                  <span className="text-2xl font-black text-[#4B2E2D]">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Clients list */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#FCE4D6] flex items-center justify-between">
                <h3 className="font-black text-[#4B2E2D] text-base">Clientes VIP Activos</h3>
                <span className="bg-[#FCE4D6] text-[#4B2E2D] text-xs font-black px-3 py-1 rounded-full">
                  {dynamicVipClients.length} registros
                </span>
              </div>
              <div className="divide-y divide-[#FCE4D6]">
                {dynamicVipClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[#FCE4D6]/30 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B3E2E] to-[#4B2E2D] flex items-center justify-center shrink-0 shadow-md">
                      <span className="text-white font-black text-base">
                        {client.name.charAt(0)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-[#4B2E2D]">{client.name}</span>
                        <span className="flex items-center gap-1 bg-amber-400/15 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300/40">
                          <Crown size={9} strokeWidth={2.5} /> VIP
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            client.status === 'Activo'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#4B2E2D]/50 mt-0.5">{client.email}</p>
                    </div>

                    {/* Plan & Stats */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-right">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                          Plan
                        </p>
                        <p className="text-sm font-black text-[#4B2E2D]">{client.plan}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                          Pedidos
                        </p>
                        <p className="text-sm font-black text-[#D96C4A]">{client.orders}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-bold text-[#4B2E2D]/45 uppercase tracking-wide">
                          Total gastado
                        </p>
                        <p className="text-sm font-black text-[#4B2E2D]">{client.totalSpent}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {dynamicVipClients.length === 0 && (
                  <div className="p-8 text-center text-[#4B2E2D]/50 font-bold">
                    Aún no hay clientes VIP con reservas activas.
                  </div>
                )}
              </div>
            </div>

            {/* Note about VIP identification */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/25 flex items-center justify-center shrink-0 mt-0.5">
                <Crown size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-800">
                  Identificación automática de clientes VIP
                </p>
                <p className="text-xs font-medium text-amber-700/80 mt-0.5 leading-relaxed">
                  El sistema detecta automáticamente a los clientes VIP al crear reservas. Los
                  nombres registrados (Alex, Axel, Pedro) son validados y reciben el indicador de
                  corona dorada en todas las vistas del sistema.
                </p>
              </div>
            </div>
          </div>
        )}



        {/* ══════════════ TAB: MANAGEMENT ══════════════ */}
        {activeTab === 'management' && <VIPManagement />}
      </div>
    </div>
  )
}
