import { ChevronLeft, LogOut, Users, Clock, CheckCircle2, Receipt, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, MouseEvent } from 'react';

const INITIAL_LOCATIONS = [
  { id: 'interior', name: 'Salón Principal' },
  { id: 'terraza', name: 'Terraza' },
  { id: 'patio', name: 'Patio Central' },
];

const INITIAL_TABLES = [
  // Interior
  { id: 1, name: 'Mesa 1', seats: 4, state: 'ocupada', shape: 'square', locationId: 'interior' },
  { id: 2, name: 'Mesa 2', seats: 2, state: 'ocupada', shape: 'round', locationId: 'interior' },
  { id: 3, name: 'Mesa 3', seats: 6, state: 'reservada', shape: 'rectangle', locationId: 'interior' },
  { id: 4, name: 'Mesa 4', seats: 4, state: 'libre', shape: 'square', locationId: 'interior' },
  // Terraza
  { id: 5, name: 'Mesa T1', seats: 2, state: 'libre', shape: 'round', locationId: 'terraza' },
  { id: 6, name: 'Mesa T2', seats: 4, state: 'ocupada', shape: 'square', locationId: 'terraza' },
  { id: 7, name: 'Mesa T3', seats: 6, state: 'reservada', shape: 'rectangle', locationId: 'terraza' },
  // Patio
  { id: 8, name: 'Mesa P1', seats: 4, state: 'libre', shape: 'square', locationId: 'patio' },
  { id: 9, name: 'Mesa P2', seats: 8, state: 'ocupada', shape: 'rectangle', locationId: 'patio' },
];

