import client from './client'
import type { User } from '../types'

export const getUsers = () =>
  client.get<User[]>('/api/admin/usuarios').then((r) => r.data)

export const createUser = (data: { username: string; password: string; role: 'superadmin' | 'usuario' }) =>
  client.post<User>('/api/admin/usuarios', data).then((r) => r.data)

export const updateUser = (id: string, data: { username?: string; password?: string; role?: 'superadmin' | 'usuario' }) =>
  client.put<User>(`/api/admin/usuarios/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) =>
  client.delete(`/api/admin/usuarios/${id}`).then((r) => r.data)
