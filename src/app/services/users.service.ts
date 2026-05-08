// ─── Servicio de Usuarios (CRUD) ─────────────────────────────────────────────
//src/app/services/users.service.ts

import { api } from './api'

// Tipo del usuario como viene del backend
export interface BackendUser {
  _id: string // <-- CORRECCIÓN: _id como string (MongoDB)
  id?: string // <-- Añadido para que React (UserManagement) no marque error al buscar .id
  nombre: string
  apellido: string
  ci: string
  email: string
  rol: string
  estado: boolean
  createdAt?: string
  updatedAt?: string
}

// Payload para crear usuario
export interface CreateUserPayload {
  nombre: string
  apellido: string
  ci: string
  email: string
  password: string // <-- CORRECCIÓN: 'password' en lugar de 'contraseña'
  rol: string
}

// Payload para editar usuario
export interface UpdateUserPayload {
  nombre?: string
  apellido?: string
  ci?: string
  email?: string
  password?: string // <-- CORRECCIÓN: 'password' en lugar de 'contraseña'
  rol?: string
}

export const usersService = {
  // GET /usuarios — Listar todos los usuarios
  async getAll(): Promise<BackendUser[]> {
    return api.get<BackendUser[]>('/usuarios')
  },

  // POST /usuarios — Crear nuevo usuario
  async create(payload: CreateUserPayload): Promise<BackendUser> {
    return api.post<BackendUser>('/usuarios', payload)
  },

  // PUT /usuarios/:id — Editar usuario (usando ID string)
  async update(id: string, payload: UpdateUserPayload): Promise<BackendUser> {
    return api.put<BackendUser>(`/usuarios/${id}`, payload)
  },

  // PATCH /usuarios/:id/estado — Activar/Desactivar usuario
  // <-- CORRECCIÓN: Añadido el parámetro 'nuevoEstado' para enviarlo en el Body
  async toggleStatus(id: string, nuevoEstado: boolean): Promise<BackendUser> {
    return api.patch<BackendUser>(`/usuarios/${id}/estado`, { estado: nuevoEstado })
  },

  // DELETE /usuarios/:id — Eliminar usuario (usando ID string)
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/usuarios/${id}`)
  }
}
