import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBiblioteca,
  createLinea, updateLinea, deleteLinea,
  createGrupo, updateGrupo, deleteGrupo,
  createItem, updateItem, deleteItem,
} from '../api/biblioteca'
import { toast } from '../store/toastStore'
import type { BibliotecaLinea, BibliotecaGrupo, BibliotecaItem } from '../types'

// ─── Item inline editor ────────────────────────────────────────────────────────

function ItemRow({
  item, grupoId, columnas, onDelete,
}: {
  item: BibliotecaItem
  grupoId: string
  columnas: string[]
  onDelete: () => void
}) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(item.nombre)
  const [tarifa, setTarifa] = useState(item.tarifa)
  const [obs, setObs] = useState(item.obs ?? '')
  const [tipoTarifa, setTipoTarifa] = useState(item.tipoTarifa)

  const saveMut = useMutation({
    mutationFn: () => updateItem(item.id, { nombre, tarifa, obs: obs || undefined, tipoTarifa }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); setEditing(false) },
    onError: () => toast.error('Error al guardar'),
  })

  if (!editing) {
    return (
      <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-surface2 group transition-colors">
        <div className="flex-1 text-sm text-foreground">{item.nombre}</div>
        {columnas.map((col) => (
          <div key={col} className="text-xs text-muted w-20 text-right">{item.extraCols?.[col] ?? ''}</div>
        ))}
        <div className="w-24 text-right">
          <span className="text-sm font-mono font-semibold text-accent">{item.tarifa}</span>
          {item.tipoTarifa === 'porcentaje' && <span className="text-2xs text-muted ml-0.5">%</span>}
        </div>
        {item.obs && <span className="text-2xs text-muted max-w-28 truncate" title={item.obs}>{item.obs}</span>}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="btn-ghost btn-sm px-1.5 py-0.5 text-xs" onClick={() => setEditing(true)}>✏️</button>
          <button className="btn-danger btn-sm px-1.5 py-0.5 text-xs" onClick={onDelete}>×</button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>
          <label className="text-2xs text-muted block mb-0.5">Nombre</label>
          <input className="input w-full text-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>
        <div>
          <label className="text-2xs text-muted block mb-0.5">Tarifa</label>
          <input className="input w-full text-sm font-mono" value={tarifa} onChange={(e) => setTarifa(e.target.value)} />
        </div>
        <div>
          <label className="text-2xs text-muted block mb-0.5">Tipo</label>
          <select className="filter-select w-full text-sm" value={tipoTarifa}
            onChange={(e) => setTipoTarifa(e.target.value as 'moneda' | 'porcentaje')}>
            <option value="moneda">Moneda ($)</option>
            <option value="porcentaje">Porcentaje (%)</option>
          </select>
        </div>
        <div>
          <label className="text-2xs text-muted block mb-0.5">Obs.</label>
          <input className="input w-full text-sm" value={obs} onChange={(e) => setObs(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary btn-sm text-xs" onClick={() => setEditing(false)}>Cancelar</button>
        <button className="btn-primary btn-sm text-xs" disabled={saveMut.isPending}
          onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ─── Grupo ─────────────────────────────────────────────────────────────────────

function GrupoSection({
  grupo, lineaId, columnas,
}: {
  grupo: BibliotecaGrupo
  lineaId: string
  columnas: string[]
}) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nombre, setNombre] = useState(grupo.nombre)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' })

  const updateGrupoMut = useMutation({
    mutationFn: () => updateGrupo(grupo.id, { nombre }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); setEditingName(false) },
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

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header grupo */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface2">
        <button onClick={() => setExpanded((x) => !x)} className="text-muted hover:text-foreground">
          {expanded ? '▼' : '▶'}
        </button>
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input className="input flex-1 text-sm py-1" value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateGrupoMut.mutate()} />
            <button className="btn-primary btn-sm text-xs py-1" onClick={() => updateGrupoMut.mutate()}>OK</button>
            <button className="btn-secondary btn-sm text-xs py-1" onClick={() => setEditingName(false)}>✕</button>
          </div>
        ) : (
          <span
            className="flex-1 text-sm font-semibold text-foreground cursor-pointer hover:text-accent"
            onDoubleClick={() => setEditingName(true)}
            title="Doble clic para editar"
          >
            {grupo.nombre}
          </span>
        )}
        <span className="text-2xs text-muted">{grupo.items.length} items</span>
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm px-1.5 py-0.5 text-xs" onClick={() => { setShowAddItem(true); setExpanded(true) }}>
            + Item
          </button>
          <button className="btn-danger btn-sm px-1.5 py-0.5 text-xs"
            onClick={() => { if (confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) deleteGrupoMut.mutate() }}>
            ×
          </button>
        </div>
      </div>

      {/* Items */}
      {expanded && (
        <div className="p-3 space-y-1">
          {grupo.items.length === 0 && !showAddItem && (
            <p className="text-xs text-muted text-center py-2">Sin items. Haz clic en "+ Item" para agregar.</p>
          )}
          {grupo.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              grupoId={grupo.id}
              columnas={columnas}
              onDelete={() => deleteItemMut.mutate(item.id)}
            />
          ))}

          {/* Formulario nuevo item */}
          {showAddItem && (
            <div className="p-3 rounded-lg border border-accent/30 bg-accent/5 space-y-2 mt-2">
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
                    <option value="moneda">Moneda ($)</option>
                    <option value="porcentaje">Porcentaje (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs text-muted block mb-0.5">Obs.</label>
                  <input className="input w-full text-sm" placeholder="Opcional" value={newItem.obs}
                    onChange={(e) => setNewItem((s) => ({ ...s, obs: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary btn-sm text-xs" onClick={() => setShowAddItem(false)}>Cancelar</button>
                <button className="btn-primary btn-sm text-xs"
                  disabled={!newItem.nombre || !newItem.tarifa || addItemMut.isPending}
                  onClick={() => addItemMut.mutate()}>
                  {addItemMut.isPending ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Linea section ─────────────────────────────────────────────────────────────

function LineaSection({ linea }: { linea: BibliotecaLinea }) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nombre, setNombre] = useState(linea.nombre)
  const [showAddGrupo, setShowAddGrupo] = useState(false)
  const [nuevoGrupo, setNuevoGrupo] = useState('')

  const updateLineaMut = useMutation({
    mutationFn: () => updateLinea(linea.id, { nombre }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['biblioteca'] }); setEditingName(false) },
    onError: () => toast.error('Error al guardar'),
  })

  const deleteLineaMut = useMutation({
    mutationFn: () => deleteLinea(linea.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['biblioteca'] }),
    onError: () => toast.error('Error al eliminar'),
  })

  const addGrupoMut = useMutation({
    mutationFn: () => createGrupo(linea.id, { nombre: nuevoGrupo }),
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
    <div className="card overflow-hidden">
      {/* Header línea */}
      <div className="flex items-center gap-3 px-5 py-3 bg-accent/5 border-b border-border">
        <button onClick={() => setExpanded((x) => !x)} className="text-accent text-sm">
          {expanded ? '▼' : '▶'}
        </button>
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input className="input flex-1" value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && updateLineaMut.mutate()} />
            <button className="btn-primary btn-sm" onClick={() => updateLineaMut.mutate()}>OK</button>
            <button className="btn-secondary btn-sm" onClick={() => setEditingName(false)}>✕</button>
          </div>
        ) : (
          <span
            className="flex-1 text-base font-bold text-foreground cursor-pointer hover:text-accent"
            onDoubleClick={() => setEditingName(true)}
            title="Doble clic para editar nombre"
          >
            {linea.nombre}
          </span>
        )}
        <span className="text-xs text-muted">{linea.grupos.length} grupos · {totalItems} items</span>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm text-xs" onClick={() => { setShowAddGrupo(true); setExpanded(true) }}>
            + Grupo
          </button>
          <button className="btn-danger btn-sm text-xs"
            onClick={() => { if (confirm(`¿Eliminar línea "${linea.nombre}" con todos sus grupos e items?`)) deleteLineaMut.mutate() }}>
            Eliminar línea
          </button>
        </div>
      </div>

      {/* Grupos */}
      {expanded && (
        <div className="p-5 space-y-3">
          {showAddGrupo && (
            <div className="flex gap-2 items-center p-3 rounded-lg border border-accent/30 bg-accent/5">
              <input className="input flex-1 text-sm" placeholder="Nombre del grupo" value={nuevoGrupo}
                onChange={(e) => setNuevoGrupo(e.target.value)} autoFocus
                onKeyDown={(e) => e.key === 'Enter' && nuevoGrupo && addGrupoMut.mutate()} />
              <button className="btn-secondary btn-sm text-xs" onClick={() => setShowAddGrupo(false)}>Cancelar</button>
              <button className="btn-primary btn-sm text-xs"
                disabled={!nuevoGrupo || addGrupoMut.isPending}
                onClick={() => addGrupoMut.mutate()}>
                Agregar
              </button>
            </div>
          )}
          {linea.grupos.length === 0 && !showAddGrupo && (
            <p className="text-sm text-muted text-center py-4">Sin grupos. Crea el primero con "+ Grupo".</p>
          )}
          {linea.grupos.map((grupo) => (
            <GrupoSection key={grupo.id} grupo={grupo} lineaId={linea.id} columnas={linea.columnas ?? []} />
          ))}
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
          <h1 className="text-2xl font-bold text-foreground">Biblioteca de Tarifas</h1>
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
