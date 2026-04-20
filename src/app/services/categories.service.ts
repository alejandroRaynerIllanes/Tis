// src/app/services/categories.service.ts
import { api } from './api';

export interface BackendCategory {
  _id: string;
  nombre: string;
}

export const categoriesService = {
  // GET /api/categorias
  async getAll(): Promise<BackendCategory[]> {
    return api.get<BackendCategory[]>('/categorias');
  },

  // POST /api/categorias
  async create(nombre: string): Promise<BackendCategory> {
    return api.post<BackendCategory>('/categorias', { nombre });
  },

  // PUT /api/categorias/:id
  async update(id: string, nombre: string): Promise<BackendCategory> {
    return api.put<BackendCategory>(`/categorias/${id}`, { nombre });
  },

  // DELETE /api/categorias/:id
  async remove(id: string): Promise<void> {
    return api.delete<void>(`/categorias/${id}`);
  }
};