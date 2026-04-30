// ─── Servicio de Autenticación Corregido ─────────────────────────────────────

import { api, setToken, setStoredUser, clearToken, clearStoredUser, type AuthUser } from './api'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  usuario: AuthUser
}

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
  // CAMBIO AQUÍ: Agregamos 'token: string' al Promise de retorno
  async login(
    usuario: string,
    contraseña: string
  ): Promise<{ user: AuthUser; role: string; token: string }> {
    const data = await api.post<LoginResponse>(
      '/auth/login',
      {
        email: usuario,
        password: contraseña
      },
      { skipAuth: true }
    )

    // Guardar en localStorage usando tus funciones de api.ts
    setToken(data.token)
    setStoredUser(data.usuario)

    const role = mapRole(data.usuario.rol)
    localStorage.setItem('userRole', role)

    // CAMBIO AQUÍ: Retornamos también el token para que Login.tsx lo vea
    return { user: data.usuario, role, token: data.token }
  },

  logout(): void {
    clearToken()
    clearStoredUser()
    localStorage.removeItem('userRole')
  }
}
