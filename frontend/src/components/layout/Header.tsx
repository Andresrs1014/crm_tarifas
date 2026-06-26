import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (d: Date) =>
    d.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-8 border-b border-border"
      style={{
        background: 'var(--surface)',
        boxShadow: 'var(--shadow)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4">
        <img
          src="/logo.png"
          alt="Grupo ZYMO"
          className="h-10 w-auto object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="pl-4 border-l border-red-500/40">
          <div className="flex items-baseline gap-2">
            <span
              className="font-bold text-4xl tracking-[4px] uppercase text-white"
              style={{ textShadow: '0 0 22px rgba(0,194,255,0.4)' }}
            >
              CRM
            </span>
            <span className="font-light text-xl tracking-[5px] uppercase text-accent">
              Proyectos & Negocios
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="w-9 h-px" style={{ background: 'linear-gradient(90deg,#e8312a,transparent)' }} />
            <span className="text-xs tracking-[3px] uppercase text-muted">Gestión Comercial</span>
          </div>
        </div>
      </div>

      {/* Right: Clock + User */}
      <div className="flex items-center gap-6">
        {/* Live clock */}
        <div className="text-right hidden md:block">
          <div className="text-accent text-sm font-semibold capitalize">
            {formatDate(now)}
          </div>
          <div className="text-muted text-xs font-mono mt-0.5">
            {formatTime(now)}
          </div>
        </div>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-foreground">{user?.username}</div>
            <div className="text-2xs text-muted uppercase tracking-wider">
              {user?.role === 'superadmin' ? '⭐ Superadmin' : 'Usuario'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-ghost btn-sm text-2xs uppercase tracking-widest px-3 py-1.5 rounded-lg border border-border hover:border-danger/40 hover:text-danger"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  )
}
