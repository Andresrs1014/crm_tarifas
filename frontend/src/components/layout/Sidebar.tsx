import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  to: string
  icon: string
  label: string
}

const NAV_PRINCIPAL: NavItem[] = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/registro', icon: '➕', label: 'Nuevo Registro' },
  { to: '/prospectos', icon: '🎯', label: 'Prospectos' },
  { to: '/crm', icon: '🗂️', label: 'CRM Pipeline' },
  { to: '/clientes', icon: '🏢', label: 'Clientes Activos' },
  { to: '/equipo', icon: '👥', label: 'Equipo Comercial' },
]

const NAV_COMERCIAL: NavItem[] = [
  { to: '/cotizaciones', icon: '📄', label: 'Cotizaciones' },
  { to: '/biblioteca', icon: '⚙️', label: 'Servicios' },
  { to: '/sac', icon: '🎂', label: 'SAC' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <aside
      className="fixed left-0 flex flex-col z-40 overflow-y-auto pb-6 border-r border-border"
      style={{
        top: '70px',
        bottom: 0,
        width: '220px',
        background: '#111827',
        boxShadow: '2px 0 16px rgba(0,0,0,0.25)',
      }}
    >
      <NavSection label="Principal" items={NAV_PRINCIPAL} />
      <NavSection label="Comercial" items={NAV_COMERCIAL} />

      {user?.role === 'superadmin' && (
        <NavSection
          label="Administración"
          items={[{ to: '/admin/usuarios', icon: '🔐', label: 'Usuarios' }]}
        />
      )}
    </aside>
  )
}

function NavSection({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <>
      <div className="px-5 pt-5 pb-1.5 text-2xs text-muted uppercase tracking-[2px] font-bold opacity-60">
        {label}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              'flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium',
              'border-l-[3px] transition-all duration-150 hover:bg-white/[0.04]',
              isActive
                ? 'border-accent text-accent bg-accent/[0.07]'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')
          }
        >
          <span className="text-base leading-none">{item.icon}</span>
          <span className="tracking-[0.5px]">{item.label}</span>
        </NavLink>
      ))}
    </>
  )
}
