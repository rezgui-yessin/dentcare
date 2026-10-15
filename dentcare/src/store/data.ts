import { create } from 'zustand'
import { loadDb, resetDb, saveDb } from '../services/db'
import type { Collection, DB, Settings } from '../types'

type Item<K extends Collection> = DB[K][number]

interface DataState {
  db: DB
  upsert: <K extends Collection>(collection: K, item: Item<K>) => void
  remove: (collection: Collection, id: string) => void
  updateSettings: (settings: Settings) => void
  reset: () => void
}

export const useData = create<DataState>((set) => ({
  db: loadDb(),
  upsert: (collection, item) =>
    set((state) => {
      const list = state.db[collection] as unknown as { id: string }[]
      const exists = list.some((x) => x.id === (item as { id: string }).id)
      const next = exists ? list.map((x) => (x.id === (item as { id: string }).id ? item : x)) : [...list, item]
      const db = { ...state.db, [collection]: next } as DB
      saveDb(db)
      return { db }
    }),
  remove: (collection, id) =>
    set((state) => {
      const list = state.db[collection] as unknown as { id: string }[]
      const db = { ...state.db, [collection]: list.filter((x) => x.id !== id) } as DB
      saveDb(db)
      return { db }
    }),
  updateSettings: (settings) =>
    set((state) => {
      const db = { ...state.db, settings }
      saveDb(db)
      return { db }
    }),
  reset: () => set({ db: resetDb() }),
}))
