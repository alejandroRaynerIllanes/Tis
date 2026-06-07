//src/app/services/products.service.ts
import { api } from './api'
import type { BackendPlato } from './platos.service'

export const productsService = {
  getAll: async (): Promise<BackendPlato[]> => {
    // Ajusta la ruta '/productos' o '/platos' según como esté tu backend
    const response = await api.get<BackendPlato[] | { data: BackendPlato[] }>('/productos')
    return Array.isArray(response) ? response : response.data || []
  }
  // Puedes agregar más métodos aquí (create, update, delete) en el futuro
}
