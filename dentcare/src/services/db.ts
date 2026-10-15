/**
 * Mock API layer – all data lives in localStorage under one key.
 * To use a real backend later, replace loadDb/saveDb (and the store actions that call
 * them) with fetch()/axios calls to your REST API. The data shapes are in src/types.
 */
import { differenceInCalendarDays, addDays, format, parseISO } from 'date-fns'
import seed from '../data/db.json'
import type { DB } from '../types'

const KEY = 'dentcare_db'
const SEED_ANCHOR = '2026-10-14' // the date the seed data was generated around

const shiftDate = (s: string, days: number) => format(addDays(parseISO(s), days), 'yyyy-MM-dd')
const shiftIso = (s: string, days: number) => shiftDate(s.slice(0, 10), days) + s.slice(10)

/**
 * Re-anchors the demo data so the dashboard always has "today's" appointments.
 * Shifts by whole weeks so weekdays (and working-hour rules) stay valid.
 */
export function buildSeed(): DB {
  const db = JSON.parse(JSON.stringify(seed)) as DB
  const weeks = Math.round(differenceInCalendarDays(new Date(), parseISO(SEED_ANCHOR)) / 7)
  const off = weeks * 7
  if (off === 0) return db
  db.appointments.forEach((a) => (a.date = shiftDate(a.date, off)))
  db.invoices.forEach((i) => (i.date = shiftDate(i.date, off)))
  db.reminders.forEach((r) => (r.scheduledFor = shiftIso(r.scheduledFor, off)))
  db.bookingRequests.forEach((b) => {
    b.preferredDate = shiftDate(b.preferredDate, off)
    b.createdAt = shiftIso(b.createdAt, off)
  })
  return db
}

export function loadDb(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch {
    /* corrupted storage – fall through to seed */
  }
  const db = buildSeed()
  saveDb(db)
  return db
}

export function saveDb(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch (e) {
    console.error('Could not save to localStorage (quota exceeded?)', e)
  }
}

export function resetDb(): DB {
  const db = buildSeed()
  saveDb(db)
  return db
}
