import { api } from './api';

export const ordersService = {
  create: async (payload: any): Promise<any> => {
    // Se comunica con el controlador crearPedido del backend
    return api.post('/pedidos', payload);
  }
};