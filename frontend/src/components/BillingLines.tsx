import { SERVICIO_COLORS } from '../types'

interface BillingLinesProps {
  servicios: string[]
  value: Record<string, number>
  onChange: (v: Record<string, number>) => void
}

export default function BillingLines({ servicios, value, onChange }: BillingLinesProps) {
  if (servicios.length === 0) return null

  const update = (svc: string, raw: string) => {
    const num = parseInt(raw.replace(/\D/g, ''), 10) || 0
    onChange({ ...value, [svc]: num })
  }

  return (
    <div className="space-y-2">
      {servicios.map((svc) => {
        const color = SERVICIO_COLORS[svc] ?? '#8899b4'
        return (
          <div key={svc} className="flex items-center gap-3">
            <span
              className="text-xs font-medium w-36 shrink-0"
              style={{ color }}
            >
              {svc}
            </span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
              <input
                style={{ paddingLeft: '1.75rem' }}
                placeholder="0"
                value={value[svc] ? value[svc].toLocaleString('es-CO') : ''}
                onChange={(e) => update(svc, e.target.value)}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
