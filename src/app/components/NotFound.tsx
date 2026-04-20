import { useNavigate, useLocation } from 'react-router';
import { Home, AlertCircle, ChefHat } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const isConstruction = location.pathname === '/en-construccion';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#FCE4D6] font-sans selection:bg-[#E57C5D] selection:text-white relative overflow-hidden items-center justify-center p-8">
      {/* Background Image Wrapper */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-[2px] scale-[1.02] pointer-events-none"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1771574205963-0c1d84ac7354?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwcmVzdGF1cmFudCUyMGludGVyaW9yJTIwYW1iaWFuY2V8ZW58MXx8fHwxNzc1NjgxNTU2fDA&ixlib=rb-4.1.0&q=80&w=1080)' }}
      />
      {/* Overlay oscuro cálido */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: 'rgba(44, 25, 15, 0.65)' }} />

      <div className="relative z-10 text-center bg-white/10 backdrop-blur-md p-10 sm:p-14 rounded-[32px] border border-white/20 shadow-2xl max-w-lg w-full">
        <div className="mb-8 flex justify-center">
          <div className="bg-[#D0543A] p-6 rounded-full shadow-xl shadow-[#D0543A]/20">
            {isConstruction ? (
              <ChefHat size={80} className="text-white" />
            ) : (
              <AlertCircle size={80} className="text-white" />
            )}
          </div>
        </div>
        
        <h1 className="text-6xl sm:text-7xl font-black mb-4 text-white drop-shadow-sm">404</h1>
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white drop-shadow-sm">
          {isConstruction ? "Página en Construcción" : "Página No Encontrada"}
        </h2>
        <p className="text-lg text-white/80 mb-10 max-w-sm mx-auto font-medium">
          {isConstruction 
            ? "Estamos preparando los fogones para este módulo. ¡Pronto estará disponible!" 
            : "Lo sentimos, la página que estás buscando no existe o ha sido movida."}
        </p>
        
        <button
          onClick={() => {
            // Limpiar sesión si están en construcción para que puedan probar otros roles, o solo volver al login
            localStorage.removeItem('userRole');
            navigate('/', { replace: true });
          }}
          className="flex items-center gap-3 mx-auto text-white font-bold text-lg bg-[#D0543A] hover:bg-[#b5462f] transition-all px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl active:scale-95 border border-white/10"
        >
          <Home size={24} />
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
