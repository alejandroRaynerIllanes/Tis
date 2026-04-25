// ─── Datos mock de la aplicación ─────────────────────────────────────────────

import type { Product, Table } from '../types'
import { TrendingUp, Package, Award, ChefHat } from 'lucide-react'

// Productos del menú
export const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Lomo Saltado',
    price: 45.0,
    category: 'Platos principales',
    description: 'Carne salteada con cebolla, tomate, papas fritas y arroz.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1743201045017-57d608973dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMb21vJTIwU2FsdGFkb3xlbnwxfHx8fDE3NzU0MDQxMTF8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '2',
    name: 'Ceviche Clásico',
    price: 35.0,
    category: 'Platos principales',
    description: 'Pescado fresco marinado en limón con cebolla y ají.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDZXZpY2hlfGVufDF8fHx8MTc3NTQwNDExNXww&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '3',
    name: 'Arroz con Pollo',
    price: 28.0,
    category: 'Platos principales',
    description:
      'Arroz graneado cocido en caldo de cilantro y cerveza negra, servido con presa de pollo.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1749640566096-5d8098d452b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxSaWNlJTIwQ2hpY2tlbnxlbnwxfHx8fDE3NzU0MDQxMTh8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '4',
    name: 'Pasta al Pesto Rústico',
    price: 40.0,
    category: 'Platos principales',
    description: 'Pasta fresca bañada en salsa pesto con albahaca, piñones y queso parmesano.',
    status: 'Agotado',
    image:
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YXxlbnwxfHx8fDE3NzE5NDc1NDN8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '6',
    name: 'Ensalada Fresca',
    price: 18.0,
    category: 'Acompañamientos',
    description: 'Mix de hojas verdes, tomates cherry, palta y aderezo especial de la casa.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZHxlbnwxfHx8fDE3NzU0MDI1NTR8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '7',
    name: 'Pisco Sour',
    price: 22.0,
    category: 'Bebidas',
    description: 'Bebida a base de pisco, limón, azúcar y clara de huevo.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1556881286-fc6915169721?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2NrdGFpbHxlbnwxfHx8fDE3NzU0MDQxNTl8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '8',
    name: 'Chicha Morada',
    price: 12.0,
    category: 'Bebidas',
    description: 'Refresco natural de maíz morado hervido con piña, manzana y canela.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcnVwbGUlMjBkcmlua3xlbnwxfHx8fDE3NzU0MDQxNzB8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '9',
    name: 'Limonada de Menta',
    price: 15.0,
    category: 'Bebidas',
    description:
      'Limonada frozen refrescante procesada con hojas de menta fresca y un toque de jengibre.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1627366422858-c5af17ac71ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW50JTIwbGVtb25hZGV8ZW58MXx8fHwxNzc1NDA0MTgyfDA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '10',
    name: 'Tiramisú',
    price: 25.0,
    category: 'Postres',
    description:
      'Clásico postre italiano con capas de bizcotela bañada en café y crema mascarpone.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1714385905983-6f8e06fffae1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJhbWlzdXxlbnwxfHx8fDE3NzU0MDQxOTR8MA&ixlib=rb-4.1.0&q=80&w=400'
  },
  {
    id: '11',
    name: 'Suspiro a la Limeña',
    price: 18.0,
    category: 'Postres',
    description: 'Manjar blanco suave coronado con merengue al oporto y espolvoreado con canela.',
    status: 'Disponible',
    image:
      'https://images.unsplash.com/photo-1605364125867-0c7f2123ccbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJhbWVsJTIwZGVzc2VydHxlbnwxfHx8fDE3NzU0MDQyMTN8MA&ixlib=rb-4.1.0&q=80&w=400'
  }
]

