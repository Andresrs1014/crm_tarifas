import { SERVICIO_COLORS } from '../types'

interface ServiceChipProps {
  label: string
  selected: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function ServiceChip({ label, selected, onToggle, disabled }: ServiceChipProps) {
  const color = SERVICIO_COLORS[label] ?? '#8899b4'
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
      style={
        selected
          ? { background: color + '20', borderColor: color, color }
          : { background: 'transparent', borderColor: '#1e3050', color: '#8899b4' }
      }
    >
      {label}
    </button>
  )
}
