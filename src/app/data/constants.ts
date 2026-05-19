// src/app/data/constants.ts
// ─── Constantes de la aplicación ─────────────────────────────────────────────

import type { Category, Location, AppUser } from '../types'

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
  bg: '#FCE4D6'
} as const

// Filtros de ubicación para WaiterView
export const WAITER_LOCATIONS = ['Todas', 'Interior', 'Terraza', 'Patio', 'Zona VIP']

// Máximo de mesas VIP permitidas
export const MAX_VIP_TABLES = 3
