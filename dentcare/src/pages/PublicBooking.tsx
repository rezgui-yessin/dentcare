import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Languages, MapPin, Moon, Phone, Sun } from 'lucide-react'
import { useData } from '../store/data'
import { useUI } from '../store/ui'
import Field from '../components/ui/Field'
import { Logo } from '../components/ui/misc'
import { todayStr, uid } from '../utils/time'

const schema = z.object({
  name: z.string().min(2, 'validation.required'),
  phone: z.string().min(6, 'validation.phone'),
  email: z.string().email('validation.email').or(z.literal('')),
  preferredDate: z.string().min(1, 'validation.required').refine((d) => d >= todayStr(), 'validation.futureDate'),
  preferredTime: z.string().min(1, 'validation.required'),
  reason: z.string().min(3, 'validation.required'),
})
type Values = z.infer<typeof schema>

const TIMES = Array.from({ length: 17 }, (_, i) => {
  const m = 9 * 60 + i * 30
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}).filter((t) => t < '12:30' || t >= '14:00')

/** Public page (no login): patients send a request that appears as "Pending" for the secretary. */
export default function PublicBooking() {
  const { t, i18n } = useTranslation()
  const { db, upsert } = useData()
  const { theme, toggleTheme } = useUI()
  const [done, setDone] = useState(false)
  const clinic = db.settings.cabinet
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { preferredTime: '09:00' } })

  const onSubmit = (v: Values) => {
    upsert('bookingRequests', { id: uid('br'), ...v, email: v.email || null, status: 'Pending', createdAt: new Date().toISOString() })
    setDone(true)
    reset()
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950">
      <header className="border-b border-slate-200/80 bg-white dark:border-white/10 dark:bg-ink-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/login" className="flex items-center gap-3"><Logo /><span className="font-display text-lg font-bold">{clinic.name}</span></Link>
          <div className="flex gap-1">
            <button className="icon-btn w-auto gap-1 px-2 text-xs font-bold" onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')} aria-label={t('common.language')}><Languages size={16} /> {i18n.language.toUpperCase()}</button>
            <button className="icon-btn" onClick={toggleTheme} aria-label={t('common.toggleTheme')}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('booking.title')}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">{t('booking.subtitle')}</p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{clinic.address}</span>
          <span className="inline-flex items-center gap-1.5"><Phone size={14} />{clinic.phone}</span>
        </p>

        {done ? (
          <div className="card mt-8 flex flex-col items-center p-10 text-center">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <h2 className="mt-4 text-2xl font-bold">{t('booking.sentTitle')}</h2>
            <p className="mt-2 max-w-md text-slate-600 dark:text-slate-300">{t('booking.sentText')}</p>
            <button className="btn-secondary mt-6" onClick={() => setDone(false)}>{t('booking.another')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card mt-8 grid gap-4 p-6 sm:grid-cols-2" noValidate>
            <Field label={t('booking.name')} error={errors.name?.message}><input className="input" autoComplete="name" {...register('name')} /></Field>
            <Field label={t('common.phone')} error={errors.phone?.message}><input className="input" type="tel" autoComplete="tel" {...register('phone')} /></Field>
            <Field label={`${t('common.email')} (${t('common.optional')})`} error={errors.email?.message} className="sm:col-span-2"><input className="input" type="email" autoComplete="email" {...register('email')} /></Field>
            <Field label={t('booking.date')} error={errors.preferredDate?.message}><input type="date" min={todayStr()} className="input" {...register('preferredDate')} /></Field>
            <Field label={t('booking.time')} error={errors.preferredTime?.message}>
              <select className="input" {...register('preferredTime')}>{TIMES.map((x) => <option key={x}>{x}</option>)}</select>
            </Field>
            <Field label={t('booking.reason')} error={errors.reason?.message} className="sm:col-span-2"><textarea rows={3} className="input" {...register('reason')} /></Field>
            <button className="btn-primary py-2.5 sm:col-span-2" disabled={isSubmitting}>{t('booking.submit')}</button>
          </form>
        )}
      </main>
    </div>
  )
}
