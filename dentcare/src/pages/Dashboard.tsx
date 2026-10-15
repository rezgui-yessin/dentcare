import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addDays, addWeeks, endOfWeek, format, startOfWeek } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CalendarCheck, CalendarClock, Inbox, Plus, UserPlus, Users, Wallet } from 'lucide-react'
import { useData } from '../store/data'
import { useCurrentUser } from '../store/auth'
import { useLookups } from '../hooks/useLookups'
import { StatusBadge, STATUS_STYLE } from '../components/ui/StatusBadge'
import { EmptyState, PageHeader } from '../components/ui/misc'
import { formatMoney } from '../utils/format'
import { toDateStr, todayStr } from '../utils/time'
import { APPOINTMENT_STATUSES } from '../types'

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string | number; tone: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className={`rounded-xl p-3 ${tone}`}><Icon size={22} /></div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const db = useData((s) => s.db)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const { patientName, treatments, users } = useLookups()
  const locale = i18n.language === 'fr' ? frLocale : undefined
  const today = todayStr()
  const isAdmin = user?.role === 'admin'

  const data = useMemo(() => {
    const active = db.appointments.filter((a) => a.status !== 'Cancelled')
    const todays = db.appointments.filter((a) => a.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime))
    const weekEnd = toDateStr(endOfWeek(new Date(), { weekStartsOn: 1 }))
    const upcomingWeek = db.appointments.filter((a) => a.date >= today && a.date <= weekEnd && (a.status === 'Scheduled' || a.status === 'Confirmed')).length
    const month = format(new Date(), 'yyyy-MM')
    const revenue = db.invoices.filter((i) => i.date.startsWith(month)).reduce((s, i) => s + i.amountPaid, 0)
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const ws = addWeeks(start, i - 3)
      const from = toDateStr(ws)
      const to = toDateStr(addDays(ws, 6))
      return { label: format(ws, 'd MMM', { locale }), count: active.filter((a) => a.date >= from && a.date <= to).length, current: i === 3 }
    })
    const byStatus = APPOINTMENT_STATUSES.map((s) => ({ name: t(`status.${s}`), key: s, value: db.appointments.filter((a) => a.status === s).length })).filter((x) => x.value)
    return { todays, upcomingWeek, revenue, weeks, byStatus }
  }, [db, today, locale, t])

  const pending = db.bookingRequests.filter((b) => b.status === 'Pending').length
  const now = format(new Date(), 'HH:mm')
  const next = data.todays.find((a) => (a.status === 'Scheduled' || a.status === 'Confirmed') && a.startTime >= now)

  return (
    <>
      <PageHeader
        title={t('dashboard.greeting', { name: user?.name.replace('Dr. ', '').split(' ')[0] })}
        subtitle={format(new Date(), 'EEEE d MMMM yyyy', { locale })}
        actions={
          <>
            <button className="btn-primary" onClick={() => navigate('/appointments?new=1')}><Plus size={16} /> {t('appointments.new')}</button>
            <button className="btn-secondary" onClick={() => navigate('/patients?new=1')}><UserPlus size={16} /> {t('patients.new')}</button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={CalendarCheck} label={t('dashboard.today')} value={data.todays.length} tone="bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300" />
        <Stat icon={CalendarClock} label={t('dashboard.thisWeek')} value={data.upcomingWeek} tone="bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300" />
        <Stat icon={Users} label={t('dashboard.totalPatients')} value={db.patients.length} tone="bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" />
        {isAdmin ? (
          <Stat icon={Wallet} label={t('dashboard.monthlyRevenue')} value={formatMoney(data.revenue, db.settings.cabinet.currency, i18n.language)} tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" />
        ) : (
          <Stat icon={Inbox} label={t('dashboard.pendingRequests')} value={pending} tone="bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
            <h2 className="text-lg font-bold">{t('dashboard.schedule')}</h2>
            <Link to="/appointments" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">{t('dashboard.viewAll')}</Link>
          </div>
          {data.todays.length === 0 ? (
            <EmptyState icon={<CalendarCheck />} title={t('dashboard.noToday')} hint={t('dashboard.noTodayHint')} />
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-white/5">
              {data.todays.map((a) => (
                <li key={a.id} className={`flex items-center gap-4 px-5 py-3.5 ${next?.id === a.id ? 'bg-brand-50/70 dark:bg-brand-400/5' : ''}`}>
                  <div className="w-16 shrink-0 text-center">
                    <p className="font-display text-lg font-bold leading-none">{a.startTime}</p>
                    <p className="mt-1 text-xs text-slate-500">{a.duration} min</p>
                  </div>
                  <div className="h-10 w-1 shrink-0 rounded-full" style={{ background: treatments.get(a.treatmentId)?.color }} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/patients/${a.patientId}`} className="block truncate font-semibold hover:underline">{patientName(a.patientId)}</Link>
                    <p className="truncate text-sm text-slate-500">
                      {treatments.get(a.treatmentId)?.name} · {users.get(a.doctorId)?.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={a.status} />
                    {next?.id === a.id && <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{t('dashboard.next')}</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-bold">{t('dashboard.perWeek')}</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeks} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.25)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                  <Bar dataKey="count" name={t('nav.appointments')} radius={[6, 6, 0, 0]}>
                    {data.weeks.map((w, i) => <Cell key={i} fill={w.current ? '#16807a' : '#8fd6cd'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="mb-2 text-lg font-bold">{t('dashboard.byStatus')}</h2>
            <div className="flex items-center gap-4">
              <div className="h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byStatus} dataKey="value" innerRadius={38} outerRadius={64} paddingAngle={2} stroke="none">
                      {data.byStatus.map((s) => <Cell key={s.key} fill={STATUS_STYLE[s.key].color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 space-y-1.5 text-sm">
                {data.byStatus.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_STYLE[s.key].color }} />{s.name}</span>
                    <span className="font-semibold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
