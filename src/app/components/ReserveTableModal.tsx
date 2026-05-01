import React, { useState, useEffect } from 'react'
import { CalendarDays, Crown, UserCheck, Users, X } from 'lucide-react'
import { Table } from '../context/AppContext'

export interface ReservationFormData {
  clientName: string
  guestCount: number
  date: string
  time: string
}

interface ReserveTableModalProps {
  isOpen: boolean
  table: Table | null
  onClose: () => void
  onConfirm: (data: ReservationFormData) => void
}

export function ReserveTableModal({
  isOpen,
  table,
  onClose,
  onConfirm
}: ReserveTableModalProps) {
  const [reservationForm, setReservationForm] = useState<ReservationFormData>({
    clientName: '',
    guestCount: 1,
    date: '',
    time: ''
  })
  
  const [reservationErrors, setReservationErrors] = useState<
    Partial<Record<keyof ReservationFormData, string>>
  >({})

  // Reiniciar el formulario automáticamente al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setReservationForm({ clientName: '', guestCount: 1, date: today, time: '' })
      setReservationErrors({})
    }
  }, [isOpen])

  if (!isOpen || !table) return null

  const validateReservation = (): boolean => {
    const errs: Partial<Record<keyof ReservationFormData, string>> = {}
    if (!reservationForm.clientName.trim()) errs.clientName = 'El nombre es obligatorio.'
    if (!reservationForm.guestCount || reservationForm.guestCount < 1)
      errs.guestCount = 'Mínimo 1 persona.'
    if (!reservationForm.date) errs.date = 'Selecciona una fecha.'
    if (!reservationForm.time) errs.time = 'Selecciona una hora.'
    setReservationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleConfirm = () => {
    if (validateReservation()) {
      onConfirm(reservationForm)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[5px] animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header del modal */}
        <div className="bg-gradient-to-r from-[#6B3E2E] to-[#4B2E2D] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-white" strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-white text-lg leading-tight">
                  Reservar Mesa
                </h2>
                {table.type === 'vip' && (
                  <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <Crown size={10} strokeWidth={2.5} /> VIP
                  </span>
                )}
              </div>
              <p className="text-[#F5E6D3] text-xs font-semibold mt-0.5">
                {table.name} · Capacidad {table.capacity} pax
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
        <div className="p-6 space-y-4">
          {/* VIP Notice */}
          {table.type === 'vip' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
              <Crown
                size={14}
                className="text-yellow-600 shrink-0 mt-0.5"
                strokeWidth={2.5}
              />
              <p className="text-[11px] font-semibold text-yellow-800 leading-relaxed">
                Esta es una mesa VIP. Solo clientes VIP pueden realizar reservas.
              </p>
            </div>
          )}

          {/* Nombre del cliente */}
          <div>
            <label className="block text-xs font-black text-[#4B2E2D] uppercase tracking-wider mb-1.5">
              Nombre del cliente <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <UserCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D96C4A]" />
              <input
                type="text"
                placeholder="Ej: María González"
                value={reservationForm.clientName}
                onChange={(e) => setReservationForm((f) => ({ ...f, clientName: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-base sm:text-sm font-semibold text-[#4B2E2D] placeholder:text-gray-400 focus:outline-none transition-all ${reservationErrors.clientName ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:border-[#D96C4A] focus:bg-white'}`}
              />
            </div>
            {reservationErrors.clientName && (
              <p className="text-red-500 text-[11px] font-semibold mt-1">
                {reservationErrors.clientName}
              </p>
            )}
          </div>

          {/* Número de personas */}
          <div>
            <label className="block text-xs font-black text-[#4B2E2D] uppercase tracking-wider mb-1.5">
              Número de personas <span className="text-[#DC2626]">*</span>
            </label>
            <div className="relative">
              <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D96C4A]" />
              <input
                type="number"
                min={1}
                max={table.capacity ?? 20}
                placeholder="Ej: 4"
                value={reservationForm.guestCount || ''}
                onChange={(e) => setReservationForm((f) => ({ ...f, guestCount: parseInt(e.target.value) || 0 }))}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-base sm:text-sm font-semibold text-[#4B2E2D] placeholder:text-gray-400 focus:outline-none transition-all ${reservationErrors.guestCount ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:border-[#D96C4A] focus:bg-white'}`}
              />
            </div>
            {reservationErrors.guestCount && (
              <p className="text-red-500 text-[11px] font-semibold mt-1">
                {reservationErrors.guestCount}
              </p>
            )}
          </div>

          {/* Fecha y Hora (en fila) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#4B2E2D] uppercase tracking-wider mb-1.5">Fecha <span className="text-[#DC2626]">*</span></label>
              <input type="date" value={reservationForm.date} onChange={(e) => setReservationForm((f) => ({ ...f, date: e.target.value }))} className={`w-full px-3 py-2.5 rounded-xl border text-base sm:text-sm font-semibold text-[#4B2E2D] focus:outline-none transition-all ${reservationErrors.date ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:border-[#D96C4A] focus:bg-white'}`} />
              {reservationErrors.date && <p className="text-red-500 text-[11px] font-semibold mt-1">{reservationErrors.date}</p>}
            </div>
            <div>
              <label className="block text-xs font-black text-[#4B2E2D] uppercase tracking-wider mb-1.5">Hora <span className="text-[#DC2626]">*</span></label>
              <input type="time" value={reservationForm.time} onChange={(e) => setReservationForm((f) => ({ ...f, time: e.target.value }))} className={`w-full px-3 py-2.5 rounded-xl border text-base sm:text-sm font-semibold text-[#4B2E2D] focus:outline-none transition-all ${reservationErrors.time ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 bg-gray-50 focus:border-[#D96C4A] focus:bg-white'}`} />
              {reservationErrors.time && <p className="text-red-500 text-[11px] font-semibold mt-1">{reservationErrors.time}</p>}
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-black text-sm hover:bg-gray-50 hover:border-gray-300 transition-all">
            Cancelar
          </button>
          <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-[#D96C4A] hover:bg-[#C25838] text-white font-black text-sm shadow-lg shadow-[#D96C4A]/30 transition-all flex items-center justify-center gap-2">
            <CalendarDays size={16} />
            Confirmar reserva
          </button>
        </div>
      </div>
    </div>
  )
}