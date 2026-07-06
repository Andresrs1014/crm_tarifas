import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import {
  getBiblioteca, createLinea, updateLinea, deleteLinea,
  createGrupo, updateGrupo, deleteGrupo,
  createItem, updateItem, deleteItem,
  createObs, updateObs, deleteObs,
} from '../api/biblioteca'
import { toast } from '../store/toastStore'
import type { BibliotecaLinea, BibliotecaGrupo, BibliotecaItem, BibliotecaObs } from '../types'
import { TIPO_TARIFA_OPTIONS } from '../constants'
import { TableScrollArea } from '../components/ui/DataListPanel'
import {
  TRANSP_SCHEMA, PAQUETEO_SCHEMA,
  PAQUETEO_GRUPOS_COORD, PAQUETEO_GRUPOS_TCC, PAQUETEO_GRUPOS_SERVIENTREGA,
  PAQUETEO_PAQUETEADORAS,
  type BibSchemaCol, type PaqueteoTab,
} from '../lib/htmlV6/constants'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COL_DEFAULTS: [string, string, string] = ['Servicio', 'Tarifa', 'Observación']

function encodeGrupoNombre(tipo: string, display: string) { return `${tipo}|${display}` }
function parseGrupoNombre(nombre: string) {
  const idx = nombre.indexOf('|')
  return idx < 0 ? { tipo: '', display: nombre } : { tipo: nombre.slice(0, idx), display: nombre.slice(idx + 1) }
}
function isTransporteLine(nombre: string) { return nombre.toLowerCase().includes('transporte') }
function isPaqueteoLine(nombre: string) { return nombre.toLowerCase().includes('paqueteo') }

function parseColumnas(raw: string[]): { headers: [string, string, string]; extra: string[] } {
  const headers: [string, string, string] = [...COL_DEFAULTS] as [string, string, string]
  const extra: string[] = []
  for (const c of raw) {
    if (c.startsWith('__h1:')) headers[0] = c.slice(5)
    else if (c.startsWith('__h2:')) headers[1] = c.slice(5)
    else if (c.startsWith('__h3:')) headers[2] = c.slice(5)
    else extra.push(c)
  }
  return { headers, extra }
}

function encodeColumnas(headers: [string, string, string], extra: string[]): string[] {
  const out: string[] = []
  if (headers[0] !== COL_DEFAULTS[0]) out.push(`__h1:${headers[0]}`)
  if (headers[1] !== COL_DEFAULTS[1]) out.push(`__h2:${headers[1]}`)
  if (headers[2] !== COL_DEFAULTS[2]) out.push(`__h3:${headers[2]}`)
  return [...out, ...extra]
}

async function persistOrden(ids: string[], updateFn: (id: string, orden: number) => Promise<unknown>) {
  await Promise.all(ids.map((id, orden) => updateFn(id, orden)))
}

// ─── Schema cell ───────────────────────────────────────────────────────────────

function SchemaCell({
  col, value, toggleVal, onChange, onToggleChange,
}: {
  col: BibSchemaCol
  value: string
  toggleVal?: string
  onChange: (v: string) => void
  onToggleChange?: (v: string) => void
}) {
  const isMixta = col.tipo === 'tarifa-mixta' || col.tipo === 'mixta'
  const isTarifaTexto = col.tipo === 'tarifa-texto'

  if (isMixta || isTarifaTexto) {
    const current = toggleVal ?? 'moneda'
    const isMoneda = current !== 'porcentaje' && current !== 'texto'
    const toggleTo = isMixta ? (isMoneda ? 'porcentaje' : 'moneda') : (isMoneda ? 'texto' : 'moneda')
    const label = isMixta ? (isMoneda ? '$' : '%') : (isMoneda ? '$' : 'T')
    return (
      <div className="flex items-center gap-0.5">
        <button type="button" className="bib-toggle-btn" title="Cambiar tipo" onClick={() => onToggleChange?.(toggleTo)}>
          {label}
        </button>
        <input
          className="bib-cell-input bib-cell-input--tarifa"
          defaultValue={value}
          onBlur={(e) => onChange(e.target.value.trim())}
        />
      </div>
    )
  }

  return (
    <input
      className={`bib-cell-input${col.tipo !== 'texto' && col.tipo !== 'numero' ? ' bib-cell-input--tarifa' : ''}`}
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value.trim())}
    />
  )
}

