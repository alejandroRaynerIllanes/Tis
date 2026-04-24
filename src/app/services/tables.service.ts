import { api } from './api'

export interface TablePayload {
  name?: string
  capacity?: number
  location?: string
  status?: string
  type?: string
}

export const tablesService = {
  getAll: (location?: string) => api.get<any[]>(`/mesas${location ? `?location=${encodeURIComponent(location)}` : ''}`),
  getById: (id: string) => api.get<any>(`/mesas/${id}`),
  create: (payload: TablePayload) => api.post<any>(`/mesas`, payload),
  update: (id: string, payload: TablePayload) => api.put<any>(`/mesas/${id}`, payload),
  updateState: (id: string, status: string) => api.patch<any>(`/mesas/${id}/estado`, { estado: status }),
  remove: (id: string) => api.delete<any>(`/mesas/${id}`),
}
