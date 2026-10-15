import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Patient, ToothRecord, Treatment } from '../../types'
import { todayStr } from '../../utils/time'

/** FDI numbering: upper right 18-11 | upper left 21-28, lower right 48-41 | lower left 31-38. */
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const TOOTH_PATH =
  'M12 2c-2 0-3.200 1-5.200 1C4.200 3 2.500 5 2.500 8c0 2.500 1.100 4.100 1.700 6.500.6 2.500.8 5.200 1.500 7.700.4 1.300 1.200 2.300 2.300 2.300 1.300 0 1.700-2 2.200-4 .4-1.500.8-2.500 2.100-2.500s1.700 1 2.100 2.500c.5 2 .9 4 2.200 4 1.100 0 1.900-1 2.300-2.300.7-2.500.9-5.200 1.500-7.700.6-2.400 1.700-4 1.700-6.500 0-3-1.700-5-4.300-5C15.200 3 14 2 12 2z'

function toothState(records: ToothRecord[] | undefined) {
  if (!records?.length) return 'none'
  const done = records.some((r) => r.status === 'done')
  const planned = records.some((r) => r.status === 'planned')
  return done && planned ? 'both' : done ? 'done' : 'planned'
}

const FILL: Record<string, string> = {
  none: 'fill-white stroke-slate-300 dark:fill-slate-100 dark:stroke-slate-500',
  done: 'fill-brand-500 stroke-brand-700',
  planned: 'fill-amber-300 stroke-amber-600',
  both: 'fill-brand-500 stroke-amber-500',
}

interface Props {
  patient: Patient
  treatments: Treatment[]
  onChange: (odontogram: Patient['odontogram']) => void
}

export default function Odontogram({ patient, treatments, onChange }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<number | null>(null)
  const [treatment, setTreatment] = useState(treatments[0]?.name ?? '')
  const [status, setStatus] = useState<'done' | 'planned'>('done')
  const [date, setDate] = useState(todayStr())

  const records = selected ? patient.odontogram[String(selected)] ?? [] : []

  const add = () => {
    if (!selected || !treatment) return
    onChange({ ...patient.odontogram, [selected]: [...records, { treatment, date, status }] })
  }
  const del = (i: number) => {
    if (!selected) return
    const next = records.filter((_, idx) => idx !== i)
    const od = { ...patient.odontogram }
    if (next.length) od[String(selected)] = next
    else delete od[String(selected)]
    onChange(od)
  }

  const Row = ({ teeth, flip }: { teeth: number[]; flip?: boolean }) => (
    <div className="flex justify-center gap-1 sm:gap-1.5">
      {teeth.map((n, i) => {
        const st = toothState(patient.odontogram[String(n)])
        return (
          <button
            key={n}
            onClick={() => setSelected(n)}
            aria-label={`${t('patients.tooth')} ${n}`}
            aria-pressed={selected === n}
            className={`flex w-8 shrink-0 flex-col items-center gap-0.5 rounded-lg p-0.5 sm:w-10 ${i === 7 ? 'mr-2 sm:mr-4' : ''} ${selected === n ? 'bg-brand-100 ring-2 ring-brand-500 dark:bg-brand-400/20' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
          >
            {flip && <span className="text-[10px] font-semibold text-slate-500">{n}</span>}
            <svg viewBox="0 0 24 28" className={`h-9 w-7 sm:h-11 sm:w-9 ${flip ? 'rotate-180' : ''}`}>
              <path d={TOOTH_PATH} strokeWidth="1.4" className={FILL[st]} />
            </svg>
            {!flip && <span className="text-[10px] font-semibold text-slate-500">{n}</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card overflow-x-auto p-4">
        <div className="min-w-[560px] space-y-5">
          <Row teeth={UPPER} />
          <div className="border-t border-dashed border-slate-300 dark:border-white/15" />
          <Row teeth={LOWER} flip />
        </div>
        <ul className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-brand-500" />{t('patients.done')}</li>
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-amber-300" />{t('patients.planned')}</li>
          <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-slate-300 bg-white" />{t('patients.healthy')}</li>
        </ul>
      </div>

      <div className="card p-4">
        {!selected ? (
          <p className="py-8 text-center text-sm text-slate-500">{t('patients.selectTooth')}</p>
        ) : (
          <>
            <h3 className="text-lg font-bold">{t('patients.tooth')} {selected}</h3>
            {records.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{t('patients.noRecords')}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {records.map((r, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 rounded-xl bg-slate-50 p-2.5 text-sm dark:bg-white/5">
                    <div>
                      <p className="font-semibold">{r.treatment}</p>
                      <p className="text-xs text-slate-500">{r.date} · {t(`patients.${r.status}`)}</p>
                    </div>
                    <button className="icon-btn h-7 w-7 hover:text-red-600" onClick={() => del(i)} aria-label={t('common.delete')}><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-white/10">
              <select className="input" value={treatment} onChange={(e) => setTreatment(e.target.value)} aria-label={t('appointments.treatment')}>
                {treatments.map((x) => <option key={x.id}>{x.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value as 'done' | 'planned')} aria-label={t('common.status')}>
                  <option value="done">{t('patients.done')}</option>
                  <option value="planned">{t('patients.planned')}</option>
                </select>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('common.date')} />
              </div>
              <button className="btn-primary w-full" onClick={add}>{t('patients.addRecord')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
