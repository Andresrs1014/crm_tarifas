import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { Plus, UserCheck, UserX, Trash2, Eye, EyeOff } from 'lucide-react'
import { listUsers, createUser, updateUser, deleteUser } from '../api/users'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { fmtDate } from '../utils/format'

export default function Usuarios() {
  const toast = useToastStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.add('Usuario creado')
      setShowCreate(false)
      setForm({ username: '', email: '', password: '' })
    },
    onError: () => toast.add('Error al crear usuario', 'error'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.add('Usuario actualizado')
    },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.add('Usuario eliminado')
      setDeleteId(null)
    },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const handleCreate = () => {
    if (!form.username || !form.email || !form.password) {
      toast.add('Completa todos los campos', 'warning')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Usuarios
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Formulario crear */}
      {showCreate && (
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-4">Crear usuario</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Usuario</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@dominio.com"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition"
              style={{ background: '#00c2ff', color: '#0a0e1a' }}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setForm({ username: '', email: '', password: '' }) }}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-white border border-border transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Usuario', 'Email', 'Rol', 'Estado', 'Creado', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-condensed uppercase text-muted tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-surface2 rounded animate-pulse" style={{ width: j === 0 ? '50%' : '70%' }} />
                  </td>
                ))}
              </tr>
            ))}
            {!isLoading && users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium" style={{ color: '#e8edf5' }}>{u.username}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  {u.is_superadmin && (
                    <span className="text-xs px-2 py-0.5 rounded border bg-gold/10 text-gold border-gold/30">
                      Superadmin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    u.is_active
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-muted/10 text-muted border-muted/30'
                  }`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      title={u.is_active ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleMutation.mutate({ id: u.id, is_active: !u.is_active })}
                      className="text-muted hover:text-accent transition"
                    >
                      {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => setDeleteId(u.id)}
                      className="text-muted hover:text-danger transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!deleteId}
        message="¿Eliminar este usuario? Esta acción no se puede deshacer."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
