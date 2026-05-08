import {
  LayoutDashboard,
  UtensilsCrossed,
  ChefHat,
  Users,
  BarChart2,
  Crown,
  LogOut,
  X,
  UserCheck
} from 'lucide-react'

export type AdminView = 'dashboard' | 'tables' | 'menu' | 'users' | 'reports' | 'vip-clients' | 'waiters'

interface SidebarProps {
  activeView: AdminView
  sidebarOpen: boolean
  onViewChange: (view: AdminView) => void
  onClose: () => void
  onLogout: () => void
}

const NAV_ITEMS: { view: AdminView; icon: React.ReactNode; label: string }[] = [
  { view: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { view: 'tables', icon: <UtensilsCrossed size={20} />, label: 'Mesas' },
  { view: 'menu', icon: <ChefHat size={20} />, label: 'Menú' },
  { view: 'users', icon: <Users size={20} />, label: 'Usuarios' },
  { view: 'waiters', icon: <UserCheck size={20} />, label: 'Meseros Activos' },
  { view: 'reports', icon: <BarChart2 size={20} />, label: 'Reportes' },
  { view: 'vip-clients', icon: <Crown size={20} />, label: 'Clientes VIP' }
]

export function Sidebar({
  activeView,
  sidebarOpen,
  onViewChange,
  onClose,
  onLogout
}: SidebarProps) {
  return (
    <aside
      className={`
      fixed lg:relative inset-y-0 left-0 z-30
      w-72 bg-[#4B2E2D] text-white flex flex-col h-full shadow-2xl
      transition-transform duration-300 ease-in-out
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
    >
      {/* Logo + cerrar en mobile */}
      <div className="p-6 lg:p-8 pb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-wide">Sabor & Gestión</h2>
          <div className="h-1 w-12 bg-[#E57C5D] mt-3 lg:mt-4 rounded-full"></div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors mt-0.5"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 mt-4 lg:mt-6 px-4 space-y-1.5 lg:space-y-2">
        {NAV_ITEMS.map(({ view, icon, label }) => (
          <button
            key={view}
            onClick={() => {
              onViewChange(view)
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === view
                ? 'bg-[#E57C5D] text-white shadow-lg shadow-[#E57C5D]/20'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {icon}
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 space-y-2">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
