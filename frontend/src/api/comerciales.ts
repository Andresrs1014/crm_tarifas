import client from './client'
import type { Comercial, ComercialCreate } from '../types'

export const getComercialesApi = () =>
  client.get<Comercial[]>('/api/comerciales').then((r) => r.data)

export const createComercial = (data: ComercialCreate) =>
  client.post<Comercial>('/api/comerciales', data).then((r) => r.data)

export const updateComercial = (id: string, data: Partial<ComercialCreate>) =>
  client.put<Comercial>(`/api/comerciales/${id}`, data).then((r) => r.data)

export const deleteComercial = (id: string) =>
  client.delete(`/api/comerciales/${id}`).then((r) => r.data)
