import React from 'react'
import { X, XCircle, AlertTriangle, UserCheck, Crown, Clock, Users } from 'lucide-react'
import { Table, ReservationInfo } from '../context/AppContext'

interface CancelReservationModalProps {
  isOpen: boolean
  table: Table | null
  reservation: ReservationInfo | null
  onClose: () => void
  onConfirm: () => void
}

export function CancelReservationModal({
  isOpen,
  table,
  reservation,
  onClose,
  onConfirm
}: CancelReservationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-[5px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-[#8C3A3A] to-[#7A2A2A] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <XCircle size={20} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg leading-tight">
                Cancelar reserva
              </h2>
              <p className="text-[#F5E6D3] text-xs font-semibold mt-0.5">
                {table?.name}
                {reservation ? ` · ${reservation.clientName}` : ''}
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

        {/* Body */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-500" strokeWidth={2} />
            </div>
            <div>
              <p className="font-black text-[#4B2E2D] text-base">
                ¿Estás seguro de que deseas cancelar esta reserva?
              </p>
              {reservation && (
                <div className="mt-3 p-3 bg-[#FFF5F0] rounded-xl border border-[#FCE4D6] text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-[#4B2E2D]">
                    <UserCheck size={13} strokeWidth={2.5} />
                    <span className="text-sm font-black">
                      {reservation.clientName}
                    </span>
                    {reservation.vip && (
                      <Crown size={12} className="text-yellow-500" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#4B2E2D]/80">
                      <Clock size={11} /> {reservation.date} · {reservation.startTime}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#4B2E2D]/80">
                      <Users size={11} /> {reservation.guestCount} personas
                    </span>
                  </div>
                </div>
              )}
              <p className="text-gray-500 text-sm font-medium mt-3">
                Esta reserva será eliminada del sistema.
              </p>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Volver
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            Confirmar cancelación
          </button>
        </div>
      </div>
    </div>
  )
}