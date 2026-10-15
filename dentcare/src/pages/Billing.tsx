import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Download, FileText, Pencil, Plus, Printer, Trash2, X } from 'lucide-react'
import { useData } from '../store/data'
import { useLookups } from '../hooks/useLookups'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PaymentBadge } from '../components/ui/StatusBadge'
import { EmptyState, PageHeader, Pagination, SearchInput } from '../components/ui/misc'
import { formatMoney } from '../utils/format'
import { downloadInvoicePdf, printInvoicePdf } from '../utils/invoicePdf'
import { formatDate, todayStr, uid } from '../utils/time'
import type { Invoice, PaymentStatus } from '../types'

const schema = z.object({
  patientId: z.string().min(1, 'validation.required'),
  appointmentId: z.string().optional(),
  date: z.string().min(1, 'validation.required'),
  items: z.array(z.object({
    description: z.string().min(1, 'validation.required'),
    quantity: z.number({ invalid_type_error: 'validation.required' }).min(1),
    unitPrice: z.number({ invalid_type_error: 'validation.required' }).min(0),
  })).min(1),
  discount: z.number({ invalid_type_error: 'validation.required' }).min(0),
  amountPaid: z.number({ invalid_type_error: 'validation.required' }).min(0),
  paymentMethod: z.string().optional(),
})
type Values = z.infer<typeof schema>

const payStatus = (total: number, paid: number): PaymentStatus => (paid <= 0 ? 'Unpaid' : paid >= total ? 'Paid' : 'Partial')

