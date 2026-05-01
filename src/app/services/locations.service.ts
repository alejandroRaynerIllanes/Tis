import { api } from './api'

export interface BackendLocation {
  _id?: string
  id?: string
  nombre?: string
  name?: string
}

export const locationsService = {
  // Retorna datos adaptados para la interfaz visual
  getAll: async () => {
    const data = await api.get<any[]>('/ubicaciones')
    return data.map((d: any) => ({
      ...d,
      id: d.id || d._id,
      name: d.nombre || d.name
    }))
  },

  create: async (name: string) => {
    const created = await api.post<any>('/ubicaciones', { nombre: name })
    return {
      ...created,
      id: created.id || created._id,
      name: created.nombre || created.name
    }
  },

  update: (id: string, nombre: string) => api.put<any>(`/ubicaciones/${id}`, { nombre }),

  remove: (id: string) => api.delete<{ mensaje: string }>(`/ubicaciones/${id}`)
}
