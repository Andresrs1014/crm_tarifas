/**
 * Catálogos de dominio HTML v6 — única fuente (regla 06-no-hardcode).
 * Datos de negocio vienen de API; aquí solo metadata de estados, badges y colores de diseño.
 */
import {
  ACTIVIDAD_TIPO_ICON,
  ACTIVIDAD_TIPO_OPTIONS,
  DETALLE_PIPELINE_STAGES,
  ESTADOS_ACTIVOS,
  FACTURADO_OPTIONS,
  HTML_SERVICES,
  PIPELINE_CHART_COLORS,
  PIPELINE_ESTADOS,
  PIPELINE_LABELS,
  SVC_COLORS,
  VISITA_OPTIONS,
} from './constants'

export {
  ACTIVIDAD_TIPO_ICON,
  ACTIVIDAD_TIPO_OPTIONS,
  DETALLE_PIPELINE_STAGES,
  ESTADOS_ACTIVOS,
  FACTURADO_OPTIONS,
  HTML_SERVICES,
  PIPELINE_CHART_COLORS,
  PIPELINE_ESTADOS,
  PIPELINE_LABELS,
  SVC_COLORS,
  VISITA_OPTIONS,
}

export type SelectOption = { value: string; label: string }

export const BADGE_TO_HEX: Record<string, string> = {
  'badge-blue': '#00c2ff',
  'badge-purple': '#a855f7',
  'badge-gold': '#f5a623',
  'badge-green': '#00e676',
  'badge-gray': '#8899b4',
  'badge-red': '#ff4444',
  'badge-cyan': '#00c2ff',
}

export function badgeToHex(badgeClass: string): string {
  return BADGE_TO_HEX[badgeClass] ?? '#8899b4'
}

export const PROSPECTO_BADGE: Record<string, string> = {
  prospecto: 'badge-blue',
  reconocimiento: 'badge-blue',
  propuesta: 'badge-purple',
  resolucion: 'badge-purple',
  aceptacion_alcance: 'badge-gold',
  aceptacion_propuesta: 'badge-gold',
  firma_contrato: 'badge-green',
  creacion_sop: 'badge-green',
  facturado: 'badge-green',
  frio: 'badge-gray',
  perdido: 'badge-red',
  seguimiento: 'badge-blue',
  cerrado: 'badge-green',
}

export const PROSPECTO_LABEL: Record<string, string> = {
  prospecto: 'Prospecto',
  reconocimiento: 'Visita',
  propuesta: 'Propuesta Comercial',
  resolucion: 'Resolución de Dudas',
  aceptacion_alcance: 'Acept. Alcance',
  aceptacion_propuesta: 'Acept. Propuesta',
  firma_contrato: 'Firma Contrato',
  creacion_sop: 'Creación Ficha Cliente',
  facturado: 'Facturado',
  frio: 'Frío',
  perdido: 'Perdido',
  seguimiento: 'En Seguimiento',
  cerrado: 'Cerrado',
}

const PROSPECTO_EMOJI: Record<string, string> = {
  prospecto: '🎯',
  reconocimiento: '🏢',
  propuesta: '📄',
  aceptacion_propuesta: '🤝',
  creacion_sop: '📋',
  facturado: '💰',
  frio: '🧊',
  perdido: '❌',
}

export type ProspectoFilterOption = SelectOption & { badge: string }

export const PROSPECTO_FILTER_OPTIONS: ProspectoFilterOption[] = [
  { value: '', label: 'Todos los estados', badge: '' },
  ...PIPELINE_ESTADOS.map((value) => ({
    value,
    label: PROSPECTO_EMOJI[value]
      ? `${PROSPECTO_EMOJI[value]} ${PROSPECTO_LABEL[value] ?? value}`
      : (PROSPECTO_LABEL[value] ?? value),
    badge: PROSPECTO_BADGE[value] ?? 'badge-gray',
  })),
]

export const PROSPECTO_FORM_OPTIONS: SelectOption[] = [
  'prospecto',
  'reconocimiento',
  'propuesta',
  'aceptacion_propuesta',
  'creacion_sop',
  'facturado',
].map((value) => ({
  value,
  label: PROSPECTO_EMOJI[value]
    ? `${PROSPECTO_EMOJI[value]} ${PROSPECTO_LABEL[value]}`
    : PROSPECTO_LABEL[value],
}))

export const PROSPECTO_STAGE_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(PROSPECTO_BADGE).map(([k, badge]) => [k, badgeToHex(badge)]),
)

export const CLIENTE_ESTADO_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'activo', label: 'Activo' },
  { value: 'en-riesgo', label: 'En riesgo' },
  { value: 'inactivo', label: 'Inactivo' },
]

