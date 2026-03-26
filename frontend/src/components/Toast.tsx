import { X } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

const COLORS = {
  success: { bg: '#00e676', text: '#0a0e1a' },
  error:   { bg: '#ff4444', text: '#fff' },
  warning: { bg: '#f5a623', text: '#0a0e1a' },
}

export default function Toast() {
  const { toasts, remove } = useToastStore()
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl pointer-events-auto text-sm font-medium"
            style={{ backgroundColor: c.bg, color: c.text, minWidth: 260 }}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
