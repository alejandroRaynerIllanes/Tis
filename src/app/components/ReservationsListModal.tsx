import { CalendarDays, Clock, Users, X, XCircle, UserCheck, Crown } from 'lucide-react';
import { MouseEvent } from 'react';
import { ReservationInfo, Table } from '../context/AppContext';

interface ReservationsListModalProps {
  viewingTableId: string | null;
  tables: Table[];
  reservations: Record<string, ReservationInfo[]>;
  onClose: () => void;
  onCancelReservation: (e: MouseEvent<HTMLButtonElement>, tableId: string, reservationId: string) => void;
}

export function ReservationsListModal({
  viewingTableId,
  tables,
  reservations,
  onClose,
  onCancelReservation
}: ReservationsListModalProps) {
  if (!viewingTableId) return null;

  const viewingTable = tables.find(t => t.id === viewingTableId);
  const tableReservations = reservations[viewingTableId] || [];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[5px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Header del modal */}
        <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg leading-tight">Reservas</h2>
              <p className="text-[#F5E6D3] text-xs font-semibold mt-0.5">
                {viewingTable?.name} · {tableReservations.length} {tableReservations.length === 1 ? 'reserva' : 'reservas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/15 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Lista de reservas */}
        <div className="p-6 max-h-[500px] overflow-y-auto">
          {tableReservations.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center mb-3">
                <CalendarDays size={32} className="text-gray-400" strokeWidth={2} />
              </div>
              <p className="text-gray-500 font-semibold">No hay reservas para esta mesa</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tableReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="relative p-4 bg-[#FFF5F0] rounded-xl border border-[#FCE4D6] hover:border-[#D96C4A]/30 transition-all"
                >
                  {/* Botón de cancelar en la esquina */}
                  <button
                    onClick={(e) => onCancelReservation(e, viewingTableId, reservation.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-500/10 transition-all"
                    title="Cancelar reserva"
                  >
                    <XCircle size={16} />
                  </button>

                  {/* Información de la reserva */}
                  <div className="pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck size={16} className="text-[#D96C4A]" strokeWidth={2.5} />
                      <span className="font-black text-[#4B2E2D] text-base">{reservation.clientName}</span>
                      {reservation.vip && (
                        <Crown size={14} className="text-yellow-500" strokeWidth={2.5} />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-[#4B2E2D]/80">
                        <CalendarDays size={12} /> {reservation.date}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-[#4B2E2D]/80">
                        <Clock size={12} /> {reservation.startTime || (reservation as any).time}
                      </span>
                      <span className="flex items-center gap-1.5 font-bold text-[#4B2E2D]/80">
                        <Users size={12} /> {reservation.guestCount} {reservation.guestCount === 1 ? 'persona' : 'personas'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black text-sm shadow-lg shadow-[#D96C4A]/30 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}