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
  Package,
  ClipboardList,
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
  { to: '/cotizaciones',       icon: <FileText    size={16} />, label: 'Cotizaciones'       },
  { to: '/biblioteca',         icon: <Library     size={16} />, label: 'Servicios'           },
  { to: '/matriz-riesgos',     icon: <ShieldAlert size={16} />, label: 'Matriz de Riesgos'  },
  { to: '/gestion-documental', icon: <FolderOpen  size={16} />, label: 'Gestión Documental' },
  { to: '/preliquidador',      icon: <Calculator  size={16} />, label: 'Preliquidador'       },
  { to: '/calendario',         icon: <CalendarDays size={16}/>, label: 'Calendario'          },
  { to: '/cotizador',          icon: <Package         size={16}/>, label: 'Cotizador Paqueteo'  },
  { to: '/fichas',             icon: <ClipboardList   size={16}/>, label: 'Fichas de Cliente'   },
]

const NAV_HERRAMIENTAS: NavItem[] = [
  { to: '/sac', icon: <Cake size={16} />, label: 'SAC' },
]

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <aside
      className="sidebar"
      style={{ bottom: 0 }}
    >
      <NavSection label="Principal" items={NAV_PRINCIPAL} />
      <NavSection label="Comercial" items={NAV_COMERCIAL} />
      <NavSection label="Herramientas" items={NAV_HERRAMIENTAS} />

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
      <div className="sidebar-label">
        {label}
      </div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            ['nav-tab', isActive ? 'active' : ''].filter(Boolean).join(' ')
          }
        >
          <span className="flex-shrink-0 opacity-80">{item.icon}</span>
          <span className="tracking-[0.3px]">{item.label}</span>
        </NavLink>
      ))}
    </>
  )
}
