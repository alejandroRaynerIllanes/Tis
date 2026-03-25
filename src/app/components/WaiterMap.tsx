import { ChevronLeft, LogOut, Users, Clock, CheckCircle2, Receipt, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState, MouseEvent } from 'react';

const INITIAL_TABLES = [
  { id: 1, name: 'Mesa 1', seats: 4, state: 'libre', shape: 'square', top: '15%', left: '10%' },
  { id: 2, name: 'Mesa 2', seats: 2, state: 'ocupada', shape: 'round', top: '20%', left: '45%' },
  { id: 3, name: 'Mesa 3', seats: 6, state: 'reservada', shape: 'rectangle', top: '55%', left: '20%' },
  { id: 4, name: 'Mesa 4', seats: 4, state: 'ocupada', shape: 'square', top: '60%', left: '65%' },
];

export function WaiterMap() {
  const navigate = useNavigate();
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [activePopover, setActivePopover] = useState<{ id: number; x: number; y: number } | null>(null);

  const handleTableClick = (e: MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Position the popover slightly to the right and below the center of the table
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
    switch (shape) {
      case 'round':
        return 'w-32 h-32 rounded-full';
      case 'square':
        return 'w-36 h-36 rounded-3xl';
      case 'rectangle':
        return 'w-56 h-36 rounded-3xl';
      default:
        return 'w-36 h-36 rounded-3xl';
    }
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
        
        {/* Leyenda */}
        <div className="flex gap-8 mb-8 bg-white/40 px-8 py-4 rounded-full backdrop-blur-sm border-2 border-white/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-[4px] border-[#4B2E2D] bg-[#FCE4D6]"></div>
            <span className="font-bold text-[#4B2E2D]">Libre</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#D0543A]"></div>
            <span className="font-bold text-[#4B2E2D]">Ocupada</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[#4B2E2D]"></div>
            <span className="font-bold text-[#4B2E2D]">Reservada</span>
          </div>
        </div>

        {/* Plano de Mesas */}
        <div className="relative w-full max-w-5xl flex-1 bg-white/20 border-4 border-[#4B2E2D]/10 rounded-[3rem] p-8 shadow-inner overflow-hidden min-h-[500px]">
          {/* Decorative floor elements */}
          <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-[#4B2E2D]/5"></div>
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#4B2E2D]/5"></div>
          <div className="absolute top-8 right-8 text-[#4B2E2D]/20 font-bold text-4xl uppercase tracking-widest pointer-events-none">
            Terraza
          </div>
          <div className="absolute bottom-8 left-8 text-[#4B2E2D]/20 font-bold text-4xl uppercase tracking-widest pointer-events-none">
            Salón Principal
          </div>

          {/* Mesas */}
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={(e) => handleTableClick(e, table.id)}
              className={`absolute flex flex-col items-center justify-center transition-all duration-300 active:scale-95 group ${getTableStyle(table.state)} ${getShapeStyle(table.shape)}`}
              style={{ top: table.top, left: table.left }}
            >
              {getStateIcon(table.state)}
              <span className="text-xl font-black tracking-wide">{table.name}</span>
              <span className="text-sm font-semibold opacity-80 mt-1 flex items-center gap-1">
                {table.seats} pax
              </span>
            </button>
          ))}
        </div>

        {/* Popover Interactivo */}
        {activePopover && (
          <div 
            className="fixed z-50 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(75,46,45,0.3)] border-2 border-[#E57C5D] w-52 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              top: activePopover.y, 
              left: activePopover.x,
              transform: 'translate(-50%, -50%)', // Centrar respecto al punto de clic
            }}
            onClick={(e) => e.stopPropagation()} // Evitar que el clic cierre el popover al tocarlo
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
                  /* Lógica futura de cuenta */
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