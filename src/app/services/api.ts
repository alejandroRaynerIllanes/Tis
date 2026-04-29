// ─── Configuración base de la API ────────────────────────────────────────────
// Cambia esta URL a la de tu backend real
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  skipAuth?: boolean
}

// Almacenamiento del token JWT
export function getToken(): string | null {
  return localStorage.getItem('authToken')
}

export function setToken(token: string): void {
  localStorage.setItem('authToken', token)
}

export function clearToken(): void {
  localStorage.removeItem('authToken')
}

// Datos del usuario autenticado
export interface AuthUser {
  id: number
  nombre: string
  apellido: string
  ci: string
  email: string
  rol: string
  estado: boolean
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('authUser')
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem('authUser', JSON.stringify(user))
}

export function clearStoredUser(): void {
  localStorage.removeItem('authUser')
}

// Cliente HTTP genérico con interceptor JWT
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>)
  }

  // Agregar Content-Type solo si el body no es FormData
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Agregar token JWT si existe y no se omite
  if (!skipAuth) {
    const token = getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const config: RequestInit = {
    ...rest,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  // Si el token expiró, limpiar sesión
  if (response.status === 401) {
    clearToken()
    clearStoredUser()
    localStorage.removeItem('userRole')
    window.location.href = '/'
    throw new Error('Sesión expirada. Inicia sesión nuevamente.')
  }

  // Para respuestas sin contenido (204)
  if (response.status === 204) {
    return {} as T
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.mensaje || data.message || data.error || `Error ${response.status}`)
  }

  return data as T
}

// Métodos HTTP exportados
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE', body })
}