export function WaiterMapFinal() {
  const navigate = useNavigate();
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [activeLocation, setActiveLocation] = useState(INITIAL_LOCATIONS[0].id);
  const [activePopover, setActivePopover] = useState<{ id: number; x: number; y: number } | null>(null);

  const activeLocationName = INITIAL_LOCATIONS.find(l => l.id === activeLocation)?.name;
  const filteredTables = tables.filter(t => t.locationId === activeLocation);

  const handleTableClick = (e: MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActivePopover({
      id,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const closePopover = () => setActivePopover(null);

  const updateTableState = (id: number, newState: string) => {
    setTables(tables.map(t => t.id === id ? { ...t, state: newState } : t));
    closePopover();
  };

  const getTableStyle = (state: string) => {
    switch (state) {
      case 'libre':
        return 'border-[6px] border-[#4B2E2D] bg-[#FCE4D6] text-[#4B2E2D] hover:bg-[#4B2E2D]/10';
      case 'ocupada':
        return 'bg-[#D0543A] text-white shadow-xl shadow-[#D0543A]/40 border-[6px] border-[#D0543A] hover:bg-[#b5462f]';
      case 'reservada':
        return 'bg-[#4B2E2D] text-white shadow-xl shadow-[#4B2E2D]/40 border-[6px] border-[#4B2E2D] hover:bg-[#3a2322]';
      default:
        return '';
    }
  };

  const getShapeStyle = (shape: string) => {
    // Para que todas las mesas se vean como cuadrados uniformes, 
    // ignoramos la propiedad 'shape' y aplicamos un único estilo de cuadrado con bordes redondeados.
    return 'w-32 h-32 md:w-40 md:h-40 rounded-2xl aspect-square flex-shrink-0';
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'libre':
        return <CheckCircle2 size={24} className="mb-1 opacity-80" />;
      case 'ocupada':
        return <Users size={24} className="mb-1 opacity-90" />;
      case 'reservada':
        return <Clock size={24} className="mb-1 opacity-90" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FCE4D6] font-sans selection:bg-[#E57C5D] selection:text-white">
      {/* Top Bar */}
      <header className="bg-[#4B2E2D] text-white flex items-center justify-between px-6 py-4 shadow-xl z-10">
        <button 
          onClick={() => navigate('/modules')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors font-medium text-lg"
        >
          <ChevronLeft size={24} />
          Volver
        </button>

        <h1 className="text-2xl font-bold tracking-wide absolute left-1/2 -translate-x-1/2 hidden md:block">
          Plano del Salón
        </h1>

        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors font-medium text-lg"
        >
          Cerrar Sesión
          <LogOut size={20} className="ml-1" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-8 items-center overflow-hidden" onClick={closePopover}>
        
        {/* Carrusel de Ubicaciones */}
        <div className="w-full max-w-5xl mb-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex gap-4 min-w-max justify-center items-center">
            {INITIAL_LOCATIONS.map(location => (
              <button
                key={location.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLocation(location.id);
                  closePopover();
                }}
                className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-lg transition-all duration-300 shadow-sm
                  ${activeLocation === location.id 
                    ? 'bg-[#E57C5D] text-white shadow-lg shadow-[#E57C5D]/30 scale-105' 
                    : 'bg-white/60 text-[#4B2E2D] hover:bg-white border-2 border-transparent hover:border-[#E57C5D]/30'
                  }`}
              >
                <MapPin size={20} className={activeLocation === location.id ? "opacity-100" : "opacity-60"} />
                {location.name}
              </button>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-8 bg-white/40 px-6 sm:px-8 py-4 rounded-full backdrop-blur-sm border-2 border-white/60 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[3px] sm:border-[4px] border-[#4B2E2D] bg-[#FCE4D6]"></div>
            <span className="font-bold text-sm sm:text-base text-[#4B2E2D]">Libre</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#D0543A]"></div>
            <span className="font-bold text-sm sm:text-base text-[#4B2E2D]">Ocupada</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#4B2E2D]"></div>
            <span className="font-bold text-sm sm:text-base text-[#4B2E2D]">Reservada</span>
          </div>
        </div>

        {/* Plano de Mesas */}
        <div className="relative w-full max-w-5xl flex-1 bg-white/20 border-4 border-[#4B2E2D]/10 rounded-[3rem] p-8 shadow-inner overflow-hidden min-h-[500px]">
          <div className="absolute top-8 left-8 right-8 text-[#4B2E2D]/10 font-black text-2xl sm:text-4xl uppercase tracking-widest pointer-events-none z-0 text-center sm:text-right">
            {activeLocationName}
          </div>

          {/* Mesas Grid */}
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10 place-items-center mt-12 sm:mt-16">
            {filteredTables.map((table) => (
              <button
                key={table.id}
                onClick={(e) => handleTableClick(e, table.id)}
                className={`relative flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group overflow-hidden shadow-sm hover:shadow-md ${getTableStyle(table.state)} ${getShapeStyle(table.shape)}`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <div className="flex flex-col items-center z-10 relative">
                  <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1 drop-shadow-sm">
                    {getStateIcon(table.state)}
                  </div>
                  <span className="text-xl md:text-2xl font-black tracking-wide drop-shadow-sm">
                    {table.name}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/10 backdrop-blur-sm border border-black/5">
                    <span className="text-xs md:text-sm font-bold tracking-wide opacity-90 whitespace-nowrap">
                      {table.seats} Pax
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Popover Interactivo */}
        {activePopover && (
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(75,46,45,0.3)] border-2 border-[#E57C5D] w-52 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              top: activePopover.y, 
              left: activePopover.x,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <button 
                onClick={() => updateTableState(activePopover.id, 'ocupada')}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-[#4B2E2D] hover:bg-[#FCE4D6] transition-colors text-sm font-bold group"
              >
                <Users size={18} className="text-[#D0543A] group-hover:scale-110 transition-transform" /> 
                Marcar Ocupada
              </button>
              
              <button 
                onClick={() => updateTableState(activePopover.id, 'reservada')}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-[#4B2E2D] hover:bg-[#FCE4D6] transition-colors text-sm font-bold border-t border-gray-100 group"
              >
                <Clock size={18} className="text-[#4B2E2D] group-hover:scale-110 transition-transform" /> 
                Marcar Reservada
              </button>
              
              <button 
                onClick={() => {
                  closePopover();
                }}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-[#4B2E2D] hover:bg-[#FCE4D6] transition-colors text-sm font-bold border-t border-gray-100 group"
              >
                <Receipt size={18} className="text-[#E57C5D] group-hover:scale-110 transition-transform" /> 
                Pedir Cuenta
              </button>
              
              <button 
                onClick={() => updateTableState(activePopover.id, 'libre')}
                className="w-full px-4 py-3.5 flex items-center gap-3 text-[#4B2E2D] hover:bg-[#FCE4D6] transition-colors text-sm font-bold border-t border-gray-100 group"
              >
                <CheckCircle2 size={18} className="text-[#4B2E2D] group-hover:scale-110 transition-transform opacity-70" /> 
                Liberar Mesa
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
