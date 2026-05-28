import client from './client'
import type { User } from '../types'

export const getUsers = () =>
  client.get<User[]>('/api/usuarios').then((r) => r.data)

export const createUser = (data: { username: string; password: string; role: 'superadmin' | 'usuario' }) =>
  client.post<User>('/api/usuarios', data).then((r) => r.data)

export const updateUser = (id: string, data: { username?: string; password?: string; role?: 'superadmin' | 'usuario' }) =>
  client.put<User>(`/api/usuarios/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) =>
  client.delete(`/api/usuarios/${id}`).then((r) => r.data)
