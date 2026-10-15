import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Field from '../ui/Field'
import { useData } from '../../store/data'
import type { Patient } from '../../types'
import { uid } from '../../utils/time'

const schema = z.object({
  firstName: z.string().min(1, 'validation.required'),
  lastName: z.string().min(1, 'validation.required'),
  gender: z.enum(['M', 'F']),
  dateOfBirth: z.string().min(1, 'validation.required'),
  phone: z.string().min(6, 'validation.phone'),
  email: z.string().email('validation.email').or(z.literal('')),
  address: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
})
type Values = z.infer<typeof schema>

interface Props {
  patient?: Patient
  prefill?: Partial<Pick<Patient, 'firstName' | 'lastName' | 'phone' | 'email'>>
  onClose: () => void
  onSaved?: (p: Patient) => void
}

export default function PatientForm({ patient, prefill, onClose, onSaved }: Props) {
  const { t } = useTranslation()
  const upsert = useData((s) => s.upsert)
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: patient?.firstName ?? prefill?.firstName ?? '',
      lastName: patient?.lastName ?? prefill?.lastName ?? '',
      gender: patient?.gender ?? 'F',
      dateOfBirth: patient?.dateOfBirth ?? '',
      phone: patient?.phone ?? prefill?.phone ?? '',
      email: patient?.email ?? prefill?.email ?? '',
      address: patient?.address ?? '',
      allergies: patient?.allergies.join(', ') ?? '',
      medicalHistory: patient?.medicalHistory ?? '',
      insuranceProvider: patient?.insurance?.provider ?? '',
      insuranceNumber: patient?.insurance?.policyNumber ?? '',
      emergencyName: patient?.emergencyContact.name ?? '',
      emergencyPhone: patient?.emergencyContact.phone ?? '',
      notes: patient?.notes ?? '',
    },
  })

  const onSubmit = (v: Values) => {
    const saved: Patient = {
      id: patient?.id ?? uid('p'),
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      gender: v.gender,
      dateOfBirth: v.dateOfBirth,
      phone: v.phone.trim(),
      email: v.email ?? '',
      address: v.address ?? '',
      allergies: (v.allergies ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      medicalHistory: v.medicalHistory?.trim() || null,
      insurance: v.insuranceProvider?.trim() ? { provider: v.insuranceProvider.trim(), policyNumber: v.insuranceNumber?.trim() ?? '' } : null,
      emergencyContact: { name: v.emergencyName ?? '', phone: v.emergencyPhone ?? '' },
      notes: v.notes ?? '',
      documents: patient?.documents ?? [],
      odontogram: patient?.odontogram ?? {},
      createdAt: patient?.createdAt ?? new Date().toISOString(),
    }
    upsert('patients', saved)
    toast.success(t(patient ? 'patients.updated' : 'patients.created'))
    onSaved?.(saved)
    onClose()
  }

  return (
    <Modal open title={t(patient ? 'patients.edit' : 'patients.new')} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label={t('patients.firstName')} error={errors.firstName?.message}><input className="input" {...register('firstName')} /></Field>
        <Field label={t('patients.lastName')} error={errors.lastName?.message}><input className="input" {...register('lastName')} /></Field>
        <Field label={t('patients.gender')}>
          <select className="input" {...register('gender')}>
            <option value="F">{t('patients.female')}</option>
            <option value="M">{t('patients.male')}</option>
          </select>
        </Field>
        <Field label={t('patients.dob')} error={errors.dateOfBirth?.message}><input type="date" className="input" {...register('dateOfBirth')} /></Field>
        <Field label={t('common.phone')} error={errors.phone?.message}><input className="input" type="tel" {...register('phone')} /></Field>
        <Field label={t('common.email')} error={errors.email?.message}><input className="input" type="email" {...register('email')} /></Field>
        <Field label={t('common.address')} className="sm:col-span-2"><input className="input" {...register('address')} /></Field>
        <Field label={t('patients.allergies')} hint={t('patients.allergiesHint')}><input className="input" {...register('allergies')} /></Field>
        <Field label={t('patients.medicalHistory')}><input className="input" {...register('medicalHistory')} /></Field>
        <Field label={t('patients.insurer')}><input className="input" {...register('insuranceProvider')} /></Field>
        <Field label={t('patients.policyNumber')}><input className="input" {...register('insuranceNumber')} /></Field>
        <Field label={t('patients.emergencyName')}><input className="input" {...register('emergencyName')} /></Field>
        <Field label={t('patients.emergencyPhone')}><input className="input" {...register('emergencyPhone')} /></Field>
        <Field label={t('common.notes')} className="sm:col-span-2"><textarea rows={2} className="input" {...register('notes')} /></Field>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn-primary" disabled={isSubmitting}>{t('common.save')}</button>
        </div>
      </form>
    </Modal>
  )
}
