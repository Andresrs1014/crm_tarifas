import api from './client'
import type { SACContacto } from '../types'

export interface SACFilters {
  mes?: number
  recibe_regalos?: string
}

export async function getSACContactos(filters: SACFilters = {}): Promise<SACContacto[]> {
  const params: Record<string, string | number> = {}
  if (filters.mes !== undefined) params.mes = filters.mes
  if (filters.recibe_regalos !== undefined) params.recibe_regalos = filters.recibe_regalos
  const { data } = await api.get<SACContacto[]>('/api/sac/contactos', { params })
  return data
}

export async function updateFotos(
  contactoId: string,
  payload: {
    fotos_entrega?: string[]
    fotos_fda?: string[]
    fda_entregado?: boolean
  }
): Promise<SACContacto> {
  const { data } = await api.patch<SACContacto>(`/api/sac/contactos/${contactoId}/fotos`, payload)
  return data
}
