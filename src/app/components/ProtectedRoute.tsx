import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  allowedRoles?: string[]
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  allowedRoles
}: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    const token = localStorage.getItem('authToken')

    // Sin sesión válida → no autorizado
    if (!userRole || !token) {
      setIsAuthorized(false)
      setIsChecking(false)
      return
    }

    const normalizedRole = userRole.toLowerCase()
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador'

    // Si requiere admin y el usuario no es admin → no autorizado
    if (requireAdmin && !isAdmin) {
      setIsAuthorized(false)
      setIsChecking(false)
      return
    }

    // Si se especifican roles permitidos y el rol del usuario no coincide → no autorizado
    if (allowedRoles && allowedRoles.length > 0) {
      const isRoleAllowed = allowedRoles.some(
        (r) => r.toLowerCase() === normalizedRole
      )
      if (!isRoleAllowed) {
        setIsAuthorized(false)
        setIsChecking(false)
        return
      }
    }

    setIsAuthorized(true)
    setIsChecking(false)
  }, [requireAdmin, allowedRoles])

  if (isChecking) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#4B2E2D]">
        <div className="text-white text-xl">Verificando...</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
