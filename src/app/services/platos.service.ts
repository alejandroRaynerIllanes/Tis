// src/app/services/platos.service.ts
import { api } from './api'

export interface BackendPlato {
  _id: string
  id?: string
  nombre: string
  descripcion: string
  precio: number
  imagenUrl: string
  imagenPublicId?: string
  disponible: boolean
  categoria: any // Puede ser string (ID) o el objeto poblado { _id, nombre }
  createdAt?: string
  updatedAt?: string
}

export interface PlatoPayload {
  nombre?: string
  descripcion?: string
  precio?: number
  imagenUrl?: string
  imagenPublicId?: string
  categoria?: string
  disponible?: boolean
}

export const platosService = {
  // GET /api/platos
  async getAll(categoryId?: string): Promise<BackendPlato[]> {
    return api.get<BackendPlato[]>(`/platos${categoryId ? `?category=${categoryId}` : ''}`)
  },

  // POST /api/platos
  async create(payload: PlatoPayload): Promise<BackendPlato> {
    return api.post<BackendPlato>('/platos', payload)
  },

  // PUT /api/platos/:id
  async update(id: string, payload: PlatoPayload): Promise<BackendPlato> {
    return api.put<BackendPlato>(`/platos/${id}`, payload)
  },

  // DELETE /api/platos/:id
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/platos/${id}`)
  },

  // PATCH /api/platos/:id/disponibilidad
  async toggleStatus(id: string): Promise<{ mensaje: string; disponible: boolean }> {
    return api.patch<{ mensaje: string; disponible: boolean }>(`/platos/${id}/disponibilidad`)
  }
}
