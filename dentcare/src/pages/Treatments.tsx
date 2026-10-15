import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '../store/data'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/misc'
import { formatMoney } from '../utils/format'
import { uid } from '../utils/time'
import type { Treatment } from '../types'

const schema = z.object({
  name: z.string().min(1, 'validation.required'),
  category: z.string().min(1, 'validation.required'),
  defaultDuration: z.number({ invalid_type_error: 'validation.required' }).min(5, 'validation.minDuration'),
  price: z.number({ invalid_type_error: 'validation.required' }).min(0, 'validation.positive'),
  color: z.string(),
  active: z.boolean(),
})
type Values = z.infer<typeof schema>

function TreatmentForm({ item, onClose }: { item: Treatment | null; onClose: () => void }) {
  const { t } = useTranslation()
  const upsert = useData((s) => s.upsert)
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: item ?? { name: '', category: '', defaultDuration: 30, price: 0, color: '#16807a', active: true },
  })
  return (
    <Modal open title={t(item ? 'treatments.edit' : 'treatments.new')} onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={handleSubmit((v) => {
          upsert('treatments', { id: item?.id ?? uid('t'), ...v })
          toast.success(t('treatments.saved'))
          onClose()
        })}
      >
        <Field label={t('common.name')} error={errors.name?.message} className="sm:col-span-2"><input className="input" {...register('name')} /></Field>
        <Field label={t('treatments.category')} error={errors.category?.message}><input className="input" {...register('category')} /></Field>
        <Field label={t('treatments.color')}><input type="color" className="input h-10 p-1" {...register('color')} /></Field>
        <Field label={t('treatments.duration')} error={errors.defaultDuration?.message}><input type="number" step={5} className="input" {...register('defaultDuration', { valueAsNumber: true })} /></Field>
        <Field label={t('treatments.price')} error={errors.price?.message}><input type="number" className="input" {...register('price', { valueAsNumber: true })} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" className="h-4 w-4 accent-brand-600" {...register('active')} /> {t('treatments.active')}</label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Treatments() {
  const { t, i18n } = useTranslation()
  const { db, remove } = useData()
  const [editing, setEditing] = useState<Treatment | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Treatment | null>(null)
  const cur = db.settings.cabinet.currency

  return (
    <>
      <PageHeader title={t('nav.treatments')} subtitle={t('treatments.subtitle')} actions={<button className="btn-primary" onClick={() => setEditing(null)}><Plus size={16} /> {t('treatments.new')}</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {db.treatments.map((x) => (
          <article key={x.id} className={`card relative overflow-hidden p-5 ${x.active ? '' : 'opacity-60'}`}>
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: x.color }} />
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold">{x.name}</h3>
                <p className="text-sm text-slate-500">{x.category}{!x.active && ` · ${t('treatments.inactive')}`}</p>
              </div>
              <div className="flex">
                <button className="icon-btn" onClick={() => setEditing(x)} aria-label={t('common.edit')}><Pencil size={15} /></button>
                <button className="icon-btn hover:text-red-600" onClick={() => setToDelete(x)} aria-label={t('common.delete')}><Trash2 size={15} /></button>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-2xl font-bold">{formatMoney(x.price, cur, i18n.language)}</p>
              <p className="flex items-center gap-1 text-sm text-slate-500"><Clock size={14} /> {x.defaultDuration} min</p>
            </div>
          </article>
        ))}
      </div>
      {editing !== undefined && <TreatmentForm item={editing} onClose={() => setEditing(undefined)} />}
      <ConfirmDialog open={Boolean(toDelete)} title={t('treatments.deleteTitle')} message={t('treatments.deleteMsg')} confirmLabel={t('common.delete')} onClose={() => setToDelete(null)} onConfirm={() => toDelete && remove('treatments', toDelete.id)} />
    </>
  )
}