// ─── Schema item row ──────────────────────────────────────────────────────────

function SchemaItemRow({
  item, cols, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDelete,
}: {
  item: BibliotecaItem
  cols: BibSchemaCol[]
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
}) {
  const qc = useQueryClient()

  function saveCampo(colId: string, value: string) {
    updateItem(item.id, { extraCols: { ...item.extraCols, [colId]: value } })
      .then(() => qc.invalidateQueries({ queryKey: ['biblioteca'] }))
      .catch(() => toast.error('Error al guardar'))
  }

  function saveToggle(colId: string, toggleVal: string) {
    updateItem(item.id, { extraCols: { ...item.extraCols, [`_tc_${colId}`]: toggleVal } })
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
      {cols.map((col) => (
        <td key={col.id}>
          <SchemaCell
            col={col}
            value={item.extraCols?.[col.id] ?? ''}
            toggleVal={item.extraCols?.[`_tc_${col.id}`]}
            onChange={(v) => saveCampo(col.id, v)}
            onToggleChange={(v) => saveToggle(col.id, v)}
          />
        </td>
      ))}
      <td style={{ width: 40, textAlign: 'center' }}>
        <button type="button" className="btn-ghost btn-sm px-1 py-0 text-xs" onClick={onDelete} title="Eliminar fila">✕</button>
      </td>
    </tr>
  )
}

// ─── Standard item row ─────────────────────────────────────────────────────────

function ItemRow({
  item, extraCols, headers, onDelete, canMoveUp, canMoveDown, onMoveUp, onMoveDown,
}: {
  item: BibliotecaItem
  extraCols: string[]
  headers: [string, string, string]
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
        <input className="bib-cell-input" defaultValue={item.nombre}
          onBlur={(e) => saveField('nombre', e.target.value.trim())} />
      </td>
      <td style={{ width: 150 }}>
        <div className="flex items-center gap-1">
          <select className="filter-select text-xs py-0.5" style={{ width: 44, minWidth: 44 }}
            defaultValue={item.tipoTarifa}
            onChange={(e) => saveField('tipoTarifa', e.target.value)}>
            {TIPO_TARIFA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.value === 'moneda' ? '$' : '%'}</option>
            ))}
          </select>
          <input className="bib-cell-input bib-cell-input--tarifa" defaultValue={item.tarifa}
            onBlur={(e) => saveField('tarifa', e.target.value.trim())} />
        </div>
      </td>
      <td>
        <input className="bib-cell-input bib-cell-input--muted" defaultValue={item.obs ?? ''} placeholder="—"
          onBlur={(e) => saveField('obs', e.target.value.trim())} />
      </td>
      {extraCols.map((col) => (
        <td key={col} className="text-xs text-muted">{item.extraCols?.[col] ?? ''}</td>
      ))}
      <td style={{ width: 40, textAlign: 'center' }}>
        <button type="button" className="btn-ghost btn-sm px-1 py-0 text-xs" onClick={onDelete} title="Eliminar">✕</button>
      </td>
    </tr>
  )
}

// ─── Standard grupo section ────────────────────────────────────────────────────

