import { NavLink } from 'react-router-dom'
import {
  BarChart3, Bell, CalendarDays, ChevronsLeft, ChevronsRight, Inbox, LayoutDashboard, Receipt, Settings, Stethoscope, Users, X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUI } from '../../store/ui'
import { useCurrentUser } from '../../store/auth'
import { useData } from '../../store/data'
import { Logo } from '../ui/misc'
import type { Role } from '../../types'

const items: { to: string; key: string; icon: typeof Users; roles?: Role[] }[] = [
  { to: '/', key: 'dashboard', icon: LayoutDashboard },
  { to: '/appointments', key: 'appointments', icon: CalendarDays },
  { to: '/patients', key: 'patients', icon: Users },
  { to: '/treatments', key: 'treatments', icon: Stethoscope },
  { to: '/billing', key: 'billing', icon: Receipt },
  { to: '/reminders', key: 'reminders', icon: Bell },
  { to: '/requests', key: 'requests', icon: Inbox },
  { to: '/reports', key: 'reports', icon: BarChart3, roles: ['admin'] },
  { to: '/settings', key: 'settings', icon: Settings, roles: ['admin'] },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useUI()
  const user = useCurrentUser()
  const clinic = useData((s) => s.db.settings.cabinet)
  const pending = useData((s) => s.db.bookingRequests.filter((b) => b.status === 'Pending').length)
  const visible = items.filter((i) => !i.roles || (user && i.roles.includes(user.role)))

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-ink-950/60 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-ink-900 text-slate-300 transition-all duration-200 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'} w-64`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            {clinic.logo ? <img src={clinic.logo} alt="" className="h-9 w-9 rounded-xl object-cover" /> : <Logo />}
            {!collapsed && <span className="truncate font-display text-lg font-bold text-white">{clinic.name.split(' ')[0]}</span>}
          </div>
          <button className="icon-btn text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto px-3" aria-label="Main">
          {visible.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? t(`nav.${key}`) : undefined}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-600 text-white' : 'hover:bg-white/10 hover:text-white'
                } ${collapsed ? 'lg:justify-center' : ''}`
              }
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{t(`nav.${key}`)}</span>}
              {key === 'requests' && pending > 0 && (
                <span className={`rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-ink-950 ${collapsed ? 'lg:hidden' : ''}`}>{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white" onClick={toggleCollapsed} aria-label={t('nav.collapse')}>
            {collapsed ? <ChevronsRight size={18} /> : (<><ChevronsLeft size={18} /> {t('nav.collapse')}</>)}
          </button>
        </div>
      </aside>
    </>
  )
}
