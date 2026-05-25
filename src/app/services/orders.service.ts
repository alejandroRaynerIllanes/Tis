//src/app/services/orders.service.ts
import { api } from './api';

export interface OrderItemPayload {
  plato: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
}

export interface CreateOrderPayload {
  mesa?: string;
  usuario: string;
  detalles: OrderItemPayload[];
  total: number;
}

export interface BackendOrder {
  _id: string;
  id?: string;
  codigo: string;
  estado: string;
  total: number;
  mesa?: any; // Dejamos any momentáneamente para no romper los componentes que asumen string o objeto
  usuario?: any;
  detalles: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const ordersService = {
  create: async (payload: CreateOrderPayload): Promise<BackendOrder> => {
    return api.post<BackendOrder>('/pedidos', payload);
  },
  getAll: async (): Promise<BackendOrder[]> => {
    return api.get<BackendOrder[]>('/pedidos');
  },
  updateStatus: async (id: string, status: string): Promise<{ mensaje: string, pedido: BackendOrder }> => {
    return api.patch<{ mensaje: string, pedido: BackendOrder }>(`/pedidos/${id}/estado`, { estado: status });
  }
};