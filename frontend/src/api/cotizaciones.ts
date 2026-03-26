import api from './client'
import type { CotizacionRead } from '../types'

export interface CotFilters {
  search?: string
  estado?: string
  comercial_id?: string
  fecha?: string
}

export async function getCotizacionesApi(filters: CotFilters = {}): Promise<CotizacionRead[]> {
  const { data } = await api.get<CotizacionRead[]>('/api/cotizaciones', { params: filters })
  return data
}

export async function getCotizacionApi(id: string): Promise<CotizacionRead> {
  const { data } = await api.get<CotizacionRead>(`/api/cotizaciones/${id}`)
  return data
}

export async function createCotizacionApi(payload: Record<string, unknown>): Promise<CotizacionRead> {
  const { data } = await api.post<CotizacionRead>('/api/cotizaciones', payload)
  return data
}

export async function updateCotizacionApi(
  id: string,
  payload: Record<string, unknown>
): Promise<CotizacionRead> {
  const { data } = await api.put<CotizacionRead>(`/api/cotizaciones/${id}`, payload)
  return data
}

export async function deleteCotizacionApi(id: string): Promise<void> {
  await api.delete(`/api/cotizaciones/${id}`)
}

export async function duplicarCotizacionApi(id: string): Promise<CotizacionRead> {
  const { data } = await api.post<CotizacionRead>(`/api/cotizaciones/${id}/duplicar`)
  return data
}

export interface ActualizarTarifasBody {
  porcentaje: number
  items_keys: string[]
}

export async function actualizarTarifasApi(
  id: string,
  body: ActualizarTarifasBody
): Promise<CotizacionRead> {
  const { data } = await api.post<CotizacionRead>(
    `/api/cotizaciones/${id}/actualizar-tarifas`,
    body
  )
  return data
}

// Endpoint público — no requiere token (el cliente lo omite si no hay sesión)
export async function getCotPublicaApi(numero: string): Promise<CotizacionRead> {
  const normalized = numero.replace(/^COT(\d+)$/i, 'COT-$1')
  const { data } = await api.get<CotizacionRead>(`/api/cotizaciones/public/${normalized}`)
  return data
}
