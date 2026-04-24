import { api } from './api';
import { BackendLocation } from './locations.service';

export interface BackendTable {
  _id: string;
  numero: string;
  capacidad: number;
  // La ubicación puede venir como un ID (string) o como el objeto completo (gracias al populate)
  ubicacion: BackendLocation | string;
  tipo: 'normal' | 'vip';
  estado: 'Disponible' | 'Ocupada' | 'Reservada';
}

export const tablesService = {
  getAll: () => api.get<BackendTable[]>('/api/mesas'),
  
  // Usamos Partial para permitir enviar solo los datos necesarios al crear/actualizar
  create: (data: Partial<BackendTable>) => api.post<BackendTable>('/api/mesas', data),
  
  update: (id: string, data: Partial<BackendTable>) => api.put<BackendTable>(`/api/mesas/${id}`, data),
  
  remove: (id: string) => api.delete<{ mensaje: string }>(`/api/mesas/${id}`)
};