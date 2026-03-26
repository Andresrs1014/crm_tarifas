import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, UserCog,
  PlusCircle, FileText, BookOpen, LogOut,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Toast from './Toast'

const NAV = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/registro',  icon: <PlusCircle size={18} />,      label: 'Nuevo Registro' },
  { to: '/prospectos', icon: <Users size={18} />,           label: 'Prospectos' },
  { to: '/clientes',  icon: <Building2 size={18} />,        label: 'Clientes' },
  { to: '/equipo',    icon: <UserCog size={18} />,           label: 'Equipo' },
  { to: '/cotizaciones', icon: <FileText size={18} />,      label: 'Cotizaciones' },
  { to: '/biblioteca', icon: <BookOpen size={18} />,        label: 'Biblioteca' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-border" style={{ background: '#111827' }}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <span className="font-condensed font-bold text-xl tracking-wider text-accent">
            ZYMO
          </span>
          <span className="font-condensed text-muted text-sm ml-1">CRM</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(({ to, icon, label }) => (
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
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}
