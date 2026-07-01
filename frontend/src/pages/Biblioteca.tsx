import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBiblioteca,
  createLinea, updateLinea, deleteLinea,
  createGrupo, updateGrupo, deleteGrupo,
  createItem, updateItem, deleteItem,
  createObs, updateObs, deleteObs,
} from '../api/biblioteca'
import { toast } from '../store/toastStore'
import type { BibliotecaLinea, BibliotecaGrupo, BibliotecaItem, BibliotecaObs } from '../types'
import { TIPO_TARIFA_OPTIONS } from '../constants'

async function persistOrden(ids: string[], updateFn: (id: string, orden: number) => Promise<unknown>) {
  await Promise.all(ids.map((id, orden) => updateFn(id, orden)))
}

function ItemRow({
  item, columnas, onDelete, canMoveUp, canMoveDown, onMoveUp, onMoveDown,
}: {
  item: BibliotecaItem
  columnas: string[]
  onDelete: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const qc = useQueryClient()

  function saveField(field: 'nombre' | 'tarifa' | 'obs' | 'tipoTarifa', value: string) {
    const current = field === 'obs' ? (item.obs ?? '') : String(item[field] ?? '')
    if (value === current) return
    updateItem(item.id, { [field]: value || undefined })
      .then(() => qc.invalidateQueries({ queryKey: ['biblioteca'] }))
      .catch(() => toast.error('Error al guardar'))
  }

  return (
    <tr>
      <td style={{ width: 36, padding: '4px 6px' }}>
        <div className="detalle-servicio-orden-actions">
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Subir">▲</button>
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Bajar">▼</button>
        </div>
      </td>
      <td>
        <input
          className="bib-cell-input"
          defaultValue={item.nombre}
          onBlur={(e) => saveField('nombre', e.target.value.trim())}
        />
      </td>
      <td style={{ width: 150 }}>
        <div className="flex items-center gap-1">
          <select
            className="filter-select text-xs py-0.5"
            style={{ width: 44, minWidth: 44 }}
            defaultValue={item.tipoTarifa}
            onChange={(e) => saveField('tipoTarifa', e.target.value)}
          >
            {TIPO_TARIFA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.value === 'moneda' ? '$' : '%'}</option>
            ))}
          </select>
          <input
            className="bib-cell-input bib-cell-input--tarifa"
            defaultValue={item.tarifa}
            onBlur={(e) => saveField('tarifa', e.target.value.trim())}
          />
        </div>
      </td>
      <td>
        <input
          className="bib-cell-input bib-cell-input--muted"
          defaultValue={item.obs ?? ''}
          placeholder="—"
          onBlur={(e) => saveField('obs', e.target.value.trim())}
        />
      </td>
      {columnas.map((col) => (
        <td key={col} className="text-xs text-muted">{item.extraCols?.[col] ?? ''}</td>
      ))}
      <td style={{ width: 40, textAlign: 'center' }}>
        <button
          type="button"
          className="btn-ghost btn-sm px-1 py-0 text-xs"
          title="Eliminar ítem"
          onClick={onDelete}
        >
          ✕
        </button>
      </td>
    </tr>
  )
}

// ─── Grupo ─────────────────────────────────────────────────────────────────────

