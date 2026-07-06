import client from './client'

export interface GDArchivo {
  id: string
  nombre: string
  size: number
  mime: string
  uploadedAt: string
}

export interface DocEstado {
  estado?: 'completo' | 'incompleto' | 'pendiente'
  obs?: string
  fecha?: string
  archivos?: GDArchivo[]
}

interface GDData {
  id: string | null
  docs: Record<string, DocEstado>
  cicloActual: number
  updatedAt: string | null
}

interface GDVencimiento {
  status: 'vencido' | 'por-vencer' | 'con-tiempo' | 'sin-fecha'
  diasRestantes: number | null
  fechaVencimiento: string | null
}

export interface GDRow {
  id: string
  empresa: string
  nit?: string
  ciudad?: string
  tipoCliente: string
  estadoCliente?: string
  companias: string[]
  comercial: { nombre: string }
  gd: GDData
  cumplimiento: number
  vencimiento: GDVencimiento
  estadoDocs: 'completo' | 'incompleto' | 'pendiente'
}

export interface GDDoc {
  id: string
  nombre: string
  aplica: 'todos' | 'directo'
  pond_di: number
  pond_ref: number
}

export const GD_DOCS: GDDoc[] = [
  { id: 'fr001',      nombre: 'FR-001-GC Formulario de datos y conocimiento de cliente',               aplica: 'todos',   pond_di: 0.34,  pond_ref: 0.34 },
  { id: 'fr004',      nombre: 'FR-004-GC Formato visita clientes',                                     aplica: 'todos',   pond_di: 0.07,  pond_ref: 0.10 },
  { id: 'est_fin',    nombre: 'Estados financieros comparativos del año inmediatamente anterior',       aplica: 'todos',   pond_di: 0.05,  pond_ref: 0.05 },
  { id: 'cam_com',    nombre: 'Certificado de Cámara de Comercio (actualizado del año en curso)',       aplica: 'todos',   pond_di: 0.03,  pond_ref: 0.03 },
  { id: 'rut',        nombre: 'RUT (actualizado del año en curso)',                                     aplica: 'todos',   pond_di: 0.03,  pond_ref: 0.03 },
  { id: 'cert_ban',   nombre: 'Certificado Bancario (actualizado del año en curso)',                    aplica: 'directo', pond_di: 0.01,  pond_ref: 0    },
  { id: 'ced_rl',     nombre: 'Fotocopia cédula de ciudadanía del Representante Legal',                aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.03 },
  { id: 'ref_com',    nombre: 'Referencias comerciales actualizadas del año en curso',                 aplica: 'directo', pond_di: 0.01,  pond_ref: 0    },
  { id: 'ant_cont',   nombre: 'Certificado de Antecedentes Disciplinarios Contador',                   aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ant_rf',     nombre: 'Certificado de Antecedentes Disciplinarios Revisor Fiscal',             aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ced_rf',     nombre: 'Fotocopia cédula ciudadanía del Revisor Fiscal (si aplica)',            aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'ced_cont',   nombre: 'Fotocopia cédula ciudadanía del Contador',                              aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'tp_rf',      nombre: 'Tarjeta Profesional del Revisor Fiscal (si aplica)',                    aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'tp_cont',    nombre: 'Tarjeta Profesional del Contador',                                      aplica: 'directo', pond_di: 0.005, pond_ref: 0    },
  { id: 'cert_basc',  nombre: 'Certificaciones BASC / OEA / ISO (si aplica)',                          aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.01 },
  { id: 'benef_dian', nombre: 'Reportes beneficiarios finales DIAN (a partir de mayo 2025)',           aplica: 'todos',   pond_di: 0.01,  pond_ref: 0.01 },
  { id: 'analisis_fin',nombre:'Estudio Análisis Financiero',                                           aplica: 'todos',   pond_di: 0.20,  pond_ref: 0.20 },
  { id: 'listas_caut',nombre: 'Listas Cautelares',                                                     aplica: 'todos',   pond_di: 0.20,  pond_ref: 0.20 },
]

export const listGD = (params?: { search?: string; vencimiento?: string; estadoDocs?: string }) =>
  client.get<GDRow[]>('/api/gestion-documental', { params }).then(r => r.data)

export const upsertGD = (recordId: string, data: { docs?: Record<string, DocEstado>; cicloActual?: number }) =>
  client.put<{ id: string; docs: Record<string, DocEstado>; cicloActual: number }>(
    `/api/gestion-documental/${recordId}`, data
  ).then(r => r.data)

export const uploadGDArchivos = (recordId: string, docId: string, files: File[]) => {
  const form = new FormData()
  files.forEach(f => form.append('archivos', f))
  return client.post<{ id: string; docs: Record<string, DocEstado>; cicloActual: number }>(
    `/api/gestion-documental/${recordId}/docs/${docId}/archivos`, form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  ).then(r => r.data)
}

export const deleteGDArchivo = (recordId: string, docId: string, archivoId: string) =>
  client.delete<{ id: string; docs: Record<string, DocEstado>; cicloActual: number }>(
    `/api/gestion-documental/${recordId}/docs/${docId}/archivos/${archivoId}`
  ).then(r => r.data)

const gdArchivoUrl = (recordId: string, docId: string, archivoId: string) =>
  `/api/gestion-documental/${recordId}/docs/${docId}/archivos/${archivoId}`

export const fetchGDArchivoBlob = (recordId: string, docId: string, archivoId: string) =>
  client.get(gdArchivoUrl(recordId, docId, archivoId), { responseType: 'blob' }).then(r => r.data as Blob)
