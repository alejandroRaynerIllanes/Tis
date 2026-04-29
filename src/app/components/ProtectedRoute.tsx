import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    const token = localStorage.getItem('authToken')

    // Sin sesión válida → login
    if (!userRole || !token) {
      navigate('/', { replace: true })
      setIsChecking(false)
      return
    }

    const isAdmin = userRole === 'admin' || userRole === 'administrador'

    // Si requiere admin y el usuario no es admin, redirigir
    if (requireAdmin && !isAdmin) {
      navigate('/waiter-view', { replace: true })
      setIsChecking(false)
      return
    }

    setIsAuthorized(true)
    setIsChecking(false)
  }, [navigate, requireAdmin])

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#4B2E2D]">
        <div className="text-white text-xl">Verificando...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#4B2E2D]">
        <div className="text-white text-xl">Redirigiendo...</div>
      </div>
    )
  }

  return <>{children}</>
}
