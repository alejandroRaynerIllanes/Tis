import api from './api';

export interface CreateReservationPayload {
  tableId: string;
  clientName: string;
  guestCount: number;
  date: string;
  time: string;
  vip: boolean;
}

export interface ReservationResponse {
  id?: string;
  _id?: string;
  clientName: string;
  guestCount: number;
  date: string;
  time: string;
  vip: boolean;
  mesa: any;
  usuario: any;
  createdAt?: string;
}

export const reservationsService = {
  getAll: async (): Promise<ReservationResponse[]> => {
    const response = await api.get('/reservas');
    return response.data;
  },

  create: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    const response = await api.post('/reservas', payload);
    return response.data;
  }
};