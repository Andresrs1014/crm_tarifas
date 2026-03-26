import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRead } from '../types'

interface AuthState {
  user: UserRead | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: UserRead) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'crm-auth' }
  )
)
