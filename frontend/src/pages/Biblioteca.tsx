import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, X, Check } from 'lucide-react'
import {
  getBibliotecaApi,
  createGrupoApi, updateGrupoApi, deleteGrupoApi,
  createItemApi, updateItemApi, deleteItemApi,
  createObsApi, updateObsApi, deleteObsApi,
  updateColumnasApi,
} from '../api/biblioteca'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { SERVICIO_COLORS } from '../types'
import type { BibliotecaGrupo, BibliotecaItem, BibliotecaObservacion, BibliotecaColumna } from '../types'

type Tab = 'items' | 'obs' | 'columnas'

export default function Biblioteca() {
  const [lineaActiva, setLineaActiva] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('items')
  const toast = useToastStore()
  const qc = useQueryClient()
  const isSuperadmin = useAuthStore((s) => s.user?.is_superadmin ?? false)

  const { data: lineas = [], isLoading } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBibliotecaApi,
    staleTime: 0,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['biblioteca'] })

  const linea = lineas.find((l) => l.id === lineaActiva) ?? lineas[0] ?? null

  // Activar primera línea cuando carga
  if (!lineaActiva && lineas.length > 0) {
    setLineaActiva(lineas[0].id)
  }

  if (isLoading) return <div className="p-6 text-muted">Cargando biblioteca...</div>

  return (
    <div className="flex" style={{ minHeight: 'calc(100vh - 0px)' }}>
      {/* Sidebar de líneas */}
      <aside className="w-52 shrink-0 border-r border-border py-4 sticky top-0 self-start" style={{ height: '100vh', overflowY: 'auto' }}>
        <p className="px-4 text-xs text-muted uppercase tracking-wider font-condensed mb-3">
          Líneas de servicio
        </p>
        {lineas.map((l) => {
          const color = SERVICIO_COLORS[l.nombre] ?? '#8899b4'
          const active = l.id === lineaActiva
          return (
            <button
              key={l.id}
              onClick={() => setLineaActiva(l.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all text-left"
              style={{
                background: active ? color + '15' : 'transparent',
                color: active ? '#e8edf5' : '#8899b4',
                borderRight: active ? `3px solid ${color}` : '3px solid transparent',
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="font-medium leading-tight">{l.nombre}</span>
            </button>
          )
        })}
      </aside>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-6">
        {linea && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h1
                className="font-condensed font-bold text-2xl"
                style={{ color: SERVICIO_COLORS[linea.nombre] ?? '#e8edf5' }}
              >
                {linea.nombre}
              </h1>
              <p className="text-muted text-sm">
                {linea.grupos.length} grupo{linea.grupos.length !== 1 ? 's' : ''} ·{' '}
                {linea.grupos.reduce((a, g) => a + g.items.length, 0)} ítems ·{' '}
                {linea.observaciones.length} obs.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-border">
              {([
                ['items', 'Grupos & Ítems'],
                ['obs', 'Observaciones'],
                ...(isSuperadmin ? [['columnas', 'Columnas extra'] as [Tab, string]] : []),
              ] as [Tab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    color: tab === t ? '#00c2ff' : '#8899b4',
                    borderBottom: tab === t ? '2px solid #00c2ff' : '2px solid transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'items' && (
              <GruposTab linea={linea} onMutate={invalidate} toast={toast} />
            )}
            {tab === 'obs' && (
              <ObsTab linea={linea} onMutate={invalidate} toast={toast} />
            )}
            {tab === 'columnas' && isSuperadmin && (
              <ColumnasTab linea={linea} onMutate={invalidate} toast={toast} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tab: Grupos & Ítems
// ─────────────────────────────────────────────────────────

function GruposTab({
  linea,
  onMutate,
  toast,
}: {
  linea: { id: string; nombre: string; grupos: BibliotecaGrupo[]; columnas: { id: string; nombre: string }[] }
  onMutate: () => void
  toast: ReturnType<typeof useToastStore>
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [newGrupoName, setNewGrupoName] = useState('')
  const [editingGrupo, setEditingGrupo] = useState<{ id: string; nombre: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'grupo' | 'item'; id: string } | null>(null)

  const toggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const createGrupo = useMutation({
    mutationFn: () => createGrupoApi({ linea_id: linea.id, nombre: newGrupoName.trim() }),
    onSuccess: () => { onMutate(); setNewGrupoName(''); toast.add('Grupo creado') },
    onError: () => toast.add('Error al crear grupo', 'error'),
  })

  const updateGrupo = useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) => updateGrupoApi(id, { nombre }),
    onSuccess: () => { onMutate(); setEditingGrupo(null); toast.add('Grupo actualizado') },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const deleteGrupo = useMutation({
    mutationFn: (id: string) => deleteGrupoApi(id),
    onSuccess: () => { onMutate(); setDeleteTarget(null); toast.add('Grupo eliminado') },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const deleteItem = useMutation({
    mutationFn: (id: string) => deleteItemApi(id),
    onSuccess: () => { onMutate(); setDeleteTarget(null); toast.add('Ítem eliminado') },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  return (
    <div className="space-y-3">
      {/* Form nuevo grupo */}
      <div className="flex gap-2">
        <input
          className="flex-1"
          placeholder="Nombre del nuevo grupo..."
          value={newGrupoName}
          onChange={(e) => setNewGrupoName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newGrupoName.trim() && createGrupo.mutate()}
        />
        <button
          onClick={() => newGrupoName.trim() && createGrupo.mutate()}
          disabled={!newGrupoName.trim() || createGrupo.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          <Plus size={15} /> Agregar grupo
        </button>
      </div>

      {linea.grupos.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted text-sm">
          Sin grupos. Agrega el primero arriba.
        </div>
      )}

      {linea.grupos.map((grupo) => (
        <div key={grupo.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Header grupo */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface2">
            <button onClick={() => toggleExpand(grupo.id)} className="text-muted hover:text-white transition">
              {expanded[grupo.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {editingGrupo?.id === grupo.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  className="flex-1 py-1 text-sm"
                  value={editingGrupo.nombre}
                  onChange={(e) => setEditingGrupo({ ...editingGrupo, nombre: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateGrupo.mutate({ id: grupo.id, nombre: editingGrupo.nombre })
                    if (e.key === 'Escape') setEditingGrupo(null)
                  }}
                  autoFocus
                />
                <button onClick={() => updateGrupo.mutate({ id: grupo.id, nombre: editingGrupo.nombre })}
                  className="text-success hover:text-green-400 transition"><Check size={15} /></button>
                <button onClick={() => setEditingGrupo(null)} className="text-muted hover:text-white transition">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <>
                <span className="font-condensed font-bold text-sm uppercase tracking-wider flex-1" style={{ color: '#e8edf5' }}>
                  {grupo.nombre}
                </span>
                <span className="text-xs text-muted mr-2">{grupo.items.length} ítems</span>
                <button onClick={() => setEditingGrupo({ id: grupo.id, nombre: grupo.nombre })}
                  className="text-muted hover:text-accent transition p-1"><Pencil size={14} /></button>
                <button onClick={() => setDeleteTarget({ type: 'grupo', id: grupo.id })}
                  className="text-muted hover:text-danger transition p-1"><Trash2 size={14} /></button>
              </>
            )}
          </div>

          {/* Ítems */}
          {expanded[grupo.id] && (
            <div>
              <ItemsTable
                grupo={grupo}
                columnas={linea.columnas}
                onMutate={onMutate}
                onDeleteItem={(id) => setDeleteTarget({ type: 'item', id })}
                toast={toast}
              />
            </div>
          )}
        </div>
      ))}

      <ConfirmModal
        open={!!deleteTarget}
        message={
          deleteTarget?.type === 'grupo'
            ? '¿Eliminar este grupo? Se eliminarán también todos sus ítems.'
            : '¿Eliminar este ítem?'
        }
        onConfirm={() => {
          if (!deleteTarget) return
          if (deleteTarget.type === 'grupo') deleteGrupo.mutate(deleteTarget.id)
          else deleteItem.mutate(deleteTarget.id)
        }}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteGrupo.isPending || deleteItem.isPending}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tabla de ítems dentro de un grupo
// ─────────────────────────────────────────────────────────

function ItemsTable({
  grupo,
  columnas,
  onMutate,
  onDeleteItem,
  toast,
}: {
  grupo: BibliotecaGrupo
  columnas: { id: string; nombre: string }[]
  onMutate: () => void
  onDeleteItem: (id: string) => void
  toast: ReturnType<typeof useToastStore>
}) {
  const EMPTY_FORM = { nombre: '', tarifa: '', tipo_tarifa: 'moneda' as const, obs: '', extra_cols: {} as Record<string, string> }
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)

  const createItem = useMutation({
    mutationFn: () => createItemApi({ grupo_id: grupo.id, ...addForm }),
    onSuccess: () => { onMutate(); setAddForm(EMPTY_FORM); setShowAdd(false); toast.add('Ítem creado') },
    onError: () => toast.add('Error al crear ítem', 'error'),
  })

  const updateItem = useMutation({
    mutationFn: () => updateItemApi(editId!, editForm),
    onSuccess: () => { onMutate(); setEditId(null); toast.add('Ítem actualizado') },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const startEdit = (item: BibliotecaItem) => {
    setEditId(item.id)
    setEditForm({
      nombre: item.nombre,
      tarifa: item.tarifa,
      tipo_tarifa: item.tipo_tarifa,
      obs: item.obs ?? '',
      extra_cols: { ...item.extra_cols },
    })
  }

  const hasItems = grupo.items.length > 0

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider min-w-[180px]">Nombre</th>
            <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-28">Tarifa</th>
            <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-24">Tipo</th>
            <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider min-w-[140px]">Observación</th>
            {columnas.map((c) => (
              <th key={c.id} className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-28">{c.nombre}</th>
            ))}
            <th className="w-16 px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {!hasItems && !showAdd && (
            <tr>
              <td colSpan={5 + columnas.length} className="px-4 py-4 text-muted text-center">
                Sin ítems — agrega el primero
              </td>
            </tr>
          )}

          {grupo.items.map((item) => (
            editId === item.id ? (
              // Fila de edición
              <tr key={item.id} className="border-b border-border bg-surface2">
                <td className="px-2 py-1.5">
                  <input className="text-xs py-1" value={editForm.nombre}
                    onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} />
                </td>
                <td className="px-2 py-1.5">
                  <input className="text-xs py-1" value={editForm.tarifa}
                    onChange={(e) => setEditForm((f) => ({ ...f, tarifa: e.target.value }))} />
                </td>
                <td className="px-2 py-1.5">
                  <select className="text-xs py-1" value={editForm.tipo_tarifa}
                    onChange={(e) => setEditForm((f) => ({ ...f, tipo_tarifa: e.target.value as 'moneda' | 'porcentaje' }))}>
                    <option value="moneda">$</option>
                    <option value="porcentaje">%</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <input className="text-xs py-1" value={editForm.obs}
                    onChange={(e) => setEditForm((f) => ({ ...f, obs: e.target.value }))} />
                </td>
                {columnas.map((c) => (
                  <td key={c.id} className="px-2 py-1.5">
                    <input className="text-xs py-1"
                      value={editForm.extra_cols[c.id] ?? ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, extra_cols: { ...f.extra_cols, [c.id]: e.target.value } }))} />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <div className="flex gap-1">
                    <button onClick={() => updateItem.mutate()} className="text-success hover:text-green-400 transition p-1"><Check size={13} /></button>
                    <button onClick={() => setEditId(null)} className="text-muted hover:text-white transition p-1"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            ) : (
              // Fila de lectura
              <tr key={item.id} className="border-b border-border hover:bg-surface2 transition">
                <td className="px-4 py-2" style={{ color: '#e8edf5' }}>{item.nombre}</td>
                <td className="px-4 py-2 font-mono text-sm" style={{ color: '#00c2ff' }}>
                  {item.tipo_tarifa === 'moneda' ? '$' : ''}{item.tarifa}{item.tipo_tarifa === 'porcentaje' ? '' : ''}
                </td>
                <td className="px-4 py-2 text-muted">{item.tipo_tarifa === 'moneda' ? 'Moneda' : 'Porcentaje'}</td>
                <td className="px-4 py-2 text-muted">{item.obs || '—'}</td>
                {columnas.map((c) => (
                  <td key={c.id} className="px-4 py-2 text-muted">{item.extra_cols[c.id] || '—'}</td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-muted hover:text-accent transition p-1"><Pencil size={13} /></button>
                    <button onClick={() => onDeleteItem(item.id)} className="text-muted hover:text-danger transition p-1"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            )
          ))}

          {/* Fila de nuevo ítem */}
          {showAdd && (
            <tr className="border-b border-border bg-surface2">
              <td className="px-2 py-1.5">
                <input className="text-xs py-1" placeholder="Nombre del ítem *" value={addForm.nombre}
                  onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))} autoFocus />
              </td>
              <td className="px-2 py-1.5">
                <input className="text-xs py-1" placeholder="Ej: 559.900" value={addForm.tarifa}
                  onChange={(e) => setAddForm((f) => ({ ...f, tarifa: e.target.value }))} />
              </td>
              <td className="px-2 py-1.5">
                <select className="text-xs py-1" value={addForm.tipo_tarifa}
                  onChange={(e) => setAddForm((f) => ({ ...f, tipo_tarifa: e.target.value as 'moneda' | 'porcentaje' }))}>
                  <option value="moneda">$</option>
                  <option value="porcentaje">%</option>
                </select>
              </td>
              <td className="px-2 py-1.5">
                <input className="text-xs py-1" placeholder="Observación corta" value={addForm.obs}
                  onChange={(e) => setAddForm((f) => ({ ...f, obs: e.target.value }))} />
              </td>
              {columnas.map((c) => (
                <td key={c.id} className="px-2 py-1.5">
                  <input className="text-xs py-1" placeholder="—"
                    value={addForm.extra_cols[c.id] ?? ''}
                    onChange={(e) => setAddForm((f) => ({ ...f, extra_cols: { ...f.extra_cols, [c.id]: e.target.value } }))} />
                </td>
              ))}
              <td className="px-2 py-1.5">
                <div className="flex gap-1">
                  <button onClick={() => addForm.nombre.trim() && createItem.mutate()}
                    disabled={!addForm.nombre.trim()}
                    className="text-success hover:text-green-400 transition p-1 disabled:opacity-40"><Check size={13} /></button>
                  <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM) }}
                    className="text-muted hover:text-white transition p-1"><X size={13} /></button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Botón agregar ítem */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted hover:text-accent transition w-full border-t border-border"
        >
          <Plus size={13} /> Agregar ítem
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tab: Observaciones
// ─────────────────────────────────────────────────────────

function ObsTab({
  linea,
  onMutate,
  toast,
}: {
  linea: { id: string; observaciones: BibliotecaObservacion[] }
  onMutate: () => void
  toast: ReturnType<typeof useToastStore>
}) {
  const EMPTY = { nombre: '', html: '' }
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY)
  const [preview, setPreview] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const createObs = useMutation({
    mutationFn: () => createObsApi({ linea_id: linea.id, ...addForm }),
    onSuccess: () => { onMutate(); setAddForm(EMPTY); setShowAdd(false); toast.add('Observación creada') },
    onError: () => toast.add('Error al crear', 'error'),
  })

  const updateObs = useMutation({
    mutationFn: () => updateObsApi(editId!, editForm),
    onSuccess: () => { onMutate(); setEditId(null); toast.add('Observación actualizada') },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const deleteObs = useMutation({
    mutationFn: (id: string) => deleteObsApi(id),
    onSuccess: () => { onMutate(); setDeleteId(null); toast.add('Observación eliminada') },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const startEdit = (obs: BibliotecaObservacion) => {
    setEditId(obs.id)
    setEditForm({ nombre: obs.nombre, html: obs.html })
  }

  return (
    <div className="space-y-3">
      {/* Botón nueva obs */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          <Plus size={15} /> Nueva observación
        </button>
      )}

      {/* Formulario nueva obs */}
      {showAdd && (
        <ObsForm
          form={addForm}
          onChange={setAddForm}
          onSave={() => addForm.nombre.trim() && addForm.html.trim() && createObs.mutate()}
          onCancel={() => { setShowAdd(false); setAddForm(EMPTY) }}
          loading={createObs.isPending}
          title="Nueva observación"
        />
      )}

      {linea.observaciones.length === 0 && !showAdd && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted text-sm">
          Sin observaciones para esta línea.
        </div>
      )}

      {/* Lista de observaciones */}
      {linea.observaciones.map((obs) => (
        <div key={obs.id} className="bg-surface border border-border rounded-xl overflow-hidden">
          {editId === obs.id ? (
            <ObsForm
              form={editForm}
              onChange={setEditForm}
              onSave={() => updateObs.mutate()}
              onCancel={() => setEditId(null)}
              loading={updateObs.isPending}
              title="Editar observación"
            />
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <span className="font-medium flex-1" style={{ color: '#e8edf5' }}>{obs.nombre}</span>
                <button
                  onClick={() => setPreview(preview === obs.id ? null : obs.id)}
                  className="text-xs text-muted hover:text-white transition px-2 py-1 rounded border border-border"
                >
                  {preview === obs.id ? 'Ocultar' : 'Preview'}
                </button>
                <button onClick={() => startEdit(obs)} className="text-muted hover:text-accent transition p-1"><Pencil size={14} /></button>
                <button onClick={() => setDeleteId(obs.id)} className="text-muted hover:text-danger transition p-1"><Trash2 size={14} /></button>
              </div>
              {preview === obs.id && (
                <div
                  className="px-4 py-3 text-sm"
                  style={{ color: '#8899b4', lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: obs.html }}
                />
              )}
            </>
          )}
        </div>
      ))}

      <ConfirmModal
        open={!!deleteId}
        message="¿Eliminar esta observación?"
        onConfirm={() => deleteId && deleteObs.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteObs.isPending}
      />
    </div>
  )
}

function ObsForm({
  form,
  onChange,
  onSave,
  onCancel,
  loading,
  title,
}: {
  form: { nombre: string; html: string }
  onChange: (f: { nombre: string; html: string }) => void
  onSave: () => void
  onCancel: () => void
  loading: boolean
  title: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs text-muted uppercase tracking-wider font-condensed">{title}</p>
      <div>
        <label className="block text-xs text-muted mb-1">Nombre</label>
        <input
          value={form.nombre}
          onChange={(e) => onChange({ ...form, nombre: e.target.value })}
          placeholder="Ej: Condiciones Generales Zona Franca"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">
          Contenido HTML{' '}
          <span className="text-muted normal-case font-normal">(soporta tags &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, etc.)</span>
        </label>
        <textarea
          className="h-40 resize-y font-mono text-xs"
          value={form.html}
          onChange={(e) => onChange({ ...form, html: e.target.value })}
          placeholder="<p>Texto de la observación...</p>"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-muted hover:text-white transition border border-border rounded-lg">
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={!form.nombre.trim() || !form.html.trim() || loading}
          className="px-4 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-40"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tab: Columnas extra (superadmin)
// ─────────────────────────────────────────────────────────

function ColumnasTab({
  linea,
  onMutate,
  toast,
}: {
  linea: { id: string; columnas: BibliotecaColumna[] }
  onMutate: () => void
  toast: ReturnType<typeof useToastStore>
}) {
  const [columnas, setColumnas] = useState<BibliotecaColumna[]>(linea.columnas)
  const [newId, setNewId] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [dirty, setDirty] = useState(false)

  const saveMutation = useMutation({
    mutationFn: () => updateColumnasApi(linea.id, columnas),
    onSuccess: () => { onMutate(); setDirty(false); toast.add('Columnas guardadas') },
    onError: () => toast.add('Error al guardar columnas', 'error'),
  })

  const addColumna = () => {
    if (!newId.trim() || !newNombre.trim()) return
    const id = newId.trim().toLowerCase().replace(/\s+/g, '_')
    if (columnas.find((c) => c.id === id)) {
      toast.add('Ya existe una columna con ese ID', 'error')
      return
    }
    setColumnas((c) => [...c, { id, nombre: newNombre.trim() }])
    setNewId('')
    setNewNombre('')
    setDirty(true)
  }

  const removeColumna = (id: string) => {
    setColumnas((c) => c.filter((col) => col.id !== id))
    setDirty(true)
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs text-muted uppercase tracking-wider font-condensed">
          Columnas extra de esta línea
        </p>
        <p className="text-sm text-muted">
          Las columnas extra aparecen como campos adicionales en los ítems y en las cotizaciones.
          El ID debe ser único y sin espacios (usa guión bajo).
        </p>

        {/* Lista actual */}
        {columnas.length > 0 && (
          <div className="space-y-1.5">
            {columnas.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface2 text-sm">
                <span className="font-mono text-xs text-muted w-28 shrink-0">{c.id}</span>
                <span className="flex-1" style={{ color: '#e8edf5' }}>{c.nombre}</span>
                <button onClick={() => removeColumna(c.id)} className="text-muted hover:text-danger transition">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Formulario nueva columna */}
        <div className="flex gap-2">
          <input
            className="w-32"
            placeholder="ID (slug)"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <input
            className="flex-1"
            placeholder="Nombre visible"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addColumna()}
          />
          <button
            onClick={addColumna}
            disabled={!newId.trim() || !newNombre.trim()}
            className="px-3 py-2 rounded-lg text-sm transition disabled:opacity-40"
            style={{ background: '#1e3050', color: '#e8edf5' }}
          >
            <Plus size={15} />
          </button>
        </div>

        {/* Guardar */}
        {dirty && (
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar columnas'}
          </button>
        )}
      </div>

      <p className="text-xs text-muted">
        Atención: eliminar una columna no borra los valores ya guardados en ítems existentes,
        pero dejarán de mostrarse en nuevas cotizaciones.
      </p>
    </div>
  )
}
