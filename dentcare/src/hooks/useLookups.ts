import { useMemo } from 'react'
import { useData } from '../store/data'

/** id → entity maps for fast lookups in tables and lists. */
export function useLookups() {
  const db = useData((s) => s.db)
  return useMemo(() => {
    const patients = new Map(db.patients.map((p) => [p.id, p]))
    const treatments = new Map(db.treatments.map((t) => [t.id, t]))
    const users = new Map(db.users.map((u) => [u.id, u]))
    const patientName = (id: string) => {
      const p = patients.get(id)
      return p ? `${p.firstName} ${p.lastName}` : '—'
    }
    const doctors = db.users.filter((u) => u.role === 'admin')
    return { patients, treatments, users, patientName, doctors }
  }, [db])
}