function InvoiceForm({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { db, upsert } = useData()
  const { patientName, treatments } = useLookups()
  const cur = db.settings.cabinet.currency
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: invoice
      ? { patientId: invoice.patientId, appointmentId: invoice.appointmentId ?? '', date: invoice.date, items: invoice.items, discount: invoice.discount, amountPaid: invoice.amountPaid, paymentMethod: invoice.paymentMethod ?? 'Cash' }
      : { patientId: '', appointmentId: '', date: todayStr(), items: [{ description: '', quantity: 1, unitPrice: 0 }], discount: 0, amountPaid: 0, paymentMethod: 'Cash' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const [patientId, items, discount, paid] = watch(['patientId', 'items', 'discount', 'amountPaid'])
  const subtotal = (items ?? []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)
  const total = Math.max(0, subtotal - (Number(discount) || 0))

  const billable = db.appointments.filter(
    (a) => a.patientId === patientId && (a.status === 'Completed') && (a.id === invoice?.appointmentId || !db.invoices.some((i) => i.appointmentId === a.id)),
  )

  const onPickAppointment = (id: string) => {
    const a = db.appointments.find((x) => x.id === id)
    const tr = a && treatments.get(a.treatmentId)
    if (tr) setValue('items', [{ description: tr.name, quantity: 1, unitPrice: tr.price }])
  }

  const onSubmit = (v: Values) => {
    const sub = v.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const tot = Math.max(0, sub - v.discount)
    const num = invoice?.number ?? `INV-${new Date().getFullYear()}-${String(db.invoices.length + 1).padStart(4, '0')}`
    upsert('invoices', {
      id: invoice?.id ?? uid('inv'),
      number: num,
      appointmentId: v.appointmentId || null,
      patientId: v.patientId,
      date: v.date,
      items: v.items,
      subtotal: sub,
      discount: v.discount,
      total: tot,
      amountPaid: Math.min(v.amountPaid, tot),
      paymentStatus: payStatus(tot, v.amountPaid),
      paymentMethod: v.amountPaid > 0 ? v.paymentMethod ?? 'Cash' : null,
    })
    toast.success(t('billing.saved'))
    onClose()
  }

  return (
    <Modal open title={t(invoice ? 'billing.edit' : 'billing.new')} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t('appointments.patient')} error={errors.patientId?.message}>
          <select className="input" {...register('patientId', { onChange: () => setValue('appointmentId', '') })}>
            <option value="">{t('common.select')}</option>
            {db.patients.map((p) => <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>)}
          </select>
        </Field>
        <Field label={t('common.date')} error={errors.date?.message}><input type="date" className="input" {...register('date')} /></Field>
        <Field label={t('billing.appointment')} className="sm:col-span-2" hint={t('billing.appointmentHint')}>
          <select className="input" {...register('appointmentId', { onChange: (e) => onPickAppointment(e.target.value) })}>
            <option value="">{t('billing.noAppointment')}</option>
            {billable.map((a) => <option key={a.id} value={a.id}>{formatDate(a.date)} · {treatments.get(a.treatmentId)?.name}</option>)}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <p className="label">{t('billing.items')}</p>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="grid grid-cols-[1fr_70px_100px_32px] items-start gap-2">
                <input className="input" placeholder={t('common.description')} aria-label={t('common.description')} {...register(`items.${i}.description`)} />
                <input type="number" min={1} className="input" aria-label={t('billing.qty')} {...register(`items.${i}.quantity`, { valueAsNumber: true })} />
                <input type="number" min={0} className="input" aria-label={t('billing.unitPrice')} {...register(`items.${i}.unitPrice`, { valueAsNumber: true })} />
                <button type="button" className="icon-btn mt-0.5" onClick={() => fields.length > 1 && remove(i)} aria-label={t('common.delete')}><X size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}><Plus size={14} /> {t('billing.addItem')}</button>
        </div>

        <Field label={t('billing.discount')}><input type="number" min={0} className="input" {...register('discount', { valueAsNumber: true })} /></Field>
        <div className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-white/5">
          <div className="flex justify-between"><span className="text-slate-500">{t('billing.subtotal')}</span><span>{formatMoney(subtotal, cur, i18n.language)}</span></div>
          <div className="mt-1 flex justify-between font-bold"><span>{t('billing.total')}</span><span>{formatMoney(total, cur, i18n.language)}</span></div>
        </div>

        <Field label={t('billing.amountPaid')} hint={paid > 0 ? t(`payment.${payStatus(total, Number(paid))}`) : undefined}><input type="number" min={0} className="input" {...register('amountPaid', { valueAsNumber: true })} /></Field>
        <Field label={t('billing.method')}>
          <select className="input" {...register('paymentMethod')}>
            {['Cash', 'Card', 'Bank transfer', 'Insurance'].map((m) => <option key={m} value={m}>{t(`billing.m_${m}`)}</option>)}
          </select>
        </Field>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}

const PAGE_SIZE = 10

export default function Billing() {
  const { t, i18n } = useTranslation()
  const { db, remove } = useData()
  const { patientName, patients } = useLookups()
  const [editing, setEditing] = useState<Invoice | null | undefined>(undefined)
  const [toDelete, setToDelete] = useState<Invoice | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const cur = db.settings.cabinet.currency
  const money = (n: number) => formatMoney(n, cur, i18n.language)

  const totals = useMemo(() => ({
    billed: db.invoices.reduce((s, i) => s + i.total, 0),
    paid: db.invoices.reduce((s, i) => s + i.amountPaid, 0),
  }), [db.invoices])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return db.invoices
      .filter((i) => (status === 'all' || i.paymentStatus === status) && (!term || `${i.number} ${patientName(i.patientId)}`.toLowerCase().includes(term)))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [db.invoices, q, status, patientName])

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  // completed appointments that still need an invoice
  const toInvoice = db.appointments.filter((a) => a.status === 'Completed' && !db.invoices.some((i) => i.appointmentId === a.id)).length

  return (
    <>
      <PageHeader title={t('nav.billing')} subtitle={t('billing.subtitle')} actions={<button className="btn-primary" onClick={() => setEditing(null)}><Plus size={16} /> {t('billing.new')}</button>} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          [t('billing.billed'), money(totals.billed), ''],
          [t('billing.collected'), money(totals.paid), 'text-emerald-600 dark:text-emerald-400'],
          [t('billing.outstanding'), money(totals.billed - totals.paid), totals.billed - totals.paid > 0 ? 'text-red-600 dark:text-red-400' : ''],
        ].map(([label, value, tone]) => (
          <div key={label} className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className={`font-display text-2xl font-bold ${tone}`}>{value}</p></div>
        ))}
      </div>

      {toInvoice > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          <span>{t('billing.toInvoice', { count: toInvoice })}</span>
          <button className="btn-secondary btn-sm" onClick={() => setEditing(null)}>{t('billing.new')}</button>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder={t('billing.search')} />
          <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label={t('common.status')}>
            <option value="all">{t('common.allStatuses')}</option>
            {(['Paid', 'Partial', 'Unpaid'] as const).map((s) => <option key={s} value={s}>{t(`payment.${s}`)}</option>)}
          </select>
        </div>
        {rows.length === 0 ? <EmptyState icon={<FileText />} title={t('billing.empty')} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head"><tr>
                <th className="th">{t('billing.number')}</th><th className="th">{t('common.date')}</th><th className="th">{t('appointments.patient')}</th>
                <th className="th text-right">{t('billing.total')}</th><th className="th text-right">{t('billing.paid')}</th><th className="th">{t('common.status')}</th><th className="th text-right">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="tr">
                    <td className="td font-semibold">{i.number}</td>
                    <td className="td whitespace-nowrap">{formatDate(i.date)}</td>
                    <td className="td">{patientName(i.patientId)}</td>
                    <td className="td text-right">{money(i.total)}</td>
                    <td className="td text-right">{money(i.amountPaid)}</td>
                    <td className="td"><PaymentBadge status={i.paymentStatus} /></td>
                    <td className="td">
                      <div className="flex justify-end gap-0.5">
                        <button className="icon-btn" title={t('billing.pdf')} aria-label={t('billing.pdf')} onClick={() => downloadInvoicePdf(i, patients.get(i.patientId), db.settings)}><Download size={16} /></button>
                        <button className="icon-btn" title={t('billing.print')} aria-label={t('billing.print')} onClick={() => printInvoicePdf(i, patients.get(i.patientId), db.settings)}><Printer size={16} /></button>
                        <button className="icon-btn" title={t('common.edit')} aria-label={t('common.edit')} onClick={() => setEditing(i)}><Pencil size={16} /></button>
                        <button className="icon-btn hover:text-red-600" title={t('common.delete')} aria-label={t('common.delete')} onClick={() => setToDelete(i)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pages={pages} onChange={setPage} />
      </div>

      {editing !== undefined && <InvoiceForm invoice={editing} onClose={() => setEditing(undefined)} />}
      <ConfirmDialog open={Boolean(toDelete)} title={t('billing.deleteTitle')} message={t('billing.deleteMsg')} confirmLabel={t('common.delete')} onClose={() => setToDelete(null)} onConfirm={() => toDelete && remove('invoices', toDelete.id)} />
    </>
  )
}
