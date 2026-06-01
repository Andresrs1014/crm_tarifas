import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, createUser, updateUser, deleteUser } from '../api/users'
import { useAuthStore } from '../store/authStore'
import { toast } from '../store/toastStore'
import type { User } from '../types'

type Role = 'superadmin' | 'usuario'

interface UserForm {
  username: string
  password: string
  role: Role
  esComercial: boolean
  nombreComercial: string
  cargo: string
  email: string
  tel: string
}

const EMPTY_FORM: UserForm = {
  username: '', password: '', role: 'usuario',
  esComercial: false, nombreComercial: '', cargo: '', email: '', tel: '',
}

function UserRow({
  user,
  currentUserId,
  onDelete,
}: {
  user: User
  currentUserId?: string
  onDelete: () => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ username: user.username, password: '', role: user.role as Role })

  const updateMut = useMutation({
    mutationFn: () => updateUser(user.id, {
      username: form.username,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario actualizado')
      setEditing(false)
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const isSelf = user.id === currentUserId

  if (editing) {
    return (
      <tr>
        <td colSpan={5}>
          <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-2xs text-muted block mb-0.5">Username</label>
              <input className="input text-sm" value={form.username}
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-2xs text-muted block mb-0.5">Nueva contraseña</label>
              <input type="password" className="input text-sm" placeholder="(sin cambios)"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
            </div>
            <div>
              <label className="text-2xs text-muted block mb-0.5">Rol</label>
              <select className="filter-select text-sm" value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}>
                <option value="usuario">usuario</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm text-xs" onClick={() => setEditing(false)}>Cancelar</button>
              <button className="btn-primary btn-sm text-xs" disabled={updateMut.isPending}
                onClick={() => updateMut.mutate()}>
                {updateMut.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>
        <span className="font-semibold text-foreground font-mono">{user.username}</span>
        {isSelf && <span className="ml-2 text-2xs text-accent">(tú)</span>}
      </td>
      <td>
        <span className={user.role === 'superadmin' ? 'badge-gold' : 'badge-gray'}>
          {user.role}
        </span>
      </td>
      <td>
        {user.comercial ? (
          <div>
            <span className="badge-blue">📊 Comercial</span>
            <div className="text-xs text-muted mt-0.5">{user.comercial.nombre}{user.comercial.cargo ? ` · ${user.comercial.cargo}` : ''}</div>
          </div>
        ) : (
          <span className="text-muted text-xs">—</span>
        )}
      </td>
      <td className="text-xs text-muted">
        {new Date(user.createdAt).toLocaleDateString('es-CO')}
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm px-2 py-1 text-xs" onClick={() => setEditing(true)}>
            Editar
          </button>
          {!isSelf && (
            <button className="btn-danger btn-sm px-2 py-1 text-xs" onClick={onDelete}>
              ×
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function Usuarios() {
  const qc = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsers,
  })

  const createMut = useMutation({
    mutationFn: () => createUser({
      username: form.username,
      password: form.password,
      role: form.role,
      ...(form.esComercial ? {
        esComercial: true,
        nombreComercial: form.nombreComercial || form.username,
        cargo: form.cargo || undefined,
        email: form.email || undefined,
        tel: form.tel || undefined,
      } : {}),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.success(form.esComercial ? 'Usuario y comercial creados' : 'Usuario creado')
      setShowForm(false)
      setForm(EMPTY_FORM)
    },
    onError: () => toast.error('Error al crear usuario'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario eliminado')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios del sistema</h1>
          <p className="text-sm text-muted mt-0.5">{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
          + Nuevo usuario
        </button>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div className="card p-5 space-y-4 border border-accent/30">
          <h3 className="text-sm font-bold text-foreground">Nuevo usuario</h3>

          {/* Campos de acceso */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Username <span className="text-danger">*</span></label>
              <input className="input w-full" value={form.username} autoFocus
                onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                placeholder="nombre.apellido" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Contraseña <span className="text-danger">*</span></label>
              <input type="password" className="input w-full" value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Rol</label>
              <select className="filter-select w-full" value={form.role}
                onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}>
                <option value="usuario">usuario</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
          </div>

          {/* Toggle comercial */}
          <div
            className={`rounded-xl border p-4 transition-colors cursor-pointer ${
              form.esComercial ? 'border-accent/50 bg-accent/5' : 'border-border'
            }`}
            onClick={() => setForm((s) => ({ ...s, esComercial: !s.esComercial }))}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-5 rounded-full transition-colors relative ${form.esComercial ? 'bg-accent' : 'bg-surface2'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.esComercial ? 'left-5' : 'left-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">📊 Es parte del equipo comercial</p>
                <p className="text-xs text-muted">Se creará también como comercial y podrá ser asignado a prospectos y clientes</p>
              </div>
            </div>
          </div>

          {/* Campos comercial (solo si esComercial) */}
          {form.esComercial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
              <div>
                <label className="text-xs text-muted block mb-1">Nombre completo <span className="text-danger">*</span></label>
                <input className="input w-full" value={form.nombreComercial}
                  onChange={(e) => setForm((s) => ({ ...s, nombreComercial: e.target.value }))}
                  placeholder="Ej: Andrés Quintero" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Cargo</label>
                <input className="input w-full" value={form.cargo}
                  onChange={(e) => setForm((s) => ({ ...s, cargo: e.target.value }))}
                  placeholder="Ej: Ejecutivo Comercial" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Email</label>
                <input type="email" className="input w-full" value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  placeholder="correo@empresa.com" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Teléfono</label>
                <input className="input w-full" value={form.tel}
                  onChange={(e) => setForm((s) => ({ ...s, tel: e.target.value }))}
                  placeholder="300 000 0000" />
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn-sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              Cancelar
            </button>
            <button
              className="btn-primary btn-sm"
              disabled={!form.username || !form.password || (form.esComercial && !form.nombreComercial) || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? 'Creando...' : form.esComercial ? '💾 Crear usuario y comercial' : '💾 Crear usuario'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="table-card">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-surface2 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Rol</th>
                <th>Equipo Comercial</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  currentUserId={currentUser?.id}
                  onDelete={() => setConfirmId(u.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirmación */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Eliminar usuario?</h3>
            <p className="text-sm text-muted">
              <strong className="text-foreground">{usuarios.find((u) => u.id === confirmId)?.username}</strong> perderá acceso al sistema.
            </p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button
                className="btn-danger btn-sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmId)}
              >
                {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
