import client from './client'
import type { Actividad, ActividadCreate } from '../types'

export interface ActividadCalendario {
  id: string
  recordId: string
  tipo: string
  descripcion: string
  fecha: string
  hora?: string
  lugar?: string
  hecho: boolean
  record: {
    id: string
    empresa: string
    comercialId: string
    comercial: { nombre: string }
  }
}

export const getActividadesCalendario = (params: { tipo?: string; mes?: string; comercialId?: string }) =>
  client.get<ActividadCalendario[]>('/api/actividades', { params }).then(r => r.data)

export const getVisitasVencidas = () =>
  client.get<ActividadCalendario[]>('/api/actividades/vencidas').then(r => r.data)

export const createActividad = (recordId: string, data: ActividadCreate & { hora?: string; lugar?: string; origen?: string }) =>
  client.post<Actividad>(`/api/records/${recordId}/actividades`, data).then((r) => r.data)

export const updateActividad = (id: string, data: Partial<ActividadCreate & { hecho?: boolean; hora?: string; lugar?: string; origen?: string }>) =>
  client.put<Actividad>(`/api/actividades/${id}`, data).then((r) => r.data)

export const deleteActividad = (id: string) =>
  client.delete(`/api/actividades/${id}`).then((r) => r.data)
