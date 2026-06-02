import client from './client'

export interface PreliqEntry {
  id: string
  empresa: string
  cotNumero: string
  servicios: string[]
  parametros: {
    producto?: string
    cif?: string
    tipo?: string
    numCont?: number
    peso?: string
    pallets?: string
    unidades?: string
  }
  lineas: Array<{
    _seccion?: string
    concepto?: string
    base?: string
    nota?: string
    resultado?: number
  }>
  total: number
  createdAt: string
}

export const getPreliqHistorial = () =>
  client.get<PreliqEntry[]>('/api/preliq-historial').then(r => r.data)

export const savePreliqHistorial = (data: Omit<PreliqEntry, 'id' | 'createdAt'>) =>
  client.post<PreliqEntry>('/api/preliq-historial', data).then(r => r.data)

export const deletePreliqEntry = (id: string) =>
  client.delete(`/api/preliq-historial/${id}`).then(r => r.data)
