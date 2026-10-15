import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { CalendarCheck, Languages, Moon, Sun, Users, Receipt } from 'lucide-react'
import { useAuth, useCurrentUser } from '../store/auth'
import { useUI } from '../store/ui'
import { useData } from '../store/data'
import Field from '../components/ui/Field'
import { Logo } from '../components/ui/misc'

const schema = z.object({
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(1, 'validation.required'),
})
type Values = z.infer<typeof schema>

export default function Login() {
  const { t, i18n } = useTranslation()
  const login = useAuth((s) => s.login)
  const user = useCurrentUser()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useUI()
  const clinic = useData((s) => s.db.settings.cabinet)
  const {
    register, handleSubmit, setValue, formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  const onSubmit = (v: Values) => {
    const u = login(v.email, v.password)
    if (!u) return toast.error(t('auth.invalid'))
    toast.success(t('auth.welcome', { name: u.name }))
    navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
  }

  const demo = (email: string, password: string) => {
    setValue('email', email)
    setValue('password', password)
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <span className="font-display text-2xl font-bold">{clinic.name}</span>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-5xl font-bold leading-[1.08]">{t('auth.heroTitle')}</h1>
          <p className="mt-5 text-lg text-slate-300">{t('auth.heroText')}</p>
          <ul className="mt-10 space-y-4 text-slate-200">
            {[
              [CalendarCheck, t('auth.feature1')],
              [Users, t('auth.feature2')],
              [Receipt, t('auth.feature3')],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Users
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="rounded-lg bg-white/10 p-2"><I size={18} /></span>
                  {text as string}
                </li>
              )
            })}
          </ul>
        </div>
        {/* decorative arcs */}
        <svg className="absolute -bottom-24 -right-24 h-[420px] w-[420px] text-brand-600/30" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          {[30, 50, 70, 90].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
        </svg>
        <p className="relative z-10 text-sm text-slate-400">{clinic.address}</p>
      </section>

      <section className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex justify-end gap-1">
          <button className="icon-btn w-auto gap-1 px-2 text-xs font-bold" onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')} aria-label={t('common.language')}>
            <Languages size={16} /> {i18n.language.toUpperCase()}
          </button>
          <button className="icon-btn" onClick={toggleTheme} aria-label={t('common.toggleTheme')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><Logo /><span className="font-display text-xl font-bold">{clinic.name}</span></div>
          <h2 className="text-3xl font-bold">{t('auth.signIn')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('auth.signInHint')}</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <Field label={t('auth.email')} error={errors.email?.message}>
              <input className="input" type="email" autoComplete="username" {...register('email')} />
            </Field>
            <Field label={t('auth.password')} error={errors.password?.message}>
              <input className="input" type="password" autoComplete="current-password" {...register('password')} />
            </Field>
            <button className="btn-primary w-full py-2.5" disabled={isSubmitting}>{t('auth.signIn')}</button>
          </form>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-white/15">
            <p className="text-sm font-semibold">{t('auth.demoAccounts')}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary btn-sm" onClick={() => demo('doctor@dentcare.com', 'doctor123')}>{t('roles.admin')}</button>
              <button type="button" className="btn-secondary btn-sm" onClick={() => demo('secretary@dentcare.com', 'secretary123')}>{t('roles.secretary')}</button>
            </div>
          </div>

          <Link to="/book" className="mt-6 text-center text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t('auth.bookOnline')}
          </Link>
        </div>
      </section>
    </div>
  )
}
