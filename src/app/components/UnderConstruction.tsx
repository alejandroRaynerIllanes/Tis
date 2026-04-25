import { Construction, Home } from 'lucide-react'
import { useNavigate } from 'react-router'

export function UnderConstruction() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('userRole')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FCE4D6] font-sans relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5E6D3] via-[#FCE4D6] to-[#F5E6D3]" />

      <div className="relative z-10 text-center px-6 max-w-2xl">
        {/* Ícono */}
        <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-[#D0543A] to-[#E57C5D] flex items-center justify-center shadow-2xl shadow-[#D0543A]/30">
          <Construction size={64} className="text-white" strokeWidth={1.5} />
        </div>

        {/* Título */}
        <h1 className="text-4xl font-black text-[#4B2E2D] mb-4 tracking-tight">
          Módulo en Construcción
        </h1>

        {/* Descripción */}
        <p className="text-lg text-[#4B2E2D]/70 mb-8 leading-relaxed">
          Esta sección del sistema está actualmente en desarrollo.
          <br />
          Pronto estará disponible para ti.
        </p>

        {/* Botón de regreso */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#D0543A] text-white font-bold rounded-xl shadow-lg shadow-[#D0543A]/30 hover:bg-[#b5462f] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all"
        >
          <Home size={20} />
          Volver al Inicio
        </button>

        {/* Mensaje adicional */}
        <p className="mt-8 text-sm text-[#4B2E2D]/50 font-medium">
          Gracias por tu paciencia mientras trabajamos en esta funcionalidad
        </p>
      </div>
    </div>
  )
}