function GrupoSection({
  grupo, headers, extraCols, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDropReorder,
}: {
  grupo: BibliotecaGrupo
  headers: [string, string, string]
  extraCols: string[]
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDropReorder: (fromId: string, toId: string) => void
}) {
  const qc = useQueryClient()
  const [nombre, setNombre] = useState(grupo.nombre)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' })

  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)

  const updateGrupoMut = useAppMutation({
    mutationFn: () => updateGrupo(grupo.id, { nombre }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al guardar'),
  })

  const deleteGrupoMut = useAppMutation({
    mutationFn: () => deleteGrupo(grupo.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addItemMut = useAppMutation({
    mutationFn: () => createItem(grupo.id, {
      nombre: newItem.nombre, tarifa: newItem.tarifa,
      tipoTarifa: newItem.tipoTarifa, obs: newItem.obs || undefined, orden: sortedItems.length,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddItem(false)
      setNewItem({ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' })
      toast.success('Item agregado')
    },
    onError: () => toast.error('Error al agregar'),
  })

  const deleteItemMut = useAppMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const reorderItemMut = useAppMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= sortedItems.length) return
      const ids = sortedItems.map((i) => i.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateItem(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  return (
    <div className="bib-grupo-row" draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', grupo.id); e.dataTransfer.effectAllowed = 'move' }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={(e) => { e.preventDefault(); const fid = e.dataTransfer.getData('text/plain'); if (fid && fid !== grupo.id) onDropReorder(fid, grupo.id) }}>
      <div className="bib-grupo-title-row bib-grupo-title-row--open">
        <span className="bib-grupo-drag" title="Reordenar">⠿</span>
        <div className="detalle-servicio-orden-actions">
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Subir">▲</button>
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Bajar">▼</button>
        </div>
        <input className="bib-grupo-name" value={nombre} onChange={(e) => setNombre(e.target.value)}
          onBlur={() => { if (nombre.trim() && nombre !== grupo.nombre) updateGrupoMut.mutate() }}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <button type="button" className="btn-danger btn-sm px-2 py-0.5 text-xs flex-shrink-0"
          onClick={() => { if (confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) deleteGrupoMut.mutate() }}>
          🗑 Grupo
        </button>
      </div>

      <div className="bib-grupo-body">
        {(grupo.items.length > 0 || showAddItem) && (
          <TableScrollArea>
          <table className="bib-items-table">
            <thead>
              <tr>
                <th style={{ width: 36 }} />
                <th>{headers[0]}</th>
                <th>{headers[1]}</th>
                <th>{headers[2]}</th>
                {extraCols.map((col) => <th key={col}>{col}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => (
                <ItemRow key={item.id} item={item} extraCols={extraCols} headers={headers}
                  canMoveUp={index > 0} canMoveDown={index < sortedItems.length - 1}
                  onMoveUp={() => reorderItemMut.mutate({ index, direction: -1 })}
                  onMoveDown={() => reorderItemMut.mutate({ index, direction: 1 })}
                  onDelete={() => deleteItemMut.mutate(item.id)} />
              ))}
            </tbody>
          </table>
          </TableScrollArea>
        )}
        {grupo.items.length === 0 && !showAddItem && (
          <p className="text-xs text-muted text-center py-3">Sin ítems. Usa &quot;+ Ítem&quot; para agregar.</p>
        )}

        {showAddItem && (
          <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2 mt-2 mx-3 mb-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-2xs text-muted block mb-0.5">Nombre</label>
                <input className="input w-full text-sm" placeholder="Descripción" value={newItem.nombre} autoFocus
                  onChange={(e) => setNewItem((s) => ({ ...s, nombre: e.target.value }))} />
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
        <button type="button" className="btn-secondary btn-sm text-xs bib-grupo-add-item" onClick={() => setShowAddItem(true)}>
          + Ítem
        </button>
      </div>
    </div>
  )
}

// ─── ColumnasSection (BIB-08) ─────────────────────────────────────────────────

function ColumnasSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const raw: string[] = (linea.columnas as string[]) ?? []
  const parsed = parseColumnas(raw)
  const [headers, setHeaders] = useState<[string, string, string]>(parsed.headers)
  const [nueva, setNueva] = useState('')

  const extra = parsed.extra

  const saveMut = useAppMutation({
    mutationFn: (cols: string[]) => updateLinea(linea.id, { columnas: cols }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al guardar columnas'),
  })

  function saveHeader(idx: 0 | 1 | 2, value: string) {
    const trimmed = value.trim() || COL_DEFAULTS[idx]
    const next: [string, string, string] = [...headers] as [string, string, string]
    next[idx] = trimmed
    setHeaders(next)
    saveMut.mutate(encodeColumnas(next, extra))
  }

  function addCol() {
    const trimmed = nueva.trim()
    if (!trimmed || extra.includes(trimmed)) return
    saveMut.mutate(encodeColumnas(headers, [...extra, trimmed]))
    setNueva('')
  }

  function removeCol(col: string) {
    saveMut.mutate(encodeColumnas(headers, extra.filter((c) => c !== col)))
  }

  return (
    <div className="bib-columnas-panel">
      <div className="bib-columnas-panel-title">🗂 Columnas de la tabla en cotización</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {(['col1', 'col2', 'col3'] as const).map((k, i) => (
          <div key={k}>
            <label className="text-2xs text-muted block mb-0.5">{k} · por defecto: {COL_DEFAULTS[i]}</label>
            <input
              className="input w-full text-sm"
              value={headers[i]}
              onChange={(e) => setHeaders((prev) => { const n = [...prev] as [string, string, string]; n[i] = e.target.value; return n })}
              onBlur={(e) => saveHeader(i as 0 | 1 | 2, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {extra.length === 0 && <span className="text-xs text-muted">Sin columnas extra.</span>}
        {extra.map((col) => (
          <div key={col} className="flex items-center gap-1 bg-surface2 rounded-lg px-2 py-1">
            <span className="text-xs font-semibold text-foreground">{col}</span>
            <button type="button" className="text-muted hover:text-danger text-xs leading-none ml-1"
              onClick={() => removeCol(col)} title="Eliminar">×</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <input className="input text-sm max-w-xs" placeholder="Columna extra (ej: Mínimo)" value={nueva}
          onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCol()} />
        <button type="button" className="btn-secondary btn-sm text-xs"
          disabled={!nueva.trim() || saveMut.isPending} onClick={addCol}>
          + Columna extra
        </button>
      </div>
    </div>
  )
}

// ─── Transporte grupo ──────────────────────────────────────────────────────────

function GrupoTransporteSection({
  grupo, canMoveUp, canMoveDown, onMoveUp, onMoveDown, onDropReorder,
}: {
  grupo: BibliotecaGrupo
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDropReorder: (fromId: string, toId: string) => void
}) {
  const qc = useQueryClient()
  const { tipo } = parseGrupoNombre(grupo.nombre)
  const schema = TRANSP_SCHEMA[tipo as keyof typeof TRANSP_SCHEMA] ?? TRANSP_SCHEMA.local
  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)
  const badge = tipo === 'local' ? '🚛' : '📦'

  const deleteGrupoMut = useAppMutation({
    mutationFn: () => deleteGrupo(grupo.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addFilaMut = useAppMutation({
    mutationFn: () => createItem(grupo.id, { nombre: 'fila', tarifa: '', orden: sortedItems.length }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al agregar fila'),
  })

  const deleteItemMut = useAppMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const reorderItemMut = useAppMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= sortedItems.length) return
      const ids = sortedItems.map((i) => i.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateItem(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  return (
    <div className="bib-grupo-row" draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', grupo.id); e.dataTransfer.effectAllowed = 'move' }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
      onDrop={(e) => { e.preventDefault(); const fid = e.dataTransfer.getData('text/plain'); if (fid && fid !== grupo.id) onDropReorder(fid, grupo.id) }}>
      <div className="bib-grupo-title-row bib-grupo-title-row--open">
        <span className="bib-grupo-drag" title="Reordenar">⠿</span>
        <div className="detalle-servicio-orden-actions">
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Subir">▲</button>
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Bajar">▼</button>
        </div>
        <span className="bib-grupo-badge">{badge} {schema.label}</span>
        <button type="button" className="btn-danger btn-sm px-2 py-0.5 text-xs flex-shrink-0"
          onClick={() => { if (confirm(`¿Eliminar grupo "${schema.label}"?`)) deleteGrupoMut.mutate() }}>
          🗑 Grupo
        </button>
      </div>
      <div className="bib-grupo-body">
        <TableScrollArea>
        <table className="bib-items-table">
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              {schema.cols.map((c) => <th key={c.id}>{c.nombre}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, index) => (
              <SchemaItemRow key={item.id} item={item} cols={schema.cols}
                canMoveUp={index > 0} canMoveDown={index < sortedItems.length - 1}
                onMoveUp={() => reorderItemMut.mutate({ index, direction: -1 })}
                onMoveDown={() => reorderItemMut.mutate({ index, direction: 1 })}
                onDelete={() => deleteItemMut.mutate(item.id)} />
            ))}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={schema.cols.length + 2} className="text-xs text-muted text-center py-3">
                  Sin filas. Usa &quot;+ Fila&quot; para agregar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </TableScrollArea>
        <button type="button" className="btn-secondary btn-sm text-xs bib-grupo-add-item"
          onClick={() => addFilaMut.mutate()}>
          + Fila
        </button>
      </div>
    </div>
  )
}

// ─── Transporte section ────────────────────────────────────────────────────────

function BibTransporteSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const sortedGrupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)

  const addGrupoMut = useAppMutation({
    mutationFn: (tipo: keyof typeof TRANSP_SCHEMA) =>
      createGrupo(linea.id, { nombre: encodeGrupoNombre(tipo, TRANSP_SCHEMA[tipo].label), orden: sortedGrupos.length }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); toast.success('Grupo agregado') },
    onError: () => toast.error('Error al agregar grupo'),
  })

  const reorderGrupoMut = useAppMutation({
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

  const dropReorderGrupoMut = useAppMutation({
    mutationFn: async ({ fromId, toId }: { fromId: string; toId: string }) => {
      const ids = sortedGrupos.map((g) => g.id)
      const fi = ids.indexOf(fromId); const ti = ids.indexOf(toId)
      if (fi < 0 || ti < 0 || fi === ti) return
      const [moved] = ids.splice(fi, 1)
      ids.splice(ti, 0, moved)
      await persistOrden(ids, (id, orden) => updateGrupo(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  return (
    <div className="space-y-4">
      {sortedGrupos.map((grupo, index) => (
        <GrupoTransporteSection key={grupo.id} grupo={grupo}
          canMoveUp={index > 0} canMoveDown={index < sortedGrupos.length - 1}
          onMoveUp={() => reorderGrupoMut.mutate({ index, direction: -1 })}
          onMoveDown={() => reorderGrupoMut.mutate({ index, direction: 1 })}
          onDropReorder={(fid, tid) => dropReorderGrupoMut.mutate({ fromId: fid, toId: tid })} />
      ))}
      {sortedGrupos.length === 0 && (
        <p className="text-sm text-muted text-center py-4">Sin grupos. Crea uno con los botones.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary btn-sm text-xs"
          disabled={addGrupoMut.isPending} onClick={() => addGrupoMut.mutate('local')}>
          🚛 + Nuevo grupo Transporte Local
        </button>
        <button type="button" className="btn-secondary btn-sm text-xs"
          disabled={addGrupoMut.isPending} onClick={() => addGrupoMut.mutate('otros')}>
          📦 + Nuevo grupo Otros Servicios
        </button>
      </div>
    </div>
  )
}

// ─── Paqueteo table head ───────────────────────────────────────────────────────

function PaqueteoTableHead({ entry }: { entry: (typeof PAQUETEO_SCHEMA)[string] }) {
  if (!entry.colspanGroups) {
    return (
      <thead>
        <tr>
          <th style={{ width: 36 }} />
          {entry.cols.map((c) => <th key={c.id}>{c.nombre}</th>)}
          <th />
        </tr>
      </thead>
    )
  }

  const spanColIds = new Set(entry.colspanGroups.flatMap((g) => g.cols))
  const leadCols = entry.cols.filter((c) => !spanColIds.has(c.id))

  return (
    <thead>
      <tr>
        <th style={{ width: 36 }} rowSpan={2} />
        {leadCols.map((c) => <th key={c.id} rowSpan={2}>{c.nombre}</th>)}
        {entry.colspanGroups.map((g) => (
          <th key={g.label} colSpan={g.cols.length} className="text-center">{g.label}</th>
        ))}
        <th rowSpan={2} />
      </tr>
      <tr>
        {entry.colspanGroups.flatMap((g) =>
          g.cols.map((colId) => {
            const col = entry.cols.find((c) => c.id === colId)
            return <th key={colId}>{col?.nombre ?? colId}</th>
          })
        )}
      </tr>
    </thead>
  )
}

// ─── Paqueteo grupo ────────────────────────────────────────────────────────────

function GrupoPaqueteoSection({
  grupo, canMoveUp, canMoveDown, onMoveUp, onMoveDown,
}: {
  grupo: BibliotecaGrupo
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const qc = useQueryClient()
  const { tipo } = parseGrupoNombre(grupo.nombre)
  const entry = PAQUETEO_SCHEMA[tipo]
  if (!entry) return null

  const sortedItems = [...grupo.items].sort((a, b) => a.orden - b.orden)

  const addFilaMut = useAppMutation({
    mutationFn: () => createItem(grupo.id, { nombre: 'fila', tarifa: '', orden: sortedItems.length }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al agregar fila'),
  })

  const deleteItemMut = useAppMutation({
    mutationFn: deleteItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const reorderItemMut = useAppMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= sortedItems.length) return
      const ids = sortedItems.map((i) => i.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateItem(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  return (
    <div className="bib-grupo-row">
      <div className="bib-grupo-title-row bib-grupo-title-row--open">
        <div className="detalle-servicio-orden-actions">
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveUp} onClick={onMoveUp} title="Subir">▲</button>
          <button type="button" className="detalle-servicio-orden-btn" disabled={!canMoveDown} onClick={onMoveDown} title="Bajar">▼</button>
        </div>
        <span className="bib-grupo-badge">{entry.label}</span>
      </div>
      <div className="bib-grupo-body">
        <TableScrollArea>
        <table className="bib-items-table">
          <PaqueteoTableHead entry={entry} />
          <tbody>
            {sortedItems.map((item, index) => (
              <SchemaItemRow key={item.id} item={item} cols={entry.cols}
                canMoveUp={index > 0} canMoveDown={index < sortedItems.length - 1}
                onMoveUp={() => reorderItemMut.mutate({ index, direction: -1 })}
                onMoveDown={() => reorderItemMut.mutate({ index, direction: 1 })}
                onDelete={() => deleteItemMut.mutate(item.id)} />
            ))}
            {sortedItems.length === 0 && (
              <tr>
                <td colSpan={entry.cols.length + 2} className="text-xs text-muted text-center py-3">
                  Sin filas. Usa &quot;+ Fila&quot; para agregar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </TableScrollArea>
        <button type="button" className="btn-secondary btn-sm text-xs bib-grupo-add-item"
          onClick={() => addFilaMut.mutate()}>
          + Fila
        </button>
      </div>
    </div>
  )
}

// ─── Paqueteo section (tabs) ──────────────────────────────────────────────────

const PAQUETEO_TAB_GRUPOS: Record<PaqueteoTab, readonly string[]> = {
  COORDINADORA: PAQUETEO_GRUPOS_COORD,
  TCC: PAQUETEO_GRUPOS_TCC,
  SERVIENTREGA: PAQUETEO_GRUPOS_SERVIENTREGA,
}

function BibPaqueteoSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState<PaqueteoTab>('COORDINADORA')

  const allGrupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)
  const tiposPresentes = new Set(allGrupos.map((g) => parseGrupoNombre(g.nombre).tipo))
  const tabGrupos = allGrupos.filter((g) =>
    (PAQUETEO_TAB_GRUPOS[tab] as readonly string[]).includes(parseGrupoNombre(g.nombre).tipo)
  )

  const seedMut = useAppMutation({
    mutationFn: async () => {
      const allTipos = [...PAQUETEO_GRUPOS_COORD, ...PAQUETEO_GRUPOS_TCC, ...PAQUETEO_GRUPOS_SERVIENTREGA]
      let orden = allGrupos.length
      for (const tipo of allTipos) {
        if (!tiposPresentes.has(tipo)) {
          await createGrupo(linea.id, { nombre: encodeGrupoNombre(tipo, PAQUETEO_SCHEMA[tipo].label), orden: orden++ })
        }
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); toast.success('Grupos inicializados') },
    onError: () => toast.error('Error al inicializar'),
  })

  const reorderGrupoMut = useAppMutation({
    mutationFn: async ({ index, direction }: { index: number; direction: -1 | 1 }) => {
      const j = index + direction
      if (j < 0 || j >= tabGrupos.length) return
      const ids = tabGrupos.map((g) => g.id)
      const [moved] = ids.splice(index, 1)
      ids.splice(j, 0, moved)
      await persistOrden(ids, (id, orden) => updateGrupo(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  if (allGrupos.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted mb-3">Sin grupos. Inicializa los 13 grupos estándar.</p>
        <button type="button" className="btn-primary btn-sm"
          disabled={seedMut.isPending} onClick={() => seedMut.mutate()}>
          {seedMut.isPending ? 'Inicializando...' : '⚡ Inicializar grupos de Paqueteo'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-0 mb-4 border-b border-border">
        {PAQUETEO_PAQUETEADORAS.map((t) => (
          <button key={t} type="button"
            className={`bib-tab-btn${tab === t ? ' bib-tab-btn--active' : ''}`}
            onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {tabGrupos.map((grupo, index) => (
          <GrupoPaqueteoSection key={grupo.id} grupo={grupo}
            canMoveUp={index > 0} canMoveDown={index < tabGrupos.length - 1}
            onMoveUp={() => reorderGrupoMut.mutate({ index, direction: -1 })}
            onMoveDown={() => reorderGrupoMut.mutate({ index, direction: 1 })} />
        ))}
        {tabGrupos.length === 0 && (
          <p className="text-xs text-muted text-center py-4">Sin grupos para {tab}.</p>
        )}
      </div>
    </div>
  )
}

// ─── Observaciones ─────────────────────────────────────────────────────────────

function ObsCard({ obs, onDelete }: { obs: BibliotecaObs; onDelete: () => void }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(obs.nombre)
  const [html, setHtml] = useState(obs.html)

  const saveMut = useAppMutation({
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
        <div className="text-xs text-muted leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: obs.html }} />
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
        <textarea className="input w-full text-sm font-mono min-h-24 resize-y" value={html}
          onChange={(e) => setHtml(e.target.value)} />
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

  const addMut = useAppMutation({
    mutationFn: () => createObs(linea.id, { nombre: newNombre, html: newHtml }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setAdding(false); setNewNombre(''); setNewHtml('')
      toast.success('Observación agregada')
    },
    onError: () => toast.error('Error al agregar'),
  })

  const delMut = useAppMutation({
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
            <textarea className="input w-full text-sm font-mono min-h-20 resize-y"
              placeholder="<p>Tarifas sujetas a cambio sin previo aviso.</p>"
              value={newHtml} onChange={(e) => setNewHtml(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="btn-secondary btn-sm text-xs"
              onClick={() => { setAdding(false); setNewNombre(''); setNewHtml('') }}>Cancelar</button>
            <button className="btn-primary btn-sm text-xs"
              disabled={!newNombre.trim() || addMut.isPending} onClick={() => addMut.mutate()}>
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

  const isTransporte = isTransporteLine(linea.nombre)
  const isPaqueteo = isPaqueteoLine(linea.nombre)
  const isStandard = !isTransporte && !isPaqueteo
  const icon = isTransporte ? '🚛' : isPaqueteo ? '📦' : '📋'

  const raw: string[] = (linea.columnas as string[]) ?? []
  const { headers, extra: extraCols } = parseColumnas(raw)
  const sortedGrupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)
  const totalItems = linea.grupos.reduce((s, g) => s + g.items.length, 0)

  const deleteLineaMut = useAppMutation({
    mutationFn: () => deleteLinea(linea.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addGrupoMut = useAppMutation({
    mutationFn: () => createGrupo(linea.id, { nombre: nuevoGrupo, orden: sortedGrupos.length }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddGrupo(false); setNuevoGrupo('')
      toast.success('Grupo agregado')
    },
    onError: () => toast.error('Error al agregar grupo'),
  })

  const reorderGrupoMut = useAppMutation({
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

  const dropReorderGrupoMut = useAppMutation({
    mutationFn: async ({ fromId, toId }: { fromId: string; toId: string }) => {
      const ids = sortedGrupos.map((g) => g.id)
      const fi = ids.indexOf(fromId); const ti = ids.indexOf(toId)
      if (fi < 0 || ti < 0 || fi === ti) return
      const [moved] = ids.splice(fi, 1)
      ids.splice(ti, 0, moved)
      await persistOrden(ids, (id, orden) => updateGrupo(id, { orden }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al reordenar'),
  })

  return (
    <div className="bib-linea-card">
      <div className={`bib-linea-header${expanded ? ' bib-linea-header--open' : ''}`}
        onClick={() => setExpanded((x) => !x)}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((x) => !x)}
        role="button" tabIndex={0}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="font-condensed text-base font-bold tracking-wide text-accent truncate">{linea.nombre}</div>
            <div className="text-xs text-muted">{sortedGrupos.length} grupos · {totalItems} ítems</div>
          </div>
        </div>
        <span className="text-muted text-lg flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="bib-linea-body space-y-4" onClick={(e) => e.stopPropagation()}>
          {isStandard && <ColumnasSection linea={linea} />}

          {isTransporte && <BibTransporteSection linea={linea} />}
          {isPaqueteo && <BibPaqueteoSection linea={linea} />}

          {isStandard && (
            <>
              {sortedGrupos.length === 0 && !showAddGrupo && (
                <p className="text-sm text-muted text-center py-4">Sin grupos. Crea el primero con &quot;+ Nuevo grupo&quot;.</p>
              )}
              {sortedGrupos.map((grupo, index) => (
                <GrupoSection key={grupo.id} grupo={grupo}
                  headers={headers} extraCols={extraCols}
                  canMoveUp={index > 0} canMoveDown={index < sortedGrupos.length - 1}
                  onMoveUp={() => reorderGrupoMut.mutate({ index, direction: -1 })}
                  onMoveDown={() => reorderGrupoMut.mutate({ index, direction: 1 })}
                  onDropReorder={(fid, tid) => dropReorderGrupoMut.mutate({ fromId: fid, toId: tid })} />
              ))}
              {showAddGrupo ? (
                <div className="flex gap-2 items-center p-3 rounded-lg border border-accent/30 bg-accent/5">
                  <input className="input flex-1 text-sm" placeholder="Nombre del grupo" value={nuevoGrupo} autoFocus
                    onChange={(e) => setNuevoGrupo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && nuevoGrupo && addGrupoMut.mutate()} />
                  <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setShowAddGrupo(false)}>Cancelar</button>
                  <button type="button" className="btn-primary btn-sm text-xs"
                    disabled={!nuevoGrupo || addGrupoMut.isPending} onClick={() => addGrupoMut.mutate()}>
                    Agregar
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-secondary btn-sm text-xs" onClick={() => setShowAddGrupo(true)}>+ Nuevo grupo</button>
                  <button type="button" className="btn-danger btn-sm text-xs"
                    onClick={() => { if (confirm(`¿Eliminar línea "${linea.nombre}" con todos sus grupos e ítems?`)) deleteLineaMut.mutate() }}>
                    Eliminar línea
                  </button>
                </div>
              )}
            </>
          )}

          {!isStandard && (
            <div className="flex justify-end pt-2">
              <button type="button" className="btn-danger btn-sm text-xs"
                onClick={() => { if (confirm(`¿Eliminar línea "${linea.nombre}"?`)) deleteLineaMut.mutate() }}>
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

  const addLineaMut = useAppMutation({
    mutationFn: () => createLinea({ nombre: nuevaLinea }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['biblioteca'] })
      setShowAddLinea(false); setNuevaLinea('')
      toast.success('Línea creada')
    },
    onError: () => toast.error('Error al crear línea'),
  })

  const totalGrupos = lineas.reduce((s, l) => s + l.grupos.length, 0)
  const totalItems  = lineas.reduce((s, l) => s + l.grupos.reduce((sg, g) => sg + g.items.length, 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Biblioteca de Tarifas</h2>
          <p className="text-sm text-muted mt-1">
            Catálogo de líneas, grupos e ítems usado en el paso <strong>Servicios</strong> al crear cotizaciones.
          </p>
          <p className="text-sm text-muted mt-0.5">{lineas.length} líneas · {totalGrupos} grupos · {totalItems} ítems</p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowAddLinea(true)}>+ Nueva línea</button>
      </div>

      {showAddLinea && (
        <div className="card p-4 flex gap-3 items-center border border-accent/30">
          <input className="input flex-1" placeholder="Nombre de la línea (ej: Zona Franca)" value={nuevaLinea} autoFocus
            onChange={(e) => setNuevaLinea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && nuevaLinea && addLineaMut.mutate()} />
          <button className="btn-secondary btn-sm" onClick={() => setShowAddLinea(false)}>Cancelar</button>
          <button className="btn-primary btn-sm" disabled={!nuevaLinea.trim() || addLineaMut.isPending}
            onClick={() => addLineaMut.mutate()}>
            {addLineaMut.isPending ? 'Creando...' : 'Crear línea'}
          </button>
        </div>
      )}

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
          <button className="btn-primary btn-sm" onClick={() => setShowAddLinea(true)}>+ Nueva línea</button>
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
