import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Check, Inbox, Mail, Phone, X } from 'lucide-react'
import { useData } from '../store/data'
import AppointmentForm from '../components/appointments/AppointmentForm'
import { EmptyState, PageHeader } from '../components/ui/misc'
import { formatDate, uid } from '../utils/time'
import type { Appointment, BookingRequest, Patient } from '../types'

const TONE: Record<BookingRequest['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  Approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
}

export default function Requests() {
  const { t } = useTranslation()
  const { db, upsert } = useData()
  const [filter, setFilter] = useState<'Pending' | 'all'>('Pending')
  const [approving, setApproving] = useState<{ req: BookingRequest; appt: Partial<Appointment> } | null>(null)

  const list = db.bookingRequests.filter((r) => filter === 'all' || r.status === 'Pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  /** Find (or create) the patient, then open the appointment form pre-filled with the requested slot. */
  const approve = (req: BookingRequest) => {
    let patient = db.patients.find((p) => p.phone.replace(/\s/g, '') === req.phone.replace(/\s/g, ''))
    if (!patient) {
      const [first, ...rest] = req.name.trim().split(' ')
      const p: Patient = {
        id: uid('p'), firstName: first, lastName: rest.join(' ') || '-', gender: 'F', dateOfBirth: '', phone: req.phone, email: req.email ?? '',
        address: '', allergies: [], medicalHistory: null, insurance: null, emergencyContact: { name: '', phone: '' },
        notes: `${t('requests.reason')}: ${req.reason}`, documents: [], odontogram: {}, createdAt: new Date().toISOString(),
      }
      upsert('patients', p)
      patient = p
    }
    setApproving({ req, appt: { patientId: patient.id, date: req.preferredDate, startTime: req.preferredTime, notes: req.reason, status: 'Confirmed' } })
  }

  return (
    <>
      <PageHeader
        title={t('nav.requests')}
        subtitle={t('requests.subtitle')}
        actions={
          <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-white/10">
            {(['Pending', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${filter === f ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t(f === 'all' ? 'requests.all' : 'requests.pending')}</button>
            ))}
          </div>
        }
      />
      <div className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-400/10 dark:text-brand-200">
        {t('requests.publicLink')} <a className="font-bold underline" href="/book" target="_blank" rel="noreferrer">{window.location.origin}/book</a>
      </div>
      {list.length === 0 ? (
        <div className="card"><EmptyState icon={<Inbox />} title={t('requests.empty')} /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold">{r.name}</h3>
                  <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><Phone size={13} />{r.phone}</span>
                    {r.email && <span className="inline-flex items-center gap-1"><Mail size={13} />{r.email}</span>}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[r.status]}`}>{t(`requests.${r.status}`)}</span>
              </div>
              <p className="mt-3 text-sm"><span className="font-semibold">{formatDate(r.preferredDate, 'EEE dd MMM')}</span> · {r.preferredTime}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.reason}</p>
              {r.status === 'Pending' && (
                <div className="mt-4 flex gap-2">
                  <button className="btn-primary btn-sm" onClick={() => approve(r)}><Check size={14} /> {t('requests.approve')}</button>
                  <button className="btn-secondary btn-sm" onClick={() => { upsert('bookingRequests', { ...r, status: 'Rejected' }); toast.success(t('requests.rejected')) }}><X size={14} /> {t('requests.reject')}</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {approving && (
        <AppointmentForm
          initial={approving.appt}
          onClose={() => setApproving(null)}
          onSaved={() => upsert('bookingRequests', { ...approving.req, status: 'Approved' })}
        />
      )}
    </>
  )
}
