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
  'Depósito Aduanero': '#a855f7',
  'CEDI':              '#00e676',
  'Transporte':        '#f5a623',
  'Paqueteo':          '#ff6b6b',
  'Aduana':            '#00ffcc',
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
}

export interface ContactoCreate {
  nombre: string
  cargo?: string
  telefono?: string
  email?: string
  orden: number
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

export interface DashboardCharts {
  prospectos_vs_clientes: ChartPoint[]
  pipeline_estados: ChartPoint[]
  servicios_solicitados: ChartPoint[]
  actividad_por_comercial: { name: string; total: number }[]
  billing_por_linea: ChartPoint[]
  pipeline_cotizaciones: ChartPoint[]
  lineas_cotizadas: ChartPoint[]
}
