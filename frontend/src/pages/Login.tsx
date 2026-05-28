import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { loginApi } from '../api/auth'
import { toast } from '../store/toastStore'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { access_token, user } = await loginApi(username, password)
      login(access_token, user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const ax = err as { response?: { status: number; data?: { error?: string } }; code?: string }
      if (ax?.response?.status === 401) {
        toast.error('Usuario o contraseña incorrectos')
      } else if (ax?.code === 'ERR_NETWORK') {
        toast.error('No se puede conectar con el servidor')
      } else {
        toast.error('Error inesperado — intenta de nuevo')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1626 50%, #0a0e1a 100%)' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,194,255,0.05) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #00c2ff, #0077ff)', boxShadow: '0 0 40px rgba(0,194,255,0.4)' }}
          >
            <span className="text-bg font-bold text-2xl tracking-widest">CRM</span>
          </div>
          <h1 className="font-bold text-3xl tracking-wider text-white mb-1">Grupo ZYMO</h1>
          <p className="text-muted text-sm tracking-[3px] uppercase">Gestión Comercial</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 border border-border"
          style={{ background: 'rgba(17,24,39,0.8)', backdropFilter: 'blur(20px)' }}
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-2xs text-muted mb-2 uppercase tracking-widest font-semibold">
                Usuario
              </label>
              <input
                className="input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                required
              />
            </div>

            <div>
              <label className="block text-2xs text-muted mb-2 uppercase tracking-widest font-semibold">
                Contraseña
              </label>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-2xs text-muted/60 mt-6 tracking-wider">
            Accede desde zymo-intranet para inicio automático
          </p>
        </div>

        <p className="text-center text-muted/40 text-2xs mt-6 tracking-widest uppercase">
          Grupo ZYMO © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
