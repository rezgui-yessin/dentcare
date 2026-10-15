import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Users } from 'lucide-react'
import { useData } from '../store/data'
import PatientForm from '../components/patients/PatientForm'
import { Avatar, EmptyState, PageHeader, Pagination, SearchInput } from '../components/ui/misc'
import { ageOf, formatDate } from '../utils/time'

const PAGE_SIZE = 12
type Sort = 'name' | 'recent' | 'age'

export default function Patients() {
  const { t } = useTranslation()
  const db = useData((s) => s.db)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [adding, setAdding] = useState(Boolean(params.get('new')))
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('name')
  const [page, setPage] = useState(1)

  // last visit per patient
  const lastVisit = useMemo(() => {
    const m = new Map<string, string>()
    db.appointments.filter((a) => a.status === 'Completed').forEach((a) => {
      if (!m.get(a.patientId) || a.date > m.get(a.patientId)!) m.set(a.patientId, a.date)
    })
    return m
  }, [db.appointments])

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    const out = db.patients.filter((p) => !term || `${p.firstName} ${p.lastName} ${p.phone} ${p.email}`.toLowerCase().includes(term))
    out.sort((a, b) =>
      sort === 'name' ? `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
      : sort === 'age' ? ageOf(a.dateOfBirth) - ageOf(b.dateOfBirth)
      : b.createdAt.localeCompare(a.createdAt),
    )
    return out
  }, [db.patients, q, sort])

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = list.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  return (
    <>
      <PageHeader
        title={t('nav.patients')}
        subtitle={t('patients.count', { count: db.patients.length })}
        actions={<button className="btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> {t('patients.new')}</button>}
      />
      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4 dark:border-white/10">
          <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder={t('patients.search')} />
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('common.sortBy')}>
            <option value="name">{t('patients.sortName')}</option>
            <option value="recent">{t('patients.sortRecent')}</option>
            <option value="age">{t('patients.sortAge')}</option>
          </select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Users />} title={t('patients.empty')} hint={t('patients.emptyHint')} action={<button className="btn-primary" onClick={() => setAdding(true)}>{t('patients.new')}</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="th">{t('nav.patients')}</th>
                  <th className="th">{t('patients.age')}</th>
                  <th className="th">{t('common.phone')}</th>
                  <th className="th">{t('patients.insurer')}</th>
                  <th className="th">{t('patients.lastVisit')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="tr cursor-pointer hover:bg-slate-50/60 dark:hover:bg-white/[.02]" onClick={() => navigate(`/patients/${p.id}`)}>
                    <td className="td">
                      <Link to={`/patients/${p.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <Avatar name={`${p.firstName} ${p.lastName}`} />
                        <span>
                          <span className="block font-semibold">{p.firstName} {p.lastName}</span>
                          <span className="block text-xs text-slate-500">{p.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="td">{ageOf(p.dateOfBirth)}</td>
                    <td className="td whitespace-nowrap">{p.phone}</td>
                    <td className="td">{p.insurance?.provider ?? <span className="text-slate-400">—</span>}</td>
                    <td className="td whitespace-nowrap">{lastVisit.get(p.id) ? formatDate(lastVisit.get(p.id)!) : <span className="text-slate-400">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={current} pages={pages} onChange={setPage} />
      </div>
      {adding && (
        <PatientForm
          onClose={() => { setAdding(false); if (params.get('new')) setParams({}, { replace: true }) }}
          onSaved={(p) => navigate(`/patients/${p.id}`)}
        />
      )}
    </>
  )
}
