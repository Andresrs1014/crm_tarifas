import type { Cotizacion } from '../../types'

/** resolveVigencia — HTML v6 */
export function resolveVigencia(cot: Cotizacion & { vigencia?: string | number; fecha?: string }): Date {
  const raw = cot.vigencia
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return new Date(`${raw}T12:00`)
  }
  const base = (cot.fecha ?? cot.createdAt?.slice(0, 10) ?? '') + 'T12:00'
  const d = new Date(base)
  const days = typeof raw === 'number' ? raw : Number(raw) || 30
  d.setDate(d.getDate() + days)
  return d
}

export function cotFechaDisplay(cot: Cotizacion & { fecha?: string }): string {
  return cot.fecha ?? cot.createdAt?.slice(0, 10) ?? '—'
}
