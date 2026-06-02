import client from './client'

export interface Analista {
  id: string
  nombre: string
  email?: string
  tel?: string
}

export interface FichaListItem {
  id: string
  recordId: string
  estado: string
  pct: number
  createdAt: string
  updatedAt: string
  record: {
    id: string
    empresa: string
    ciudad?: string
    tipoCliente: string
    comercial: { nombre: string }
  }
}

export interface FichaDetalle extends FichaListItem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export const getFichas = (params?: { estado?: string; comercialId?: string }) =>
  client.get<FichaListItem[]>('/api/fichas', { params }).then((r) => r.data)

export const getFichaByRecord = (recordId: string) =>
  client.get<FichaDetalle>(`/api/fichas/record/${recordId}`).then((r) => r.data)

export const updateFicha = (id: string, body: { estado?: string; pct?: number; data?: Record<string, unknown> }) =>
  client.put<FichaDetalle>(`/api/fichas/${id}`, body).then((r) => r.data)

export const getAnalistas = () =>
  client.get<Analista[]>('/api/fichas/analistas').then((r) => r.data)

export const createAnalista = (data: { nombre: string; email?: string; tel?: string }) =>
  client.post<Analista>('/api/fichas/analistas', data).then((r) => r.data)

export const deleteAnalista = (id: string) =>
  client.delete(`/api/fichas/analistas/${id}`).then((r) => r.data)
