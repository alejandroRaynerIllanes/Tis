import { Settings, ConciergeBell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';

export function ModuleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FCE4D6] text-[#4B2E2D] p-8 flex flex-col font-sans">
      {/* Header */}
      <header className="flex justify-end w-full">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#E57C5D] font-bold text-lg hover:text-[#D0543A] transition-colors bg-white/50 px-4 py-2 rounded-lg hover:bg-white/80"
        >
          <LogOut size={24} />
          Cerrar Sesión
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center -mt-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-16 text-center text-[#4B2E2D]">
          Bienvenido. Selecciona tu área de trabajo
        </h1>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-stretch justify-center w-full max-w-5xl">
          {/* Tarjeta 1: Administrador */}
          <div className="group bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center flex-1 max-w-md text-center border-2 border-transparent hover:border-[#E57C5D] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
            <div className="bg-[#FCE4D6] p-6 rounded-full mb-8 text-[#D0543A] group-hover:scale-110 transition-transform duration-300">
              <Settings size={64} />
            </div>
            <h2 className="text-2xl font-bold mb-8 text-[#4B2E2D]">Panel de Administrador</h2>
            <button onClick={() => navigate('/catalog')} className="mt-auto bg-[#D0543A] text-white py-4 px-6 rounded-xl w-full font-bold text-lg hover:bg-[#b5462f] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
              Entrar al Admin
            </button>
          </div>

          {/* Tarjeta 2: Salón y Mesas */}
          <div className="group bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center flex-1 max-w-md text-center border-2 border-transparent hover:border-[#E57C5D] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
            <div className="bg-[#FCE4D6] p-6 rounded-full mb-8 text-[#D0543A] group-hover:scale-110 transition-transform duration-300">
              <ConciergeBell size={64} />
            </div>
            <h2 className="text-2xl font-bold mb-8 text-[#4B2E2D]">Salón y Mesas</h2>
            <div className="w-full flex flex-col gap-3 mt-auto">
              <button onClick={() => navigate('/waiter-map')} className="bg-[#D0543A] text-white py-4 px-6 rounded-xl w-full font-bold text-lg hover:bg-[#b5462f] shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                Mesero - Paso 1
              </button>
              <button onClick={() => navigate('/waiter-map-final')} className="bg-transparent border-2 border-[#D0543A] text-[#D0543A] py-3 px-6 rounded-xl w-full font-bold text-lg hover:bg-[#D0543A] hover:text-white transition-all active:scale-[0.98]">
                Mesero - Paso Final
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
