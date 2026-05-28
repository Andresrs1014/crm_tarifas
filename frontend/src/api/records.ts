import client from './client'
import type { CRMRecord, RecordCreate } from '../types'

export const getRecords = (params?: {
  tipo?: string
  estado?: string
  comercialId?: string
  search?: string
  fecha?: string
}) =>
  client.get<CRMRecord[]>('/api/records', { params }).then((r) => r.data)

export const getRecord = (id: string) =>
  client.get<CRMRecord>(`/api/records/${id}`).then((r) => r.data)

export const createRecord = (data: RecordCreate) =>
  client.post<CRMRecord>('/api/records', data).then((r) => r.data)

export const updateRecord = (id: string, data: Partial<RecordCreate>) =>
  client.put<CRMRecord>(`/api/records/${id}`, data).then((r) => r.data)

export const deleteRecord = (id: string) =>
  client.delete(`/api/records/${id}`).then((r) => r.data)

export const importRecords = (file: File, tipo: string) => {
  const form = new FormData()
  form.append('file', file)
  form.append('tipo', tipo)
  return client.post('/api/records/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}
