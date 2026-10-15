import { create } from 'zustand'
import { useData } from './data'
import type { User } from '../types'

const KEY = 'dentcare_auth'

interface AuthState {
  userId: string | null
  login: (email: string, password: string) => User | null
  logout: () => void
}

/** Mock authentication: checks credentials against db.users. Replace with a real API + JWT later. */
export const useAuth = create<AuthState>((set) => ({
  userId: localStorage.getItem(KEY),
  login: (email, password) => {
    const user = useData
      .getState()
      .db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password)
    if (!user) return null
    localStorage.setItem(KEY, user.id)
    set({ userId: user.id })
    return user
  },
  logout: () => {
    localStorage.removeItem(KEY)
    set({ userId: null })
  },
}))

export const useCurrentUser = (): User | null => {
  const id = useAuth((s) => s.userId)
  return useData((s) => s.db.users.find((u) => u.id === id)) ?? null
}
