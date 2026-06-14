import { createBrowserRouter, Outlet } from 'react-router'
import { lazy, Suspense } from 'react'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppProvider } from './context/AppContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { Toaster } from 'sonner'

const Login = lazy(() => import('./components/Login').then((m) => ({ default: m.Login })))
const PublicMenu = lazy(() => import('./components/PublicMenu').then((m) => ({ default: m.PublicMenu })))
const Catalog = lazy(() => import('./components/Catalog').then((m) => ({ default: m.Catalog })))
const WaiterView = lazy(() =>
  import('./components/WaiterView').then((m) => ({ default: m.WaiterView }))
)
const NotFound = lazy(() => import('./components/NotFound').then((m) => ({ default: m.NotFound })))
const UserManagement = lazy(() =>
  import('./components/admin/UserManagement').then((m) => ({ default: m.UserManagement }))
)
const ChefView = lazy(() => import('./components/ChefView').then((m) => ({ default: m.ChefView })))
const CashierView = lazy(() =>
  import('./components/CashierView').then((m) => ({ default: m.CashierView }))
)
const UnderConstruction = lazy(() =>
  import('./components/UnderConstruction').then((m) => ({ default: m.UnderConstruction }))
)
const PaymentSimulator = lazy(() =>
  import('./components/PaymentSimulator').then((m) => ({ default: m.PaymentSimulator }))
)
const ClientProfile = lazy(() =>
  import('./components/ClientProfile').then((m) => ({ default: m.ClientProfile }))
)
const DeliveryView = lazy(() =>
  import('./components/DeliveryView').then((m) => ({ default: m.DeliveryView }))
)

function RootLayout() {
  return (
    <NotificationsProvider>
      <AppProvider>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">
              Cargando módulo...
            </div>
          }
        >
          <Outlet />
        </Suspense>
        <Toaster position="bottom-right" richColors />
      </AppProvider>
    </NotificationsProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: (
      <NotificationsProvider>
        <AppProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500 font-medium">
                Cargando módulo...
              </div>
            }
          >
            <NotFound />
          </Suspense>
          <Toaster position="bottom-right" richColors />
        </AppProvider>
      </NotificationsProvider>
    ),
    children: [
      {
        index: true,
        element: <PublicMenu />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        // RUTA PÚBLICA AÑADIDA AQUÍ
        path: 'pay-simulator',
        element: <PaymentSimulator />
      },
      {
        path: 'catalog',
        element: (
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        )
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <ClientProfile />
          </ProtectedRoute>
        )
      },
      {
        path: 'waiter-view',
        element: (
          <ProtectedRoute>
            <WaiterView />
          </ProtectedRoute>
        )
      },
      {
        path: 'chef-view',
        element: (
          <ProtectedRoute>
            <ChefView />
          </ProtectedRoute>
        )
      },
      {
        path: 'cashier-view',
        element: (
          <ProtectedRoute>
            <CashierView />
          </ProtectedRoute>
        )
      },
      {
        path: 'user-management',
        element: (
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        )
      },
      {
        path: 'delivery',
        element: (
          <ProtectedRoute>
            <DeliveryView />
          </ProtectedRoute>
        )
      },
      {
        path: 'en-construccion',
        element: <UnderConstruction />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])
