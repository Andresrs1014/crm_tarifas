import type { ValueType } from 'recharts/types/component/DefaultTooltipContent'

/** Estilos compartidos — equivalente visual a Chart.js del HTML v6 (fondo oscuro, texto claro). */
export const CHART_AXIS = {
  tick: { fill: '#8899b4', fontSize: 10, fontFamily: 'Barlow, sans-serif' },
  axisLine: { stroke: '#1e293b' },
  tickLine: { stroke: '#1e293b' },
}

/** Eje Y de barras horizontales — HTML Chart.js usa ~12px y etiquetas en una sola línea */
export const CHART_AXIS_Y_CATEGORY = {
  tick: { fill: '#8899b4', fontSize: 12, fontFamily: 'Barlow, sans-serif' },
  axisLine: { stroke: '#1e293b' },
  tickLine: false as const,
}

/** Ancho para etiquetas largas del pipeline (evita wrap en 2 líneas) */
export const PIPELINE_YAXIS_WIDTH = 164

export const CHART_GRID = {
  stroke: 'rgba(136,153,180,0.12)',
  strokeDasharray: '3 3',
}

export const chartTooltipProps = {
  contentStyle: {
    background: '#131a28',
    border: '1px solid #1e293b',
    borderRadius: 8,
    boxShadow: '0 4px 20px rgba(0,0,0,0.45)',
    fontFamily: 'Barlow, sans-serif',
    fontSize: 13,
    padding: '10px 14px',
  },
  labelStyle: { color: '#8899b4', marginBottom: 4, fontWeight: 600 },
  itemStyle: { color: '#e2e8f0', padding: '2px 0' },
  cursor: { fill: 'rgba(255,255,255,0.05)' },
}

export const chartLegendProps = {
  wrapperStyle: { paddingTop: 16, fontFamily: 'Barlow, sans-serif' },
  iconType: 'circle' as const,
  iconSize: 8,
}

export function currencyTooltipFormatter(value: ValueType): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return String(value ?? '')
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

export const barActiveBar = {
  stroke: '#fff',
  strokeWidth: 1,
  fillOpacity: 0.95,
}

/** Colores Recharts — design tokens HTML v6 (no repetir en páginas) */
export const CHART_DONUT_TIPO = {
  prospecto: { fill: 'rgba(0,194,255,0.8)', stroke: '#00c2ff' },
  cliente: { fill: 'rgba(0,230,118,0.8)', stroke: '#00e676' },
} as const

export const CHART_LINE_TIMELINE = {
  prospectos: '#00c2ff',
  clientes: '#00e676',
} as const

export const CHART_BAR_COMERCIAL = {
  prospectos: 'rgba(0,194,255,0.7)',
  clientes: 'rgba(0,230,118,0.7)',
} as const

export const CHART_GESTION_CLIENTES = 'rgba(0,230,118,0.75)'

export const CHART_PIE_STROKE_DARK = '#111827'

export const CHART_MUTED_FALLBACK = '#8899b4'
