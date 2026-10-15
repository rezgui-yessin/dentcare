import { format, parseISO, differenceInYears } from 'date-fns'
import type { Locale } from 'date-fns'
import type { DayKey } from '../types'

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fromMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const addMinutes = (t: string, min: number) => fromMin(toMin(t) + min)

export const todayStr = () => format(new Date(), 'yyyy-MM-dd')
export const toDateStr = (d: Date) => format(d, 'yyyy-MM-dd')
export const nowMinutes = () => {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

const DAYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const dayKeyOf = (dateStr: string): DayKey => DAYS[parseISO(dateStr).getDay()]

export const ageOf = (dob: string) => (dob ? differenceInYears(new Date(), parseISO(dob)) : 0)

export const uid = (prefix: string) =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const initials = (first: string, last = '') => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

export function formatDate(dateStr: string, pattern = 'dd MMM yyyy', locale?: Locale) {
  try {
    return format(parseISO(dateStr), pattern, { locale })
  } catch {
    return dateStr
  }
}
