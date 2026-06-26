/** Constantes portadas de seguimiento-zymo-v6 (88).html */

export const HTML_SERVICES = [
  'Zona Franca',
  'Depósito Aduanero',
  'CEDI',
  'Transporte',
  'Paqueteo',
  'Aduana',
] as const

export type HtmlService = (typeof HTML_SERVICES)[number]

export const SVC_COLORS: Record<string, string> = {
  'Zona Franca': '#00c2ff',
  'Depósito Aduanero': '#a855f7',
  CEDI: '#00e676',
  Transporte: '#f5a623',
  Paqueteo: '#ff4444',
  Aduana: '#4fc3f7',
}

export const ESTADOS_ACTIVOS = [
  'prospecto',
  'reconocimiento',
  'propuesta',
  'aceptacion_propuesta',
  'creacion_sop',
] as const

export const PIPELINE_ESTADOS = [
  'prospecto',
  'reconocimiento',
  'propuesta',
  'aceptacion_propuesta',
  'creacion_sop',
  'facturado',
  'frio',
  'perdido',
] as const

export const PIPELINE_LABELS = [
  'Prospecto',
  'Visita',
  'Propuesta Comercial',
  'Acept. Propuesta Comercial',
  'Creación Ficha Cliente',
  'Facturado',
  'Frío',
  'Perdido',
] as const

export const PIPELINE_CHART_COLORS = [
  'rgba(0,194,255,0.8)',
  'rgba(0,194,255,0.6)',
  'rgba(168,85,247,0.8)',
  'rgba(168,85,247,0.6)',
  'rgba(245,166,35,0.8)',
  'rgba(245,166,35,0.6)',
  'rgba(0,230,118,0.8)',
  'rgba(136,153,180,0.6)',
  'rgba(255,68,68,0.8)',
]


export const DETALLE_PIPELINE_STAGES = [
  { value: 'prospecto', label: 'Prospecto' },
  { value: 'reconocimiento', label: 'Visita' },
  { value: 'propuesta', label: 'Propuesta Comercial' },
  { value: 'aceptacion_propuesta', label: 'Aceptacion Propuesta Comercial' },
  { value: 'creacion_sop', label: 'Creacion Ficha Cliente' },
  { value: 'facturado', label: 'Facturado' },
] as const

export const ACTIVIDAD_TIPO_ICON = {
  llamada: '\uD83D\uDCDE',
  reunion: '\uD83E\uDD1D',
  email: '\uD83D\uDCE7',
  visita: '\uD83C\uDFE2',
  tarea: '\u2705',
  seguimiento: '\uD83D\uDD14',
} as const

export const ACTIVIDAD_TIPO_OPTIONS = [
  { value: 'llamada', label: 'llamada' },
  { value: 'reunion', label: 'reunion' },
  { value: 'email', label: 'email' },
  { value: 'visita', label: 'visita' },
  { value: 'tarea', label: 'tarea' },
  { value: 'seguimiento', label: 'seguimiento' },
] as const

export const VISITA_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Si - Presencial' },
  { value: 'virtual', label: 'Si - Virtual' },
  { value: 'llamada', label: 'Si - Llamada' },
] as const

export const FACTURADO_OPTIONS = [
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Si' },
  { value: 'parcial', label: 'Parcial' },
] as const
