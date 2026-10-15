import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useData } from '../store/data'
import { useCurrentUser } from '../store/auth'
import Field from '../components/ui/Field'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Avatar, PageHeader } from '../components/ui/misc'
import { readFileAsDataUrl } from '../utils/format'
import { uid } from '../utils/time'
import { DAY_KEYS, type Settings, type User } from '../types'

type Tab = 'cabinet' | 'hours' | 'holidays' | 'staff' | 'data'

/* ---------- Cabinet info ---------- */
function CabinetTab({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const update = useData((s) => s.updateSettings)
  const fileRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState<string | null>(settings.cabinet.logo)
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(1, 'validation.required'), address: z.string(), phone: z.string(), email: z.string().email('validation.email').or(z.literal('')), currency: z.string().min(1) })),
    defaultValues: { name: settings.cabinet.name, address: settings.cabinet.address, phone: settings.cabinet.phone, email: settings.cabinet.email, currency: settings.cabinet.currency },
  })
  return (
    <form className="grid max-w-2xl gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit((v) => { update({ ...settings, cabinet: { ...v, logo } }); toast.success(t('settings.saved')) })}>
      <div className="flex items-center gap-4 sm:col-span-2">
        {logo ? <img src={logo} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <Avatar name={settings.cabinet.name} size={64} />}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setLogo(await readFileAsDataUrl(f)) }} />
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('settings.logo')}</button>
        {logo && <button type="button" className="btn-ghost" onClick={() => setLogo(null)}>{t('common.delete')}</button>}
      </div>
      <Field label={t('common.name')} error={errors.name?.message} className="sm:col-span-2"><input className="input" {...register('name')} /></Field>
      <Field label={t('common.address')} className="sm:col-span-2"><input className="input" {...register('address')} /></Field>
      <Field label={t('common.phone')}><input className="input" {...register('phone')} /></Field>
      <Field label={t('common.email')} error={errors.email?.message}><input className="input" {...register('email')} /></Field>
      <Field label={t('settings.currency')}><input className="input" maxLength={3} {...register('currency')} /></Field>
      <div className="sm:col-span-2"><button className="btn-primary">{t('common.save')}</button></div>
    </form>
  )
}

