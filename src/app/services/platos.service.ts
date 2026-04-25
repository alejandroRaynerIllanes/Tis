// src/app/services/platos.service.ts
import { api } from './api'

export const platosService = {
  // GET /api/platos
  async getAll(): Promise<any[]> {
    return api.get<any[]>('/platos')
  },

  // POST /api/platos
  async create(payload: any): Promise<any> {
    return api.post<any>('/platos', payload)
  },

  // PUT /api/platos/:id
  async update(id: string, payload: any): Promise<any> {
    return api.put<any>(`/platos/${id}`, payload)
  },

  // DELETE /api/platos/:id
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/platos/${id}`)
  }
}
