import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Bell, Mail, MessageSquare, Send } from 'lucide-react'
import { useData } from '../store/data'
import { useLookups } from '../hooks/useLookups'
import { useSendReminder } from '../hooks/useReminders'
import { StatusBadge } from '../components/ui/StatusBadge'
import { EmptyState, PageHeader } from '../components/ui/misc'
import { formatDate, todayStr, toDateStr } from '../utils/time'
import { addDays } from 'date-fns'

export default function Reminders() {
  const { t } = useTranslation()
  const db = useData((s) => s.db)
  const { patientName, patients, treatments } = useLookups()
  const send = useSendReminder()
  const [days, setDays] = useState(7)

  const upcoming = useMemo(() => {
    const today = todayStr()
    const end = toDateStr(addDays(new Date(), days))
    return db.appointments
      .filter((a) => a.date >= today && a.date <= end && (a.status === 'Scheduled' || a.status === 'Confirmed'))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
  }, [db.appointments, days])

  const reminderOf = (id: string) => db.reminders.find((r) => r.appointmentId === id)
  const pending = upcoming.filter((a) => !reminderOf(a.id)?.sent)
  const log = db.reminders.filter((r) => r.sent).sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor)).slice(0, 8)

  const sendAll = () => {
    pending.forEach((a) => send(a, patients.get(a.patientId)?.email ? 'Email' : 'SMS'))
    toast.success(t('reminders.allSent', { count: pending.length }))
  }

  return (
    <>
      <PageHeader
        title={t('nav.reminders')}
        subtitle={t('reminders.subtitle', { hours: db.settings.reminderHoursBefore })}
        actions={
          <>
            <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label={t('reminders.range')}>
              {[1, 3, 7, 14].map((d) => <option key={d} value={d}>{t('reminders.nextDays', { count: d })}</option>)}
            </select>
            <button className="btn-primary" disabled={pending.length === 0} onClick={sendAll}><Send size={16} /> {t('reminders.sendAll', { count: pending.length })}</button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          {upcoming.length === 0 ? <EmptyState icon={<Bell />} title={t('reminders.empty')} /> : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {upcoming.map((a) => {
                const r = reminderOf(a.id)
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="w-28 shrink-0 text-sm"><p className="font-semibold">{formatDate(a.date, 'EEE dd MMM')}</p><p className="text-slate-500">{a.startTime}</p></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{patientName(a.patientId)}</p>
                      <p className="truncate text-sm text-slate-500">{treatments.get(a.treatmentId)?.name} · {patients.get(a.patientId)?.phone}</p>
                    </div>
                    <StatusBadge status={a.status} />
                    {r?.sent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">{r.channel === 'SMS' ? <MessageSquare size={14} /> : <Mail size={14} />} {t('reminders.sent')}</span>
                    ) : (
                      <div className="flex gap-1.5">
                        <button className="btn-secondary btn-sm" onClick={() => send(a, 'SMS')}><MessageSquare size={14} /> SMS</button>
                        <button className="btn-secondary btn-sm" onClick={() => send(a, 'Email')}><Mail size={14} /> Email</button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-lg font-bold">{t('reminders.log')}</h2>
          {log.length === 0 ? <p className="text-sm text-slate-500">{t('reminders.noLog')}</p> : (
            <ul className="space-y-3">
              {log.map((r) => (
                <li key={r.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                  <p className="flex items-center gap-1.5 font-semibold">{r.channel === 'SMS' ? <MessageSquare size={14} /> : <Mail size={14} />} {patientName(r.patientId)}</p>
                  <p className="mt-1 text-xs text-slate-500">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
