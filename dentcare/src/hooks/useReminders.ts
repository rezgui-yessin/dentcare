import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useData } from '../store/data'
import { uid } from '../utils/time'
import type { Appointment } from '../types'
import { formatDate } from '../utils/time'

/** Simulates sending an SMS / email reminder and records it in db.reminders. */
export function useSendReminder() {
  const { t } = useTranslation()
  const { db, upsert } = useData()

  return (a: Appointment, channel: 'SMS' | 'Email' = 'SMS') => {
    const patient = db.patients.find((p) => p.id === a.patientId)
    if (!patient) return
    const message = t('reminders.message', {
      name: patient.firstName,
      clinic: db.settings.cabinet.name,
      date: formatDate(a.date),
      time: a.startTime,
    })
    const existing = db.reminders.find((r) => r.appointmentId === a.id)
    upsert('reminders', {
      id: existing?.id ?? uid('r'),
      appointmentId: a.id,
      patientId: a.patientId,
      channel,
      scheduledFor: new Date().toISOString(),
      sent: true,
      message,
    })
    toast.success(t('reminders.sentTo', { channel, name: `${patient.firstName} ${patient.lastName}` }))
  }
}
