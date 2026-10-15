import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export default function Field({ label, error, hint, children, className = '' }: Props) {
  const { t } = useTranslation()
  return (
    <div className={className}>
      <label className="label">
        {label}
        <div className="mt-1 font-normal">{children}</div>
      </label>
      {hint && !error && <p className="-mt-0.5 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {t(error, { defaultValue: error })}
        </p>
      )}
    </div>
  )
}
