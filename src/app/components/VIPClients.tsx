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
import { useState } from 'react'
import { toast } from 'sonner'
import { VIPManagement } from './VIPManagement'

// ─── Mock data ───────────────────────────────────────────────────────────────

const VIP_CLIENTS_LIST = [
  {
    id: 1,
    name: 'Alex Martínez',
    email: 'alex@email.com',
    plan: 'VIP Anual',
    since: '2024-01-15',
    orders: 47,
    totalSpent: 'Bs. 3,420',
    status: 'Activo'
  },
  {
    id: 2,
    name: 'Axel Rodríguez',
    email: 'axel@email.com',
    plan: 'VIP Mensual',
    since: '2024-08-03',
    orders: 19,
    totalSpent: 'Bs. 1,180',
    status: 'Activo'
  },
  {
    id: 3,
    name: 'Pedro Gómez',
    email: 'pedro@email.com',
    plan: 'VIP Anual',
    since: '2023-11-20',
    orders: 63,
    totalSpent: 'Bs. 5,105',
    status: 'Activo'
  }
]

const PLANS = [
  {
    id: 'standard',
    name: 'Estándar',
    price: 'Gratis',
    period: '',
    highlight: false,
    icon: <Users size={28} className="text-[#4B2E2D]/60" />,
    color: 'bg-white border-[#E0D0C5]',
    headerBg: 'bg-[#F5E6D3]',
    features: [
      { label: 'Acceso a zonas comunes', included: true },
      { label: 'Menú completo', included: true },
      { label: 'Reservas de mesas estándar', included: true },
      { label: 'Zona VIP exclusiva', included: false },
      { label: 'Prioridad en cocina', included: false },
      { label: 'Atención preferencial', included: false }
    ],
    cta: 'Plan actual',
    ctaStyle: 'bg-[#F5E6D3] text-[#4B2E2D] border border-[#D0B8A8] cursor-default'
  },
  {
    id: 'vip-monthly',
    name: 'VIP Premium',
    price: 'Bs. 149',
    period: '/ mes',
    highlight: true,
    icon: <Crown size={28} className="text-yellow-400 drop-shadow" />,
    color: 'bg-[#4B2E2D] border-[#4B2E2D]',
    headerBg: 'bg-gradient-to-br from-[#6B3E2E] to-[#4B2E2D]',
    features: [
      { label: 'Acceso a zonas comunes', included: true },
      { label: 'Menú completo', included: true },
      { label: 'Reservas de mesas estándar', included: true },
      { label: 'Zona VIP exclusiva', included: true },
      { label: 'Prioridad en cocina', included: true },
      { label: 'Atención preferencial', included: true }
    ],
    cta: 'Suscribirse mensual',
    ctaStyle:
      'bg-[#D96C4A] hover:bg-[#C25838] text-white shadow-lg shadow-[#D96C4A]/30 transition-all'
  },
  {
    id: 'vip-annual',
    name: 'VIP Anual',
    price: 'Bs. 1,290',
    period: '/ año',
    badge: '¡Ahorra 30%!',
    highlight: false,
    icon: <Sparkles size={28} className="text-amber-500" />,
    color: 'bg-white border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-50 to-[#FFF5E8]',
    features: [
      { label: 'Acceso a zonas comunes', included: true },
      { label: 'Menú completo', included: true },
      { label: 'Reservas de mesas estándar', included: true },
      { label: 'Zona VIP exclusiva', included: true },
      { label: 'Prioridad en cocina', included: true },
      { label: 'Atención preferencial', included: true }
    ],
    cta: 'Suscribirse anual',
    ctaStyle:
      'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-400/30 transition-all'
  }
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function PriorityIndicator() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
      <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-yellow-300" />
        </div>
        <div>
          <h3 className="font-black text-white text-base">Sistema de Prioridad VIP en Cocina</h3>
          <p className="text-white/65 text-xs font-medium mt-0.5">
            Inspirado en el modelo de atención preferencial bancaria
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Visual queue representation */}
        <div>
          <p className="text-xs font-bold text-[#4B2E2D]/50 uppercase tracking-wider mb-3">
            Simulación de cola en cocina
          </p>
          <div className="space-y-2">
            {/* VIP orders at top */}
            {[
              { label: 'Mesa VIP 1 — Lomo Saltado ×2', isVip: true, time: '2 min' },
              { label: 'Mesa VIP 2 — Ceviche Clásico ×1', isVip: true, time: '3 min' },
              { label: 'Mesa 3 — Pasta al Pesto ×1', isVip: false, time: '5 min' },
              { label: 'Mesa 1 — Arroz con Pollo ×2', isVip: false, time: '7 min' }
            ].map((order, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all ${
                  order.isVip
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs ${
                    order.isVip ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-bold truncate block ${order.isVip ? 'text-[#4B2E2D]' : 'text-gray-500'}`}
                  >
                    {order.label}
                  </span>
                </div>
                {order.isVip && (
                  <span className="flex items-center gap-1 bg-yellow-400/20 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border border-yellow-300/50">
                    <Crown size={9} strokeWidth={2.5} /> VIP
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold shrink-0 ${order.isVip ? 'text-amber-600' : 'text-gray-400'}`}
                >
                  ~{order.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority rules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#FCE4D6]">
          <div className="flex items-start gap-3 bg-amber-50/60 rounded-xl p-3 border border-amber-100">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <ArrowUp size={14} className="text-amber-600" strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-black text-[#4B2E2D]">Pedidos VIP: Primero</p>
              <p className="text-[11px] text-[#4B2E2D]/60 font-medium mt-0.5 leading-snug">
                Los platos de clientes VIP siempre encabezan la cola de preparación.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#FCE4D6]/60 rounded-xl p-3 border border-[#E0D0C5]">
            <div className="w-8 h-8 rounded-lg bg-[#D96C4A]/15 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={14} className="text-[#D96C4A]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs font-black text-[#4B2E2D]">Tiempo reducido</p>
              <p className="text-[11px] text-[#4B2E2D]/60 font-medium mt-0.5 leading-snug">
                Entrega estimada 40% más rápida que clientes estándar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function VIPClients() {
  const [activeTab, setActiveTab] = useState<
    'subscription' | 'clients' | 'priority' | 'management'
  >('subscription')

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
              <span className="text-sm font-black text-[#4B2E2D]">{VIP_CLIENTS_LIST.length}</span>
              <span className="text-xs font-medium text-[#4B2E2D]/55">VIPs activos</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#E0D0C5]">
              <Zap size={14} className="text-[#D96C4A]" />
              <span className="text-sm font-black text-[#4B2E2D]">2</span>
              <span className="text-xs font-medium text-[#4B2E2D]/55">Mesas VIP</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 bg-white/60 rounded-xl p-1 shadow-inner border border-[#E0D0C5]/80 w-fit">
          {(
            [
              { key: 'subscription', label: 'Suscripción', icon: <Star size={14} /> },
              { key: 'clients', label: 'Clientes VIP', icon: <Crown size={14} /> },
              { key: 'priority', label: 'Prioridad', icon: <Zap size={14} /> },
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
        {/* ══════════════ TAB: SUBSCRIPTION ══════════════ */}
        {activeTab === 'subscription' && (
          <>
            {/* Benefits hero */}
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <div
                className="relative p-6 sm:p-8 lg:p-10 bg-cover bg-center"
                style={{
                  backgroundImage:
                    'url(https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aXAlMjByZXN0YXVyYW50JTIwbG91bmdlfGVufDF8fHx8MTc3NTQwNTg2OXww&ixlib=rb-4.1.0&q=80&w=1080)'
                }}
              >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2C1A0E]/90 via-[#4B2E2D]/80 to-[#2C1A0E]/75" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown size={20} className="text-yellow-300" />
                    <span className="text-yellow-300 font-black text-sm uppercase tracking-widest">
                      Membresía VIP
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                    Vive la experiencia
                    <br />
                    <span className="text-yellow-300">exclusiva</span>
                  </h2>
                  <p className="text-white/75 font-medium text-sm sm:text-base max-w-xl leading-relaxed">
                    Accede a la Zona VIP, disfruta prioridad en cocina y recibe atención
                    preferencial en cada visita a Sabor & Gestión.
                  </p>

                  <div className="flex flex-wrap gap-3 mt-5">
                    {[
                      { icon: <MapPin size={14} />, label: 'Zona VIP exclusiva' },
                      { icon: <Zap size={14} />, label: 'Prioridad en cocina' },
                      { icon: <Star size={14} />, label: 'Atención preferencial' }
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/20"
                      >
                        <span className="text-yellow-300">{b.icon}</span>
                        <span className="text-white text-xs font-bold">{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing cards */}
            <div>
              <h2 className="text-xl font-black text-[#4B2E2D] mb-4">Planes de membresía</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border-2 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 relative ${plan.color} ${plan.highlight ? 'scale-[1.02] ring-2 ring-[#D96C4A]/40' : ''}`}
                  >
                    {plan.badge && (
                      <div className="absolute top-3 right-3 bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm z-10">
                        {plan.badge}
                      </div>
                    )}
                    {plan.highlight && (
                      <div className="absolute top-3 right-3 bg-[#D96C4A] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm z-10">
                        Popular
                      </div>
                    )}

                    {/* Card header */}
                    <div className={`p-5 pb-4 ${plan.headerBg}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-white/10' : 'bg-white/60'}`}
                        >
                          {plan.icon}
                        </div>
                        <span
                          className={`font-black text-lg ${plan.highlight ? 'text-white' : 'text-[#4B2E2D]'}`}
                        >
                          {plan.name}
                        </span>
                      </div>
                      <div
                        className={`flex items-baseline gap-1 ${plan.highlight ? 'text-white' : 'text-[#4B2E2D]'}`}
                      >
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span
                          className={`text-sm font-bold ${plan.highlight ? 'text-white/65' : 'text-[#4B2E2D]/50'}`}
                        >
                          {plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="p-5 pt-4 space-y-2.5">
                      {plan.features.map((f) => (
                        <div key={f.label} className="flex items-center gap-2.5">
                          {f.included ? (
                            <CheckCircle2
                              size={15}
                              strokeWidth={2.5}
                              className={plan.highlight ? 'text-[#D96C4A]' : 'text-emerald-500'}
                            />
                          ) : (
                            <div className="w-[15px] h-[15px] rounded-full border-2 border-gray-200 shrink-0" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              f.included
                                ? plan.highlight
                                  ? 'text-white/90'
                                  : 'text-[#4B2E2D]'
                                : 'text-gray-400 line-through'
                            }`}
                          >
                            {f.label}
                          </span>
                        </div>
                      ))}

                      <button
                        onClick={() => plan.id !== 'standard' && handleSubscribe(plan.name)}
                        className={`w-full mt-4 py-3 rounded-xl font-black text-sm ${plan.ctaStyle}`}
                        disabled={plan.id === 'standard'}
                      >
                        {plan.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits detail */}
            <div>
              <h2 className="text-xl font-black text-[#4B2E2D] mb-4">Beneficios exclusivos VIP</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: <MapPin size={22} className="text-[#D96C4A]" />,
                    bg: 'bg-[#D96C4A]/10',
                    title: 'Zona VIP Exclusiva',
                    desc: 'Acceso prioritario a las mesas VIP 1 y VIP 2 ubicadas en la zona reservada del restaurante, con mayor privacidad y confort.'
                  },
                  {
                    icon: <Zap size={22} className="text-amber-500" />,
                    bg: 'bg-amber-400/10',
                    title: 'Prioridad en Cocina',
                    desc: 'Los pedidos de clientes VIP encabezan la cola de preparación, garantizando tiempos de entrega hasta 40% más rápidos.'
                  },
                  {
                    icon: <Shield size={22} className="text-blue-500" />,
                    bg: 'bg-blue-400/10',
                    title: 'Atención Preferencial',
                    desc: 'Servicio personalizado con meseros dedicados y acceso a un menú de maridaje especial solo para miembros VIP.'
                  },
                  {
                    icon: <ChefHat size={22} className="text-[#4B2E2D]" />,
                    bg: 'bg-[#4B2E2D]/10',
                    title: 'Menú Degustación',
                    desc: 'Acceso anticipado a nuevos platos y eventos gastronómicos exclusivos organizados por nuestro chef.'
                  },
                  {
                    icon: <BadgeCheck size={22} className="text-emerald-600" />,
                    bg: 'bg-emerald-400/10',
                    title: 'Reservas Garantizadas',
                    desc: 'Reserva con 48h de anticipación en cualquier zona y recibe confirmación inmediata sin lista de espera.'
                  },
                  {
                    icon: <Crown size={22} className="text-yellow-500" />,
                    bg: 'bg-yellow-400/10',
                    title: 'Distintivo de Corona',
                    desc: 'Tu perfil y reservas llevan el indicador visual de corona dorada reconocido por todo el personal del restaurante.'
                  }
                ].map((b) => (
                  <div
                    key={b.title}
                    className="bg-white rounded-2xl p-5 shadow-md border border-[#FCE4D6] hover:shadow-lg transition-all hover:border-[#D96C4A]/20"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center mb-3`}
                    >
                      {b.icon}
                    </div>
                    <h3 className="font-black text-[#4B2E2D] text-sm mb-1">{b.title}</h3>
                    <p className="text-xs text-[#4B2E2D]/60 font-medium leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════ TAB: CLIENTS ══════════════ */}
        {activeTab === 'clients' && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                {
                  label: 'Clientes VIP',
                  value: VIP_CLIENTS_LIST.length,
                  icon: <Crown size={16} className="text-amber-500" />,
                  color: 'bg-amber-50 border-amber-200'
                },
                {
                  label: 'Órdenes totales',
                  value: VIP_CLIENTS_LIST.reduce((a, c) => a + c.orders, 0),
                  icon: <ChefHat size={16} className="text-[#D96C4A]" />,
                  color: 'bg-[#FCE4D6] border-[#E0D0C5]'
                },
                {
                  label: 'Plan mensual',
                  value: VIP_CLIENTS_LIST.filter((c) => c.plan === 'VIP Mensual').length,
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
                  {VIP_CLIENTS_LIST.length} registros
                </span>
              </div>
              <div className="divide-y divide-[#FCE4D6]">
                {VIP_CLIENTS_LIST.map((client) => (
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

        {/* ══════════════ TAB: PRIORITY ══════════════ */}
        {activeTab === 'priority' && (
          <div className="space-y-6">
            {/* Explainer */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#4B2E2D]/10 flex items-center justify-center shrink-0">
                  <Shield size={24} className="text-[#4B2E2D]" />
                </div>
                <div>
                  <h3 className="font-black text-[#4B2E2D] text-lg">
                    ¿Cómo funciona la prioridad VIP?
                  </h3>
                  <p className="text-sm text-[#4B2E2D]/65 font-medium mt-1 leading-relaxed">
                    Inspirado en el sistema de atención preferencial de los bancos, donde clientes
                    con necesidades especiales son atendidos primero sin importar el orden de
                    llegada, nuestro sistema de prioridad VIP garantiza que los pedidos de miembros
                    premium siempre sean procesados antes que los pedidos regulares.
                  </p>
                </div>
              </div>
            </div>

            {/* Priority indicator demo */}
            <PriorityIndicator />

            {/* How it works steps */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#FCE4D6] overflow-hidden">
              <div className="bg-gradient-to-r from-[#4B2E2D] to-[#6B3E2E] px-5 py-4">
                <h3 className="font-black text-white">Flujo de pedido VIP</h3>
              </div>
              <div className="p-5 space-y-0">
                {[
                  {
                    step: 1,
                    icon: <Crown size={16} className="text-yellow-400" />,
                    title: 'Mesa VIP identificada',
                    desc: 'El mesero abre una mesa con tipo VIP o reservada por un cliente VIP. El sistema muestra el indicador de corona dorada.',
                    color: 'border-amber-300 bg-amber-50/50'
                  },
                  {
                    step: 2,
                    icon: <ChefHat size={16} className="text-[#D96C4A]" />,
                    title: 'Pedido marcado como prioritario',
                    desc: 'Al confirmar el pedido, se añade la etiqueta "PRIORIDAD VIP" y el pedido sube automáticamente al inicio de la cola de cocina.',
                    color: 'border-[#D96C4A]/30 bg-[#FCE4D6]/30'
                  },
                  {
                    step: 3,
                    icon: <Zap size={16} className="text-emerald-500" />,
                    title: 'Preparación acelerada',
                    desc: 'El cocinero ve el indicador VIP junto al pedido y lo procesa con mayor prioridad, reduciendo el tiempo de espera.',
                    color: 'border-emerald-200 bg-emerald-50/50'
                  },
                  {
                    step: 4,
                    icon: <BadgeCheck size={16} className="text-blue-500" />,
                    title: 'Entrega preferencial',
                    desc: 'El mesero recibe notificación de pedido listo y lo entrega antes que cualquier otro pedido pendiente.',
                    color: 'border-blue-200 bg-blue-50/50'
                  }
                ].map((s, idx, arr) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-xl border-2 ${s.color} flex items-center justify-center shrink-0 font-black text-[#4B2E2D] text-sm shadow-sm`}
                      >
                        {s.step}
                      </div>
                      {idx < arr.length - 1 && <div className="w-px h-6 bg-[#E0D0C5] my-1" />}
                    </div>
                    <div className={`flex-1 rounded-xl border-2 ${s.color} p-3.5 mb-2`}>
                      <div className="flex items-center gap-2 mb-1">
                        {s.icon}
                        <span className="font-black text-[#4B2E2D] text-sm">{s.title}</span>
                      </div>
                      <p className="text-xs font-medium text-[#4B2E2D]/60 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
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
