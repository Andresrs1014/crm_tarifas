/** Helpers compartidos entre el listado (GestionDocumental.tsx) y el detalle (GestionDocumentalDetalle.tsx). */

export const ESTADO_STYLE = {
  completo:   { label: 'Completo',   bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.35)'  },
  incompleto: { label: 'Incompleto', bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.35)'  },
  pendiente:  { label: 'Pendiente',  bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.35)' },
}

export function pctColor(pct: number): string {
  if (pct >= 80) return '#34d399'
  if (pct >= 50) return '#f59e0b'
  return '#f87171'
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
