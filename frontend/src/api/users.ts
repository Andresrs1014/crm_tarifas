import api from './client'
import type { UserRead } from '../types'

export async function listUsers(): Promise<UserRead[]> {
  const { data } = await api.get<UserRead[]>('/api/auth/users')
  return data
}

export async function createUser(payload: {
  username: string
  email: string
  password: string
}): Promise<UserRead> {
  const { data } = await api.post<UserRead>('/api/auth/register', payload)
  return data
}

export async function updateUser(
  id: string,
  payload: { is_active?: boolean; password?: string; email?: string }
): Promise<UserRead> {
  const { data } = await api.put<UserRead>(`/api/auth/users/${id}`, payload)
  return data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/auth/users/${id}`)
}
