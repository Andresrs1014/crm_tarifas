import client from './client'
import type {
  BibliotecaLinea,
  BibliotecaGrupo,
  BibliotecaItem,
  BibliotecaObs,
} from '../types'

// Full tree
export const getBiblioteca = () =>
  client.get<BibliotecaLinea[]>('/api/biblioteca').then((r) => r.data)

// Líneas
export const createLinea = (data: { nombre: string; orden?: number }) =>
  client.post<BibliotecaLinea>('/api/biblioteca/lineas', data).then((r) => r.data)

export const updateLinea = (id: string, data: Partial<{ nombre: string; orden: number; columnas: string[] }>) =>
  client.put<BibliotecaLinea>(`/api/biblioteca/lineas/${id}`, data).then((r) => r.data)

export const deleteLinea = (id: string) =>
  client.delete(`/api/biblioteca/lineas/${id}`).then((r) => r.data)

// Grupos
export const createGrupo = (lineaId: string, data: { nombre: string; orden?: number }) =>
  client.post<BibliotecaGrupo>(`/api/biblioteca/lineas/${lineaId}/grupos`, data).then((r) => r.data)

export const updateGrupo = (id: string, data: Partial<{ nombre: string; orden: number }>) =>
  client.put<BibliotecaGrupo>(`/api/biblioteca/grupos/${id}`, data).then((r) => r.data)

export const deleteGrupo = (id: string) =>
  client.delete(`/api/biblioteca/grupos/${id}`).then((r) => r.data)

// Items
export const createItem = (grupoId: string, data: {
  nombre: string
  tarifa: string
  tipoTarifa?: string
  obs?: string
  extraCols?: Record<string, string>
  orden?: number
}) =>
  client.post<BibliotecaItem>(`/api/biblioteca/grupos/${grupoId}/items`, data).then((r) => r.data)

export const updateItem = (id: string, data: Partial<{
  nombre: string
  tarifa: string
  tipoTarifa: string
  obs: string
  extraCols: Record<string, string>
  orden: number
}>) =>
  client.put<BibliotecaItem>(`/api/biblioteca/items/${id}`, data).then((r) => r.data)

export const deleteItem = (id: string) =>
  client.delete(`/api/biblioteca/items/${id}`).then((r) => r.data)

// Observaciones
export const createObs = (lineaId: string, data: { nombre: string; html: string }) =>
  client.post<BibliotecaObs>(`/api/biblioteca/lineas/${lineaId}/obs`, data).then((r) => r.data)

export const updateObs = (id: string, data: Partial<{ nombre: string; html: string }>) =>
  client.put<BibliotecaObs>(`/api/biblioteca/obs/${id}`, data).then((r) => r.data)

export const deleteObs = (id: string) =>
  client.delete(`/api/biblioteca/obs/${id}`).then((r) => r.data)
