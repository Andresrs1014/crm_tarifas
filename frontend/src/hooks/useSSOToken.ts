import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRead } from '../types'

export function useSSOToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, login } = useAuthStore()

  useEffect(() => {
    if (token) return // ya hay sesión activa, no hacer nada

    const params = new URLSearchParams(location.search)
    const ssoToken = params.get('sso_token')
    if (!ssoToken) return

    try {
      const payload = JSON.parse(atob(ssoToken.split('.')[1]))
      
      // Construir el user mínimo que espera el store del CRM
      const user: UserRead = {
        id: payload.sub,          // usamos el email como id temporal
        username: payload.sub,    // email del token
        email: payload.sub,
        is_active: true,
        is_superadmin: false,
        created_at: new Date().toISOString(),
      }

      login(ssoToken, user)

      // Limpiar el token de la URL
      params.delete('sso_token')
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true }
      )
    } catch {
      // Token malformado — el usuario verá el login normal
    }
  }, [])
}