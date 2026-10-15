import { useMemo, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import frFcLocale from '@fullcalendar/core/locales/fr'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import { Bell, CalendarDays, CalendarX, List, Pencil, Plus, Trash2, XCircle } from 'lucide-react'
import { useData } from '../store/data'
import { useLookups } from '../hooks/useLookups'
import { useSendReminder } from '../hooks/useReminders'
import AppointmentForm from '../components/appointments/AppointmentForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { StatusBadge, STATUS_STYLE } from '../components/ui/StatusBadge'
import { EmptyState, PageHeader, Pagination, SearchInput } from '../components/ui/misc'
import { APPOINTMENT_STATUSES, DAY_KEYS, type Appointment } from '../types'
import { checkWorkingHours, findConflict } from '../utils/scheduling'
import { addMinutes, formatDate } from '../utils/time'
import { fr as dfFr } from 'date-fns/locale'
import { format } from 'date-fns'

const PAGE_SIZE = 10

export default function Appointments() {
  const { t, i18n } = useTranslation()
  const { db, upsert, remove } = useData()
  const { patientName, treatments, users, doctors } = useLookups()
  const sendReminder = useSendReminder()
  const [params, setParams] = useSearchParams()
  const calRef = useRef<FullCalendar>(null)

  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [editing, setEditing] = useState<Partial<Appointment> | null>(() =>
    params.get('new') ? { patientId: params.get('patient') ?? undefined } : null,
  )
  const [toDelete, setToDelete] = useState<Appointment | null>(null)
  const [doctor, setDoctor] = useState('all')

  // list filters
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [treatment, setTreatment] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)

  const closeForm = () => {
    setEditing(null)
    if (params.get('new')) setParams({}, { replace: true })
  }

  const events = useMemo(
    () =>
      db.appointments
        .filter((a) => doctor === 'all' || a.doctorId === doctor)
        .map((a) => ({
          id: a.id,
          title: patientName(a.patientId),
          start: `${a.date}T${a.startTime}:00`,
          end: `${a.date}T${a.endTime}:00`,
          backgroundColor: STATUS_STYLE[a.status].color,
          classNames: a.status === 'Cancelled' || a.status === 'No-show' ? ['is-cancelled'] : [],
          extendedProps: { treatment: treatments.get(a.treatmentId)?.name ?? '' },
        })),
    [db.appointments, doctor, patientName, treatments],
  )

  const businessHours = useMemo(() => {
    const out: { daysOfWeek: number[]; startTime: string; endTime: string }[] = []
    DAY_KEYS.forEach((k) => {
      const h = db.settings.workingHours[k]
      if (!h.open || !h.start || !h.end) return
      const dow = (DAY_KEYS.indexOf(k) + 1) % 7
      if (h.breakStart && h.breakEnd) {
        out.push({ daysOfWeek: [dow], startTime: h.start, endTime: h.breakStart })
        out.push({ daysOfWeek: [dow], startTime: h.breakEnd, endTime: h.end })
      } else out.push({ daysOfWeek: [dow], startTime: h.start, endTime: h.end })
    })
    return out
  }, [db.settings.workingHours])

  const onEventDrop = (info: EventDropArg) => {
    const a = db.appointments.find((x) => x.id === info.event.id)
    const start = info.event.start
    if (!a || !start) return info.revert()
    const date = format(start, 'yyyy-MM-dd')
    const startTime = format(start, 'HH:mm')
    const endTime = addMinutes(startTime, a.duration)
    const hoursError = checkWorkingHours(db.settings, date, startTime, endTime)
    if (hoursError) {
      toast.error(t(hoursError))
      return info.revert()
    }
    if (findConflict(db.appointments, { doctorId: a.doctorId, date, startTime, endTime, excludeId: a.id })) {
      toast.error(t('errors.conflict'))
      return info.revert()
    }
    upsert('appointments', { ...a, date, startTime, endTime })
    toast.success(t('appointments.rescheduled'))
  }

  const onDateClick = (info: DateClickArg) => {
    const date = format(info.date, 'yyyy-MM-dd')
    setEditing({ date, startTime: info.allDay ? '09:00' : format(info.date, 'HH:mm'), doctorId: doctor === 'all' ? undefined : doctor })
  }

  const onEventClick = (info: EventClickArg) => {
    const a = db.appointments.find((x) => x.id === info.event.id)
    if (a) setEditing(a)
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return db.appointments
      .filter((a) => (status === 'all' || a.status === status) && (treatment === 'all' || a.treatmentId === treatment) && (doctor === 'all' || a.doctorId === doctor))
      .filter((a) => (!from || a.date >= from) && (!to || a.date <= to))
      .filter((a) => !term || patientName(a.patientId).toLowerCase().includes(term))
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime))
  }, [db.appointments, q, status, treatment, doctor, from, to, patientName])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const locale = i18n.language === 'fr' ? dfFr : undefined

  return (
    <>
      <PageHeader
        title={t('nav.appointments')}
        subtitle={t('appointments.subtitle')}
        actions={
          <>
            <div className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-white/10" role="tablist">
              {([['calendar', CalendarDays], ['list', List]] as const).map(([v, Icon]) => (
                <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${view === v ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                  <Icon size={15} /> {t(`appointments.${v}`)}
                </button>
              ))}
            </div>
            <select className="input w-auto" value={doctor} onChange={(e) => setDoctor(e.target.value)} aria-label={t('appointments.doctor')}>
              <option value="all">{t('appointments.allDoctors')}</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn-primary" onClick={() => setEditing({})}><Plus size={16} /> {t('appointments.new')}</button>
          </>
        }
      />

      {view === 'calendar' ? (
        <div className="card p-3 sm:p-5">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
            locales={[frFcLocale]}
            locale={i18n.language}
            firstDay={1}
            height="74vh"
            nowIndicator
            allDaySlot={false}
            editable
            eventDurationEditable={false}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            slotDuration={`${db.settings.slotDuration < 60 ? '00:' + String(db.settings.slotDuration).padStart(2, '0') : '01:00'}:00`}
            businessHours={businessHours}
            events={events}
            eventDrop={onEventDrop}
            dateClick={onDateClick}
            eventClick={onEventClick}
            eventContent={(arg) => (
              <div className="overflow-hidden px-1 py-0.5 text-[11px] leading-tight text-white">
                <p className="truncate font-bold">{arg.timeText} {arg.event.title}</p>
                <p className="truncate opacity-90">{arg.event.extendedProps.treatment}</p>
              </div>
            )}
          />
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {APPOINTMENT_STATUSES.map((s) => (
              <li key={s} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_STYLE[s].color }} />{t(`status.${s}`)}</li>
            ))}
            <li className="ml-auto">{t('appointments.dragHint')}</li>
          </ul>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4 dark:border-white/10">
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder={t('appointments.searchPatient')} />
            <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label={t('common.status')}>
              <option value="all">{t('common.allStatuses')}</option>
              {APPOINTMENT_STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
            </select>
            <select className="input w-auto" value={treatment} onChange={(e) => { setTreatment(e.target.value); setPage(1) }} aria-label={t('appointments.treatment')}>
              <option value="all">{t('appointments.allTreatments')}</option>
              {db.treatments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <input type="date" className="input w-auto" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} aria-label={t('common.from')} />
            <input type="date" className="input w-auto" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} aria-label={t('common.to')} />
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={<CalendarX />} title={t('appointments.empty')} hint={t('appointments.emptyHint')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr>
                    <th className="th">{t('common.date')}</th>
                    <th className="th">{t('appointments.patient')}</th>
                    <th className="th">{t('appointments.treatment')}</th>
                    <th className="th">{t('appointments.doctor')}</th>
                    <th className="th">{t('common.status')}</th>
                    <th className="th text-right">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="tr hover:bg-slate-50/60 dark:hover:bg-white/[.02]">
                      <td className="td whitespace-nowrap">
                        <p className="font-semibold">{formatDate(a.date, 'dd MMM yyyy', locale)}</p>
                        <p className="text-xs text-slate-500">{a.startTime} – {a.endTime}</p>
                      </td>
                      <td className="td"><Link to={`/patients/${a.patientId}`} className="font-semibold hover:underline">{patientName(a.patientId)}</Link></td>
                      <td className="td">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: treatments.get(a.treatmentId)?.color }} />
                        {treatments.get(a.treatmentId)?.name}
                      </td>
                      <td className="td text-slate-600 dark:text-slate-300">{users.get(a.doctorId)?.name}</td>
                      <td className="td"><StatusBadge status={a.status} /></td>
                      <td className="td">
                        <div className="flex justify-end gap-0.5">
                          {(a.status === 'Scheduled' || a.status === 'Confirmed') && (
                            <>
                              <button className="icon-btn" title={t('reminders.send')} aria-label={t('reminders.send')} onClick={() => sendReminder(a)}><Bell size={16} /></button>
                              <button className="icon-btn" title={t('appointments.cancelAppt')} aria-label={t('appointments.cancelAppt')} onClick={() => { upsert('appointments', { ...a, status: 'Cancelled' }); toast.success(t('appointments.cancelled')) }}><XCircle size={16} /></button>
                            </>
                          )}
                          <button className="icon-btn" title={t('common.edit')} aria-label={t('common.edit')} onClick={() => setEditing(a)}><Pencil size={16} /></button>
                          <button className="icon-btn hover:text-red-600" title={t('common.delete')} aria-label={t('common.delete')} onClick={() => setToDelete(a)}><Trash2 size={16} /></button>
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
      )}

      {editing && <AppointmentForm initial={editing} onClose={closeForm} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('appointments.deleteTitle')}
        message={t('appointments.deleteMsg')}
        confirmLabel={t('common.delete')}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { remove('appointments', toDelete.id); toast.success(t('appointments.deleted')) } }}
      />
    </>
  )
}
