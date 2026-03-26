/** Formatea número como pesos colombianos: 1200000 → '$1.200.000' */
export function fmtCOP(value: number | null | undefined): string {
  if (value == null) return '$0'
  return '$' + Math.round(value).toLocaleString('es-CO')
}

/** Formatea tarifa para display: '559.900' + 'moneda' → '$559.900' */
export function fmtTarifa(valor: string, tipo: string): string {
  if (!valor) return '—'
  return tipo === 'moneda' ? '$' + valor : valor
}

/** '559.900' → 559900 (punto = separador de miles en Colombia) */
export function parseTarifaNum(str: string): number {
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0
}

/** 559900 → '559.900' */
export function formatTarifaNum(num: number): string {
  return Math.round(num).toLocaleString('es-CO')
}

/** 'YYYY-MM-DD' → '15 de marzo de 2026' */
export function fmtDate(str: string | null | undefined): string {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** 'YYYY-MM-DD' → 'YYYY-MM-DD' (devuelve today si vacío) */
export function today(): string {
  return new Date().toISOString().split('T')[0]
}
