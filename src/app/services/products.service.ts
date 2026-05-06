import { api } from './api'

export const productsService = {
  getAll: async () => {
    // Ajusta la ruta '/productos' o '/platos' según como esté tu backend
    const response: any = await api.get('/productos')
    return response.data
  },
  // Puedes agregar más métodos aquí (create, update, delete) en el futuro
}