export const CLIENTE_BADGE: Record<string, string> = {
  activo: 'badge-green',
  'en-riesgo': 'badge-red',
  riesgo: 'badge-red',
  inactivo: 'badge-gray',
}

export const CLIENTE_LABEL: Record<string, string> = {
  activo: 'Activo',
  'en-riesgo': 'En Riesgo',
  riesgo: 'En Riesgo',
  inactivo: 'Inactivo',
}

export const COTIZACION_ESTADO_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
]

export const COTIZACION_BADGE: Record<string, string> = {
  borrador: 'badge-gray',
  enviada: 'badge-blue',
  negociacion: 'badge-gold',
  aprobada: 'badge-green',
  rechazada: 'badge-red',
}

export const COT_PIPELINE_CHART = [
  { key: 'aprobadas' as const, name: 'Aprobada', fill: 'rgba(0,230,118,0.8)' },
  { key: 'borradores' as const, name: 'Borrador', fill: 'rgba(136,153,180,0.5)' },
  { key: 'enviadas' as const, name: 'Enviada', fill: 'rgba(0,194,255,0.8)' },
  { key: 'negociacion' as const, name: 'Negociación', fill: 'rgba(245,166,35,0.8)' },
  { key: 'rechazadas' as const, name: 'Rechazada', fill: 'rgba(255,68,68,0.8)' },
  { key: 'vencidas' as const, name: 'Vencida', fill: 'rgba(200,50,50,0.6)' },
]

export const TIPO_CONTACTO_OPTIONS: SelectOption[] = [
  { value: '', label: '— Sin definir —' },
  { value: 'principal', label: '⭐ Principal' },
  { value: 'comercial', label: '💼 Comercial' },
  { value: 'gestion-documental', label: '📁 Gestión Documental' },
  { value: 'financiero', label: '💰 Financiero' },
  { value: 'operativo', label: '⚙️ Operativo' },
]

export const FACTURADO_BADGE: Record<string, string> = {
  si: 'badge-green',
  parcial: 'badge-gold',
  no: 'badge-gray',
}

/** Compañías operativas — filtro HTML v6 (CRM + Clientes) */
export const COMPANIAS_FILTER_OPTIONS: SelectOption[] = [
  { value: '', label: '🏢 Todas las compañías' },
  { value: 'Logimat', label: 'Logimat' },
  { value: 'IMC Depósito', label: 'IMC Depósito' },
  { value: 'IMC Cargo', label: 'IMC Cargo' },
  { value: 'Aduana', label: 'Aduana' },
]

/** Deriva compañías desde servicios (misma lógica que matriz-riesgos backend) */
export function deriveCompaniasFromServicios(servicios: string[]): string[] {
  const cias: string[] = []
  if (servicios.some((s) => ['Zona Franca', 'CEDI', 'Transporte'].includes(s))) cias.push('Logimat')
  if (servicios.some((s) => ['Aduana', 'Depósito Aduanero'].includes(s))) cias.push('IMC Cargo')
  if (servicios.includes('Paqueteo')) cias.push('IMC Depósito')
  if (servicios.includes('Aduana')) cias.push('Aduana')
  return [...new Set(cias)]
}

export function recordMatchesCompaniaFilter(
  servicios: string[],
  companias: string[] | undefined,
  filtCia: string,
): boolean {
  if (!filtCia) return true
  const list = companias?.length ? companias : deriveCompaniasFromServicios(servicios)
  return list.includes(filtCia)
}

export const CATEGORIA_COLOR: Record<string, string> = {
  A: '#f5a623',
  B: '#00c2ff',
  C: '#8899b4',
}

export const CRM_KPI_STRIP = [
  { key: 'total', label: 'Total Prospectos', color: '#00c2ff' },
  { key: 'pipeline', label: 'En Pipeline', color: '#a855f7' },
  { key: 'facturados', label: 'Facturados', color: '#00e676' },
  { key: 'perdidos', label: 'Frío / Perdido', color: '#ff4444' },
  { key: 'ingresos', label: 'Ingresos Esperados', color: '#f5a623' },
] as const

const CRM_STAGE_VALUES = [
  'prospecto',
  'reconocimiento',
  'propuesta',
  'aceptacion_propuesta',
  'creacion_sop',
  'facturado',
] as const

/** Columnas Kanban CRM — colores desde PROSPECTO_STAGE_COLOR */
export const CRM_KANBAN_STAGES = CRM_STAGE_VALUES.map((value) => {
  const color = PROSPECTO_STAGE_COLOR[value] ?? '#8899b4'
  return {
    value,
    label: PROSPECTO_LABEL[value] ?? value,
    color,
    bg: `${color}10`,
  }
})
