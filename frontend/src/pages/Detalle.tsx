import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecord, updateRecord, deleteRecord } from '../api/records'
import { getCotizaciones } from '../api/cotizaciones'
import { createActividad, updateActividad, deleteActividad } from '../api/actividades'
import { toast } from '../store/toastStore'
import type { ActividadTipo, EstadoProspecto, EstadoCliente, TipoVisita, TipoFacturado } from '../types'
import { SERVICIOS } from '../types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPO_ACT_ICON: Record<ActividadTipo, string> = {
  llamada:     '📞',
  reunion:     '🤝',
  email:       '📧',
  visita:      '🏢',
  tarea:       '✅',
  seguimiento: '🔔',
}

const ESTADO_BADGE_P: Record<string, string> = {
  prospecto:            'badge-blue',
  reconocimiento:       'badge-purple',
  propuesta:            'badge-gold',
  aceptacion_propuesta: 'badge-green',
  creacion_sop:         'badge-gold',
  facturado:            'badge-green',
  frio:                 'badge-gray',
  perdido:              'badge-red',
}

const ESTADO_BADGE_C: Record<string, string> = {
  activo:     'badge-green',
  'en-riesgo': 'badge-red',
  inactivo:   'badge-gray',
}

const COT_BADGE: Record<string, string> = {
  borrador:    'badge-gray',
  enviada:     'badge-blue',
  negociacion: 'badge-gold',
  aprobada:    'badge-green',
  rechazada:   'badge-red',
}

function fmtEstado(value: string | undefined, map: { value: string; label: string }[]): string {
  if (!value) return '—'
  return map.find(e => e.value === value)?.label ?? value.replace(/_/g, ' ')
}

const ESTADOS_PROSPECTO: { value: string; label: string }[] = [
  { value: 'prospecto',            label: '🎯 Prospecto' },
  { value: 'reconocimiento',       label: '🏢 Visita' },
  { value: 'propuesta',            label: '📄 Propuesta Comercial' },
  { value: 'aceptacion_propuesta', label: '🤝 Aceptación Propuesta' },
  { value: 'creacion_sop',         label: '📋 Creación Ficha Cliente' },
  { value: 'facturado',            label: '💰 Facturado' },
  { value: 'frio',                 label: '🧊 Frío' },
  { value: 'perdido',              label: '❌ Perdido' },
]

const ESTADOS_CLIENTE: { value: string; label: string }[] = [
  { value: 'activo',     label: '✅ Activo' },
  { value: 'en-riesgo',  label: '⚠️ En Riesgo' },
  { value: 'inactivo',   label: '💤 Inactivo' },
]

