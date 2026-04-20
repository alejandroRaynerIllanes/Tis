// ─── Constantes de la aplicación ─────────────────────────────────────────────

import type { Category, Location, AppUser } from '../types';

// Credenciales de usuarios (login)
export const LOGIN_USERS: Record<string, { password: string; role: string }> = {
  'admin':         { password: 'admin123',   role: 'admin'  },
  'administrador': { password: 'admin123',   role: 'admin'  },
  'mesero':        { password: 'mesero123',  role: 'waiter' },
  'waiter':        { password: 'waiter123',  role: 'waiter' },
  'cocinero':      { password: 'cocinero123', role: 'chef'   },
  'cajero':        { password: 'cajero123',   role: 'cashier'},
};

// Clientes VIP autorizados
export const VIP_CLIENT_NAMES = ['alex', 'axel', 'pedro'];

// Categorías iniciales del menú
export const INITIAL_CATEGORIES: Category[] = [
  { id: 'Platos principales', label: 'Platos principales' },
  { id: 'Acompañamientos', label: 'Acompañamientos' },
  { id: 'Bebidas', label: 'Bebidas' },
  { id: 'Postres', label: 'Postres' },
];

// Ubicaciones iniciales
export const INITIAL_LOCATIONS: Location[] = [
  { id: 'interior', name: 'Interior' },
  { id: 'terraza', name: 'Terraza' },
  { id: 'patio', name: 'Patio' },
];

// Usuarios iniciales del sistema
export const INITIAL_USERS: AppUser[] = [
  { id: 1, name: 'Administrador', email: 'admin@restaurante.com', role: 'Administrador', isActive: true },
  { id: 2, name: 'Juan Mesero', email: 'juan@restaurante.com', role: 'Mesero', isActive: true },
  { id: 3, name: 'María Cocinera', email: 'maria@restaurante.com', role: 'Cocinero', isActive: true },
];

// Paleta de colores
export const COLORS = {
  primary: '#D96C4A',
  primaryDark: '#D0543A',
  primaryHover: '#b5462f',
  secondary: '#E57C5D',
  accent: '#F2A98A',
  dark: '#4B2E2D',
  darkAlt: '#6B3E2E',
  light: '#F5E6D3',
  bg: '#FCE4D6',
} as const;

// Filtros de ubicación para WaiterView
export const WAITER_LOCATIONS = ['Todas', 'Interior', 'Terraza', 'Patio', 'Zona VIP'];

// Máximo de mesas VIP permitidas
export const MAX_VIP_TABLES = 3;
