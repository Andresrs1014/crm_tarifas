export const SERVICIOS = [
  'Zona Franca',
  'Depósito Aduanero',
  'CEDI',
  'Transporte',
  'Paqueteo',
  'Aduana',
] as const

export const SERVICIO_COLORS: Record<string, string> = {
  'Zona Franca':       '#00c2ff',
  'Depósito Aduanero': '#f5a623',
  'CEDI':              '#f5a623',
  'Transporte':        '#00e676',
  'Paqueteo':          '#a855f7',
  'Aduana':            '#ff4444',
}

// ---------- Biblioteca ----------

export interface BibliotecaColumna {
  id: string     // slug único, ej: 'kg', 'm3'
  nombre: string // label visible, ej: 'Kilogramos'
}

export interface BibliotecaItem {
  id: string
  grupo_id: string
  nombre: string
  tarifa: string                      // '559.900' | '0,36%'
  tipo_tarifa: 'moneda' | 'porcentaje'
  obs: string | null
  extra_cols: Record<string, string>  // { col_id: valor }
  orden: number
}

export interface BibliotecaObservacion {
  id: string
  linea_id: string
  nombre: string
  html: string
  orden: number
}

export interface BibliotecaGrupo {
  id: string
  linea_id: string
  nombre: string
  orden: number
  items: BibliotecaItem[]
}

export interface BibliotecaLinea {
  id: string
  nombre: string
  columnas: BibliotecaColumna[]       // columnas extra de esta línea
  orden: number
  grupos: BibliotecaGrupo[]
  observaciones: BibliotecaObservacion[]
}

// ---------- Cotizaciones ----------

export type EstadoCotizacion =
  | 'borrador'
  | 'enviada'
  | 'negociacion'
  | 'aprobada'
  | 'rechazada'

// WizardItem: copia editable en memoria de un BibliotecaItem
export interface WizardItem {
  sel: boolean
  nombre: string
  tarifa: string
  tipo_tarifa: 'moneda' | 'porcentaje'
  obs: string
  extra_cols: Record<string, string>
}

// WizardGrupo: grupo con nombre + lista de WizardItems
export interface WizardGrupo {
  sel: boolean    // true = todos sus items seleccionados
  nombre: string  // guardamos nombre para display sin re-consultar biblioteca
  items: WizardItem[]
}

// ItemsMap = { [servicio]: { [grupo_id]: WizardGrupo } }
// Esto es exactamente la forma del items_snapshot en el backend
export type ItemsMap = Record<string, Record<string, WizardGrupo>>

export interface CotizacionRead {
  id: string
  numero: string
  empresa: string
  nit: string | null
  record_id: string | null
  contacto: string | null
  cargo: string | null
  email: string | null
  telefono: string | null
  comercial_id: string | null
  fecha: string
  vigencia: string
  estado: EstadoCotizacion
  asunto: string | null
  lineas: string[]
  items_snapshot: ItemsMap
  obs_plantillas: Record<string, string[]>
  obs_libre: string | null
  paqueteadora: string | null
  tarifa_tipo: Record<string, string> | null   // {linea: "biblioteca"|"especial"}
  tarifa_especial_id: Record<string, string> | null  // {linea: uuid_str}
  created_at: string
  updated_at: string
}

// ---------- Tarifas Especiales ----------

export interface TarifaEspecial {
  id: string
  nombre: string
  servicio: string
  grupos: unknown[]     // misma estructura que grupos en BibliotecaLinea
  created_at: string
  updated_at: string
}

// ---------- SAC ----------

export interface SACContacto extends Contacto {
  empresa: string
  record_id: string
}

// ---------- Auth ----------

