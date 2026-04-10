import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import {
  getBibliotecaApi,
  createGrupoApi, updateGrupoApi, deleteGrupoApi,
  createItemApi, updateItemApi, deleteItemApi,
  createObsApi, updateObsApi, deleteObsApi,
  updateColumnasApi,
} from '../api/biblioteca'
import ConfirmModal from '../components/ConfirmModal'
import PageContainer from '../components/PageContainer'
import { useToastStore } from '../store/toastStore'
import type { ToastState } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { SERVICIO_COLORS } from '../types'
import type { BibliotecaGrupo, BibliotecaItem, BibliotecaObservacion, BibliotecaColumna, BibliotecaLinea } from '../types'

const SVC_ICONS: Record<string, string> = {
  'Zona Franca':       '🏭',
  'Depósito Aduanero': '📦',
  'CEDI':              '🏗️',
  'Transporte':        '🚛',
  'Paqueteo':          '📬',
  'Aduana':            '🛃',
}

type Tab = 'items' | 'obs' | 'columnas'

export default function Biblioteca() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [tabs, setTabs] = useState<Record<string, Tab>>({})
  const toast = useToastStore((s) => s)
  const qc = useQueryClient()
  const isSuperadmin = useAuthStore((s) => s.user?.is_superadmin ?? false)

  const { data: lineas = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBibliotecaApi,
    staleTime: 0,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['biblioteca'] })

  const toggleExpand = (id: string) =>
    setExpanded((e) => ({ ...e, [id]: !e[id] }))

  const getTab = (id: string): Tab => tabs[id] ?? 'items'
  const setTab = (id: string, t: Tab) => setTabs((prev) => ({ ...prev, [id]: t }))

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-muted">Cargando servicios...</p>
      </PageContainer>
    )
  }

  if (isError) {
    return (
      <PageContainer>
        <div className="flex items-center gap-3 mb-2">
          <Settings size={22} style={{ color: '#8899b4' }} />
          <h1 className="font-condensed font-bold text-2xl tracking-wider" style={{ color: '#e8edf5' }}>
            BIBLIOTECA DE{' '}
            <span style={{ color: '#00c2ff' }}>SERVICIOS</span>
          </h1>
        </div>
        <div className="mt-8 flex flex-col items-center gap-3 py-12 rounded-xl border" style={{ borderColor: '#ff444433', background: '#1a1225' }}>
          <p className="text-sm font-medium" style={{ color: '#ff6b6b' }}>No se pudo cargar la biblioteca de servicios.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            Reintentar
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-2">
        <Settings size={22} style={{ color: '#8899b4' }} />
        <h1 className="font-condensed font-bold text-2xl tracking-wider" style={{ color: '#e8edf5' }}>
          BIBLIOTECA DE{' '}
          <span style={{ color: '#00c2ff' }}>SERVICIOS</span>
        </h1>
      </div>
      <p className="text-muted text-sm mb-8">
        Configura los grupos y servicios por línea de negocio. Estos se usarán al crear cotizaciones.
      </p>

      {/* Acordeones */}
      <div className="space-y-3">
        {lineas.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 rounded-xl border" style={{ borderColor: '#1e3050', background: '#1a2235' }}>
            <p className="text-muted text-sm">No hay líneas de servicio configuradas.</p>
            <p className="text-xs" style={{ color: '#4a5568' }}>Contacta al administrador para inicializar la biblioteca.</p>
          </div>
        )}
        {lineas.map((linea) => {
          const color = SERVICIO_COLORS[linea.nombre] ?? '#8899b4'
          const icon = SVC_ICONS[linea.nombre] ?? '📋'
          const isOpen = !!expanded[linea.id]
          const totalItems = linea.grupos.reduce((a, g) => a + g.items.length, 0)
          const tab = getTab(linea.id)

          return (
            <div
              key={linea.id}
              className="rounded-xl border overflow-hidden transition-all"
              style={{
                background: '#1a2235',
                borderColor: isOpen ? color + '55' : '#1e3050',
              }}
            >
              {/* Cabecera del acordeón */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition-all hover:bg-white/5"
                onClick={() => toggleExpand(linea.id)}
              >
                {/* Icono en caja coloreada */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                  style={{ background: color + '20' }}
                >
                  {icon}
                </div>

                {/* Nombre y contador */}
                <div className="flex-1 min-w-0">
                  <p className="font-condensed font-bold text-base tracking-wide" style={{ color }}>
                    {linea.nombre}
                  </p>
                  <p className="text-xs" style={{ color: '#8899b4' }}>
                    {linea.grupos.length} grupo{linea.grupos.length !== 1 ? 's' : ''} · {totalItems} ítem{totalItems !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Chevron */}
                <div style={{ color: '#8899b4' }}>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Contenido expandido */}
              {isOpen && (
                <div style={{ borderTop: `1px solid ${color}33` }}>
                  {/* Tabs internos */}
                  <div className="flex gap-0 border-b border-border px-5">
                    {([
                      ['items', 'Grupos & Ítems'],
                      ['obs', 'Observaciones'],
                      ...(isSuperadmin ? [['columnas', 'Columnas extra'] as [Tab, string]] : []),
                    ] as [Tab, string][]).map(([t, label]) => (
                      <button
                        key={t}
                        onClick={() => setTab(linea.id, t)}
                        className="px-4 py-3 text-sm font-medium transition-all"
                        style={{
                          color: tab === t ? color : '#8899b4',
                          borderBottom: tab === t ? `2px solid ${color}` : '2px solid transparent',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="p-5">
                    {tab === 'items' && (
                      <GruposTab linea={linea} onMutate={invalidate} toast={toast} />
                    )}
                    {tab === 'obs' && (
                      <ObsTab linea={linea} onMutate={invalidate} toast={toast} />
                    )}
                    {tab === 'columnas' && isSuperadmin && (
                      <ColumnasTab linea={linea} onMutate={invalidate} toast={toast} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </PageContainer>
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
  linea: BibliotecaLinea
  onMutate: () => void
  toast: ToastState
}) {
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})
  const [newGrupoName, setNewGrupoName] = useState('')
  const [editingGrupo, setEditingGrupo] = useState<{ id: string; nombre: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'grupo' | 'item'; id: string } | null>(null)

  const toggleGrupo = (id: string) =>
    setExpandedGrupos((e) => ({ ...e, [id]: !e[id] }))

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

  const color = SERVICIO_COLORS[linea.nombre] ?? '#8899b4'

  return (
    <div className="space-y-3">
      {/* Nuevo grupo */}
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
          style={{ background: color, color: '#0a0e1a' }}
        >
          <Plus size={14} /> Agregar grupo
        </button>
      </div>

      {linea.grupos.length === 0 && (
        <p className="text-center text-muted text-sm py-4">
          Sin grupos. Agrega el primero arriba.
        </p>
      )}

      {linea.grupos.map((grupo) => (
        <div
          key={grupo.id}
          className="rounded-xl border overflow-hidden"
          style={{ background: '#111827', borderColor: '#1e3050' }}
        >
          {/* Cabecera grupo */}
          <div className="flex items-center gap-3 px-4 py-2.5">
            <button
              onClick={() => toggleGrupo(grupo.id)}
              className="text-muted hover:text-white transition"
            >
              {expandedGrupos[grupo.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
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
                  className="text-success transition p-1"><Check size={14} /></button>
                <button onClick={() => setEditingGrupo(null)}
                  className="text-muted hover:text-white transition p-1"><X size={14} /></button>
              </div>
            ) : (
              <>
                <span className="font-condensed font-bold text-sm uppercase tracking-wider flex-1" style={{ color: '#e8edf5' }}>
                  {grupo.nombre}
                </span>
                <span className="text-xs text-muted mr-2">
                  {grupo.items.length} ítem{grupo.items.length !== 1 ? 's' : ''}
                </span>
                <button onClick={() => setEditingGrupo({ id: grupo.id, nombre: grupo.nombre })}
                  className="text-muted hover:text-accent transition p-1"><Pencil size={13} /></button>
                <button onClick={() => setDeleteTarget({ type: 'grupo', id: grupo.id })}
                  className="text-muted hover:text-danger transition p-1"><Trash2 size={13} /></button>
              </>
            )}
          </div>

          {expandedGrupos[grupo.id] && (
            <ItemsTable
              grupo={grupo}
              columnas={linea.columnas}
              color={color}
              onMutate={onMutate}
              onDeleteItem={(id) => setDeleteTarget({ type: 'item', id })}
              toast={toast}
            />
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
  color,
  onMutate,
  onDeleteItem,
  toast,
}: {
  grupo: BibliotecaGrupo
  columnas: BibliotecaColumna[]
  color: string
  onMutate: () => void
  onDeleteItem: (id: string) => void
  toast: ToastState
}) {
  const EMPTY = { nombre: '', tarifa: '', tipo_tarifa: 'moneda' as 'moneda' | 'porcentaje', obs: '', extra_cols: {} as Record<string, string> }
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY)

  const createItem = useMutation({
    mutationFn: () => createItemApi({ grupo_id: grupo.id, ...addForm }),
    onSuccess: () => { onMutate(); setAddForm(EMPTY); setShowAdd(false); toast.add('Ítem creado') },
    onError: () => toast.add('Error al crear ítem', 'error'),
  })

  const updateItem = useMutation({
    mutationFn: () => updateItemApi(editId!, editForm),
    onSuccess: () => { onMutate(); setEditId(null); toast.add('Ítem actualizado') },
    onError: () => toast.add('Error al actualizar', 'error'),
  })

  const startEdit = (item: BibliotecaItem) => {
    setEditId(item.id)
    setEditForm({ nombre: item.nombre, tarifa: item.tarifa, tipo_tarifa: item.tipo_tarifa, obs: item.obs ?? '', extra_cols: { ...item.extra_cols } })
  }

  return (
    <div style={{ borderTop: '1px solid #1e3050' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid #1e3050' }}>
              <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider min-w-[160px]">Nombre</th>
              <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-28">Tarifa</th>
              <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-24">Tipo</th>
              <th className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider min-w-[130px]">Obs.</th>
              {columnas.map((c) => (
                <th key={c.id} className="text-left px-4 py-2 text-muted font-condensed uppercase tracking-wider w-24">{c.nombre}</th>
              ))}
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {grupo.items.length === 0 && !showAdd && (
              <tr>
                <td colSpan={5 + columnas.length} className="px-4 py-3 text-muted text-center">
                  Sin ítems
                </td>
              </tr>
            )}

            {grupo.items.map((item) =>
              editId === item.id ? (
                <tr key={item.id} style={{ borderBottom: '1px solid #1e3050', background: '#1a2235' }}>
                  <td className="px-2 py-1.5"><input className="text-xs py-1" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} /></td>
                  <td className="px-2 py-1.5"><input className="text-xs py-1" value={editForm.tarifa} onChange={(e) => setEditForm((f) => ({ ...f, tarifa: e.target.value }))} /></td>
                  <td className="px-2 py-1.5">
                    <select className="text-xs py-1" value={editForm.tipo_tarifa} onChange={(e) => setEditForm((f) => ({ ...f, tipo_tarifa: e.target.value as 'moneda' | 'porcentaje' }))}>
                      <option value="moneda">$</option>
                      <option value="porcentaje">%</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5"><input className="text-xs py-1" value={editForm.obs} onChange={(e) => setEditForm((f) => ({ ...f, obs: e.target.value }))} /></td>
                  {columnas.map((c) => (
                    <td key={c.id} className="px-2 py-1.5">
                      <input className="text-xs py-1" value={editForm.extra_cols[c.id] ?? ''} onChange={(e) => setEditForm((f) => ({ ...f, extra_cols: { ...f.extra_cols, [c.id]: e.target.value } }))} />
                    </td>
                  ))}
                  <td className="px-2 py-1.5">
                    <div className="flex gap-1">
                      <button onClick={() => updateItem.mutate()} className="text-success p-1"><Check size={13} /></button>
                      <button onClick={() => setEditId(null)} className="text-muted hover:text-white p-1"><X size={13} /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="hover:bg-white/5 transition" style={{ borderBottom: '1px solid #1e3050' }}>
                  <td className="px-4 py-2" style={{ color: '#e8edf5' }}>{item.nombre}</td>
                  <td className="px-4 py-2 font-medium" style={{ color }}>{item.tipo_tarifa === 'moneda' ? '$' : ''}{item.tarifa}</td>
                  <td className="px-4 py-2 text-muted">{item.tipo_tarifa === 'moneda' ? 'Moneda' : '%'}</td>
                  <td className="px-4 py-2 text-muted">{item.obs || '—'}</td>
                  {columnas.map((c) => (
                    <td key={c.id} className="px-4 py-2 text-muted">{item.extra_cols[c.id] || '—'}</td>
                  ))}
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(item)} className="text-muted hover:text-accent p-1"><Pencil size={13} /></button>
                      <button onClick={() => onDeleteItem(item.id)} className="text-muted hover:text-danger p-1"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {showAdd && (
              <tr style={{ borderBottom: '1px solid #1e3050', background: '#1a2235' }}>
                <td className="px-2 py-1.5"><input className="text-xs py-1" autoFocus placeholder="Nombre *" value={addForm.nombre} onChange={(e) => setAddForm((f) => ({ ...f, nombre: e.target.value }))} /></td>
                <td className="px-2 py-1.5"><input className="text-xs py-1" placeholder="559.900" value={addForm.tarifa} onChange={(e) => setAddForm((f) => ({ ...f, tarifa: e.target.value }))} /></td>
                <td className="px-2 py-1.5">
                  <select className="text-xs py-1" value={addForm.tipo_tarifa} onChange={(e) => setAddForm((f) => ({ ...f, tipo_tarifa: e.target.value as 'moneda' | 'porcentaje' }))}>
                    <option value="moneda">$</option>
                    <option value="porcentaje">%</option>
                  </select>
                </td>
                <td className="px-2 py-1.5"><input className="text-xs py-1" placeholder="Obs. corta" value={addForm.obs} onChange={(e) => setAddForm((f) => ({ ...f, obs: e.target.value }))} /></td>
                {columnas.map((c) => (
                  <td key={c.id} className="px-2 py-1.5">
                    <input className="text-xs py-1" placeholder="—" value={addForm.extra_cols[c.id] ?? ''} onChange={(e) => setAddForm((f) => ({ ...f, extra_cols: { ...f.extra_cols, [c.id]: e.target.value } }))} />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <div className="flex gap-1">
                    <button onClick={() => addForm.nombre.trim() && createItem.mutate()} disabled={!addForm.nombre.trim()} className="text-success p-1 disabled:opacity-40"><Check size={13} /></button>
                    <button onClick={() => { setShowAdd(false); setAddForm(EMPTY) }} className="text-muted hover:text-white p-1"><X size={13} /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted hover:text-accent transition w-full"
          style={{ borderTop: '1px solid #1e3050' }}
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
  linea: BibliotecaLinea
  onMutate: () => void
  toast: ToastState
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

  return (
    <div className="space-y-3">
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: SERVICIO_COLORS[linea.nombre] ?? '#00c2ff', color: '#0a0e1a' }}
        >
          <Plus size={14} /> Nueva observación
        </button>
      )}

      {showAdd && (
        <ObsForm form={addForm} onChange={setAddForm}
          onSave={() => addForm.nombre.trim() && addForm.html.trim() && createObs.mutate()}
          onCancel={() => { setShowAdd(false); setAddForm(EMPTY) }}
          loading={createObs.isPending} title="Nueva observación" />
      )}

      {linea.observaciones.length === 0 && !showAdd && (
        <p className="text-muted text-sm text-center py-3">Sin observaciones para esta línea.</p>
      )}

      {linea.observaciones.map((obs) => (
        <div key={obs.id} className="rounded-xl border overflow-hidden" style={{ background: '#111827', borderColor: '#1e3050' }}>
          {editId === obs.id ? (
            <ObsForm form={editForm} onChange={setEditForm}
              onSave={() => updateObs.mutate()}
              onCancel={() => setEditId(null)}
              loading={updateObs.isPending} title="Editar observación" />
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="font-medium flex-1" style={{ color: '#e8edf5' }}>{obs.nombre}</span>
                <button onClick={() => setPreview(preview === obs.id ? null : obs.id)}
                  className="text-xs text-muted hover:text-white transition px-2 py-1 rounded border border-border">
                  {preview === obs.id ? 'Ocultar' : 'Preview'}
                </button>
                <button onClick={() => { setEditId(obs.id); setEditForm({ nombre: obs.nombre, html: obs.html }) }}
                  className="text-muted hover:text-accent p-1"><Pencil size={13} /></button>
                <button onClick={() => setDeleteId(obs.id)}
                  className="text-muted hover:text-danger p-1"><Trash2 size={13} /></button>
              </div>
              {preview === obs.id && (
                <div className="px-4 pb-3 text-sm text-muted leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: obs.html }} />
              )}
            </>
          )}
        </div>
      ))}

      <ConfirmModal open={!!deleteId} message="¿Eliminar esta observación?"
        onConfirm={() => deleteId && deleteObs.mutate(deleteId)}
        onCancel={() => setDeleteId(null)} loading={deleteObs.isPending} />
    </div>
  )
}

function ObsForm({ form, onChange, onSave, onCancel, loading, title }: {
  form: { nombre: string; html: string }
  onChange: (f: { nombre: string; html: string }) => void
  onSave: () => void
  onCancel: () => void
  loading: boolean
  title: string
}) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3" style={{ background: '#111827' }}>
      <p className="text-xs text-muted uppercase tracking-wider font-condensed">{title}</p>
      <input value={form.nombre} onChange={(e) => onChange({ ...form, nombre: e.target.value })}
        placeholder="Nombre de la observación" />
      <textarea className="h-32 resize-y font-mono text-xs" value={form.html}
        onChange={(e) => onChange({ ...form, html: e.target.value })}
        placeholder="<p>Contenido HTML...</p>" />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-muted hover:text-white border border-border rounded-lg transition">Cancelar</button>
        <button onClick={onSave} disabled={!form.nombre.trim() || !form.html.trim() || loading}
          className="px-4 py-1.5 text-sm font-medium rounded-lg transition disabled:opacity-40"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Tab: Columnas extra (superadmin)
// ─────────────────────────────────────────────────────────

function ColumnasTab({ linea, onMutate, toast }: {
  linea: BibliotecaLinea
  onMutate: () => void
  toast: ToastState
}) {
  const [columnas, setColumnas] = useState<BibliotecaColumna[]>(linea.columnas)
  const [newId, setNewId] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [dirty, setDirty] = useState(false)

  const saveMutation = useMutation({
    mutationFn: () => updateColumnasApi(linea.id, columnas),
    onSuccess: () => { onMutate(); setDirty(false); toast.add('Columnas guardadas') },
    onError: () => toast.add('Error al guardar', 'error'),
  })

  const addColumna = () => {
    if (!newId.trim() || !newNombre.trim()) return
    const id = newId.trim().toLowerCase().replace(/\s+/g, '_')
    if (columnas.find((c) => c.id === id)) { toast.add('ID duplicado', 'error'); return }
    setColumnas((c) => [...c, { id, nombre: newNombre.trim() }])
    setNewId(''); setNewNombre(''); setDirty(true)
  }

  return (
    <div className="space-y-3 max-w-xl">
      <p className="text-sm text-muted">Columnas extra aparecen como campos adicionales en ítems y cotizaciones.</p>
      {columnas.map((c) => (
        <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#111827', border: '1px solid #1e3050' }}>
          <span className="font-mono text-xs text-muted w-28 shrink-0">{c.id}</span>
          <span className="flex-1" style={{ color: '#e8edf5' }}>{c.nombre}</span>
          <button onClick={() => { setColumnas((prev) => prev.filter((x) => x.id !== c.id)); setDirty(true) }}
            className="text-muted hover:text-danger transition"><X size={14} /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <input className="w-28" placeholder="ID (slug)" value={newId} onChange={(e) => setNewId(e.target.value)} />
        <input className="flex-1" placeholder="Nombre visible" value={newNombre} onChange={(e) => setNewNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addColumna()} />
        <button onClick={addColumna} disabled={!newId.trim() || !newNombre.trim()} className="px-3 py-2 rounded-lg text-sm transition disabled:opacity-40" style={{ background: '#1e3050', color: '#e8edf5' }}><Plus size={15} /></button>
      </div>
      {dirty && (
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="w-full py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}>
          {saveMutation.isPending ? 'Guardando...' : 'Guardar columnas'}
        </button>
      )}
    </div>
  )
}
