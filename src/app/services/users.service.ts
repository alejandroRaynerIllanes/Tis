// ─── Servicio de Usuarios (CRUD) ─────────────────────────────────────────────

import { api } from './api';

// Tipo del usuario como viene del backend
export interface BackendUser {
  id: number;
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  rol: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Payload para crear usuario
export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  contraseña: string;
  rol: string;
}

// Payload para editar usuario
export interface UpdateUserPayload {
  nombre?: string;
  apellido?: string;
  ci?: string;
  email?: string;
  contraseña?: string;
  rol?: string;
}

export const usersService = {
  // GET /usuarios — Listar todos los usuarios
  async getAll(): Promise<BackendUser[]> {
    return api.get<BackendUser[]>('/usuarios');
  },

  // POST /usuarios — Crear nuevo usuario
  async create(payload: CreateUserPayload): Promise<BackendUser> {
    return api.post<BackendUser>('/usuarios', payload);
  },

  // PUT /usuarios/:id — Editar usuario
  async update(id: number, payload: UpdateUserPayload): Promise<BackendUser> {
    return api.put<BackendUser>(`/usuarios/${id}`, payload);
  },

  // PATCH /usuarios/:id/estado — Activar/Desactivar usuario
  async toggleStatus(id: number): Promise<BackendUser> {
    return api.patch<BackendUser>(`/usuarios/${id}/estado`);
  },

  // DELETE /usuarios/:id — Eliminar usuario
  async remove(id: number): Promise<void> {
    return api.delete<void>(`/usuarios/${id}`);
  },
};
