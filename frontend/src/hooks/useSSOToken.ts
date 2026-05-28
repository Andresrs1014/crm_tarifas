import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ssoApi } from '../api/auth'

/**
 * SSO Hook — Handles authentication via zymo-intranet token.
 *
 * Flow:
 * 1. Intranet redirects to CRM with ?sso_token=<JWT_FROM_INTRANET>
 * 2. This hook detects the sso_token in the URL
 * 3. Sends it to /api/auth/sso on the CRM backend
 * 4. Backend validates it (same JWT_SECRET), looks up/creates user, returns CRM token
 * 5. CRM stores its own token and redirects to dashboard
 *
 * Why the old implementation failed:
 * - It decoded the token client-side WITHOUT validating it against the backend
 * - It used the intranet token directly for CRM API calls (different secret)
 * - It constructed a fake UserRead without real CRM roles/permissions
 */
export function useSSOToken() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, login } = useAuthStore()

  useEffect(() => {
    // Already authenticated — nothing to do
    if (token) return

    const params = new URLSearchParams(location.search)
    const ssoToken = params.get('sso_token')
    if (!ssoToken) return

    // Send the intranet token to CRM backend for validation
    ssoApi(ssoToken)
      .then(({ access_token, user }) => {
        login(access_token, user)

        // Clean sso_token from URL
        params.delete('sso_token')
        navigate(
          { pathname: location.pathname, search: params.toString() },
          { replace: true }
        )
      })
      .catch(() => {
        // SSO failed — redirect to login page so user can log in manually
        params.delete('sso_token')
        navigate('/login', { replace: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
