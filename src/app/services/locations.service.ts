import { api } from './api'

export interface LocationBackend {
  id?: string
  _id?: string
  nombre?: string
  name?: string
}

export const locationsService = {
  getAll: async (): Promise<{ id: string; name: string }[]> => {
    const data = await api.get<any[]>('/ubicaciones')
    return data.map((d: any) => ({ id: d.id || d._id || d._id, name: d.nombre || d.name }))
  },
  create: async (name: string): Promise<{ id: string; name: string }> => {
    const created = await api.post<any>('/ubicaciones', { nombre: name })
    return { id: created.id || created._id || created.id, name: created.nombre || created.name }
  }
}
