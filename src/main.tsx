import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
// @ts-ignore - Vite se encarga de procesar e inyectar las importaciones de CSS
import './styles/index.css'

createRoot(document.getElementById('root')!).render(<App />)
