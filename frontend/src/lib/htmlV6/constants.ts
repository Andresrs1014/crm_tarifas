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

// ─── Biblioteca schemas (portados de seguimiento-zymo-v6 §4617–4889) ──────────

export interface BibSchemaCol {
  id: string
  nombre: string
  tipo: 'texto' | 'moneda' | 'numero' | 'porcentaje' | 'tarifa' | 'tarifa-mixta' | 'tarifa-texto' | 'mixta'
}

export interface PaqueteoSchemaEntry {
  paqueteadora: 'COORDINADORA' | 'TCC' | 'SERVIENTREGA'
  label: string
  cols: BibSchemaCol[]
  colspanGroups?: { label: string; cols: string[] }[]
  hasObs?: boolean
}

export const TRANSP_SCHEMA: {
  local: { label: string; cols: BibSchemaCol[] }
  otros: { label: string; cols: BibSchemaCol[] }
} = {
  local: {
    label: 'TRANSPORTE LOCAL',
    cols: [
      { id: 'tipoVehiculo',  nombre: 'TIPO DE VEHÍCULO',                    tipo: 'texto'       },
      { id: 'capacidades',   nombre: 'CAPACIDADES',                          tipo: 'texto'       },
      { id: 'valorMax',      nombre: 'VALOR MÁX. AUTORIZADO PARA MOVILIZAR', tipo: 'texto'       },
      { id: 'viaje4h',       nombre: 'VIAJE 4 HORAS',                        tipo: 'tarifa'      },
      { id: 'viaje8h',       nombre: 'VIAJE 8 HORAS',                        tipo: 'tarifa'      },
      { id: 'horaAdc',       nombre: 'HORA ADICIONAL',                       tipo: 'tarifa'      },
    ],
  },
  otros: {
    label: 'OTROS SERVICIOS DE TRANSPORTE',
    cols: [
      { id: 'servicio',       nombre: 'SERVICIO',       tipo: 'texto'        },
      { id: 'caracteristica', nombre: 'CARACTERÍSTICA', tipo: 'texto'        },
      { id: 'condicion',      nombre: 'CONDICIÓN',      tipo: 'texto'        },
      { id: 'unaHora',        nombre: '(1) UNA HORA',   tipo: 'tarifa-mixta' },
      { id: 'minima',         nombre: 'MÍNIMA',         tipo: 'tarifa-texto' },
    ],
  },
}

export type TranspTipo = keyof typeof TRANSP_SCHEMA

