import client from './client'
import type { Actividad, ActividadCreate } from '../types'

export const createActividad = (recordId: string, data: ActividadCreate & { hora?: string; lugar?: string; origen?: string }) =>
  client.post<Actividad>(`/api/records/${recordId}/actividades`, data).then((r) => r.data)

export const updateActividad = (id: string, data: Partial<ActividadCreate & { hecho?: boolean; hora?: string; lugar?: string; origen?: string }>) =>
  client.put<Actividad>(`/api/actividades/${id}`, data).then((r) => r.data)

export const deleteActividad = (id: string) =>
  client.delete(`/api/actividades/${id}`).then((r) => r.data)
