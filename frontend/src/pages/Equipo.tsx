import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getComercialesApi, createComercial, updateComercial, deleteComercial,
} from '../api/comerciales'
import { toast } from '../store/toastStore'
import type { Comercial, ComercialCreate } from '../types'

// ─── Formulario ────────────────────────────────────────────────────────────────

const EMPTY_FORM: ComercialCreate = {
  nombre: '', cargo: '', email: '', tel: '',
}

function ComercialForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: ComercialCreate
  onSave: (data: ComercialCreate) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState<ComercialCreate>(initial)
  function set(k: keyof ComercialCreate, v: string) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  return (
    <div className="card p-5 space-y-4 border border-accent/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted block mb-1">Nombre <span className="text-danger">*</span></label>
          <input className="input w-full" value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre completo" autoFocus />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Cargo</label>
          <input className="input w-full" value={form.cargo ?? ''}
            onChange={(e) => set('cargo', e.target.value)} placeholder="Ej: Asesor Comercial" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Email</label>
          <input type="email" className="input w-full" value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)} placeholder="nombre@empresa.com" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Teléfono</label>
          <input className="input w-full" value={form.tel ?? ''}
            onChange={(e) => set('tel', e.target.value)} placeholder="+57 300 000 0000" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm" onClick={onCancel}>Cancelar</button>
        <button
          className="btn-primary btn-sm"
          disabled={!form.nombre.trim() || loading}
          onClick={() => onSave(form)}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Tarjeta comercial ─────────────────────────────────────────────────────────

function ComercialCard({
  comercial,
  onEdit,
  onDelete,
}: {
  comercial: Comercial
  onEdit: () => void
  onDelete: () => void
}) {
  const initials = comercial.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="card p-5 space-y-3 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: '#00c2ff18', color: '#00c2ff' }}
          >
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground">{comercial.nombre}</p>
            {comercial.cargo && <p className="text-xs text-muted">{comercial.cargo}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm px-2 py-1 text-xs" onClick={onEdit}>Editar</button>
          <button className="btn-danger btn-sm px-2 py-1 text-xs" onClick={onDelete}>×</button>
        </div>
      </div>

      <div className="space-y-1">
        {comercial.email && (
          <a href={`mailto:${comercial.email}`}
            className="flex items-center gap-2 text-xs text-accent hover:underline">
            <span>📧</span>{comercial.email}
          </a>
        )}
        {comercial.tel && (
          <a href={`tel:${comercial.tel}`}
            className="flex items-center gap-2 text-xs text-muted hover:text-foreground">
            <span>📞</span>{comercial.tel}
          </a>
        )}
      </div>

      <div className="flex items-center justify-between text-2xs text-muted pt-1 border-t border-border">
        <span>Activo desde {new Date(comercial.createdAt).toLocaleDateString('es-CO')}</span>
        <span className={comercial.activo ? 'text-success' : 'text-muted'}>
          {comercial.activo ? '● Activo' : '○ Inactivo'}
        </span>
      </div>
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function Equipo() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { data: comerciales = [], isLoading } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const createMut = useMutation({
    mutationFn: createComercial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.success('Comercial creado')
      setShowForm(false)
    },
    onError: () => toast.error('Error al crear comercial'),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ComercialCreate> }) =>
      updateComercial(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.success('Comercial actualizado')
      setEditingId(null)
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteComercial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comerciales'] })
      toast.success('Comercial eliminado')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const comercialToEdit = comerciales.find((c) => c.id === editingId)

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo Comercial</h1>
          <p className="text-sm text-muted mt-0.5">{comerciales.length} comerciales</p>
        </div>
        {!showForm && (
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Nuevo comercial
          </button>
        )}
      </div>

      {/* Formulario nuevo */}
      {showForm && (
        <ComercialForm
          initial={EMPTY_FORM}
          loading={createMut.isPending}
          onCancel={() => setShowForm(false)}
          onSave={(data) => createMut.mutate(data)}
        />
      )}

      {/* Formulario edición */}
      {editingId && comercialToEdit && (
        <div className="space-y-1">
          <p className="text-xs text-muted">Editando: <strong className="text-foreground">{comercialToEdit.nombre}</strong></p>
          <ComercialForm
            initial={{
              nombre: comercialToEdit.nombre,
              cargo: comercialToEdit.cargo,
              email: comercialToEdit.email,
              tel: comercialToEdit.tel,
            }}
            loading={updateMut.isPending}
            onCancel={() => setEditingId(null)}
            onSave={(data) => updateMut.mutate({ id: editingId, data })}
          />
        </div>
      )}

      {/* Grid de comerciales */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-36 animate-pulse bg-surface2" />
          ))}
        </div>
      ) : comerciales.length === 0 ? (
        <div className="empty-state">
          <div className="text-5xl mb-4">👥</div>
          <p className="font-semibold text-foreground mb-1">Sin comerciales</p>
          <p className="text-sm mb-4">Agrega el primer miembro del equipo comercial.</p>
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>
            + Nuevo comercial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comerciales.map((c) => (
            <ComercialCard
              key={c.id}
              comercial={c}
              onEdit={() => { setEditingId(c.id); setShowForm(false) }}
              onDelete={() => setConfirmId(c.id)}
            />
          ))}
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Eliminar comercial?</h3>
            <p className="text-sm text-muted">
              {comerciales.find((c) => c.id === confirmId)?.nombre} será eliminado del equipo.
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
