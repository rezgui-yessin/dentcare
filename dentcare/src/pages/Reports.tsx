import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, subMonths } from 'date-fns'
import { fr as frLocale } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '../store/data'
import { PageHeader } from '../components/ui/misc'
import { formatMoney } from '../utils/format'

export default function Reports() {
  const { t, i18n } = useTranslation()
  const db = useData((s) => s.db)
  const cur = db.settings.cabinet.currency
  const locale = i18n.language === 'fr' ? frLocale : undefined

  const d = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i)
      const key = format(m, 'yyyy-MM')
      return {
        label: format(m, 'MMM', { locale }),
        billed: db.invoices.filter((x) => x.date.startsWith(key)).reduce((s, x) => s + x.total, 0),
        collected: db.invoices.filter((x) => x.date.startsWith(key)).reduce((s, x) => s + x.amountPaid, 0),
      }
    })
    const byTreatment = db.treatments
      .map((tr) => ({ name: tr.name, color: tr.color, count: db.appointments.filter((a) => a.treatmentId === tr.id && a.status === 'Completed').length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
    const past = db.appointments.filter((a) => a.status === 'Completed' || a.status === 'No-show' || a.status === 'Cancelled')
    const rate = (s: string) => (past.length ? Math.round((past.filter((a) => a.status === s).length / past.length) * 100) : 0)
    return { months, byTreatment, noShow: rate('No-show'), cancelled: rate('Cancelled'), completed: rate('Completed') }
  }, [db, locale])

  return (
    <>
      <PageHeader title={t('nav.reports')} subtitle={t('reports.subtitle')} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[[t('reports.completedRate'), d.completed], [t('reports.noShowRate'), d.noShow], [t('reports.cancelRate'), d.cancelled]].map(([l, v]) => (
          <div key={l as string} className="card p-5"><p className="text-sm text-slate-500">{l}</p><p className="font-display text-3xl font-bold">{v}%</p></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">{t('reports.revenue')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.months} margin={{ left: 0, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.25)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v: number) => formatMoney(v, cur, i18n.language)} cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                <Bar dataKey="billed" name={t('billing.billed')} fill="#8fd6cd" radius={[6, 6, 0, 0]} />
                <Bar dataKey="collected" name={t('billing.collected')} fill="#16807a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-bold">{t('reports.topTreatments')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.byTreatment} layout="vertical" margin={{ left: 10, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,.25)" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,.12)' }} />
                <Bar dataKey="count" name={t('reports.count')} fill="#16807a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  )
}
