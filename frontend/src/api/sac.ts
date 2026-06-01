import client from './client'
import type { ContactoSAC } from '../types'

export const getSacContactos = (mes?: number) =>
  client
    .get<ContactoSAC[]>('/api/sac/contactos', { params: mes ? { mes } : undefined })
    .then((r) => r.data)

export const getSacFda = () =>
  client.get<ContactoSAC[]>('/api/sac/fda').then((r) => r.data)

export const updateSacFotos = (id: string, data: { fotos?: string[]; fdaEntregado?: boolean }) =>
  client.patch(`/api/sac/contactos/${id}/fotos`, data).then((r) => r.data)

export const updateSacContacto = (id: string, data: { cargo?: string; telefono?: string; email?: string }) =>
  client.patch(`/api/sac/contactos/${id}/datos`, data).then((r) => r.data)
