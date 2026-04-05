import { useState, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, UserCog,
  PlusCircle, FileText, BookOpen, LogOut, ShieldCheck, HeartHandshake,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Toast from './Toast'

const NAV_MAIN = [
  { to: '/dashboard',    icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/prospectos',   icon: <Users size={18} />,           label: 'Prospectos' },
  { to: '/clientes',     icon: <Building2 size={18} />,       label: 'Clientes' },
  { to: '/equipo',       icon: <UserCog size={18} />,          label: 'Equipo' },
  { to: '/cotizaciones', icon: <FileText size={18} />,        label: 'Cotizaciones' },
  { to: '/biblioteca',   icon: <BookOpen size={18} />,        label: 'Servicios' },
  { to: '/sac',          icon: <HeartHandshake size={18} />, label: 'SAC' },
]

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const now = useClock()

  const fecha = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const hora = now.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-border" style={{ background: '#111827' }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
          <div className="bg-white rounded-md px-2.5 py-1.5 shrink-0">
            <img src="/logo.png" alt="Zymo" className="h-6 w-auto" />
          </div>
          <span className="font-condensed text-muted text-xs tracking-widest uppercase">CRM</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {/* Nuevo Registro destacado */}
          <NavLink
            to="/registro"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-3 transition-all ${
                isActive
                  ? 'bg-accent/20 text-accent'
                  : 'text-accent/80 hover:bg-accent/10 hover:text-accent'
              }`
            }
          >
            <PlusCircle size={18} />
            <span className="font-medium">Nuevo Registro</span>
          </NavLink>

          <div className="border-t border-border mb-3" />

          {NAV_MAIN.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-surface2 hover:text-white'
                }`
              }
            >
              {icon}
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}

          {/* Admin — solo superadmin */}
          {user?.is_superadmin && (
            <>
              <div className="border-t border-border my-3" />
              <NavLink
                to="/admin/usuarios"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                    isActive
                      ? 'bg-gold/10 text-gold'
                      : 'text-muted hover:bg-surface2 hover:text-white'
                  }`
                }
              >
                <ShieldCheck size={18} />
                <span className="font-medium">Usuarios</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-border">
          <p className="text-xs text-muted truncate mb-2">{user?.username}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-muted hover:text-danger text-sm transition w-full"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con fecha/hora */}
        <header
          className="shrink-0 flex items-center justify-end px-8 py-3 border-b border-border"
          style={{ background: '#111827' }}
        >
          <div className="text-right">
            <p className="text-xs font-medium capitalize" style={{ color: '#00c2ff' }}>{fecha}</p>
            <p className="text-xs" style={{ color: '#8899b4' }}>{hora}</p>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Toast />
    </div>
  )
}
