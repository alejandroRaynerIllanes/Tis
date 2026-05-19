// src/app/routes.tsx
import { createBrowserRouter, Outlet } from 'react-router'
import { Login } from './components/Login'
import { Catalog } from './components/Catalog'
import { WaiterView } from './components/WaiterView'
import { NotFound } from './components/NotFound'
import { UserManagement } from './components/admin/UserManagement'
import { ChefView } from './components/ChefView'
import { CashierView } from './components/CashierView'
import { UnderConstruction } from './components/UnderConstruction'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppProvider } from './context/AppContext'
import { Toaster } from 'sonner'
import { PaymentSimulator } from './components/PaymentSimulator'

function RootLayout() {
  return (
    <AppProvider>
      <Outlet />
      <Toaster position="bottom-right" richColors />
    </AppProvider>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: (
      <AppProvider>
        <NotFound />
        <Toaster position="bottom-right" richColors />
      </AppProvider>
    ),
    children: [
      {
        index: true,
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