import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Target,
  Kanban,
  Building2,
  Users,
  FileText,
  Library,
  Cake,
  ShieldCheck,
  ShieldAlert,
  FolderOpen,
  Calculator,
  CalendarDays,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
}

const NAV_PRINCIPAL: NavItem[] = [
  { to: '/dashboard',  icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
  { to: '/registro',   icon: <PlusCircle      size={16} />, label: 'Nuevo Registro' },
  { to: '/prospectos', icon: <Target          size={16} />, label: 'Prospectos' },
  { to: '/crm',        icon: <Kanban          size={16} />, label: 'CRM Pipeline' },
  { to: '/clientes',   icon: <Building2       size={16} />, label: 'Clientes Activos' },
  { to: '/equipo',     icon: <Users           size={16} />, label: 'Equipo Comercial' },
]

const NAV_COMERCIAL: NavItem[] = [
  { to: '/cotizaciones',    icon: <FileText    size={16} />, label: 'Cotizaciones' },
  { to: '/biblioteca',      icon: <Library     size={16} />, label: 'Servicios' },
  { to: '/sac',             icon: <Cake        size={16} />, label: 'SAC' },
  { to: '/matriz-riesgos',      icon: <ShieldAlert size={16} />, label: 'Matriz de Riesgos'   },
  { to: '/gestion-documental',  icon: <FolderOpen   size={16} />, label: 'Gestión Documental' },
  { to: '/preliquidador',       icon: <Calculator   size={16} />, label: 'Preliquidador'       },
  { to: '/calendario',          icon: <CalendarDays size={16} />, label: 'Calendario Visitas'   },
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
          items={[{ to: '/admin/usuarios', icon: <ShieldCheck size={16} />, label: 'Usuarios' }]}
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
              'border-l-[3px] transition-[color,background,border-color] duration-150',
              'hover:bg-white/[0.04]',
              isActive
                ? 'border-accent text-accent bg-accent/[0.07]'
                : 'border-transparent text-muted hover:text-foreground',
            ].join(' ')
          }
        >
          <span className="flex-shrink-0 opacity-80">{item.icon}</span>
          <span className="tracking-[0.3px]">{item.label}</span>
        </NavLink>
      ))}
    </>
  )
}
