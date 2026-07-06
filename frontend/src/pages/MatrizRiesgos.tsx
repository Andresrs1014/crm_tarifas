import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { ShieldAlert, RefreshCw, CheckCircle2, Clock, BookOpen } from 'lucide-react'
import { listMatriz, upsertMatriz, MatrizRiesgoRow, MatrizRiesgoUpsert } from '../api/matrizRiesgos'
import { useToastStore } from '../store/toastStore'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel, TableScrollArea } from '../components/ui/DataListPanel'

// ─── Constants ────────────────────────────────────────────────────────────────
const MR_OPCIONES = {
  mercancia:   ['Industrial','Tecnología','Consumo masivo','Textiles','Farmacéuticos',
                'Dispositivos Médicos','Repuestos automotrices','Hogar y cocina',
                'Accesorios','Herramientas','Juguetería','Electrodomésticos','Decoración','Misceláneos'],
  tipoPersona: ['Jurídica','Natural'],
  tiempo:      ['< 1 año','1 - 3 años','> 3 años'],
  capital:     ['< 1 M','1 M - 50M','>50M - 100M','> 100M'],
  frecuencia:  ['Bajo','Medio','Alta'],
  facturacion: ['Bajo','Medio','Alta'],
  cert:        ['Sí','No'],
  anFin:       ['Favorable','Desfavorable','No disponible'],
  frecControl: ['Anual','Semestral','Trimestral'],
}

const RIESGO_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  'BAJO':      { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.35)' },
  'MEDIO':     { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
  'ALTO':      { bg: 'rgba(248,113,113,0.14)', text: '#f87171', border: 'rgba(248,113,113,0.4)' },
  'CRÍTICO':   { bg: 'rgba(239,68,68,0.18)',   text: '#ef4444', border: 'rgba(239,68,68,0.5)'  },
  'PENDIENTE': { bg: 'rgba(100,116,139,0.1)',  text: '#94a3b8', border: 'rgba(100,116,139,0.3)'},
}

const RIESGO_ORDER = ['CRÍTICO','ALTO','MEDIO','BAJO','PENDIENTE']

