import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarPlus, FileText, Mail, MapPin, Pencil, Phone, ShieldAlert, Trash2, Upload } from 'lucide-react'
import { useData } from '../store/data'
import { useLookups } from '../hooks/useLookups'
import PatientForm from '../components/patients/PatientForm'
import Odontogram from '../components/patients/Odontogram'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { PaymentBadge, StatusBadge } from '../components/ui/StatusBadge'
import { Avatar, EmptyState } from '../components/ui/misc'
import { formatMoney, readFileAsDataUrl } from '../utils/format'
import { ageOf, formatDate, uid } from '../utils/time'

type Tab = 'overview' | 'history' | 'odontogram' | 'documents'
const MAX_FILE = 1.5 * 1024 * 1024

export default function PatientDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const { db, upsert, remove } = useData()
  const { treatments, users } = useLookups()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const patient = db.patients.find((p) => p.id === id)
  if (!patient) return <Navigate to="/patients" replace />

  const appts = db.appointments.filter((a) => a.patientId === patient.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
  const invoices = db.invoices.filter((i) => i.patientId === patient.id)
  const invoiceOf = (aid: string) => invoices.find((i) => i.appointmentId === aid)
  const cur = db.settings.cabinet.currency
  const balance = invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0)

  const onFiles = async (files: FileList | null) => {
    if (!files) return
    for (const f of Array.from(files)) {
      if (f.size > MAX_FILE) { toast.error(t('patients.fileTooBig', { name: f.name })); continue }
      const dataUrl = await readFileAsDataUrl(f)
      upsert('patients', { ...patient, documents: [...patient.documents, { id: uid('d'), name: f.name, type: f.type, dataUrl, addedAt: new Date().toISOString() }] })
      toast.success(t('patients.fileAdded'))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const tabs: Tab[] = ['overview', 'history', 'odontogram', 'documents']
  const Info = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-0.5 text-sm">{children || <span className="text-slate-400">—</span>}</dd></div>
  )

  return (
    <>
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700"><ArrowLeft size={15} /> {t('nav.patients')}</Link>

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <Avatar name={`${patient.firstName} ${patient.lastName}`} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
          <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>{ageOf(patient.dateOfBirth)} {t('patients.years')} · {t(patient.gender === 'M' ? 'patients.male' : 'patients.female')}</span>
            <span className="inline-flex items-center gap-1"><Phone size={13} /> {patient.phone}</span>
            {patient.email && <span className="inline-flex items-center gap-1"><Mail size={13} /> {patient.email}</span>}
          </p>
          {patient.allergies.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5">
              <ShieldAlert size={15} className="text-red-500" />
              {patient.allergies.map((a) => <span key={a} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-400/15 dark:text-red-300">{a}</span>)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => navigate(`/appointments?new=1&patient=${patient.id}`)}><CalendarPlus size={16} /> {t('appointments.new')}</button>
          <button className="btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> {t('common.edit')}</button>
          <button className="btn-secondary hover:text-red-600" onClick={() => setDeleting(true)} aria-label={t('common.delete')}><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-white/10" role="tablist">
        {tabs.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === k ? 'border-brand-600 text-brand-700 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}>
            {t(`patients.tab_${k}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="card p-5 lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold">{t('patients.personal')}</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label={t('patients.dob')}>{formatDate(patient.dateOfBirth, 'dd MMM yyyy')}</Info>
              <Info label={t('common.address')}>{patient.address && <span className="inline-flex items-start gap-1"><MapPin size={14} className="mt-0.5 shrink-0" />{patient.address}</span>}</Info>
              <Info label={t('patients.medicalHistory')}>{patient.medicalHistory}</Info>
              <Info label={t('patients.insurer')}>{patient.insurance && `${patient.insurance.provider} · ${patient.insurance.policyNumber}`}</Info>
              <Info label={t('patients.emergency')}>{patient.emergencyContact.name && `${patient.emergencyContact.name} · ${patient.emergencyContact.phone}`}</Info>
              <Info label={t('common.notes')}>{patient.notes}</Info>
            </dl>
          </section>
          <section className="card p-5">
            <h2 className="mb-4 text-lg font-bold">{t('patients.summary')}</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t('patients.visits')}</dt><dd className="font-semibold">{appts.filter((a) => a.status === 'Completed').length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t('patients.upcoming')}</dt><dd className="font-semibold">{appts.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t('patients.balance')}</dt><dd className={`font-semibold ${balance > 0 ? 'text-red-600' : ''}`}>{formatMoney(balance, cur, i18n.language)}</dd></div>
            </dl>
          </section>
        </div>
      )}

      {tab === 'history' && (
        <div className="card overflow-hidden">
          {appts.length === 0 ? <EmptyState title={t('patients.noHistory')} /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-head"><tr>
                  <th className="th">{t('common.date')}</th><th className="th">{t('appointments.treatment')}</th><th className="th">{t('appointments.doctor')}</th><th className="th">{t('common.status')}</th><th className="th">{t('nav.billing')}</th>
                </tr></thead>
                <tbody>
                  {appts.map((a) => {
                    const inv = invoiceOf(a.id)
                    return (
                      <tr key={a.id} className="tr">
                        <td className="td whitespace-nowrap"><p className="font-semibold">{formatDate(a.date)}</p><p className="text-xs text-slate-500">{a.startTime}</p></td>
                        <td className="td">{treatments.get(a.treatmentId)?.name}{a.toothNumber ? <span className="text-slate-500"> · #{a.toothNumber}</span> : null}</td>
                        <td className="td">{users.get(a.doctorId)?.name}</td>
                        <td className="td"><StatusBadge status={a.status} /></td>
                        <td className="td">{inv ? <PaymentBadge status={inv.paymentStatus} /> : <span className="text-slate-400">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'odontogram' && (
        <Odontogram patient={patient} treatments={db.treatments} onChange={(odontogram) => upsert('patients', { ...patient, odontogram })} />
      )}

      {tab === 'documents' && (
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('patients.tab_documents')}</h2>
            <>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              <button className="btn-primary" onClick={() => fileRef.current?.click()}><Upload size={16} /> {t('patients.upload')}</button>
            </>
          </div>
          <p className="mb-4 text-xs text-slate-500">{t('patients.uploadHint')}</p>
          {patient.documents.length === 0 ? <EmptyState icon={<FileText />} title={t('patients.noDocs')} /> : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {patient.documents.map((d) => (
                <li key={d.id} className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
                  {d.type.startsWith('image/') ? (
                    <button className="block h-32 w-full" onClick={() => setPreview(d.dataUrl)}><img src={d.dataUrl} alt={d.name} className="h-full w-full object-cover" /></button>
                  ) : (
                    <a href={d.dataUrl} download={d.name} className="flex h-32 items-center justify-center bg-slate-50 text-slate-400 dark:bg-white/5"><FileText size={36} /></a>
                  )}
                  <div className="flex items-center justify-between gap-2 p-2.5">
                    <p className="truncate text-xs font-semibold" title={d.name}>{d.name}</p>
                    <button className="icon-btn h-7 w-7 hover:text-red-600" aria-label={t('common.delete')} onClick={() => upsert('patients', { ...patient, documents: patient.documents.filter((x) => x.id !== d.id) })}><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && <PatientForm patient={patient} onClose={() => setEditing(false)} />}
      <Modal open={Boolean(preview)} title={t('patients.preview')} onClose={() => setPreview(null)} size="lg">
        {preview && <img src={preview} alt="" className="mx-auto max-h-[70vh] rounded-lg" />}
      </Modal>
      <ConfirmDialog
        open={deleting}
        title={t('patients.deleteTitle')}
        message={t('patients.deleteMsg', { name: `${patient.firstName} ${patient.lastName}` })}
        confirmLabel={t('common.delete')}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          db.appointments.filter((a) => a.patientId === patient.id).forEach((a) => remove('appointments', a.id))
          remove('patients', patient.id)
          toast.success(t('patients.deleted'))
          navigate('/patients')
        }}
      />
    </>
  )
}