/* ---------- Working hours + slots ---------- */
function HoursTab({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const update = useData((s) => s.updateSettings)
  const [hours, setHours] = useState(settings.workingHours)
  const [slot, setSlot] = useState(settings.slotDuration)
  const [remind, setRemind] = useState(settings.reminderHoursBefore)

  return (
    <div className="max-w-3xl">
      <div className="card divide-y divide-slate-100 dark:divide-white/5">
        {DAY_KEYS.map((k) => {
          const h = hours[k]
          const set = (patch: Partial<typeof h>) => setHours({ ...hours, [k]: { ...h, ...patch } })
          return (
            <div key={k} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <label className="flex w-36 items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={h.open} onChange={(e) => set(e.target.checked ? { open: true, start: h.start ?? '09:00', end: h.end ?? '17:00' } : { open: false })} />
                {t(`days.${k}`)}
              </label>
              {h.open ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <input type="time" className="input w-auto" value={h.start ?? ''} onChange={(e) => set({ start: e.target.value })} aria-label={t('settings.opens')} />
                  <span>–</span>
                  <input type="time" className="input w-auto" value={h.end ?? ''} onChange={(e) => set({ end: e.target.value })} aria-label={t('settings.closes')} />
                  <span className="ml-2 text-slate-500">{t('settings.break')}</span>
                  <input type="time" className="input w-auto" value={h.breakStart ?? ''} onChange={(e) => set({ breakStart: e.target.value || null })} aria-label={t('settings.break')} />
                  <span>–</span>
                  <input type="time" className="input w-auto" value={h.breakEnd ?? ''} onChange={(e) => set({ breakEnd: e.target.value || null })} aria-label={t('settings.break')} />
                </div>
              ) : <span className="text-sm text-slate-400">{t('settings.closed')}</span>}
            </div>
          )
        })}
      </div>
      <div className="mt-5 grid max-w-md gap-4 sm:grid-cols-2">
        <Field label={t('settings.slot')}>
          <select className="input" value={slot} onChange={(e) => setSlot(Number(e.target.value))}>{[10, 15, 20, 30, 60].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
        </Field>
        <Field label={t('settings.remindBefore')}>
          <select className="input" value={remind} onChange={(e) => setRemind(Number(e.target.value))}>{[2, 12, 24, 48].map((h) => <option key={h} value={h}>{h} h</option>)}</select>
        </Field>
      </div>
      <button className="btn-primary mt-5" onClick={() => { update({ ...settings, workingHours: hours, slotDuration: slot, reminderHoursBefore: remind }); toast.success(t('settings.saved')) }}>{t('common.save')}</button>
    </div>
  )
}

/* ---------- Holidays ---------- */
function HolidaysTab({ settings }: { settings: Settings }) {
  const { t } = useTranslation()
  const update = useData((s) => s.updateSettings)
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const list = [...settings.holidays].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <div className="max-w-xl">
      <div className="flex flex-wrap items-end gap-2">
        <Field label={t('common.date')}><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={t('common.name')} className="min-w-[160px] flex-1"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <button className="btn-primary mb-0.5" disabled={!date || !name} onClick={() => { update({ ...settings, holidays: [...settings.holidays, { date, name }] }); setDate(''); setName('') }}><Plus size={16} /> {t('common.add')}</button>
      </div>
      <ul className="card mt-5 divide-y divide-slate-100 dark:divide-white/5">
        {list.length === 0 && <li className="p-4 text-sm text-slate-500">{t('settings.noHolidays')}</li>}
        {list.map((h) => (
          <li key={h.date + h.name} className="flex items-center justify-between px-4 py-3 text-sm">
            <span><span className="font-semibold">{h.date}</span> · {h.name}</span>
            <button className="icon-btn hover:text-red-600" aria-label={t('common.delete')} onClick={() => update({ ...settings, holidays: settings.holidays.filter((x) => x !== h) })}><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- Staff ---------- */
const staffSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  email: z.string().min(1, 'validation.required').email('validation.email'),
  password: z.string().min(6, 'validation.password'),
  role: z.enum(['admin', 'secretary']),
  specialty: z.string().optional(),
  phone: z.string().optional(),
})

function StaffForm({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { t } = useTranslation()
  const { db, upsert } = useData()
  const { register, handleSubmit, setError, formState: { errors } } = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', password: user?.password ?? '', role: user?.role ?? 'secretary', specialty: user?.specialty ?? '', phone: user?.phone ?? '' },
  })
  return (
    <Modal open title={t(user ? 'settings.editStaff' : 'settings.newStaff')} onClose={onClose}>
      <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit((v) => {
        if (db.users.some((u) => u.id !== user?.id && u.email.toLowerCase() === v.email.toLowerCase())) return setError('email', { message: 'validation.emailTaken' })
        upsert('users', { id: user?.id ?? uid('u'), avatar: null, language: user?.language ?? 'en', ...v, specialty: v.specialty || null, phone: v.phone ?? '' })
        toast.success(t('settings.saved'))
        onClose()
      })}>
        <Field label={t('common.name')} error={errors.name?.message} className="sm:col-span-2"><input className="input" {...register('name')} /></Field>
        <Field label={t('common.email')} error={errors.email?.message}><input className="input" {...register('email')} /></Field>
        <Field label={t('auth.password')} error={errors.password?.message}><input className="input" type="text" {...register('password')} /></Field>
        <Field label={t('settings.role')}>
          <select className="input" {...register('role')}><option value="admin">{t('roles.admin')}</option><option value="secretary">{t('roles.secretary')}</option></select>
        </Field>
        <Field label={t('common.phone')}><input className="input" {...register('phone')} /></Field>
        <Field label={t('settings.specialty')} className="sm:col-span-2"><input className="input" {...register('specialty')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button><button className="btn-primary">{t('common.save')}</button></div>
      </form>
    </Modal>
  )
}

function StaffTab() {
  const { t } = useTranslation()
  const { db, remove } = useData()
  const me = useCurrentUser()
  const [editing, setEditing] = useState<User | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<User | null>(null)
  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex justify-end"><button className="btn-primary" onClick={() => setEditing(null)}><Plus size={16} /> {t('settings.newStaff')}</button></div>
      <ul className="card divide-y divide-slate-100 dark:divide-white/5">
        {db.users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={u.name.replace('Dr. ', '')} />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.name}</p><p className="truncate text-sm text-slate-500">{u.email} · {t(`roles.${u.role}`)}</p></div>
            <button className="icon-btn" aria-label={t('common.edit')} onClick={() => setEditing(u)}><Pencil size={15} /></button>
            <button className="icon-btn hover:text-red-600 disabled:opacity-30" disabled={u.id === me?.id} aria-label={t('common.delete')} onClick={() => setToDelete(u)}><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
      {editing !== undefined && <StaffForm user={editing} onClose={() => setEditing(undefined)} />}
      <ConfirmDialog open={Boolean(toDelete)} title={t('settings.deleteStaff')} message={t('settings.deleteStaffMsg')} confirmLabel={t('common.delete')} onClose={() => setToDelete(null)} onConfirm={() => toDelete && remove('users', toDelete.id)} />
    </div>
  )
}

/* ---------- Data ---------- */
function DataTab() {
  const { t } = useTranslation()
  const reset = useData((s) => s.reset)
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="card max-w-xl p-5">
      <h2 className="text-lg font-bold">{t('settings.resetTitle')}</h2>
      <p className="mt-1 text-sm text-slate-500">{t('settings.resetText')}</p>
      <button className="btn-danger mt-4" onClick={() => setConfirm(true)}>{t('settings.reset')}</button>
      <ConfirmDialog open={confirm} title={t('settings.resetTitle')} message={t('settings.resetConfirm')} confirmLabel={t('settings.reset')} onClose={() => setConfirm(false)} onConfirm={() => { reset(); toast.success(t('settings.resetDone')) }} />
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const settings = useData((s) => s.db.settings)
  const [tab, setTab] = useState<Tab>('cabinet')
  const tabs: Tab[] = ['cabinet', 'hours', 'holidays', 'staff', 'data']
  return (
    <>
      <PageHeader title={t('nav.settings')} subtitle={t('settings.subtitle')} />
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10" role="tablist">
        {tabs.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>{t(`settings.tab_${k}`)}</button>
        ))}
      </div>
      {tab === 'cabinet' && <CabinetTab settings={settings} />}
      {tab === 'hours' && <HoursTab settings={settings} />}
      {tab === 'holidays' && <HolidaysTab settings={settings} />}
      {tab === 'staff' && <StaffTab />}
      {tab === 'data' && <DataTab />}
    </>
  )
}
