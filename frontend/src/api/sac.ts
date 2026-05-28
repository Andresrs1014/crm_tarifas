import client from './client'
import type { ContactoSAC } from '../types'

export const getSacContactos = (mes?: number) =>
  client
    .get<ContactoSAC[]>('/api/sac/contactos', { params: mes ? { mes } : undefined })
    .then((r) => r.data)

export const updateSacFotos = (id: string, data: { fotos?: string[]; fdaEntregado?: boolean }) =>
  client.patch(`/api/sac/contactos/${id}/fotos`, data).then((r) => r.data)
