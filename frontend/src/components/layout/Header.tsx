import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
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
      className="header fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-border"
      style={{
        height: 'var(--header-h)',
        padding: '0 clamp(12px, 2.5vw, 28px)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            className="app-header-menu"
            onClick={onMenuClick}
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>
        )}
        <img
          src="/logo.png"
          alt="Grupo ZYMO"
          className="h-9 w-auto object-contain shrink-0"
          style={{ maxHeight: 'calc(var(--header-h) - 16px)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="pl-3 border-l border-red-500/40 min-w-0 app-header-brand-sub">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="app-header-crm font-bold tracking-[4px] uppercase text-white"
              style={{
                fontSize: '2.25rem',
                textShadow: '0 0 22px rgba(0,194,255,0.4)',
                lineHeight: 1.1,
              }}
            >
              CRM
            </span>
            <span
              className="app-header-tagline font-light tracking-[5px] uppercase text-accent"
              style={{ fontSize: '1.25rem', lineHeight: 1.2 }}
            >
              Proyectos & Negocios
            </span>
          </div>
          <div className="app-header-subline flex items-center gap-2 mt-0.5">
            <div className="w-9 h-px shrink-0" style={{ background: 'linear-gradient(90deg,#e8312a,transparent)' }} />
            <span className="text-xs tracking-[3px] uppercase text-muted">Gestión Comercial</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="app-header-clock text-right hidden md:block">
          <div className="text-accent text-sm font-semibold capitalize">
            {formatDate(now)}
          </div>
          <div className="text-muted text-xs font-mono mt-0.5">
            {formatTime(now)}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
