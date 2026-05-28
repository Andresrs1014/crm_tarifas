import client from './client'
import type { User } from '../types'

export interface LoginResponse {
  access_token: string
  user: User
}

export const loginApi = (username: string, password: string) =>
  client.post<LoginResponse>('/api/auth/login', { username, password }).then((r) => r.data)

export const ssoApi = (ssoToken: string) =>
  client.post<LoginResponse>('/api/auth/sso', { token: ssoToken }).then((r) => r.data)

export const getMeApi = () =>
  client.get<User>('/api/auth/me').then((r) => r.data)
