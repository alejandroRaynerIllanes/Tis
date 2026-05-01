// ─── Tipos compartidos de la aplicación ─────────────────────────────────────

export type ProductStatus = 'Disponible' | 'Agotado'

export interface Product {
  id: string
  name: string
  price: number
  category: string
  description?: string
  status: ProductStatus
  image: string
  imagePublicId?: string
}

export type TableStatus = 'Disponible' | 'Ocupada' | 'Esperando pago' | 'Reservada'

export interface Table {
  id: string
  name: string
  location: string
  status: TableStatus
  capacity?: number
  type?: 'vip' | 'normal'
}

export interface ReservationInfo {
  id: string
  clientName: string
  guestCount: number
  date: string
  startTime: string
  endTime: string
  vip?: boolean
}

export interface OrderItem {
  product: Product
  quantity: number
  note?: string
}

export type UserRole = 'admin' | 'waiter' | 'chef' | 'cashier'

export type StateFilter = 'all' | 'Disponible' | 'Ocupada' | 'Esperando pago' | 'Reservada'

export interface ReservationFormData {
  clientName: string
  guestCount: number
  date: string
  time: string
}

export interface Category {
  id: string
  label: string
}

export interface Location {
  id: string
  name: string
}

export interface AppUser {
  id: number
  name: string
  email: string
  role: string
  isActive: boolean
}
