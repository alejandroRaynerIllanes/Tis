// src/app/services/upload.service.ts
import { api } from './api'

export const uploadService = {
  // Función para subir una imagen a nuestro backend (que a su vez la sube a Cloudinary)
  async uploadImage(file: File): Promise<{ url: string; publicId: string }> {
    // Usamos FormData porque estamos enviando un archivo físico, no un JSON de texto
    const formData = new FormData()
    // 'imagen' es el nombre exacto que configuramos en multer (upload.single('imagen'))
    formData.append('imagen', file)

    // Hacemos el POST a tu servidor Express
    // api.post es el cliente que tus compañeros configuraron (ya maneja el Token JWT)
    const response = await api.post<{ url: string; publicId: string }>('/upload', formData)

    return response
  }
}
