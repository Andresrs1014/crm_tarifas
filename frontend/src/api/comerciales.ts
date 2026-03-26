import api from './client'
import type { Comercial, ComercialCreate } from '../types'

export async function getComercialesApi(): Promise<Comercial[]> {
  const { data } = await api.get<Comercial[]>('/api/comerciales')
  return data
}

export async function createComercialApi(payload: ComercialCreate): Promise<Comercial> {
  const { data } = await api.post<Comercial>('/api/comerciales', payload)
  return data
}

export async function updateComercialApi(id: string, payload: Partial<ComercialCreate & { activo: boolean }>): Promise<Comercial> {
  const { data } = await api.put<Comercial>(`/api/comerciales/${id}`, payload)
  return data
}

export async function deleteComercialApi(id: string): Promise<void> {
  await api.delete(`/api/comerciales/${id}`)
}
