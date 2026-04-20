// ─── Servicio de Autenticación ───────────────────────────────────────────────

import { api, setToken, setStoredUser, clearToken, clearStoredUser, type AuthUser } from './api'

// 1. CORRECCIÓN AQUÍ: Cambiamos 'usuario' por 'email' y 'contraseña' por 'password'
interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  usuario: AuthUser
}

// Mapeo de rol del backend al rol interno del frontend
const ROLE_MAP: Record<string, string> = {
  administrador: 'admin',
  admin: 'admin',
  mesero: 'waiter',
  cocinero: 'chef',
  cajero: 'cashier'
}

function mapRole(backendRole: string): string {
  return ROLE_MAP[backendRole.toLowerCase()] || backendRole.toLowerCase()
}

export const authService = {
  // POST /auth/login
  async login(usuario: string, contraseña: string): Promise<{ user: AuthUser; role: string }> {
    // 2. CORRECCIÓN AQUÍ: Asignamos las variables a los nombres que el backend espera
    const data = await api.post<LoginResponse>(
      '/auth/login',
      {
        email: usuario,
        password: contraseña
      } as LoginRequest,
      { skipAuth: true }
    )

    // Guardar token y datos del usuario
    setToken(data.token)
    setStoredUser(data.usuario)

    const role = mapRole(data.usuario.rol)
    localStorage.setItem('userRole', role)

    return { user: data.usuario, role }
  },

  // Cerrar sesión (solo frontend)
  logout(): void {
    clearToken()
    clearStoredUser()
    localStorage.removeItem('userRole')
  }
}