function GrupoSection({
  grupo, columnas, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDropReorder,
}: {
  grupo: BibliotecaGrupo
  columnas: string[]
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDropReorder: (fromGrupoId: string, toGrupoId: string) => void
}) {
  const qc = useQueryClient()
  const [nombre, setNombre] = useState(grupo.nombre)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' })

  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)

  const updateGrupoMut = useMutation({
    mutationFn: () => updateGrupo(grupo.id, { nombre }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al guardar'),
  })

  const deleteGrupoMut = useMutation({
    mutationFn: () => deleteGrupo(grupo.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addItemMut = useMutation({
    mutationFn: () => createItem(grupo.id, {
      nombre: newItem.nombre,
      tarifa: newItem.tarifa,
      tipoTarifa: newItem.tipoTarifa,
      obs: newItem.obs || undefined,
      orden: sortedItems.length,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddItem(false)
      setNewItem({ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' })
      toast.success('Item agregado')
    },
    onError: () => toast.error('Error al agregar'),
  })

  const deleteItemMut = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const reorderItemMut = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= sortedItems.length) return
      const ids = sortedItems.map((i) => i.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateItem(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar ítem'),
  })

  return (
    <div
      className="bib-grupo-row"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', grupo.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        const fromId = e.dataTransfer.getData('text/plain')
        if (fromId && fromId !== grupo.id) onDropReorder(fromId, grupo.id)
      }}
    >
      <div className="bib-grupo-title-row bib-grupo-title-row--open">
        <span className="bib-grupo-drag" title="Reordenar grupo">⠿</span>
        <div className="detalle-servicio-orden-actions">
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Subir">▲</button>
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Bajar">▼</button>
        </div>
        <input
          className="bib-grupo-name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={() => { if (nombre.trim() && nombre !== grupo.nombre) updateGrupoMut.mutate() }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <button
          type="button"
          className="btn-danger btn-sm px-2 py-0.5 text-xs flex-shrink-0"
          onClick={() => { if (confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) deleteGrupoMut.mutate() }}
        >
          🗑 Grupo
        </button>
      </div>

      <div className="bib-grupo-body">
        {grupo.items.length === 0 && !showAddItem ? (
          <p className="text-xs text-muted text-center py-3">Sin ítems. Usa &quot;+ Ítem&quot; para agregar.</p>
        ) : (
          <table className="bib-items-table">
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>Servicio</th>
                <th>Tarifa</th>
                <th>Observación</th>
                {columnas.map((col) => <th key={col}>{col}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  columnas={columnas}
                  canMoveUp={index > 0}
                  canMoveDown={index < sortedItems.length - 1}
                  onMoveUp={() => reorderItemMut.mutate({ index, direction: -1 })}
                  onMoveDown={() => reorderItemMut.mutate({ index, direction: 1 })}
                  onDelete={() => deleteItemMut.mutate(item.id)}
                />
              ))}
            </tbody>
          </table>
        )}

        {showAddItem && (
          <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2 mt-2 mx-3 mb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-2xs text-muted block mb-0.5">Nombre</label>
                <input className="input w-full text-sm" placeholder="Descripción" value={newItem.nombre}
                  onChange={(e) => setNewItem((s) => ({ ...s, nombre: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="text-2xs text-muted block mb-0.5">Tarifa</label>
                <input className="input w-full text-sm font-mono" placeholder="$559.900" value={newItem.tarifa}
                  onChange={(e) => setNewItem((s) => ({ ...s, tarifa: e.target.value }))} />
              </div>
              <div>
                <label className="text-2xs text-muted block mb-0.5">Tipo</label>
                <select className="filter-select w-full text-sm" value={newItem.tipoTarifa}
                  onChange={(e) => setNewItem((s) => ({ ...s, tipoTarifa: e.target.value }))}>
                  {TIPO_TARIFA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-2xs text-muted block mb-0.5">Obs.</label>
                <input className="input w-full text-sm" placeholder="Opcional" value={newItem.obs}
                  onChange={(e) => setNewItem((s) => ({ ...s, obs: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setShowAddItem(false)}>Cancelar</button>
              <button type="button" className="btn-primary btn-sm text-xs"
                disabled={!newItem.nombre || !newItem.tarifa || addItemMut.isPending}
                onClick={() => addItemMut.mutate()}>
                {addItemMut.isPending ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn-secondary btn-sm text-xs bib-grupo-add-item"
          onClick={() => setShowAddItem(true)}
        >
          + Ítem
        </button>
      </div>
    </div>
  )
}

// ─── Columnas section ─────────────────────────────────────────────────────────

function ColumnasSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const [nueva, setNueva] = useState('')

  const saveMut = useMutation({
    mutationFn: (cols: string[]) => updateLinea(linea.id, { columnas: cols }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al guardar columnas'),
  })

  const cols: string[] = (linea.columnas as string[]) ?? []

  function addCol() {
    const trimmed = nueva.trim()
    if (!trimmed || cols.includes(trimmed)) return
    saveMut.mutate([...cols, trimmed])
    setNueva('')
  }

  function removeCol(col: string) {
    saveMut.mutate(cols.filter((c) => c !== col))
  }

  return (
    <div className="bib-columnas-panel">
      <div className="bib-columnas-panel-title">🗂 Columnas de la tabla en cotización</div>
      <p className="text-xs text-muted mb-2">
        Columnas por defecto: <strong>Servicio</strong>, <strong>Tarifa</strong>, <strong>Observaciones</strong>.
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        {cols.length === 0 && (
          <span className="text-xs text-muted">Sin columnas extra.</span>
        )}
        {cols.map((col) => (
          <div key={col} className="flex items-center gap-1 bg-surface2 rounded-lg px-2 py-1">
            <span className="text-xs font-semibold text-foreground">{col}</span>
            <button
              type="button"
              className="text-muted hover:text-danger text-xs leading-none ml-1"
              onClick={() => removeCol(col)}
              title="Eliminar columna"
            >×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input
          className="input text-sm max-w-xs"
          placeholder="Nombre de la columna (ej: Mínimo)"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCol()}
        />
        <button
          type="button"
          className="btn-secondary btn-sm text-xs"
          disabled={!nueva.trim() || saveMut.isPending}
          onClick={addCol}
        >
          + Columna extra
        </button>
      </div>
    </div>
  )
}

// ─── Observaciones section ────────────────────────────────────────────────────

function ObsCard({ obs, onDelete }: { obs: BibliotecaObs; onDelete: () => void }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(obs.nombre)
  const [html, setHtml] = useState(obs.html)

  const saveMut = useMutation({
    mutationFn: () => updateObs(obs.id, { nombre, html }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); setEditing(false) },
    onError: () => toast.error('Error al guardar'),
  })

  if (!editing) {
    return (
      <div className="rounded-lg border border-border p-3 group">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-foreground">{obs.nombre}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="btn-ghost btn-sm px-1.5 py-0.5 text-xs" onClick={() => setEditing(true)}>✏️</button>
            <button className="btn-danger btn-sm px-1.5 py-0.5 text-xs" onClick={onDelete}>×</button>
          </div>
        </div>
        <div
          className="text-xs text-muted leading-relaxed line-clamp-3"
          dangerouslySetInnerHTML={{ __html: obs.html }}
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
      <div>
        <label className="text-2xs text-muted block mb-0.5">Nombre / Título</label>
        <input className="input w-full text-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div>
        <label className="text-2xs text-muted block mb-0.5">Contenido (HTML o texto)</label>
        <textarea
          className="input w-full text-sm font-mono min-h-24 resize-y"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm text-xs" onClick={() => setEditing(false)}>Cancelar</button>
        <button className="btn-primary btn-sm text-xs" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function ObsSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [newHtml, setNewHtml] = useState('')

  const addMut = useMutation({
    mutationFn: () => createObs(linea.id, { nombre: newNombre, html: newHtml }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setAdding(false); setNewNombre(''); setNewHtml('')
      toast.success('Observación agregada')
    },
    onError: () => toast.error('Error al agregar'),
  })

  const delMut = useMutation({
    mutationFn: deleteObs,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const obs: BibliotecaObs[] = linea.obs ?? []

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-accent uppercase tracking-widest">📝 Observaciones de cotización</span>
        <button className="btn-ghost btn-sm text-xs" onClick={() => setAdding(true)}>+ Nueva</button>
      </div>

      {obs.length === 0 && !adding && (
        <p className="text-xs text-muted">Sin observaciones. Se mostrarán al pie de la cotización en PDF.</p>
      )}

      <div className="space-y-2">
        {obs.map((o) => (
          <ObsCard key={o.id} obs={o} onDelete={() => delMut.mutate(o.id)} />
        ))}
      </div>

      {adding && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
          <div>
            <label className="text-2xs text-muted block mb-0.5">Nombre / Título *</label>
            <input className="input w-full text-sm" placeholder="Ej: Notas generales" value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-2xs text-muted block mb-0.5">Contenido (HTML o texto)</label>
            <textarea
              className="input w-full text-sm font-mono min-h-20 resize-y"
              placeholder="Ej: <p>Tarifas sujetas a cambio sin previo aviso.</p>"
              value={newHtml}
              onChange={(e) => setNewHtml(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn-sm text-xs" onClick={() => { setAdding(false); setNewNombre(''); setNewHtml('') }}>Cancelar</button>
            <button className="btn-primary btn-sm text-xs"
              disabled={!newNombre.trim() || addMut.isPending}
              onClick={() => addMut.mutate()}>
              {addMut.isPending ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Linea section ─────────────────────────────────────────────────────────────

function LineaSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [showAddGrupo, setShowAddGrupo] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState('')

  const sortedGrupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)

  const reorderGrupoMut = useMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= sortedGrupos.length) return
      const ids = sortedGrupos.map((g) => g.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateGrupo(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  const dropReorderGrupoMut = useMutation({
    mutationFn: async ({ fromId, toId }: { fromId: string; toId: string }) => {
      const ids = sortedGrupos.map((g) => g.id)
      const fromIdx = ids.indexOf(fromId)
      const toIdx = ids.indexOf(toId)
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return
      const [moved] = ids.splice(fromIdx, 1)
      ids.splice(toIdx, 0, moved)
      await persistOrden(ids, (id, orden) => updateGrupo(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  const deleteLineaMut = useMutation({
    mutationFn: () => deleteLinea(linea.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addGrupoMut = useMutation({
    mutationFn: () => createGrupo(linea.id, { nombre: nuevoGrupo, orden: sortedGrupos.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddGrupo(false)
      setNuevoGrupo('')
      toast.success('Grupo agregado')
    },
    onError: () => toast.error('Error al agregar grupo'),
  })

  const totalItems = linea.grupos.reduce((s, g) => s + g.items.length, 0)

  return (
    <div className="bib-linea-card">
      <div
        className={`bib-linea-header${expanded ? ' bib-linea-header--open' : ''}`}
        onClick={() => setExpanded((x) => !x)}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((x) => !x)}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0">📋</span>
          <div className="min-w-0">
            <div className="font-condensed text-base font-bold tracking-wide text-accent truncate">{linea.nombre}</div>
            <div className="text-xs text-muted">{sortedGrupos.length} grupos · {totalItems} ítems</div>
          </div>
        </div>
        <span className="text-muted text-lg flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="bib-linea-body space-y-4" onClick={(e) => e.stopPropagation()}>
          <ColumnasSection linea={linea} />

          {sortedGrupos.length === 0 && !showAddGrupo && (
            <p className="text-sm text-muted text-center py-4">Sin grupos. Crea el primero con &quot;+ Nuevo grupo&quot;.</p>
          )}
          {sortedGrupos.map((grupo, index) => (
            <GrupoSection
              key={grupo.id}
              grupo={grupo}
              columnas={linea.columnas ?? []}
              canMoveUp={index > 0}
              canMoveDown={index < sortedGrupos.length - 1}
              onMoveUp={() => reorderGrupoMut.mutate({ index, direction: -1 })}
              onMoveDown={() => reorderGrupoMut.mutate({ index, direction: 1 })}
              onDropReorder={(fromId, toId) => dropReorderGrupoMut.mutate({ fromId, toId })}
            />
          ))}

          {showAddGrupo ? (
            <div className="flex gap-2 items-center p-3 rounded-lg border border-accent/30 bg-accent/5">
              <input className="input flex-1 text-sm" placeholder="Nombre del grupo" value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)} autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nuevoGrupo && addGrupoMut.mutate()} />
              <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setShowAddGrupo(false)}>Cancelar</button>
              <button type="button" className="btn-primary btn-sm text-xs"
                disabled={!nuevoGrupo || addGrupoMut.isPending}
                onClick={() => addGrupoMut.mutate()}>
                Agregar
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setShowAddGrupo(true)}>
                + Nuevo grupo
              </button>
              <button type="button" className="btn-danger btn-sm text-xs"
                onClick={() => { if (confirm(`¿Eliminar línea "${linea.nombre}" con todos sus grupos e items?`)) deleteLineaMut.mutate() }}>
                Eliminar línea
              </button>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <ObsSection linea={linea} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function Biblioteca() {
  const qc = useQueryClient()
  const [showAddLinea, setShowAddLinea] = useState(false)
  const [nuevaLinea, setNuevaLinea] = useState('')

  const { data: lineas = [], isLoading } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBiblioteca,
  })

  const addLineaMut = useMutation({
    mutationFn: () => createLinea({ nombre: nuevaLinea }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddLinea(false)
      setNuevaLinea('')
      toast.success('Línea creada')
    },
    onError: () => toast.error('Error al crear línea'),
  })

  const totalGrupos = lineas.reduce((s, l) => s + l.grupos.length, 0)
  const totalItems  = lineas.reduce((s, l) => s + l.grupos.reduce((sg, g) => sg + g.items.length, 0), 0)

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Biblioteca de Tarifas</h2>
          <p className="text-sm text-muted mt-1">
            Catálogo de líneas, grupos e ítems usado en el paso <strong>Servicios</strong> al crear cotizaciones.
          </p>
          <p className="text-sm text-muted mt-0.5">
            {lineas.length} líneas · {totalGrupos} grupos · {totalItems} items
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowAddLinea(true)}>
          + Nueva línea
        </button>
      </div>

      {/* Formulario nueva línea */}
      {showAddLinea && (
        <div className="card p-4 flex gap-3 items-center border border-accent/30">
          <input
            className="input flex-1"
            placeholder="Nombre de la línea (ej: Zona Franca)"
            value={nuevaLinea}
            onChange={(e) => setNuevaLinea(e.target.value)}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && nuevaLinea && addLineaMut.mutate()}
          />
          <button className="btn-secondary btn-sm" onClick={() => setShowAddLinea(false)}>Cancelar</button>
          <button
            className="btn-primary btn-sm"
            disabled={!nuevaLinea.trim() || addLineaMut.isPending}
            onClick={() => addLineaMut.mutate()}
          >
            {addLineaMut.isPending ? 'Creando...' : 'Crear línea'}
          </button>
        </div>
      )}

      {/* Contenido */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-32 animate-pulse bg-surface2" />
          ))}
        </div>
      ) : lineas.length === 0 ? (
        <div className="empty-state">
          <div className="text-5xl mb-4">⚙️</div>
          <p className="font-semibold text-foreground mb-1">Biblioteca vacía</p>
          <p className="text-sm mb-4">Crea la primera línea de servicios con sus tarifas.</p>
          <button className="btn-primary btn-sm" onClick={() => setShowAddLinea(true)}>
            + Nueva línea
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {lineas.map((linea) => (
            <LineaSection key={linea.id} linea={linea} />
          ))}
        </div>
      )}
    </div>
  )
}
