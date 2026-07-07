import client from './client'
import type { TarifaEspecial } from '../types'

export const getTarifasEspeciales = (espKey: string) =>
  client.get<TarifaEspecial[]>('/api/tarifas-especiales', { params: { espKey } }).then((r) => r.data)

export const createTarifaEspecial = (data: { espKey: string; svc: string; nombre: string; grupos: unknown[] }) =>
  client.post<TarifaEspecial>('/api/tarifas-especiales', data).then((r) => r.data)

export const updateTarifaEspecial = (id: string, data: Partial<{ nombre: string; grupos: unknown[] }>) =>
  client.put<TarifaEspecial>(`/api/tarifas-especiales/${id}`, data).then((r) => r.data)

export const deleteTarifaEspecial = (id: string) =>
  client.delete(`/api/tarifas-especiales/${id}`).then((r) => r.data)
