import api from './client'
import type { RecordRead, RecordDetalle, ActividadCreate, Actividad } from '../types'

export interface RecordFilters {
  tipo?: string
  comercial_id?: string
  estado_prospecto?: string
  estado_cliente?: string
  search?: string
  fecha_desde?: string
  fecha_hasta?: string
}

export async function getRecords(filters: RecordFilters = {}): Promise<RecordRead[]> {
  const { data } = await api.get<RecordRead[]>('/api/records', { params: filters })
  return data
}

export async function getRecord(id: string): Promise<RecordDetalle> {
  const { data } = await api.get<RecordDetalle>(`/api/records/${id}`)
  return data
}

export async function createRecord(payload: Record<string, unknown>): Promise<RecordDetalle> {
  const { data } = await api.post<RecordDetalle>('/api/records', payload)
  return data
}

export async function updateRecord(id: string, payload: Record<string, unknown>): Promise<RecordDetalle> {
  const { data } = await api.put<RecordDetalle>(`/api/records/${id}`, payload)
  return data
}

export async function deleteRecord(id: string): Promise<void> {
  await api.delete(`/api/records/${id}`)
}

export async function addActividad(recordId: string, payload: ActividadCreate): Promise<Actividad> {
  const { data } = await api.post<Actividad>(`/api/records/${recordId}/actividades`, payload)
  return data
}
