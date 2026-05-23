//src/app/services/reservations.service.ts
import { api } from './api';
import type { BackendTable } from './tables.service';
import type { BackendUser } from './users.service';

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
  mesa?: BackendTable | string;
  usuario?: BackendUser | string;
  createdAt?: string;
}

export const reservationsService = {
  getAll: async (): Promise<ReservationResponse[]> => {
    return api.get<ReservationResponse[]>('/reservas');
  },

  create: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    return api.post<ReservationResponse>('/reservas', payload);
  }
};