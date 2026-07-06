// ─── Servicios logísticos — fuente única htmlV6/constants ────────────────────
export { HTML_SERVICES as SERVICIOS } from '../lib/htmlV6/constants'
export type { HtmlService as Servicio } from '../lib/htmlV6/constants'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  username: string
  role: 'superadmin' | 'usuario'
  createdAt: string
  comercial?: { id: string; nombre: string; cargo?: string } | null
}

// ─── Comerciales ──────────────────────────────────────────────────────────────
export interface Comercial {
  id: string
  nombre: string
  cargo?: string
  email?: string
  tel?: string
  activo: boolean
  createdAt: string
}

export interface ComercialCreate {
  nombre: string
  cargo?: string
  email?: string
  tel?: string
}

// ─── Contactos ────────────────────────────────────────────────────────────────
export interface Contacto {
  id: string
  recordId: string
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
  direccion?: string
  orden: number
  cumpleanos?: string
  recibeRegalos: boolean
  fotosEntrega: string[]
  fdaEntregado: boolean
}

export interface ContactoCreate {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
  orden?: number
  cumpleanos?: string
  recibeRegalos?: boolean
  /** HTML v6: principal | comercial | gestion-documental | financiero | operativo */
  tipo?: string
}

// ─── Actividades ──────────────────────────────────────────────────────────────
export type ActividadTipo = 'llamada' | 'reunion' | 'email' | 'visita' | 'tarea' | 'seguimiento'

export interface Actividad {
  id: string
  recordId: string
  tipo: ActividadTipo
  descripcion: string
  fecha: string
  hecho: boolean
  createdAt: string
}

export interface ActividadCreate {
  tipo: ActividadTipo
  descripcion: string
  fecha: string
}

// ─── CRM Records ──────────────────────────────────────────────────────────────
export type TipoRecord = 'prospecto' | 'cliente'
export type EstadoProspecto =
  | 'prospecto' | 'reconocimiento' | 'propuesta'
  | 'aceptacion_propuesta'
  | 'creacion_sop' | 'facturado' | 'frio' | 'perdido'
export type EstadoCliente = 'activo' | 'en-riesgo' | 'inactivo'
export type TipoCliente = 'directo' | 'indirecto' | 'referido'
export type TipoVisita = 'no' | 'si' | 'virtual' | 'llamada'
export type TipoFacturado = 'no' | 'si' | 'parcial'

/** CRMRecord — named to avoid conflict with TypeScript's built-in Record<K,V> utility type */
export interface CRMRecord {
  id: string
  tipo: TipoRecord
  empresa: string
  nit?: string
  ciudad?: string
  direccion?: string
  categoria?: 'A' | 'B' | 'C'
  comercialId: string
  comercial: Comercial
  tipoCliente: TipoCliente
  clienteIndirectoId?: string
  comision?: string
  fecha: string
  proximoSeguimiento?: string
  observaciones?: string
  estadoProspecto?: EstadoProspecto
  estadoCliente?: EstadoCliente
  visita?: TipoVisita
  visitaCliente?: TipoVisita
  fechaVisita?: string
  fechaVisitaCliente?: string
  facturadoP?: TipoFacturado
  facturado?: TipoFacturado
  valorP?: number
  valor?: number
  nuevoServicio?: string
  servicioNuevo?: string
  ingresosEsperados?: number
  servicios: string[]
  facturacionLineas: { [linea: string]: number }
  stageHistory: { stage: string; desde: string; hasta: string | null }[]
  companias: string[]
  contactos: Contacto[]
  actividades: Actividad[]
  createdAt: string
  updatedAt: string
}

