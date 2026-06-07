// src/app/services/inventario.service.ts
import { api } from './api'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Ingrediente {
  _id: string
  nombre: string
  stockActual: number
  stockMinimo: number
  unidad: string
  estado: 'Disponible' | 'Bajo' | 'Agotado'
}

export interface EntradaStockPayload {
  ingredienteId: string
  cantidad: number
  costo?: number
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const inventarioService = {
  /**
   * Obtiene el estado actual del inventario con todos los ingredientes.
   * GET /inventario/estado
   */
  getInventarioEstado(): Promise<Ingrediente[]> {
    return api.get<Ingrediente[]>('/inventario/estado')
  },

  /**
   * Registra una entrada de stock para un ingrediente.
   * POST /inventario/entrada
   */
  registrarEntrada(payload: EntradaStockPayload): Promise<void> {
    return api.post<void>('/inventario/entrada', payload)
  }
}