const ESTADOS_COT: { value: string; label: string }[] = [
  { value: 'borrador',    label: 'Borrador' },
  { value: 'enviada',     label: 'Enviada' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'aprobada',    label: 'Aprobada' },
  { value: 'rechazada',   label: 'Rechazada' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

type Tab = 'info' | 'actividades' | 'cotizaciones'

// ─── Formulario actividad ──────────────────────────────────────────────────────

interface ActForm {
  tipo: ActividadTipo
  descripcion: string
  fecha: string
  hora: string
  lugar: string
}

const EMPTY_ACT: ActForm = {
  tipo: 'llamada',
  descripcion: '',
  fecha: new Date().toISOString().slice(0, 10),
  hora: '',
  lugar: '',
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function Detalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [tab, setTab] = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showActForm, setShowActForm] = useState(false)
  const [actForm, setActForm] = useState<ActForm>(EMPTY_ACT)
  const [editAct, setEditAct] = useState<string | null>(null)

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: record, isLoading } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getRecord(id!),
    enabled: !!id,
  })

  const { data: cotizaciones = [] } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => getCotizaciones(),
    select: (data) => data.filter((c) => c.recordId === id),
    enabled: tab === 'cotizaciones',
  })

  // ── Estado edición ───────────────────────────────────────────────────────────

  const [edit, setEdit] = useState({
    empresa: '',
    nit: '',
    ciudad: '',
    direccion: '',
    observaciones: '',
    proximoSeguimiento: '',
    estadoProspecto: '' as EstadoProspecto | '',
    estadoCliente: '' as EstadoCliente | '',
    visita: '' as TipoVisita | '',
    visitaCliente: '' as TipoVisita | '',
    facturado: '' as TipoFacturado | '',
    valor: '',
    ingresosEsperados: '',
    servicios: [] as string[],
  })

  function startEdit() {
    if (!record) return
    setEdit({
      empresa: record.empresa,
      nit: record.nit ?? '',
      ciudad: record.ciudad ?? '',
      direccion: record.direccion ?? '',
      observaciones: record.observaciones ?? '',
      proximoSeguimiento: record.proximoSeguimiento?.slice(0, 10) ?? '',
      estadoProspecto: record.estadoProspecto ?? '',
      estadoCliente: record.estadoCliente ?? '',
      visita: record.visita ?? '',
      visitaCliente: record.visitaCliente ?? '',
      facturado: record.facturado ?? '',
      valor: record.valor?.toString() ?? '',
      ingresosEsperados: record.ingresosEsperados?.toString() ?? '',
      servicios: [...record.servicios],
    })
    setEditing(true)
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateMut = useMutation({
    mutationFn: () => updateRecord(id!, {
      empresa: edit.empresa,
      nit: edit.nit || undefined,
      ciudad: edit.ciudad || undefined,
      direccion: edit.direccion || undefined,
      observaciones: edit.observaciones || undefined,
      proximoSeguimiento: edit.proximoSeguimiento || undefined,
      estadoProspecto: edit.estadoProspecto || undefined,
      estadoCliente: edit.estadoCliente || undefined,
      visita: edit.visita || undefined,
      visitaCliente: edit.visitaCliente || undefined,
      facturado: edit.facturado || undefined,
      valor: edit.valor ? Number(edit.valor) : undefined,
      ingresosEsperados: edit.ingresosEsperados ? Number(edit.ingresosEsperados) : undefined,
      servicios: edit.servicios,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Registro actualizado')
      setEditing(false)
    },
    onError: () => toast.error('Error al guardar'),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteRecord(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records'] })
      toast.success('Registro eliminado')
      navigate(record?.tipo === 'cliente' ? '/clientes' : '/prospectos')
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const createActMut = useMutation({
    mutationFn: () => createActividad(id!, {
      tipo: actForm.tipo,
      descripcion: actForm.descripcion,
      fecha: actForm.fecha,
      hora: actForm.hora || undefined,
      lugar: actForm.lugar || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      toast.success('Actividad registrada')
      setShowActForm(false)
      setActForm(EMPTY_ACT)
    },
    onError: () => toast.error('Error al registrar'),
  })

  const toggleHechoMut = useMutation({
    mutationFn: ({ actId, hecho }: { actId: string; hecho: boolean }) =>
      updateActividad(actId, { hecho }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['record', id] }),
    onError: () => toast.error('Error al actualizar'),
  })

  const deleteActMut = useMutation({
    mutationFn: (actId: string) => deleteActividad(actId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['record', id] })
      toast.success('Actividad eliminada')
      setEditAct(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-12 w-64 bg-surface2 rounded animate-pulse" />
        <div className="card p-6 h-48 animate-pulse bg-surface2" />
        <div className="card p-6 h-64 animate-pulse bg-surface2" />
      </div>
    )
  }

  if (!record) {
    return (
      <div className="empty-state p-12">
        <div className="text-4xl mb-3">🔍</div>
        <p className="font-semibold text-foreground mb-1">Registro no encontrado</p>
        <Link to="/prospectos" className="btn-primary btn-sm mt-2">Volver</Link>
      </div>
    )
  }

  const isProspecto = record.tipo === 'prospecto'
  const estadoBadge = isProspecto
    ? ESTADO_BADGE_P[record.estadoProspecto ?? 'prospecto']
    : ESTADO_BADGE_C[record.estadoCliente ?? 'activo']
  const estadoLabel = isProspecto
    ? fmtEstado(record.estadoProspecto, ESTADOS_PROSPECTO)
    : fmtEstado(record.estadoCliente, ESTADOS_CLIENTE)

  const actividadesOrdenadas = [...record.actividades].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">

      {/* Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <button onClick={() => navigate(-1)} className="text-xs text-muted hover:text-foreground flex items-center gap-1 mb-1">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-foreground">{record.empresa}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={isProspecto ? 'badge-blue' : 'badge-gold'}>{record.tipo}</span>
            <span className={estadoBadge ?? 'badge-gray'}>{estadoLabel}</span>
            {record.nit && <span className="text-xs text-muted font-mono">NIT: {record.nit}</span>}
            {record.categoria && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${record.categoria === 'A' ? '#f5a623' : record.categoria === 'B' ? '#00c2ff' : '#8899b4'}20`,
                         color: record.categoria === 'A' ? '#f5a623' : record.categoria === 'B' ? '#00c2ff' : '#8899b4' }}>
                Cat. {record.categoria}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <button className="btn-secondary btn-sm" onClick={startEdit}>Editar</button>
              <button className="btn-danger btn-sm" onClick={() => setConfirmDel(true)}>Eliminar</button>
            </>
          )}
          {editing && (
            <>
              <button className="btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
              <button
                className="btn-primary btn-sm"
                disabled={updateMut.isPending}
                onClick={() => updateMut.mutate()}
              >
                {updateMut.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pipeline bar (solo prospectos) ── */}
      {isProspecto && (
        <div className="flex rounded-xl overflow-hidden border border-border">
          {[
            { value: 'prospecto',            label: 'Prospecto',     color: '#00c2ff' },
            { value: 'reconocimiento',       label: 'Reconocimiento', color: '#a855f7' },
            { value: 'propuesta',            label: 'Propuesta',     color: '#f5a623' },
            { value: 'aceptacion_propuesta', label: 'Aceptación',    color: '#00e676' },
            { value: 'creacion_sop',         label: 'Creación SOP',  color: '#f5a623' },
            { value: 'facturado',            label: 'Facturado',     color: '#00e676' },
          ].map((stage, idx, arr) => {
            const isActive = record.estadoProspecto === stage.value
            const stageIdx = arr.findIndex((s) => s.value === record.estadoProspecto)
            const isPast   = idx < stageIdx
            return (
              <div
                key={stage.value}
                className="flex-1 py-2 px-1 text-center transition-all"
                style={{
                  background: isActive
                    ? `${stage.color}22`
                    : isPast
                    ? 'rgba(255,255,255,0.03)'
                    : 'transparent',
                  borderRight: idx < arr.length - 1 ? '1px solid var(--border)' : undefined,
                  borderBottom: isActive ? `3px solid ${stage.color}` : '3px solid transparent',
                }}
              >
                <div
                  className="text-xs font-bold truncate"
                  style={{ color: isActive ? stage.color : isPast ? 'var(--muted)' : 'var(--muted)' }}
                >
                  {isActive ? '▶ ' : isPast ? '✓ ' : ''}{stage.label}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs ── */}
      <div className="flex border-b border-border gap-0">
        {(['info', 'actividades', 'cotizaciones'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t === 'info' ? 'Información' : t === 'actividades' ? `Actividades (${record.actividades.length})` : `Cotizaciones (${cotizaciones.length})`}
          </button>
        ))}
      </div>

      {/* ── TAB: INFO ─────────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Datos generales */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Datos generales</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted block mb-1">Empresa</label>
                  {editing
                    ? <input className="input w-full" value={edit.empresa} onChange={(e) => setEdit((s) => ({ ...s, empresa: e.target.value }))} />
                    : <p className="font-semibold text-foreground">{record.empresa}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">NIT</label>
                  {editing
                    ? <input className="input w-full" value={edit.nit} onChange={(e) => setEdit((s) => ({ ...s, nit: e.target.value }))} />
                    : <p className="text-foreground font-mono">{record.nit || '—'}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Ciudad</label>
                  {editing
                    ? <input className="input w-full" value={edit.ciudad} onChange={(e) => setEdit((s) => ({ ...s, ciudad: e.target.value }))} />
                    : <p className="text-foreground">{record.ciudad || '—'}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Dirección</label>
                  {editing
                    ? <input className="input w-full" value={edit.direccion} onChange={(e) => setEdit((s) => ({ ...s, direccion: e.target.value }))} />
                    : <p className="text-foreground">{record.direccion || '—'}</p>}
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Comercial</label>
                  <p className="text-foreground">{record.comercial?.nombre || '—'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Tipo cliente</label>
                  <p className="text-foreground capitalize">{record.tipoCliente}</p>
                </div>
                {record.companias && record.companias.length > 0 && (
                  <div className="col-span-2">
                    <label className="text-xs text-muted block mb-1">Compañías</label>
                    <div className="flex flex-wrap gap-1.5">
                      {record.companias.map((c) => (
                        <span key={c} className="stag" style={{ background: 'rgba(0,194,255,0.12)', color: 'var(--accent)' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Estado */}
              <div className="grid grid-cols-2 gap-4">
                {isProspecto ? (
                  <>
                    <div>
                      <label className="text-xs text-muted block mb-1">Estado prospecto</label>
                      {editing
                        ? (
                          <select className="filter-select w-full" value={edit.estadoProspecto}
                            onChange={(e) => setEdit((s) => ({ ...s, estadoProspecto: e.target.value as EstadoProspecto }))}>
                            {['prospecto','reconocimiento','propuesta','aceptacion_propuesta','creacion_sop','facturado','frio','perdido'].map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        )
                        : <span className={ESTADO_BADGE_P[record.estadoProspecto ?? 'prospecto'] ?? 'badge-gray'}>{fmtEstado(record.estadoProspecto, ESTADOS_PROSPECTO)}</span>}
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Visita</label>
                      {editing
                        ? (
                          <select className="filter-select w-full" value={edit.visita}
                            onChange={(e) => setEdit((s) => ({ ...s, visita: e.target.value as TipoVisita }))}>
                            {['no','si','virtual','llamada'].map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )
                        : <span className={record.visita && record.visita !== 'no' ? 'badge-green' : 'badge-gray'}>{record.visita || 'no'}</span>}
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Ingresos esperados</label>
                      {editing
                        ? <input type="number" className="input w-full" value={edit.ingresosEsperados}
                            onChange={(e) => setEdit((s) => ({ ...s, ingresosEsperados: e.target.value }))} />
                        : <p className="font-mono text-success">{record.ingresosEsperados ? fmt(record.ingresosEsperados) : '—'}</p>}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs text-muted block mb-1">Estado cliente</label>
                      {editing
                        ? (
                          <select className="filter-select w-full" value={edit.estadoCliente}
                            onChange={(e) => setEdit((s) => ({ ...s, estadoCliente: e.target.value as EstadoCliente }))}>
                            {['activo','en-riesgo','inactivo'].map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )
                        : <span className={ESTADO_BADGE_C[record.estadoCliente ?? 'activo'] ?? 'badge-gray'}>{fmtEstado(record.estadoCliente, ESTADOS_CLIENTE)}</span>}
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Facturado</label>
                      {editing
                        ? (
                          <select className="filter-select w-full" value={edit.facturado}
                            onChange={(e) => setEdit((s) => ({ ...s, facturado: e.target.value as TipoFacturado }))}>
                            {['no','si','parcial'].map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )
                        : <span className={record.facturado === 'si' ? 'badge-green' : record.facturado === 'parcial' ? 'badge-gold' : 'badge-gray'}>{record.facturado || 'no'}</span>}
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Valor facturación</label>
                      {editing
                        ? <input type="number" className="input w-full" value={edit.valor}
                            onChange={(e) => setEdit((s) => ({ ...s, valor: e.target.value }))} />
                        : <p className="font-mono text-success">{record.valor ? fmt(record.valor) : '—'}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Visita cliente</label>
                      {editing
                        ? (
                          <select className="filter-select w-full" value={edit.visitaCliente}
                            onChange={(e) => setEdit((s) => ({ ...s, visitaCliente: e.target.value as TipoVisita }))}>
                            {['no','si','virtual','llamada'].map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        )
                        : <span className={record.visitaCliente && record.visitaCliente !== 'no' ? 'badge-green' : 'badge-gray'}>{record.visitaCliente || 'no'}</span>}
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs text-muted block mb-1">Próximo seguimiento</label>
                  {editing
                    ? <input type="date" className="input w-full" value={edit.proximoSeguimiento}
                        onChange={(e) => setEdit((s) => ({ ...s, proximoSeguimiento: e.target.value }))} />
                    : <p className="text-foreground">{record.proximoSeguimiento
                        ? new Date(record.proximoSeguimiento).toLocaleDateString('es-CO')
                        : '—'}</p>}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-xs text-muted block mb-1">Observaciones</label>
                {editing
                  ? <textarea className="input w-full h-20 resize-none" value={edit.observaciones}
                      onChange={(e) => setEdit((s) => ({ ...s, observaciones: e.target.value }))} />
                  : <p className="text-foreground text-sm whitespace-pre-wrap">{record.observaciones || '—'}</p>}
              </div>

              {/* Servicios */}
              <div>
                <label className="text-xs text-muted block mb-2">Servicios</label>
                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {SERVICIOS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEdit((prev) => ({
                          ...prev,
                          servicios: prev.servicios.includes(s)
                            ? prev.servicios.filter((x) => x !== s)
                            : [...prev.servicios, s],
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                          edit.servicios.includes(s)
                            ? 'bg-accent/15 border-accent text-accent'
                            : 'border-border text-muted hover:border-muted hover:text-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {record.servicios.length > 0
                      ? record.servicios.map((s) => <span key={s} className="stag">{s}</span>)
                      : <span className="text-muted text-sm">—</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tiempos en etapas (solo prospectos con historial) */}
          {isProspecto && (record.stageHistory?.length > 0 || record.estadoProspecto) && (
            <div className="lg:col-span-2">
              <div className="card p-5 space-y-3">
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest">⏱ Tiempos en etapas</h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const STAGE_COLORS: Record<string, string> = {
                      prospecto: '#00c2ff', reconocimiento: '#a855f7', propuesta: '#f5a623',
                      aceptacion_propuesta: '#00e676', creacion_sop: '#f5a623', facturado: '#00e676',
                      frio: '#8899b4', perdido: '#ff4444',
                    }
                    const STAGE_LABELS: Record<string, string> = {
                      prospecto: 'Prospecto', reconocimiento: 'Reconocimiento', propuesta: 'Propuesta',
                      aceptacion_propuesta: 'Aceptación', creacion_sop: 'Creación SOP',
                      facturado: 'Facturado', frio: 'Frío', perdido: 'Perdido',
                    }
                    const history = record.stageHistory ?? []
                    // Si no hay historial aún, mostrar solo la etapa actual con días desde creación
                    const entries = history.length > 0
                      ? history
                      : record.estadoProspecto
                        ? [{ stage: record.estadoProspecto, desde: record.createdAt, hasta: null }]
                        : []
                    return entries.map((e, i) => {
                      const desde = new Date(e.desde)
                      const hasta = e.hasta ? new Date(e.hasta) : new Date()
                      const dias = Math.max(1, Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)))
                      const color = STAGE_COLORS[e.stage] ?? '#8899b4'
                      const isActual = e.hasta === null
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                          style={{ background: `${color}10`, borderColor: `${color}40` }}>
                          <div>
                            <div className="text-xs font-bold" style={{ color }}>{STAGE_LABELS[e.stage] ?? e.stage}</div>
                            <div className="text-xs text-muted">{dias} {dias === 1 ? 'día' : 'días'}{isActual ? ' (actual)' : ''}</div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Panel lateral: Contactos */}
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Contactos</h3>
              {record.contactos.length === 0 ? (
                <p className="text-sm text-muted">Sin contactos registrados.</p>
              ) : (
                record.contactos.map((c) => (
                  <div key={c.id} className="border-b border-border last:border-0 pb-3 last:pb-0 space-y-1">
                    <p className="font-semibold text-foreground text-sm">{c.nombre}</p>
                    {c.cargo && <p className="text-xs text-muted">{c.cargo}</p>}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="text-xs text-accent block hover:underline">
                        {c.email}
                      </a>
                    )}
                    {c.telefono && <p className="text-xs text-muted font-mono">{c.telefono}</p>}
                    <div className="flex gap-2 mt-1">
                      {c.cumpleanos && (
                        <span className="text-xs text-muted">🎂 {c.cumpleanos}</span>
                      )}
                      {c.recibeRegalos && (
                        <span className="text-xs text-gold">🎁 Recibe regalos</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Metadata */}
            <div className="card p-5 space-y-2">
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Metadata</h3>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Creado</span>
                  <span className="text-foreground">{new Date(record.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Actualizado</span>
                  <span className="text-foreground">{new Date(record.updatedAt).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Fecha registro</span>
                  <span className="text-foreground">{new Date(record.fecha).toLocaleDateString('es-CO')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ACTIVIDADES ────────────────────────────────────────────── */}
      {tab === 'actividades' && (
        <div className="space-y-4">

          {/* Botón nueva actividad */}
          <div className="flex justify-end">
            <button className="btn-primary btn-sm" onClick={() => { setShowActForm(!showActForm); setActForm(EMPTY_ACT) }}>
              {showActForm ? 'Cancelar' : '+ Nueva actividad'}
            </button>
          </div>

          {/* Formulario nueva actividad */}
          {showActForm && (
            <div className="card p-5 space-y-4 border border-accent/30">
              <h3 className="text-sm font-bold text-foreground">Nueva actividad</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Tipo</label>
                  <select className="filter-select w-full" value={actForm.tipo}
                    onChange={(e) => setActForm((s) => ({ ...s, tipo: e.target.value as ActividadTipo }))}>
                    {(['llamada','reunion','email','visita','tarea','seguimiento'] as ActividadTipo[]).map((t) => (
                      <option key={t} value={t}>{TIPO_ACT_ICON[t]} {t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Fecha</label>
                  <input type="date" className="input w-full" value={actForm.fecha}
                    onChange={(e) => setActForm((s) => ({ ...s, fecha: e.target.value }))} />
                </div>
                {actForm.tipo === 'visita' && (
                  <>
                    <div>
                      <label className="text-xs text-muted block mb-1">Hora</label>
                      <input type="time" className="input w-full" value={actForm.hora}
                        onChange={(e) => setActForm((s) => ({ ...s, hora: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Lugar</label>
                      <input className="input w-full" placeholder="Dirección o lugar" value={actForm.lugar}
                        onChange={(e) => setActForm((s) => ({ ...s, lugar: e.target.value }))} />
                    </div>
                  </>
                )}
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Descripción</label>
                <textarea
                  className="input w-full h-20 resize-none"
                  placeholder="Describe la actividad..."
                  value={actForm.descripcion}
                  onChange={(e) => setActForm((s) => ({ ...s, descripcion: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="btn-primary btn-sm"
                  disabled={!actForm.descripcion.trim() || createActMut.isPending}
                  onClick={() => createActMut.mutate()}
                >
                  {createActMut.isPending ? 'Guardando...' : 'Guardar actividad'}
                </button>
              </div>
            </div>
          )}

          {/* Timeline de actividades */}
          {actividadesOrdenadas.length === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-3">📅</div>
              <p className="font-semibold text-foreground mb-1">Sin actividades</p>
              <p className="text-sm">Registra llamadas, reuniones, visitas...</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Línea vertical */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

              {actividadesOrdenadas.map((act) => (
                <div key={act.id} className="relative flex gap-4 pb-5">
                  {/* Ícono tipo */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 border-2 transition-colors ${
                    act.hecho
                      ? 'bg-success/10 border-success/40'
                      : 'bg-surface2 border-border'
                  }`}>
                    {TIPO_ACT_ICON[act.tipo as ActividadTipo] ?? '📌'}
                  </div>

                  {/* Contenido */}
                  <div className={`flex-1 card p-4 space-y-1.5 ${act.hecho ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-muted uppercase">{act.tipo}</span>
                        {act.tipo === 'visita' && (act as { hora?: string; lugar?: string }).hora && (
                          <span className="ml-2 text-xs text-accent font-mono">
                            {(act as { hora?: string }).hora}
                          </span>
                        )}
                        {act.tipo === 'visita' && (act as { lugar?: string }).lugar && (
                          <span className="ml-2 text-xs text-muted">
                            📍 {(act as { lugar?: string }).lugar}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted whitespace-nowrap">
                          {new Date(act.fecha).toLocaleDateString('es-CO')}
                        </span>
                        <button
                          className={`text-xs px-2 py-0.5 rounded-md border transition-colors ${
                            act.hecho
                              ? 'border-success/40 text-success'
                              : 'border-border text-muted hover:border-success/40 hover:text-success'
                          }`}
                          onClick={() => toggleHechoMut.mutate({ actId: act.id, hecho: !act.hecho })}
                          title={act.hecho ? 'Marcar pendiente' : 'Marcar hecho'}
                        >
                          {act.hecho ? '✓ Hecho' : 'Completar'}
                        </button>
                        <button
                          className="text-xs text-danger/60 hover:text-danger"
                          onClick={() => {
                            if (editAct === act.id) { setEditAct(null) }
                            else deleteActMut.mutate(act.id)
                          }}
                          title="Eliminar"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-foreground">{act.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: COTIZACIONES ───────────────────────────────────────────── */}
      {tab === 'cotizaciones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Link
              to={`/cotizaciones/nueva?recordId=${id}`}
              className="btn-primary btn-sm"
            >
              + Nueva cotización
            </Link>
          </div>

          {cotizaciones.length === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-foreground mb-1">Sin cotizaciones</p>
              <p className="text-sm">Crea la primera cotización para este cliente.</p>
            </div>
          ) : (
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Estado</th>
                    <th>Líneas</th>
                    <th>Comercial</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id}>
                      <td className="font-mono text-accent font-semibold">{cot.numero}</td>
                      <td>
                        <span className={COT_BADGE[cot.estado] ?? 'badge-gray'}>{fmtEstado(cot.estado, ESTADOS_COT)}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {cot.lineas.slice(0, 2).map((l) => (
                            <span key={l} className="stag">{l}</span>
                          ))}
                          {cot.lineas.length > 2 && <span className="stag">+{cot.lineas.length - 2}</span>}
                        </div>
                      </td>
                      <td className="text-sm text-muted">{cot.comercial}</td>
                      <td className="text-xs text-muted">
                        {new Date(cot.createdAt).toLocaleDateString('es-CO')}
                      </td>
                      <td>
                        <Link
                          to={`/cotizaciones/${cot.id}`}
                          className="btn-ghost btn-sm px-2 py-1 text-xs"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: confirmar eliminación ── */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setConfirmDel(false)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Eliminar {record.empresa}?</h3>
            <p className="text-sm text-muted">Se eliminarán todos los contactos y actividades asociados. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-sm" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button
                className="btn-danger btn-sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
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
