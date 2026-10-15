import type { Appointment, Settings } from '../types'
import { dayKeyOf, fromMin, nowMinutes, toMin, todayStr } from './time'

/** Returns an i18n error key, or null when the slot is inside working hours. */
export function checkWorkingHours(settings: Settings, date: string, start: string, end: string): string | null {
  const h = settings.workingHours[dayKeyOf(date)]
  if (!h || !h.open || !h.start || !h.end) return 'errors.closedDay'
  if (settings.holidays.some((x) => x.date === date)) return 'errors.holiday'
  const s = toMin(start)
  const e = toMin(end)
  if (s < toMin(h.start) || e > toMin(h.end)) return 'errors.outsideHours'
  if (h.breakStart && h.breakEnd && s < toMin(h.breakEnd) && toMin(h.breakStart) < e) return 'errors.duringBreak'
  return null
}

const isActive = (a: Appointment) => a.status !== 'Cancelled' && a.status !== 'No-show'

export function findConflict(
  appointments: Appointment[],
  q: { doctorId: string; date: string; startTime: string; endTime: string; excludeId?: string },
): Appointment | undefined {
  const s = toMin(q.startTime)
  const e = toMin(q.endTime)
  return appointments.find(
    (a) =>
      a.id !== q.excludeId &&
      isActive(a) &&
      a.doctorId === q.doctorId &&
      a.date === q.date &&
      s < toMin(a.endTime) &&
      toMin(a.startTime) < e,
  )
}

/** All free start times for a doctor on a given day, stepping by the slot duration. */
export function suggestSlots(
  appointments: Appointment[],
  settings: Settings,
  q: { doctorId: string; date: string; duration: number; excludeId?: string },
): string[] {
  const h = settings.workingHours[dayKeyOf(q.date)]
  if (!h?.open || !h.start || !h.end || !q.date || !q.duration) return []
  const step = Math.max(5, settings.slotDuration)
  const slots: string[] = []
  const isToday = q.date === todayStr()
  for (let m = toMin(h.start); m + q.duration <= toMin(h.end); m += step) {
    if (isToday && m < nowMinutes()) continue
    const start = fromMin(m)
    const end = fromMin(m + q.duration)
    if (checkWorkingHours(settings, q.date, start, end)) continue
    if (findConflict(appointments, { doctorId: q.doctorId, date: q.date, startTime: start, endTime: end, excludeId: q.excludeId })) continue
    slots.push(start)
  }
  return slots
}
