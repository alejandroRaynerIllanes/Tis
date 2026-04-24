import { api } from './api';

export interface BackendLocation {
  _id: string;
  nombre: string;
}

export const locationsService = {
  getAll: () => api.get<BackendLocation[]>('/ubicaciones'),
  
  create: (nombre: string) => api.post<BackendLocation>('/ubicaciones', { nombre }),
  
  update: (id: string, nombre: string) => api.put<BackendLocation>(`/ubicaciones/${id}`, { nombre }),
  
  remove: (id: string) => api.delete<{ mensaje: string }>(`/ubicaciones/${id}`)
};