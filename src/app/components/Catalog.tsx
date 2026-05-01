import { useNavigate } from 'react-router'
import { useState, useEffect } from 'react'
import { categoriesService } from '../services/categories.service'
import { locationsService } from '../services/locations.service'
import { INITIAL_CATEGORIES, INITIAL_LOCATIONS } from '../data/constants'
import type { AdminView } from './layout/Sidebar'
import { Sidebar } from './layout/Sidebar'

// 🔥 Importaciones Modulares
import { Dashboard } from './admin/Dashboard'
import { MenuManagement } from './admin/MenuManagement'
import { CategoryManagement } from './admin/CategoryManagement'
import { TableManagement } from './admin/TableManagement'
import { UserManagement } from './admin/UserManagement'
import { ReportsSection } from './admin/ReportsSection'
import { VIPClients } from './VIPClients'

export function Catalog() {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<AdminView | 'categories' | 'locations'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Estado compartido
  const [categories, setCategories] = useState(INITIAL_CATEGORIES)
  const [locations, setLocations] = useState(INITIAL_LOCATIONS)

  // 🔧 Cargar categorías y ubicaciones desde backend
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const dataCat = await categoriesService.getAll()
        setCategories(dataCat.map((c: any) => ({ id: c._id || c.id, label: c.nombre || c.name })))
      } catch (error) {
        console.error('Error al cargar categorías de MongoDB:', error)
      }

      try {
        const dataLoc = await locationsService.getAll()
        if (dataLoc && dataLoc.length > 0) {
          setLocations(dataLoc.map((d: any) => ({ id: d.id, name: d.name })))
        }
      } catch (error) {
        console.warn('No se pudieron cargar ubicaciones de MongoDB, usando locales:', error)
      }
    }

    cargarDatos()
  }, [])

  // 🔧 Validación de rol
  useEffect(() => {
    const role = localStorage.getItem('userRole')
    if (role !== 'admin' && role !== 'administrador') {
      navigate('/waiter-view')
    }
  }, [navigate])

  return (
    <div className="flex h-screen w-full bg-[#FCE4D6] font-sans overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeView={activeView as AdminView}
        sidebarOpen={sidebarOpen}
        onViewChange={(view) => setActiveView(view)}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => {
          localStorage.clear()
          navigate('/', { replace: true })
        }}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto relative min-w-0">
        {activeView === 'dashboard' ? (
          <Dashboard onOpenSidebar={() => setSidebarOpen(true)} />
        ) : activeView === 'menu' ? (
          <MenuManagement categories={categories} setCategories={setCategories} />
        ) : activeView === 'categories' ? (
          <CategoryManagement categories={categories} setCategories={setCategories} />
        ) : activeView === 'tables' ? (
          <TableManagement locations={locations} setLocations={setLocations} />
        ) : activeView === 'users' ? (
          <UserManagement />
        ) : activeView === 'reports' ? (
          <ReportsSection />
        ) : activeView === 'vip-clients' ? (
          <VIPClients />
        ) : null}
      </main>
    </div>
  )
}
