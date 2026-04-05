import api from './client'
import type { TarifaEspecial } from '../types'

export async function getTarifasEspeciales(servicio?: string): Promise<TarifaEspecial[]> {
  const { data } = await api.get<TarifaEspecial[]>('/api/tarifas-especiales', {
    params: servicio ? { servicio } : {},
  })
  return data
}

export async function createTarifaEspecial(
  payload: { nombre: string; servicio: string; grupos: unknown[] }
): Promise<TarifaEspecial> {
  const { data } = await api.post<TarifaEspecial>('/api/tarifas-especiales', payload)
  return data
}

export async function updateTarifaEspecial(
  id: string,
  payload: Partial<{ nombre: string; servicio: string; grupos: unknown[] }>
): Promise<TarifaEspecial> {
  const { data } = await api.put<TarifaEspecial>(`/api/tarifas-especiales/${id}`, payload)
  return data
}

export async function deleteTarifaEspecial(id: string): Promise<void> {
  await api.delete(`/api/tarifas-especiales/${id}`)
}