// Mesas predeterminadas
export const defaultTables: Table[] = [
  {
    id: '1',
    name: 'Mesa 1',
    location: 'interior',
    status: 'Disponible',
    capacity: 4,
    type: 'normal'
  },
  {
    id: '2',
    name: 'Mesa 2',
    location: 'interior',
    status: 'Disponible',
    capacity: 2,
    type: 'normal'
  },
  {
    id: '3',
    name: 'Mesa 3',
    location: 'interior',
    status: 'Disponible',
    capacity: 6,
    type: 'normal'
  },
  {
    id: '4',
    name: 'Mesa 4',
    location: 'interior',
    status: 'Disponible',
    capacity: 4,
    type: 'normal'
  },
  {
    id: '5',
    name: 'Terraza 1',
    location: 'terraza',
    status: 'Disponible',
    capacity: 2,
    type: 'normal'
  },
  {
    id: 'vip1',
    name: 'VIP 1',
    location: 'zona-vip',
    status: 'Disponible',
    capacity: 4,
    type: 'vip'
  },
  {
    id: 'vip2',
    name: 'VIP 2',
    location: 'zona-vip',
    status: 'Disponible',
    capacity: 6,
    type: 'vip'
  }
]

// Dashboard: platos más vendidos
export const TOP_DISHES_DATA = [
  { name: 'Hamburguesa Sabor Real', sold: 148, trend: 'up' as const, percent: 100 },
  { name: 'Limonada de Menta y Jengibre', sold: 132, trend: 'up' as const, percent: 89 },
  { name: 'Tiramisú Clásico', sold: 115, trend: 'up' as const, percent: 78 },
  { name: 'Pasta al Pesto Rústico', sold: 98, trend: 'down' as const, percent: 66 },
  { name: 'Ensalada Fresca del Campo', sold: 74, trend: 'down' as const, percent: 50 }
]

// Dashboard: categorías más populares
export const CATEGORY_POPULARITY_DATA = [
  { name: 'Platos Fuertes', orders: 120, percent: 45, color: '#D0543A' },
  { name: 'Bebidas', orders: 80, percent: 25, color: '#E57C5D' },
  { name: 'Postres', orders: 60, percent: 20, color: '#4B2E2D' },
  { name: 'Acompañamientos', orders: 30, percent: 10, color: '#F2A98A' }
]

// Dashboard: órdenes recientes
export const RECENT_ORDERS = [
  { id: '#001', table: 'Mesa 5', time: '14:32', status: 'Completada', total: 'Bs. 145' },
  { id: '#002', table: 'Mesa 2', time: '14:28', status: 'En preparación', total: 'Bs. 89' },
  { id: '#003', table: 'Mesa 8', time: '14:25', status: 'Completada', total: 'Bs. 210' },
  { id: '#004', table: 'Mesa 1', time: '14:20', status: 'Pendiente', total: 'Bs. 125' }
]

// Reportes disponibles
export const REPORTS_LIST = [
  {
    id: 1,
    name: 'Ventas del Mes',
    icon: TrendingUp,
    description: 'Resumen de ingresos y transacciones del mes actual'
  },
  {
    id: 2,
    name: 'Inventario',
    icon: Package,
    description: 'Estado actual del stock e ingredientes disponibles'
  },
  {
    id: 3,
    name: 'Rendimiento del Personal',
    icon: Award,
    description: 'Métricas de desempeño por empleado y turno'
  },
  {
    id: 4,
    name: 'Platos Más Vendidos',
    icon: ChefHat,
    description: 'Ranking de productos con mayor demanda del período'
  }
]

// VIP: lista de suscriptores
export const VIP_SUBSCRIBERS = [
  {
    id: 1,
    name: 'Alex Martínez',
    email: 'alex@email.com',
    plan: 'VIP Anual',
    status: 'Activo',
    joinDate: '2024-01-15',
    nextBilling: '2025-01-15',
    totalSpent: 3420,
    visits: 47,
    avgTicket: 72.8
  },
  {
    id: 2,
    name: 'Axel Rodríguez',
    email: 'axel@email.com',
    plan: 'VIP Mensual',
    status: 'Activo',
    joinDate: '2024-08-03',
    nextBilling: '2026-05-03',
    totalSpent: 1180,
    visits: 19,
    avgTicket: 62.1
  },
  {
    id: 3,
    name: 'Pedro Gómez',
    email: 'pedro@email.com',
    plan: 'VIP Anual',
    status: 'Activo',
    joinDate: '2023-11-20',
    nextBilling: '2026-11-20',
    totalSpent: 5105,
    visits: 63,
    avgTicket: 81.0
  }
]
