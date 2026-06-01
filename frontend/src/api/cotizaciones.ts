import client from './client'
import type { Cotizacion, CotizacionCreate } from '../types'

export const getCotizaciones = (params?: { estado?: string; search?: string }) =>
  client.get<Cotizacion[]>('/api/cotizaciones', { params }).then((r) => r.data)

export const getCotizacion = (id: string) =>
  client.get<Cotizacion>(`/api/cotizaciones/${id}`).then((r) => r.data)

export const getCotizacionPublica = (numero: string) =>
  client.get<Cotizacion>(`/api/cot/${numero}`).then((r) => r.data)

export const createCotizacion = (data: CotizacionCreate) =>
  client.post<Cotizacion>('/api/cotizaciones', data).then((r) => r.data)

export const updateCotizacion = (id: string, data: Partial<CotizacionCreate>) =>
  client.put<Cotizacion>(`/api/cotizaciones/${id}`, data).then((r) => r.data)

export const deleteCotizacion = (id: string) =>
  client.delete(`/api/cotizaciones/${id}`).then((r) => r.data)

export const duplicarCotizacion = (id: string) =>
  client.post<Cotizacion>(`/api/cotizaciones/${id}/duplicar`).then((r) => r.data)

export const actualizarTarifas = (id: string, incremento: number) =>
  client.post<{ cotizacion: Cotizacion; itemsActualizados: number }>(
    `/api/cotizaciones/${id}/actualizar-tarifas`, { incremento }
  ).then((r) => r.data)
