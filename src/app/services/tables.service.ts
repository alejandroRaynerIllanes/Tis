//src/app/services/tables.service.ts
import { api } from './api'
import type { TableStatus } from '../types'

export interface TablePayload {
  name?: string
  capacity?: number
  location?: string
  status?: string
  type?: string
}

export interface BackendTable {
  id: string
  _id: string
  name: string
  numero: string
  capacity: number
  location: string
  locationId: string | null
  status: TableStatus
  type: 'vip' | 'normal'
  createdAt?: string
  updatedAt?: string
}

export const tablesService = {
  // Mantiene soporte de filtro (tu aporte)
  getAll: (location?: string) =>
    api.get<BackendTable[]>(`/mesas${location ? `?location=${encodeURIComponent(location)}` : ''}`),

  getById: (id: string) => api.get<BackendTable>(`/mesas/${id}`),

  // Usa los campos de payload de Gustavo para no romper el AppContext
  create: (payload: TablePayload) => api.post<BackendTable>(`/mesas`, payload),

  update: (id: string, payload: TablePayload) => api.put<BackendTable>(`/mesas/${id}`, payload),

  // 🔥 Mantener esto (muy importante)
  updateState: (id: string, estado: string) => api.patch<BackendTable>(`/mesas/${id}/estado`, { estado }),

  remove: (id: string) => api.delete<{ mensaje: string, mesa?: BackendTable }>(`/mesas/${id}`)
}
