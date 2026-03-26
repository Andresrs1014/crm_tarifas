import api from './client'
import type { Token, UserRead } from '../types'

export async function loginApi(username: string, password: string): Promise<Token> {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await api.post<Token>('/api/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function getMeApi(): Promise<UserRead> {
  const { data } = await api.get<UserRead>('/api/auth/me')
  return data
}
