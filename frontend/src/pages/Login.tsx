import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { loginApi, getMeApi } from '../api/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await loginApi(username, password)
      useAuthStore.setState({ token: token.access_token })
      const user = await getMeApi()
      login(token.access_token, user)
      navigate('/dashboard')
    } catch {
      setError('Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#0a0e1a' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-condensed font-black text-5xl tracking-widest text-accent">ZYMO</h1>
          <p className="text-muted text-sm mt-1 font-condensed tracking-wider uppercase">
            CRM Tarifas
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl">
          <h2 className="font-condensed font-bold text-xl mb-6" style={{ color: '#e8edf5' }}>
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider font-condensed">
                Usuario
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-muted mb-1.5 uppercase tracking-wider font-condensed">
                Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
              style={{ background: '#00c2ff', color: '#0a0e1a' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-muted text-xs mt-6">Grupo ZYMO © 2026</p>
      </div>
    </div>
  )
}
