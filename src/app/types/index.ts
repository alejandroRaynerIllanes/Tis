export type UserRole = 'admin' | 'administrador' | 'mesero' | 'cocinero' | 'cajero' | 'delivery' | 'Cliente';

export interface User {
  id: string | number;
  _id?: string;
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  zona?: string;
  ubicacion?: string;
  estado?: boolean;
  verificado?: boolean;
  direcciones?: Address[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  id: string;
  alias: string;
  detalle: string;
  referencia?: string;
}

export interface Category {
  id: string;
  _id?: string;
  nombre: string;
  label?: string;
}

export interface Dish {
  id: string;
  _id?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  categoria: string | Category;
  categoryName?: string;
  disponible?: boolean;
  estado?: string | boolean;
  // Fallbacks para compatibilidad
  name?: string;
  price?: number;
  image?: string;
}

export interface OrderDetail {
  plato: Dish | string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observacion?: string;
  nombre?: string; // Para visualización rápida
}

export interface Order {
  id?: string;
  _id?: string;
  pedidoId?: string; // Usado en lógica de Caja
  codigo: string;
  mesa?: { // Puede ser ID o objeto poblado con campos relevantes
    _id: string;
    id?: string; // Para compatibilidad
    numero?: string;
    name?: string;
    ubicacion?: { nombre: string };
    type?: 'normal' | 'vip';
    estado?: string; // Para el estado de la mesa en el contexto del pedido
    status?: string; // Para el estado de la mesa en el contexto del pedido
  } | string;
  mesaId?: string;
  mesaNombre?: string;
  usuario?: User | string;
  meseroNombre?: string;
  cajeroAsignado?: User | string;
  detalles?: OrderDetail[];
  items?: OrderDetail[];
  total: number;
  subtotalCierre?: number;
  montoDescuento?: number;
  montoPropina?: number;
  estado: string;
  metodoPago?: string;
  paymentStatus?: string;
  estadoPago?: string;
  clienteNombre?: string;
  clienteCI?: string;
  clienteNIT?: string;
  createdAt: string;
  updatedAt: string;
  tiempoEsperaMinutos?: number;
  paymentMethod?: string;
  fechaHoraBolivia?: string;
  fechaHora?: string;
  repartidorId?: string;
  coordenadasEntrega?: { lat: number; lng: number };
  direccionEntrega?: string;
  referenciaEntrega?: string;
  clienteTelefono?: string;
}

// ─── Tipos para el AppContext y Vistas Frontend ──────────────────────────────

export type ProductStatus = 'Disponible' | 'Agotado';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  status: ProductStatus;
}

export type TableStatus = 'Disponible' | 'Ocupada' | 'Esperando pago' | 'Reservada';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  location: string;
  type: string;
  status: TableStatus;
  locationId?: string | null;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  note?: string;
  estado?: string;
}

export interface ReservationInfo {
  id: string;
  clientName: string;
  guestCount: number;
  date: string;
  startTime: string;
  endTime: string;
  vip?: boolean;
}

export interface ChatMessage {
  pedidoId: string;
  sender: 'Repartidor' | 'Cliente';
  text: string;
  time: string;
}