export const PAQUETEO_SCHEMA: Record<string, PaqueteoSchemaEntry> = {
  // COORDINADORA
  coord_industrial: {
    paqueteadora: 'COORDINADORA', label: 'Mercancía Industrial',
    cols: [
      { id: 'trayecto',  nombre: 'Trayecto',       tipo: 'texto'      },
      { id: 'minFlete',  nombre: 'Mínima Flete',   tipo: 'moneda'     },
      { id: 'minKilos',  nombre: 'Mínima Kilos',   tipo: 'numero'     },
      { id: 'pctManejo', nombre: '% Manejo',        tipo: 'porcentaje' },
      { id: 'manejo',    nombre: 'Manejo',          tipo: 'moneda'     },
    ],
  },
  coord_xl: {
    paqueteadora: 'COORDINADORA', label: 'Mercancía XL',
    cols: [
      { id: 'trayecto',  nombre: 'Trayecto',       tipo: 'texto'      },
      { id: 'minFlete',  nombre: 'Mínima Flete',   tipo: 'moneda'     },
      { id: 'minKilos',  nombre: 'Mínima Kilos',   tipo: 'numero'     },
      { id: 'pctManejo', nombre: '% Manejo',        tipo: 'porcentaje' },
      { id: 'manejo',    nombre: 'Manejo',          tipo: 'moneda'     },
    ],
  },
  coord_sobreporte: {
    paqueteadora: 'COORDINADORA', label: 'Sobreporte Radicación de Documentos',
    cols: [
      { id: 'trayecto',  nombre: 'Trayecto',          tipo: 'texto'  },
      { id: 'primerDoc', nombre: 'Primer Documento',  tipo: 'moneda' },
      { id: 'copiaAdc',  nombre: 'Copia Adicional',   tipo: 'moneda' },
    ],
  },
  coord_firma: {
    paqueteadora: 'COORDINADORA', label: 'Documentos — Firma de Documentos',
    cols: [
      { id: 'trayecto',  nombre: 'Trayecto',          tipo: 'texto'  },
      { id: 'primerDoc', nombre: 'Primer Documento',  tipo: 'moneda' },
      { id: 'copiaAdc',  nombre: 'Copia Adicional',   tipo: 'moneda' },
    ],
  },
  coord_ecommerce: {
    paqueteadora: 'COORDINADORA', label: 'ECOMMERCE', hasObs: true,
    cols: [
      { id: 'pesoEnvio', nombre: 'Peso del Envío', tipo: 'texto'  },
      { id: 'local',     nombre: 'Local',          tipo: 'moneda' },
      { id: 'regional',  nombre: 'Regional',       tipo: 'moneda' },
      { id: 'nacional',  nombre: 'Nacional',       tipo: 'moneda' },
      { id: 'zonal',     nombre: 'Zonal',          tipo: 'moneda' },
      { id: 'otras',     nombre: 'Otras',          tipo: 'moneda' },
      { id: 'especial',  nombre: 'Especial',       tipo: 'moneda' },
    ],
  },
  // TCC
  tcc_paqueteria: {
    paqueteadora: 'TCC', label: 'Paquetería TCC',
    cols: [
      { id: 'trayecto',     nombre: 'Trayecto',             tipo: 'texto'      },
      { id: 'minFlete',     nombre: 'Mínima Flete',         tipo: 'moneda'     },
      { id: 'minManejoSeg', nombre: 'Mínimo Manejo Seguro', tipo: 'moneda'     },
      { id: 'minKilos',     nombre: 'Mínima Kilos',         tipo: 'texto'      },
      { id: 'pctManejo',    nombre: '% Manejo',              tipo: 'porcentaje' },
    ],
  },
  tcc_boomerang: {
    paqueteadora: 'TCC', label: 'Boommerang / Sobreporte',
    cols: [
      { id: 'trayecto', nombre: 'Trayecto', tipo: 'texto'  },
      { id: 'fisico',   nombre: 'Físico',   tipo: 'moneda' },
      { id: 'digital',  nombre: 'Digital',  tipo: 'moneda' },
      { id: 'mixto',    nombre: 'Mixto',    tipo: 'moneda' },
    ],
  },
  tcc_radicacion: {
    paqueteadora: 'TCC', label: 'Radicación de Documentos',
    colspanGroups: [
      { label: 'Ida y Regreso Físico',  cols: ['rad_fis_flete', 'rad_fis_docAdc'] },
      { label: 'Ida y Regreso Digital', cols: ['rad_dig_flete', 'rad_dig_docAdc'] },
      { label: 'Ida y Regreso Mixto',   cols: ['rad_mix_flete', 'rad_mix_docAdc'] },
    ],
    cols: [
      { id: 'trayecto',       nombre: 'Trayecto',       tipo: 'texto'  },
      { id: 'rad_fis_flete',  nombre: 'Flete 1Kg',      tipo: 'moneda' },
      { id: 'rad_fis_docAdc', nombre: 'Doc. Adicional', tipo: 'moneda' },
      { id: 'rad_dig_flete',  nombre: 'Flete 1Kg',      tipo: 'moneda' },
      { id: 'rad_dig_docAdc', nombre: 'Doc. Adicional', tipo: 'moneda' },
      { id: 'rad_mix_flete',  nombre: 'Flete 1Kg',      tipo: 'moneda' },
      { id: 'rad_mix_docAdc', nombre: 'Doc. Adicional', tipo: 'moneda' },
    ],
  },
  tcc_mensajeria: {
    paqueteadora: 'TCC', label: 'Mensajería',
    cols: [
      { id: 'trayecto',     nombre: 'Trayecto',         tipo: 'texto'      },
      { id: 'kg1',          nombre: '1 Kg',             tipo: 'moneda'     },
      { id: 'kg2',          nombre: '2 Kg',             tipo: 'moneda'     },
      { id: 'kg3',          nombre: '3 Kg',             tipo: 'moneda'     },
      { id: 'kg4',          nombre: '4 Kg',             tipo: 'moneda'     },
      { id: 'kg5',          nombre: '5 Kg',             tipo: 'moneda'     },
      { id: 'manejoSeg',    nombre: 'Manejo Seguro',    tipo: 'porcentaje' },
      { id: 'minManejoSeg', nombre: 'Mín. Manejo Seg.', tipo: 'moneda'    },
    ],
  },
  // SERVIENTREGA
  srv_doc_unitario: {
    paqueteadora: 'SERVIENTREGA', label: 'Documento Unitario',
    cols: [
      { id: 'tiempoEntrega', nombre: 'Tiempo de Entrega', tipo: 'texto' },
      { id: 'tipo',          nombre: 'Tipo',              tipo: 'texto' },
      { id: 'nacional',      nombre: 'Nacional',          tipo: 'mixta' },
      { id: 'territorial',   nombre: 'Territorial',       tipo: 'mixta' },
      { id: 'zonal',         nombre: 'Zonal',             tipo: 'mixta' },
      { id: 'urbano',        nombre: 'Urbano',            tipo: 'mixta' },
      { id: 'especial',      nombre: 'Especial',          tipo: 'mixta' },
    ],
  },
  srv_sobreporte: {
    paqueteadora: 'SERVIENTREGA', label: 'Sobreporte',
    cols: [
      { id: 'tiempoEntrega', nombre: 'Tiempo de Entrega', tipo: 'texto'      },
      { id: 'tipoTrayecto',  nombre: 'Tipo de Trayecto',  tipo: 'texto'      },
      { id: 'valorFlete',    nombre: 'Valor Flete',       tipo: 'moneda'     },
      { id: 'pctManejo',     nombre: '% Manejo',           tipo: 'porcentaje' },
      { id: 'sobrefleteMin', nombre: 'Sobreflete Mínimo', tipo: 'moneda'     },
    ],
  },
  srv_mercancia_premier: {
    paqueteadora: 'SERVIENTREGA', label: 'Mercancía Premier',
    cols: [
      { id: 'tiempoEntrega', nombre: 'Tiempo de Entrega',   tipo: 'texto'  },
      { id: 'medioTransp',   nombre: 'Medio de Transporte', tipo: 'texto'  },
      { id: 'kilos',         nombre: 'Kilos',               tipo: 'texto'  },
      { id: 'nacional',      nombre: 'Nacional',            tipo: 'moneda' },
      { id: 'territorial',   nombre: 'Territorial',         tipo: 'moneda' },
      { id: 'zonal',         nombre: 'Zonal',               tipo: 'moneda' },
      { id: 'urbano',        nombre: 'Urbano',              tipo: 'moneda' },
      { id: 'especial',      nombre: 'Especial',            tipo: 'moneda' },
      { id: 'sobrefleteMin', nombre: 'Sobreflete Mínimo',   tipo: 'moneda' },
    ],
  },
  srv_mercancia_industrial: {
    paqueteadora: 'SERVIENTREGA', label: 'Mercancía Industrial',
    cols: [
      { id: 'condComerciales', nombre: 'Condiciones Comerciales', tipo: 'texto' },
      { id: 'nacional',        nombre: 'Nacional',                tipo: 'mixta' },
      { id: 'zonal',           nombre: 'Zonal',                   tipo: 'mixta' },
      { id: 'urbano',          nombre: 'Urbano',                  tipo: 'mixta' },
    ],
  },
}

export const PAQUETEO_GRUPOS_COORD = ['coord_industrial', 'coord_xl', 'coord_sobreporte', 'coord_firma', 'coord_ecommerce'] as const
export const PAQUETEO_GRUPOS_TCC = ['tcc_paqueteria', 'tcc_boomerang', 'tcc_radicacion', 'tcc_mensajeria'] as const
export const PAQUETEO_GRUPOS_SERVIENTREGA = ['srv_doc_unitario', 'srv_sobreporte', 'srv_mercancia_premier', 'srv_mercancia_industrial'] as const
export const PAQUETEO_PAQUETEADORAS = ['COORDINADORA', 'TCC', 'SERVIENTREGA'] as const
export type PaqueteoTab = typeof PAQUETEO_PAQUETEADORAS[number]
