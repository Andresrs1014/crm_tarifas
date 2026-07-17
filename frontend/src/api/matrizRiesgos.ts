import client from './client'

export interface MatrizRiesgoRow {
  id: string
  empresa: string
  nit?: string
  ciudad?: string
  estadoCliente?: string
  comercial: { nombre: string }
  matrizRiesgo: MatrizRiesgoData | null
}

export interface MatrizRiesgoData {
  id: string
  recordId: string
  companias: string[]
  mercancia?: string
  tipoPersona?: string
  tiempo?: string
  capital?: string
  frecuencia?: string
  facturacion?: string
  cert?: string
  anFin?: string
  puntaje: number
  riesgo: string
  control?: string
  frecControl?: string
  updatedAt: string
}

export interface MatrizRiesgoUpsert {
  companias?: string[]
  mercancia?: string
  tipoPersona?: string
  tiempo?: string
  capital?: string
  frecuencia?: string
  facturacion?: string
  cert?: string
  anFin?: string
  control?: string
  frecControl?: string
}

export const listMatriz = (params?: { search?: string; riesgo?: string; completa?: string }) =>
  client.get<MatrizRiesgoRow[]>('/api/matriz-riesgos', { params }).then(r => r.data)

export const getMatrizByRecord = (recordId: string) =>
  client.get<MatrizRiesgoData>(`/api/matriz-riesgos/${recordId}`).then(r => r.data)

export const upsertMatriz = (recordId: string, data: MatrizRiesgoUpsert) =>
  client.put<MatrizRiesgoData>(`/api/matriz-riesgos/${recordId}`, data).then(r => r.data)
