import { useTranslation } from 'react-i18next'
import Modal from './Modal'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmDialog({ open, title, message, confirmLabel, danger = true, onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
