//src/app/services/orders.service.ts
import { api } from './api';

export const ordersService = {
  create: async (payload: any): Promise<any> => {
    // Se comunica con el controlador crearPedido del backend
    return api.post('/pedidos', payload);
  },
  getAll: async (): Promise<any> => {
    return api.get('/pedidos');
  },
  updateStatus: async (id: string, status: string): Promise<any> => {
    return api.patch(`/pedidos/${id}/estado`, { estado: status });
  }
};