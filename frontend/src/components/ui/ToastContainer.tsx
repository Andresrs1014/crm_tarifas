import { useToastStore, type ToastType } from '../../store/toastStore'

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const COLORS: Record<ToastType, string> = {
  success: 'border-success/40 bg-success/10 text-success',
  error:   'border-danger/40 bg-danger/10 text-danger',
  info:    'border-accent/40 bg-accent/10 text-accent',
  warning: 'border-gold/40 bg-gold/10 text-gold',
}

export default function ToastContainer() {
  const { toasts, remove } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'flex items-center gap-3 px-4 py-3 rounded-xl border',
            'shadow-card backdrop-blur-sm animate-slide-up pointer-events-auto',
            COLORS[t.type],
          ].join(' ')}
        >
          <span className="font-bold text-lg w-5 text-center flex-shrink-0">{ICONS[t.type]}</span>
          <span className="text-sm flex-1 font-medium">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
