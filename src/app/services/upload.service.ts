// ─── Servicio de Cloudinary (Upload/Delete de imágenes) ──────────────────────

import { api } from './api';

interface UploadResponse {
  url: string;
  publicId: string;
}

interface DeleteResponse {
  message: string;
}

export const uploadService = {
  // POST /api/upload — Subir imagen (form-data, key: "imagen")
  async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('imagen', file);

    return api.post<UploadResponse>('/api/upload', formData);
  },

  // DELETE /api/upload — Eliminar imagen por publicId
  async deleteImage(publicId: string): Promise<DeleteResponse> {
    return api.delete<DeleteResponse>('/api/upload', { publicId });
  },
};
