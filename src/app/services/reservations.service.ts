//src/app/services/reservations.service.ts
import { api } from './api'

export interface CreateReservationPayload {
  tableId: string
  clientName: string
  guestCount: number
  date: string
  time: string
  vip: boolean
}

export interface ReservationResponse {
  id?: string
  _id?: string
  clientName: string
  guestCount: number
  date: string
  time: string
  vip: boolean
  mesa: any
  usuario: any
  createdAt?: string
}

export const reservationsService = {
  getAll: async (): Promise<ReservationResponse[]> => {
    return api.get<ReservationResponse[]>('/reservas')
  },

  create: async (payload: CreateReservationPayload): Promise<ReservationResponse> => {
    return api.post<ReservationResponse>('/reservas', payload)
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/reservas/${id}`)
  }
}
