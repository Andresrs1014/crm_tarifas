const BADGE_STYLES: Record<string, string> = {
  // Prospectos
  seguimiento: 'bg-blue-500/20 text-accent border-accent/30',
  cerrado:     'bg-success/20 text-success border-success/30',
  perdido:     'bg-danger/20 text-danger border-danger/30',
  frio:        'bg-muted/20 text-muted border-muted/30',
  // Clientes
  activo:      'bg-success/20 text-success border-success/30',
  'en-riesgo': 'bg-gold/20 text-gold border-gold/30',
  inactivo:    'bg-muted/20 text-muted border-muted/30',
  // Cotizaciones
  borrador:    'bg-muted/20 text-muted border-muted/30',
  enviada:     'bg-accent/20 text-accent border-accent/30',
  negociacion: 'bg-gold/20 text-gold border-gold/30',
  aprobada:    'bg-success/20 text-success border-success/30',
  rechazada:   'bg-danger/20 text-danger border-danger/30',
  // Visita
  si:          'bg-success/20 text-success border-success/30',
  no:          'bg-muted/20 text-muted border-muted/30',
  virtual:     'bg-purple/20 text-purple border-purple/30',
  llamada:     'bg-gold/20 text-gold border-gold/30',
  parcial:     'bg-gold/20 text-gold border-gold/30',
}

const LABELS: Record<string, string> = {
  seguimiento: 'Seguimiento',
  cerrado:     'Cerrado',
  perdido:     'Perdido',
  frio:        'Frío',
  activo:      'Activo',
  'en-riesgo': 'En riesgo',
  inactivo:    'Inactivo',
  borrador:    'Borrador',
  enviada:     'Enviada',
  negociacion: 'Negociación',
  aprobada:    'Aprobada',
  rechazada:   'Rechazada',
  si:          'Sí',
  no:          'No',
  virtual:     'Virtual',
  llamada:     'Llamada',
  parcial:     'Parcial',
}

interface BadgeProps {
  value: string | null | undefined
}

export default function Badge({ value }: BadgeProps) {
  if (!value) return <span className="text-muted text-xs">—</span>
  const style = BADGE_STYLES[value] ?? 'bg-muted/20 text-muted border-muted/30'
  const label = LABELS[value] ?? value
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  )
}
