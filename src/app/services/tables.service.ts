//src/app/services/tables.service.ts
import { api } from './api'

export interface TablePayload {
  name?: string
  capacity?: number
  location?: string
  status?: string
  type?: string
}

export const tablesService = {
  // Mantiene soporte de filtro (tu aporte)
  getAll: (location?: string) =>
    api.get<any[]>(`/mesas${location ? `?location=${encodeURIComponent(location)}` : ''}`),

  getById: (id: string) => api.get<any>(`/mesas/${id}`),

  // Usa los campos de payload de Gustavo para no romper el AppContext
  create: (payload: TablePayload) => api.post<any>(`/mesas`, payload),

  update: (id: string, payload: TablePayload) => api.put<any>(`/mesas/${id}`, payload),

  // 🔥 Mantener esto (muy importante)
  updateState: (id: string, estado: string) => api.patch<any>(`/mesas/${id}/estado`, { estado }),

  remove: (id: string) => api.delete<any>(`/mesas/${id}`)
}
