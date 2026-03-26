import api from './client'
import type { BibliotecaLinea, BibliotecaGrupo, BibliotecaItem, BibliotecaObservacion, BibliotecaColumna } from '../types'

export async function getBibliotecaApi(): Promise<BibliotecaLinea[]> {
  const { data } = await api.get<BibliotecaLinea[]>('/api/biblioteca')
  return data
}

// ── Grupos ──
export async function createGrupoApi(payload: { linea_id: string; nombre: string; orden?: number }): Promise<BibliotecaGrupo> {
  const { data } = await api.post<BibliotecaGrupo>('/api/biblioteca/grupos', payload)
  return data
}
export async function updateGrupoApi(id: string, payload: { nombre?: string; orden?: number }): Promise<BibliotecaGrupo> {
  const { data } = await api.put<BibliotecaGrupo>(`/api/biblioteca/grupos/${id}`, payload)
  return data
}
export async function deleteGrupoApi(id: string): Promise<void> {
  await api.delete(`/api/biblioteca/grupos/${id}`)
}

// ── Ítems ──
export interface ItemPayload {
  grupo_id: string
  nombre: string
  tarifa: string
  tipo_tarifa: 'moneda' | 'porcentaje'
  obs?: string
  extra_cols?: Record<string, string>
  orden?: number
}
export async function createItemApi(payload: ItemPayload): Promise<BibliotecaItem> {
  const { data } = await api.post<BibliotecaItem>('/api/biblioteca/items', payload)
  return data
}
export async function updateItemApi(id: string, payload: Partial<ItemPayload>): Promise<BibliotecaItem> {
  const { data } = await api.put<BibliotecaItem>(`/api/biblioteca/items/${id}`, payload)
  return data
}
export async function deleteItemApi(id: string): Promise<void> {
  await api.delete(`/api/biblioteca/items/${id}`)
}

// ── Observaciones ──
export interface ObsPayload {
  linea_id: string
  nombre: string
  html: string
  orden?: number
}
export async function createObsApi(payload: ObsPayload): Promise<BibliotecaObservacion> {
  const { data } = await api.post<BibliotecaObservacion>('/api/biblioteca/observaciones', payload)
  return data
}
export async function updateObsApi(id: string, payload: { nombre?: string; html?: string; orden?: number }): Promise<BibliotecaObservacion> {
  const { data } = await api.put<BibliotecaObservacion>(`/api/biblioteca/observaciones/${id}`, payload)
  return data
}
export async function deleteObsApi(id: string): Promise<void> {
  await api.delete(`/api/biblioteca/observaciones/${id}`)
}

// ── Columnas extra de línea (solo superadmin) ──
export async function updateColumnasApi(lineaId: string, columnas: BibliotecaColumna[]): Promise<BibliotecaLinea> {
  const { data } = await api.put<BibliotecaLinea>(`/api/biblioteca/lineas/${lineaId}/columnas`, { columnas })
  return data
}
