import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    // Usamos id: string para evitar errores de tipo
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
      return null;
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // --- AQUÍ AGREGAS EL TAMAÑO ---
  build: {
    chunkSizeWarningLimit: 1000, // Sube el límite a 1000kB para quitar la advertencia
  },
  // ------------------------------
  assetsInclude: ['**/*.svg', '**/*.csv'],
})