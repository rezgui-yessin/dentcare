import { create } from 'zustand'

type Theme = 'light' | 'dark'
const THEME_KEY = 'dentcare_theme'

const applyTheme = (t: Theme) => document.documentElement.classList.toggle('dark', t === 'dark')
const initial: Theme = localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
applyTheme(initial)

interface UIState {
  theme: Theme
  collapsed: boolean
  mobileOpen: boolean
  toggleTheme: () => void
  toggleCollapsed: () => void
  setMobileOpen: (v: boolean) => void
}

export const useUI = create<UIState>((set, get) => ({
  theme: initial,
  collapsed: false,
  mobileOpen: false,
  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, next)
    applyTheme(next)
    set({ theme: next })
  },
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  setMobileOpen: (v) => set({ mobileOpen: v }),
}))
