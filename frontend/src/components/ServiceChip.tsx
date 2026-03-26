import { SERVICIO_COLORS } from '../types'

interface ServiceChipProps {
  service: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

export default function ServiceChip({ service, selected, onClick, disabled }: ServiceChipProps) {
  const color = SERVICIO_COLORS[service] ?? '#8899b4'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
        selected
          ? 'text-bg'
          : 'bg-transparent text-muted border-border hover:border-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={
        selected
          ? { backgroundColor: color, borderColor: color }
          : { borderColor: color + '55', color }
      }
    >
      {service}
    </button>
  )
}
