//src/app/services/auth.service.ts
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
  // Login unificado
  async login(
    usuario: string,
    contraseña: string
  ): Promise<{ user: AuthUser; role: string; token: string }> {
    try {
      return await this.loginStaff(usuario, contraseña)
    } catch (error) {
      return await this.loginClient(usuario, contraseña)
    }
  },

  // POST /auth/login para el Personal
  async loginStaff(
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

    setToken(data.token)
    setStoredUser(data.usuario)

    const role = mapRole(data.usuario.rol)
    localStorage.setItem('userRole', role)

    return { user: data.usuario, role, token: data.token }
  },

  // POST /clientes/auth/login para Clientes
  async loginClient(
    usuario: string,
    contraseña: string
  ): Promise<{ user: AuthUser; role: string; token: string }> {
    const data = await api.post<any>(
      '/clientes/auth/login',
      {
        email: usuario,
        password: contraseña
      },
      { skipAuth: true }
    )

    const clientUser = data.cliente || data.usuario
    const userObj = {
      ...clientUser,
      id: clientUser?.id || clientUser?._id,
      rol: clientUser?.rol || 'Cliente'
    } as unknown as AuthUser

    setToken(data.token)
    setStoredUser(userObj)

    const role = mapRole(userObj.rol)
    localStorage.setItem('userRole', role)

    return { user: userObj, role, token: data.token }
  },

  logout(): void {
    // 1. Limpiar funciones nativas
    clearToken()
    clearStoredUser()

    // 2. Limpiar CUALQUIER rastro fantasma de la "Sopa de LocalStorage"
    localStorage.removeItem('userRole')
    localStorage.removeItem('user') // Rastro fantasma 1
    localStorage.removeItem('usuario') // Rastro fantasma 2
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')

    // 3. (Opcional pero seguro) Forzar limpieza total de la sesión actual
    // localStorage.clear();
  }
}
