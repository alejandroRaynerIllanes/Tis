// src/app/services/inventario.service.ts
import { api } from './api'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Ingrediente {
  _id: string
  nombre: string
  stockActual: number
  stockMinimo: number
  unidad: string
  unidadMedida?: string
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
    return api.get<Ingrediente[]>('/inventario/estado', { skipAuth: true })
  },

  /**
   * Obtiene la lista de recetas (escandallos) conectadas al menú.
   * GET /inventario/recetas
   */
  getRecetas(): Promise<any[]> {
    return api.get<any[]>('/inventario/recetas')
    return api.get<any[]>('/inventario/recetas', { skipAuth: true })
  },

  /**
   * Obtiene el estado de las alertas de stock.
   * GET /inventario/alertas
   */
  getAlertas(): Promise<Ingrediente[]> {
    return api.get<Ingrediente[]>('/inventario/alertas')
  },

  /**
   * Registra una entrada de stock para un ingrediente.
   * POST /inventario/entrada
   */
  registrarEntrada(payload: EntradaStockPayload): Promise<void> {
    return api.post<void>('/inventario/entrada', payload)
  },

  /**
   * Crea un nuevo ingrediente.
   */
  crearIngrediente(payload: any): Promise<Ingrediente> {
    return api.post<Ingrediente>('/inventario/ingredientes', payload)
  },

  actualizarIngrediente(id: string, payload: any): Promise<Ingrediente> {
    return api.put<Ingrediente>(`/inventario/ingredientes/${id}`, payload)
  },

  eliminarIngrediente(id: string): Promise<void> {
    return api.delete<void>(`/inventario/ingredientes/${id}`)
  },

  /**
   * Crea o actualiza la receta de un plato.
   * POST /inventario/recetas
   */
  guardarReceta(payload: { plato: string; ingredientes: { ingrediente: string; cantidadNecesaria: number }[] }): Promise<any> {
    return api.post<any>('/inventario/recetas', payload)
  }
}
