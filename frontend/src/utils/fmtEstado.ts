export function fmtEstado(value: string | undefined, map: { value: string; label: string }[]): string {
  if (!value) return '—'
  return map.find(e => e.value === value)?.label ?? value.replace(/_/g, ' ')
}
