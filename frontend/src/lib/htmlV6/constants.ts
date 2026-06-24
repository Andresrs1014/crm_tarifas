/** Constantes portadas de seguimiento-zymo-v6 (88).html */

export const HTML_SERVICES = [
  'Zona Franca',
  'Depósito Aduanero',
  'CEDI',
  'Transporte',
  'Paqueteo',
  'Aduana',
] as const

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
