import { useTranslation } from 'react-i18next'
import type { AppointmentStatus, PaymentStatus } from '../../types'

export const STATUS_STYLE: Record<AppointmentStatus, { badge: string; color: string }> = {
  Scheduled: { badge: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300', color: '#0ea5e9' },
  Confirmed: { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300', color: '#6366f1' },
  Completed: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300', color: '#10b981' },
  Cancelled: { badge: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300', color: '#ef4444' },
  'No-show': { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300', color: '#f59e0b' },
}

const PAY_STYLE: Record<PaymentStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  Partial: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  Unpaid: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
}

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold'

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation()
  return (
    <span className={`${base} ${STATUS_STYLE[status].badge}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_STYLE[status].color }} />
      {t(`status.${status}`)}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation()
  return <span className={`${base} ${PAY_STYLE[status]}`}>{t(`payment.${status}`)}</span>
}
