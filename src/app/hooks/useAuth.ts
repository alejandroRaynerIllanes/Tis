//src/app/hooks/useAuth.ts
// ─── Hook de autenticación ──────────────────────────────────────────────────

import { useNavigate } from 'react-router'
import { useCallback } from 'react'
import type { UserRole } from '../types'
import { authService } from '../services/auth.service'

export function useAuth() {
  const navigate = useNavigate()

  const getUserRole = (): UserRole | null => {
    return localStorage.getItem('userRole') as UserRole | null
  }

  const isAdmin = (): boolean => {
    return getUserRole() === 'admin'
  }

  const logout = useCallback(() => {
    authService.logout()
    navigate('/', { replace: true })
  }, [navigate])

  const redirectByRole = useCallback(
    (role: string) => {
      const normalizedRole = role.toLowerCase().trim()
      if (normalizedRole === 'admin' || normalizedRole === 'administrador') {
        navigate('/catalog', { replace: true })
      } else if (normalizedRole === 'waiter' || normalizedRole === 'mesero') {
        navigate('/waiter-view', { replace: true })
      } else if (normalizedRole === 'chef' || normalizedRole === 'cocinero') {
        navigate('/chef-view', { replace: true })
      } else if (normalizedRole === 'cashier' || normalizedRole === 'cajero') {
        navigate('/cashier-view', { replace: true })
      } else if (normalizedRole === 'delivery' || normalizedRole === 'repartidor') {
        navigate('/delivery', { replace: true })
      } else if (normalizedRole === 'cliente' || normalizedRole === 'client') {
        navigate('/perfil', { replace: true })
      } else {
        navigate('/en-construccion', { replace: true })
      }
    },
    [navigate]
  )

  return {
    getUserRole,
    isAdmin,
    logout,
    redirectByRole
  }
}
