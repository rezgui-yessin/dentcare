import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Field from '../ui/Field'
import { useData } from '../../store/data'
import { useCurrentUser } from '../../store/auth'
import { useLookups } from '../../hooks/useLookups'
import { APPOINTMENT_STATUSES, type Appointment } from '../../types'
import { checkWorkingHours, findConflict, suggestSlots } from '../../utils/scheduling'
import { addMinutes, todayStr, uid } from '../../utils/time'

const schema = z.object({
  patientId: z.string().min(1, 'validation.required'),
  doctorId: z.string().min(1, 'validation.required'),
  treatmentId: z.string().min(1, 'validation.required'),
  date: z.string().min(1, 'validation.required'),
  startTime: z.string().min(1, 'validation.required'),
  duration: z.number({ invalid_type_error: 'validation.required' }).min(5, 'validation.minDuration').max(480, 'validation.maxDuration'),
  status: z.enum(['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show']),
  toothNumber: z.string().optional(),
  notes: z.string().optional(),
})
type Values = z.infer<typeof schema>

interface Props {
  initial: Partial<Appointment>
  onClose: () => void
  onSaved?: (a: Appointment) => void
}

export default function AppointmentForm({ initial, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const { db, upsert } = useData()
  const user = useCurrentUser()
  const { doctors } = useLookups()
  const isEdit = Boolean(initial.id)
  const activeTreatments = db.treatments.filter((x) => x.active || x.id === initial.treatmentId)
  const firstTreatment = activeTreatments[0]

  const {
    register, handleSubmit, watch, setValue, setError, formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: initial.patientId ?? '',
      doctorId: initial.doctorId ?? (user?.role === 'admin' ? user.id : doctors[0]?.id ?? ''),
      treatmentId: initial.treatmentId ?? firstTreatment?.id ?? '',
      date: initial.date ?? todayStr(),
      startTime: initial.startTime ?? '09:00',
      duration: initial.duration ?? firstTreatment?.defaultDuration ?? 30,
      status: initial.status ?? 'Scheduled',
      toothNumber: initial.toothNumber ? String(initial.toothNumber) : '',
      notes: initial.notes ?? '',
    },
  })

  const [doctorId, date, duration, startTime] = watch(['doctorId', 'date', 'duration', 'startTime'])
  const slots = useMemo(
    () => suggestSlots(db.appointments, db.settings, { doctorId, date, duration: Number(duration) || 0, excludeId: initial.id }),
    [db.appointments, db.settings, doctorId, date, duration, initial.id],
  )

  // keep the end time in sync when the treatment changes
  useEffect(() => {
    if (!startTime) return
  }, [startTime])

  const onSubmit = (v: Values) => {
    const endTime = addMinutes(v.startTime, v.duration)
    const hoursError = checkWorkingHours(db.settings, v.date, v.startTime, endTime)
    if (hoursError) return setError('startTime', { message: hoursError })
    const conflict = findConflict(db.appointments, { doctorId: v.doctorId, date: v.date, startTime: v.startTime, endTime, excludeId: initial.id })
    if (conflict) return setError('startTime', { message: 'errors.conflict' })

    const appt: Appointment = {
      id: initial.id ?? uid('a'),
      patientId: v.patientId,
      doctorId: v.doctorId,
      treatmentId: v.treatmentId,
      date: v.date,
      startTime: v.startTime,
      endTime,
      duration: v.duration,
      status: v.status,
      toothNumber: v.toothNumber ? Number(v.toothNumber) : null,
      notes: v.notes ?? '',
      createdBy: initial.createdBy ?? user?.id ?? '',
      createdAt: initial.createdAt ?? new Date().toISOString(),
    }
    upsert('appointments', appt)
    toast.success(t(isEdit ? 'appointments.updated' : 'appointments.created'))
    onSaved?.(appt)
    onClose()
  }

  const patients = [...db.patients].sort((a, b) => a.lastName.localeCompare(b.lastName))

  return (
    <Modal open title={t(isEdit ? 'appointments.edit' : 'appointments.new')} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t('appointments.patient')} error={errors.patientId?.message} className="sm:col-span-2">
          <select className="input" {...register('patientId')}>
            <option value="">{t('common.select')}</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>)}
          </select>
        </Field>

        <Field label={t('appointments.treatment')} error={errors.treatmentId?.message}>
          <select
            className="input"
            {...register('treatmentId', {
              onChange: (e) => {
                const tr = db.treatments.find((x) => x.id === e.target.value)
                if (tr) setValue('duration', tr.defaultDuration)
              },
            })}
          >
            {activeTreatments.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
          </select>
        </Field>

        <Field label={t('appointments.doctor')} error={errors.doctorId?.message}>
          <select className="input" {...register('doctorId')}>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label={t('common.date')} error={errors.date?.message}>
          <input type="date" className="input" {...register('date')} />
        </Field>
        <Field label={t('appointments.startTime')} error={errors.startTime?.message}>
          <input type="time" step={300} className="input" {...register('startTime')} />
        </Field>

        <Field label={t('appointments.duration')} error={errors.duration?.message}>
          <input type="number" min={5} step={5} className="input" {...register('duration', { valueAsNumber: true })} />
        </Field>
        <Field label={t('common.status')} error={errors.status?.message}>
          <select className="input" {...register('status')}>
            {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <p className="label">{t('appointments.availableSlots')}</p>
          {slots.length === 0 ? (
            <p className="text-sm text-slate-500">{t('appointments.noSlots')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {slots.slice(0, 24).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setValue('startTime', s, { shouldValidate: true })}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    startTime === s
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-white/10 dark:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label={t('appointments.tooth')} hint={t('appointments.toothHint')}>
          <input className="input" inputMode="numeric" {...register('toothNumber')} />
        </Field>
        <Field label={t('common.notes')} className="sm:col-span-2">
          <textarea rows={2} className="input" {...register('notes')} />
        </Field>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" disabled={isSubmitting}>{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
