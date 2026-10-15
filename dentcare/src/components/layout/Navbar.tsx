import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, Languages, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUI } from '../../store/ui'
import { useAuth, useCurrentUser } from '../../store/auth'
import { Avatar } from '../ui/misc'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme, setMobileOpen } = useUI()
  const logout = useAuth((s) => s.logout)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur dark:border-white/10 dark:bg-ink-950/85 sm:px-6">
      <button className="icon-btn lg:hidden" onClick={() => setMobileOpen(true)} aria-label={t('nav.menu')}>
        <Menu size={20} />
      </button>
      <div className="flex-1" />

      <button className="btn-primary btn-sm hidden sm:inline-flex" onClick={() => navigate('/appointments?new=1')}>
        <Plus size={15} /> {t('appointments.new')}
      </button>

      <button
        className="icon-btn w-auto gap-1 px-2 text-xs font-bold"
        onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}
        aria-label={t('common.language')}
        title={t('common.language')}
      >
        <Languages size={17} /> {i18n.language.toUpperCase()}
      </button>
      <button className="icon-btn" onClick={toggleTheme} aria-label={t('common.toggleTheme')} title={t('common.toggleTheme')}>
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="relative" ref={ref}>
        <button className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
          <Avatar name={user?.name.replace('Dr. ', '') ?? '?'} />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold">{user?.name}</span>
            <span className="block text-xs text-slate-500">{user ? t(`roles.${user.role}`) : ''}</span>
          </span>
        </button>
        {open && (
          <div className="card absolute right-0 mt-2 w-52 p-1.5 shadow-xl" role="menu">
            <div className="px-3 py-2 text-xs text-slate-500">{user?.email}</div>
            <button
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              <LogOut size={16} /> {t('auth.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