// ─── Inline select ────────────────────────────────────────────────────────────
function InlineSelect({
  value, options, onChange, placeholder,
}: {
  value?: string; options: string[]; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="cell-select"
    >
      <option value="">{placeholder ?? '—'}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── Risk badge ───────────────────────────────────────────────────────────────
function RiesgoBadge({ riesgo }: { riesgo: string }) {
  const s = RIESGO_STYLE[riesgo] ?? RIESGO_STYLE['PENDIENTE']
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold whitespace-nowrap"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {riesgo}
    </span>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="crm-kpi-cell" style={{ borderTopColor: color }}>
      <div className="crm-kpi-label">{label}</div>
      <div className="crm-kpi-value" style={{ color }}>{value}</div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MatrizRiesgos() {
  const qc = useQueryClient()
  const { push } = useToastStore()

  const [activeTab, setActiveTab]   = useState<'matriz' | 'referencia'>('matriz')
  const [search, setSearch]         = useState('')
  const [filtRiesgo, setFiltRiesgo] = useState('')
  const [filtComp, setFiltComp]     = useState('')
  const [filtCia, setFiltCia]       = useState('')
  const [editing, setEditing]       = useState<Record<string, MatrizRiesgoUpsert>>({})

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['matriz-riesgos', search, filtRiesgo, filtComp],
    queryFn: () => listMatriz({ search: search || undefined, riesgo: filtRiesgo || undefined, completa: filtComp || undefined }),
    staleTime: 30_000,
  })

  const mutate = useAppMutation({
    mutationFn: ({ recordId, data }: { recordId: string; data: MatrizRiesgoUpsert }) =>
      upsertMatriz(recordId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matriz-riesgos'] })
      push('Matriz actualizada', 'success')
    },
    onError: () => push('Error al guardar', 'error'),
  })

  const handleChange = useCallback((recordId: string, field: keyof MatrizRiesgoUpsert, value: string) => {
    setEditing(prev => ({
      ...prev,
      [recordId]: { ...prev[recordId], [field]: value },
    }))
  }, [])

  const handleSave = useCallback((row: MatrizRiesgoRow) => {
    const draft = editing[row.id] ?? {}
    const m = row.matrizRiesgo
    const merged: MatrizRiesgoUpsert = {
      companias:   m?.companias,
      mercancia:   draft.mercancia   ?? m?.mercancia,
      tipoPersona: draft.tipoPersona ?? m?.tipoPersona,
      tiempo:      draft.tiempo      ?? m?.tiempo,
      capital:     draft.capital     ?? m?.capital,
      frecuencia:  draft.frecuencia  ?? m?.frecuencia,
      facturacion: draft.facturacion ?? m?.facturacion,
      cert:        draft.cert        ?? m?.cert,
      anFin:       draft.anFin       ?? m?.anFin,
      control:     draft.control     ?? m?.control,
      frecControl: draft.frecControl ?? m?.frecControl,
    }
    mutate.mutate({ recordId: row.id, data: merged })
    setEditing(prev => { const n = { ...prev }; delete n[row.id]; return n })
  }, [editing, mutate])

  // Client-side cia filter
  const filteredRows = filtCia
    ? rows.filter(r => r.matrizRiesgo?.companias?.includes(filtCia))
    : rows

  // KPI counts
  const kpis = RIESGO_ORDER.map(r => ({
    label: r,
    value: filteredRows.filter(row => (row.matrizRiesgo?.riesgo ?? 'PENDIENTE') === r).length,
    color: (RIESGO_STYLE[r] ?? RIESGO_STYLE['PENDIENTE']).text,
  }))

  const pendientes = filteredRows.filter(r => !r.matrizRiesgo?.mercancia).length

  const pagination = usePagination(filteredRows, {
    resetDeps: [search, filtRiesgo, filtComp, filtCia],
    pageSize: 25,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Matriz de Riesgos</h2>
          <p className="text-xs text-muted">FR-002-GC · Solo clientes activos</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-surface2 border border-border rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('matriz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'matriz' ? 'bg-accent/15 text-accent font-semibold' : 'text-muted hover:text-foreground'}`}
            >
              <ShieldAlert size={12} />
              Matriz
            </button>
            <button
              onClick={() => setActiveTab('referencia')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'referencia' ? 'bg-accent/15 text-accent font-semibold' : 'text-muted hover:text-foreground'}`}
            >
              <BookOpen size={12} />
              Datos de Referencia
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-muted hover:text-foreground hover:bg-surface3 text-xs transition-colors"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </div>

      {activeTab === 'matriz' && (<>
      {/* Alert banner */}
      {pendientes > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm">
          <Clock size={16} className="text-red-400 flex-shrink-0" />
          <span className="text-red-400 font-semibold">{pendientes} cliente{pendientes > 1 ? 's' : ''} sin Matriz de Riesgos completada.</span>
          <span className="text-red-400/70">Completa los campos faltantes para evaluar su nivel de riesgo.</span>
        </div>
      )}

      {/* KPI row */}
      <div className="crm-kpi-strip">
        {kpis.map(k => <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} />)}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa o NIT..."
          className="filter-input"
        />
        <select value={filtRiesgo} onChange={e => setFiltRiesgo(e.target.value)} className="filter-select">
          <option value="">Todos los riesgos</option>
          {RIESGO_ORDER.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filtCia} onChange={e => setFiltCia(e.target.value)} className="filter-select">
          <option value="">Todas las compañías</option>
          <option value="Logimat">Logimat</option>
          <option value="IMC Cargo">IMC Cargo</option>
          <option value="IMC Depósito">IMC Depósito</option>
          <option value="Aduana">Aduana</option>
        </select>
        <select value={filtComp} onChange={e => setFiltComp(e.target.value)} className="filter-select">
          <option value="">Todos</option>
          <option value="completa">Completas</option>
          <option value="pendiente">Pendientes</option>
        </select>
      </div>

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state py-12 text-muted">No hay clientes registrados.</div>
        }
      >
        <table className="w-full text-xs min-w-[1500px]">
          <thead>
            <tr>
              <th className="text-left w-[180px]">Empresa</th>
              <th className="text-left min-w-[120px]">Mercancía</th>
              <th className="text-left min-w-[100px]">Tipo Persona</th>
              <th className="text-left min-w-[100px]">Tiempo</th>
              <th className="text-left min-w-[110px]">Capital</th>
              <th className="text-left min-w-[100px]">Frecuencia Op.</th>
              <th className="text-left min-w-[100px]">Facturación</th>
              <th className="text-left min-w-[100px]">Certificación</th>
              <th className="text-left min-w-[110px]">Análisis Fin.</th>
              <th className="text-left min-w-[140px]">Control a Aplicar</th>
              <th className="text-left min-w-[100px]">Frecuencia</th>
              <th className="text-center min-w-[72px]">Puntaje</th>
              <th className="text-center min-w-[88px]">Riesgo</th>
              <th className="text-center w-[52px]"></th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map(row => {
              const m = row.matrizRiesgo
              const d = editing[row.id] ?? {}
              const isEdited = !!editing[row.id]
              const riesgo = m?.riesgo ?? 'PENDIENTE'

              const val = (field: keyof MatrizRiesgoUpsert) =>
                (d[field] as string | undefined) ?? (m?.[field as keyof typeof m] as string | undefined)

              return (
                <tr key={row.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground truncate max-w-[160px]">{row.empresa}</div>
                    {row.nit && <div className="text-muted text-[10px]">{row.nit}</div>}
                    <div className="text-muted text-[10px]">{row.comercial.nombre}</div>
                  </td>
                  <td className="px-3 py-2.5 min-w-[140px]">
                    <InlineSelect value={val('mercancia')} options={MR_OPCIONES.mercancia} onChange={v => handleChange(row.id, 'mercancia', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[100px]">
                    <InlineSelect value={val('tipoPersona')} options={MR_OPCIONES.tipoPersona} onChange={v => handleChange(row.id, 'tipoPersona', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[110px]">
                    <InlineSelect value={val('tiempo')} options={MR_OPCIONES.tiempo} onChange={v => handleChange(row.id, 'tiempo', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[120px]">
                    <InlineSelect value={val('capital')} options={MR_OPCIONES.capital} onChange={v => handleChange(row.id, 'capital', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[90px]">
                    <InlineSelect value={val('frecuencia')} options={MR_OPCIONES.frecuencia} onChange={v => handleChange(row.id, 'frecuencia', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[90px]">
                    <InlineSelect value={val('facturacion')} options={MR_OPCIONES.facturacion} onChange={v => handleChange(row.id, 'facturacion', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[80px]">
                    <InlineSelect value={val('cert')} options={MR_OPCIONES.cert} onChange={v => handleChange(row.id, 'cert', v)} placeholder="—" />
                  </td>
                  <td className="px-3 py-2.5 min-w-[120px]">
                    <InlineSelect value={val('anFin')} options={MR_OPCIONES.anFin} onChange={v => handleChange(row.id, 'anFin', v)} />
                  </td>
                  <td className="px-3 py-2.5 min-w-[160px]">
                    <input
                      type="text"
                      value={(d.control as string | undefined) ?? m?.control ?? ''}
                      onChange={e => handleChange(row.id, 'control', e.target.value)}
                      placeholder="Descripción del control..."
                      className="cell-input"
                    />
                  </td>
                  <td className="px-3 py-2.5 min-w-[110px]">
                    <InlineSelect value={val('frecControl')} options={MR_OPCIONES.frecControl} onChange={v => handleChange(row.id, 'frecControl', v)} placeholder="—" />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-mono font-bold text-sm text-foreground">
                      {m?.puntaje?.toFixed(2) ?? '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <RiesgoBadge riesgo={riesgo} />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleSave(row)}
                      disabled={!isEdited || mutate.isPending}
                      className={[
                        'p-1.5 rounded-lg transition-colors',
                        isEdited
                          ? 'text-accent hover:bg-accent/10 cursor-pointer'
                          : 'text-muted/30 cursor-not-allowed',
                      ].join(' ')}
                      title="Guardar"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataListPanel>

      {/* Control suggestions panel */}
      {activeTab === 'matriz' && filteredRows.some(r => r.matrizRiesgo?.control) && (
        <div className="card-glass rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-[1.5px]">Controles sugeridos</h2>
          <div className="space-y-2">
            {filteredRows
              .filter(r => r.matrizRiesgo?.control && r.matrizRiesgo.riesgo !== 'PENDIENTE')
              .sort((a, b) =>
                RIESGO_ORDER.indexOf(a.matrizRiesgo!.riesgo) - RIESGO_ORDER.indexOf(b.matrizRiesgo!.riesgo)
              )
              .slice(0, 8)
              .map(r => (
                <div key={r.id} className="flex items-start gap-3 text-sm">
                  <RiesgoBadge riesgo={r.matrizRiesgo!.riesgo} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{r.empresa}</span>
                    <span className="text-muted mx-2">—</span>
                    <span className="text-muted">{r.matrizRiesgo!.control}</span>
                  </div>
                  <span className="text-muted text-xs flex-shrink-0">{r.matrizRiesgo!.frecControl}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
      </>)}

      {/* ── Datos de Referencia tab ─────────────────────────────────────────── */}
      {activeTab === 'referencia' && (
        <div className="space-y-5">
          <p className="text-xs text-muted">Tablas de referencia para la calificación de criterios según FR-002-GC.</p>

          {/* Pesos por criterio */}
          <div className="card-glass rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-[1.5px]">Pesos por Criterio</h3>
            </div>
            <TableScrollArea>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted text-[10px] uppercase tracking-[1px]">
                  <th className="text-left px-5 py-2 font-semibold">Criterio</th>
                  <th className="text-center px-4 py-2 font-semibold">Peso</th>
                  <th className="text-left px-4 py-2 font-semibold">Escala (Bajo / Medio / Alto)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { criterio: 'Mercancía', peso: '45%', escala: '1 — 3 — 5' },
                  { criterio: 'Facturación', peso: '25%', escala: '1 — 3 — 5' },
                  { criterio: 'Frecuencia de Operación', peso: '15%', escala: '1 — 3 — 5' },
                  { criterio: 'Tipo de Persona', peso: '5%', escala: 'Natural: 1 · Jurídica: 5' },
                  { criterio: 'Tiempo como cliente', peso: '5%', escala: '>3 años: 1 · 1-3 años: 3 · <1 año: 5' },
                  { criterio: 'Capital declarado', peso: '5%', escala: '>100M: 1 · 50-100M: 2 · 1-50M: 3 · <1M: 5' },
                ].map(r => (
                  <tr key={r.criterio} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5 font-medium text-foreground">{r.criterio}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="font-bold text-accent">{r.peso}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{r.escala}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </TableScrollArea>
          </div>

          {/* Niveles de riesgo */}
          <div className="card-glass rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-[1.5px]">Niveles de Riesgo</h3>
            </div>
            <TableScrollArea>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted text-[10px] uppercase tracking-[1px]">
                  <th className="text-left px-5 py-2 font-semibold">Nivel</th>
                  <th className="text-center px-4 py-2 font-semibold">Rango de Puntaje</th>
                  <th className="text-left px-4 py-2 font-semibold">Acción Recomendada</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { nivel: 'BAJO', rango: '1.00 – 1.99', accion: 'Monitoreo anual', riesgoKey: 'BAJO' },
                  { nivel: 'MEDIO', rango: '2.00 – 2.99', accion: 'Seguimiento semestral', riesgoKey: 'MEDIO' },
                  { nivel: 'ALTO', rango: '3.00 – 3.99', accion: 'Control trimestral + visita', riesgoKey: 'ALTO' },
                  { nivel: 'CRÍTICO', rango: '4.00 – 5.00', accion: 'Revisión inmediata — posible rechazo', riesgoKey: 'CRÍTICO' },
                ].map(r => (
                  <tr key={r.nivel} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-2.5"><RiesgoBadge riesgo={r.nivel} /></td>
                    <td className="px-4 py-2.5 text-center font-mono text-foreground">{r.rango}</td>
                    <td className="px-4 py-2.5 text-muted">{r.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </TableScrollArea>
          </div>

          {/* Nota escala */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-muted">
            <span className="text-accent font-bold flex-shrink-0">ℹ</span>
            <span>La escala de calificación es <strong className="text-foreground">1 (Bajo riesgo) · 3 (Riesgo medio) · 5 (Alto riesgo)</strong>. El puntaje final es la suma ponderada de todos los criterios. Se requiere certificado BASC vigente para reducir el nivel de riesgo.</span>
          </div>
        </div>
      )}
    </div>
  )
}
