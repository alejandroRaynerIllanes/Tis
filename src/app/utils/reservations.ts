// ─── Utilidades para reservas ────────────────────────────────────────────────

import type { ReservationInfo } from '../types';

/** Calcular duración de reserva según número de personas */
export const calculateReservationDuration = (guestCount: number): number => {
  return guestCount <= 3 ? 90 : 120; // minutos
};

/** Calcular hora de fin basándose en hora de inicio y duración */
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/** Verificar si dos rangos de tiempo se solapan */
export const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
};

/** Obtener la reserva activa actual (si existe) para una mesa */
export const getCurrentActiveReservation = (
  tableReservations: ReservationInfo[],
  currentDateTime: Date
): ReservationInfo | null => {
  if (!tableReservations || tableReservations.length === 0) return null;

  const currentDate = currentDateTime.toISOString().split('T')[0];
  const currentTime = `${String(currentDateTime.getHours()).padStart(2, '0')}:${String(currentDateTime.getMinutes()).padStart(2, '0')}`;

  return tableReservations.find(res => {
    if (res.date !== currentDate) return false;
    return timesOverlap(res.startTime, res.endTime, currentTime, currentTime);
  }) || null;
};
