import { api } from './api'
import { BackendLocation } from './locations.service'

export interface BackendTable {
  _id: string
  numero: string
  capacidad: number
  ubicacion: BackendLocation | string
  tipo: 'normal' | 'vip'
  estado: 'Disponible' | 'Ocupada' | 'Reservada'
}

export const tablesService = {
  // Mantiene soporte de filtro (tu aporte)
  getAll: (location?: string) =>
    api.get<BackendTable[]>(`/mesas${location ? `?location=${encodeURIComponent(location)}` : ''}`),

  getById: (id: string) => api.get<BackendTable>(`/mesas/${id}`),

  // Usa tipado correcto (Cristhian)
  create: (data: Partial<BackendTable>) => api.post<BackendTable>(`/mesas`, data),

  update: (id: string, data: Partial<BackendTable>) => api.put<BackendTable>(`/mesas/${id}`, data),

  // 🔥 Mantener esto (muy importante)
  updateState: (id: string, estado: BackendTable['estado']) =>
    api.patch<BackendTable>(`/mesas/${id}/estado`, { estado }),

  remove: (id: string) => api.delete<{ mensaje: string }>(`/mesas/${id}`)
}