export interface RecordCreate {
  tipo: TipoRecord
  empresa: string
  nit?: string
  ciudad?: string
  direccion?: string
  categoria?: string
  comercialId: string
  tipoCliente?: TipoCliente
  clienteIndirectoId?: string
  comision?: string
  fecha: string
  proximoSeguimiento?: string
  observaciones?: string
  estadoProspecto?: EstadoProspecto
  estadoCliente?: EstadoCliente
  visita?: TipoVisita
  visitaCliente?: TipoVisita
  fechaVisita?: string
  fechaVisitaCliente?: string
  facturadoP?: TipoFacturado
  facturado?: TipoFacturado
  valorP?: number
  valor?: number
  nuevoServicio?: string
  servicioNuevo?: string
  ingresosEsperados?: number
  servicios?: string[]
  facturacionLineas?: { [linea: string]: number }
  contactos?: ContactoCreate[]
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_prospectos: number
  total_clientes: number
  total_cotizaciones: number
  facturacion_total: number
  cotizaciones_en_curso: number
  cotizaciones_aprobadas: number
  cotizaciones_rechazadas: number
  cotizaciones_negociacion: number
  prospectos_por_estado: { [estado: string]: number }
  registros_por_mes: Array<{ mes: string; prospectos: number; clientes: number }>
  servicios_frecuentes: Array<{ servicio: string; count: number }>
  actividad_por_comercial: Array<{
    nombre: string
    prospectos: number
    clientes: number
    visitas: number
    facturado: number
  }>
  facturacion_por_linea: { [linea: string]: number }
  cotizaciones_por_estado: { [estado: string]: number }
  lineas_mas_cotizadas: Array<{ linea: string; count: number }>
}

export interface RankingComercial {
  id: string
  nombre: string
  cargo?: string
  prospectos: number
  clientes: number
  visitas: number
  facturado: number
}

// ─── Biblioteca ───────────────────────────────────────────────────────────────
export interface BibliotecaItem {
  id: string
  grupoId: string
  nombre: string
  tarifa: string // NEVER number — "$559.900" or "0,36%"
  tipoTarifa: 'moneda' | 'porcentaje'
  obs?: string
  extraCols: { [k: string]: string }
  orden: number
}

export interface BibliotecaGrupo {
  id: string
  lineaId: string
  nombre: string
  orden: number
  obsEcommerce?: string
  items: BibliotecaItem[]
}

export interface BibliotecaObs {
  id: string
  lineaId: string
  nombre: string
  html: string
}

export interface BibliotecaLinea {
  id: string
  nombre: string
  orden: number
  columnas: string[]
  grupos: BibliotecaGrupo[]
  obs: BibliotecaObs[]
}

// ─── Cotizaciones ─────────────────────────────────────────────────────────────
export type EstadoCotizacion = 'borrador' | 'enviada' | 'negociacion' | 'aprobada' | 'rechazada'

export interface Cotizacion {
  id: string
  numero: string
  recordId?: string
  empresa: string
  nit?: string
  ciudad?: string
  contacto?: string
  cargo?: string
  telefono?: string
  email?: string
  comercial: string
  paqueteadora?: string
  tarifaTipo: 'biblioteca' | 'especial'
  estado: EstadoCotizacion
  fecha?: string
  vigencia?: string
  asunto?: string
  lineas: string[]
  itemsSnapshot: { [k: string]: unknown }
  obsHtml: { [k: string]: string }
  obsLibre?: string
  htmlPreview?: string
  createdAt: string
  updatedAt: string
}

export interface CotizacionCreate {
  recordId?: string
  empresa: string
  nit?: string
  ciudad?: string
  contacto?: string
  cargo?: string
  telefono?: string
  email?: string
  comercial: string
  paqueteadora?: string
  tarifaTipo: string
  estado: EstadoCotizacion
  fecha?: string
  vigencia?: string
  asunto?: string
  lineas: string[]
  itemsSnapshot: { [k: string]: unknown }
  obsHtml: { [k: string]: string }
  obsLibre?: string
  htmlPreview?: string
}

// ─── SAC ──────────────────────────────────────────────────────────────────────
export interface ContactoSAC extends Contacto {
  empresa: string
  comercial: string
  categoria?: 'A' | 'B' | 'C' | null
  tipoCliente?: string | null
}
