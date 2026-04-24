import { api } from './api';

export interface BackendLocation {
  _id: string;
  nombre: string;
}

export const locationsService = {
  getAll: () => api.get<BackendLocation[]>('/api/ubicaciones'),
  
  create: (nombre: string) => api.post<BackendLocation>('/api/ubicaciones', { nombre }),
  
  update: (id: string, nombre: string) => api.put<BackendLocation>(`/api/ubicaciones/${id}`, { nombre }),
  
  remove: (id: string) => api.delete<{ mensaje: string }>(`/api/ubicaciones/${id}`)
};