//src/app/services/index.ts
// ─── Servicios API ───────────────────────────────────────────────────────────
// Punto de entrada centralizado para todos los servicios

export {
  api,
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser
} from './api'
export type { AuthUser } from './api'
export { authService } from './auth.service'
export { usersService } from './users.service'
export type { BackendUser, CreateUserPayload, UpdateUserPayload } from './users.service'
export { uploadService } from './upload.service'