export interface UserRead {
  id: string
  username: string
  email: string
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

// ---------- Comerciales ----------

export interface Comercial {
  id: string
  nombre: string
  cargo: string | null
  email: string | null
  tel: string | null
  activo: boolean
  created_at: string
}

export interface ComercialCreate {
  nombre: string
  cargo?: string
  email?: string
  tel?: string
}

// ---------- Contactos ----------

export interface Contacto {
  id: string
  record_id: string
  nombre: string
  cargo: string | null
  telefono: string | null
  email: string | null
  orden: number
  cumpleanos: string | null       // YYYY-MM-DD
  recibe_regalos: string | null   // si|no|tal_vez
  fotos_entrega: string[]
  fotos_fda: string[]
  fda_entregado: boolean | null
  direccion: string | null
}

export interface ContactoCreate {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
  orden: number
  cumpleanos?: string | null
  recibe_regalos?: string | null
  direccion?: string | null
}

// ---------- Actividades ----------

export type ActividadTipo = 'visit' | 'service' | 'invoice' | 'note'

export interface Actividad {
  id: string
  record_id: string
  tipo: ActividadTipo
  descripcion: string
  fecha: string
  created_at: string
}

export interface ActividadCreate {
  tipo: ActividadTipo
  descripcion: string
  fecha: string
}

// ---------- Records ----------

export type TipoRecord = 'prospecto' | 'cliente'
export type EstadoProspecto = 'seguimiento' | 'cerrado' | 'perdido' | 'frio'
export type EstadoCliente = 'activo' | 'en-riesgo' | 'inactivo'

export interface RecordRead {
  id: string
  tipo: TipoRecord
  empresa: string
  nit: string | null
  ciudad: string | null
  direccion: string | null
  categoria: string | null         // A|B|C
  comercial_id: string | null
  tipo_cliente: 'directo' | 'indirecto' | 'referido'
  cliente_indirecto_id: string | null
  comision: string | null
  servicios: string[]
  observaciones: string | null
  fecha: string
  proximo_seguimiento: string | null
  estado_prospecto: EstadoProspecto | null
  visita: 'no' | 'si' | 'virtual' | 'llamada' | null
  facturado_p: 'no' | 'si' | 'parcial' | null
  valor_p: number | null
  estado_cliente: EstadoCliente | null
  visita_cliente: 'no' | 'si' | 'virtual' | 'llamada' | null
  nuevo_servicio: 'si' | 'no' | null
  servicio_nuevo: string | null
  facturado: 'no' | 'si' | 'parcial' | null
  valor: number | null
  facturacion_lineas: Record<string, number>
  created_at: string
  updated_at: string
}

export interface RecordDetalle extends RecordRead {
  contactos: Contacto[]
  actividades: Actividad[]
}

// ---------- Dashboard ----------

export interface DashboardStats {
  total_records: number
  total_prospectos: number
  total_clientes: number
  prospectos_por_estado: Record<string, number>
  clientes_por_estado: Record<string, number>
  total_facturado: number
  facturacion_por_linea: Record<string, number>
  cotizaciones_por_estado: Record<string, number>
  total_cotizaciones: number
}

export interface ChartPoint {
  name: string
  value: number
}

export interface MonthPoint {
  name: string
  prospectos: number
  clientes: number
}

export interface DashboardCharts {
  prospectos_vs_clientes: ChartPoint[]
  pipeline_estados: ChartPoint[]
  servicios_solicitados: ChartPoint[]
  actividad_por_comercial: { name: string; total: number }[]
  billing_por_linea: ChartPoint[]
  pipeline_cotizaciones: ChartPoint[]
  lineas_cotizadas: ChartPoint[]
  registros_por_mes: MonthPoint[]
  gestion_clientes: ChartPoint[]
}

export interface RankingEntry {
  comercial_id: string
  nombre: string
  prospectos: number
  clientes: number
  visitas: number
  valor_facturado: number
}

export interface RecordReciente {
  id: string
  empresa: string
  tipo: string
  comercial_nombre: string | null
  servicios: string[]
  estado: string
  fecha: string
}

export interface CotizacionReciente {
  id: string
  numero: string
  empresa: string
  lineas: string[]
  estado: string
  fecha: string
  vencida: boolean
}

export interface DashboardRecientes {
  registros: RecordReciente[]
  cotizaciones: CotizacionReciente[]
}
