import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-10 ${className}`} role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, hint, action }: { icon?: ReactNode; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && <div className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-400/10 dark:text-brand-300">{icon}</div>}
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const { t } = useTranslation()
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? t('common.search')}
        aria-label={placeholder ?? t('common.search')}
      />
    </div>
  )
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  const { t } = useTranslation()
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-white/10">
      <span className="text-slate-500">{t('common.pageOf', { page, pages })}</span>
      <div className="flex gap-1">
        <button className="icon-btn" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('common.previous')}>
          <ChevronLeft size={18} />
        </button>
        <button className="icon-btn" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label={t('common.next')}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const parts = name.split(' ').filter(Boolean)
  const text = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ width: size, height: size, background: `hsl(${hue} 55% 90%)`, color: `hsl(${hue} 50% 28%)` }}
      aria-hidden
    >
      {text}
    </span>
  )
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#16807a" />
      <path d="M32 14c-4 0-6.5 2-10.5 2C16.5 16 13 20 13 26c0 5 2.3 8.3 3.5 13 1.2 5 1.5 10.5 3 15.5.8 2.7 2.5 5.200 4.700 5.200 2.700 0 3.500-4 4.500-8 .8-3 1.500-5 4.300-5s3.500 2 4.300 5c1 4 1.800 8 4.500 8 2.200 0 3.900-2.500 4.700-5.200 1.500-5 1.800-10.500 3-15.500C48.700 34.300 51 31 51 26c0-6-3.500-10-8.500-10C38.500 16 36 14 32 14z" transform="translate(0 -5) scale(1 .93)" fill="#fff" />
    </svg>
  )
}
