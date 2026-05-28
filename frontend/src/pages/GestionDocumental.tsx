import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Search, X, ChevronRight, RefreshCw, AlertTriangle, Clock, CheckCircle, Circle } from 'lucide-react'
import { listGD, upsertGD, GD_DOCS, GDRow, DocEstado } from '../api/gestionDocumental'
import { useToastStore } from '../store/toastStore'

// ─── Constants ────────────────────────────────────────────────────────────────
const ESTADO_STYLE = {
  completo:   { label: 'Completo',   bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.35)'  },
  incompleto: { label: 'Incompleto', bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.35)'  },
  pendiente:  { label: 'Pendiente',  bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.35)' },
}

const VENC_STYLE = {
  'con-tiempo': { label: 'Al día',      text: '#34d399', icon: CheckCircle },
  'por-vencer': { label: 'Por vencer',  text: '#f59e0b', icon: AlertTriangle },
  'vencido':    { label: 'Vencido',     text: '#f87171', icon: AlertTriangle },
  'sin-fecha':  { label: 'Sin fecha',   text: '#94a3b8', icon: Circle       },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(pct: number): string {
  if (pct >= 80) return '#34d399'
  if (pct >= 50) return '#f59e0b'
  return '#f87171'
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card-glass rounded-xl p-4 border border-border flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold">{label}</div>
      <div className="text-3xl font-display font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

// ─── Doc Modal ────────────────────────────────────────────────────────────────
function DocModal({ row, onClose }: { row: GDRow; onClose: () => void }) {
  const qc = useQueryClient()
  const { push } = useToastStore()
  const anoActual = new Date().getFullYear()
  const esReferido = row.tipoCliente === 'referido'
  const docs = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true)

  const [draft, setDraft] = useState<Record<string, DocEstado>>(() => ({ ...row.gd.docs }))
  const [ciclo, setCiclo] = useState(row.gd.cicloActual)

  const mutate = useMutation({
    mutationFn: () => upsertGD(row.id, { docs: draft, cicloActual: ciclo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      push('Documentación actualizada', 'success')
      onClose()
    },
    onError: () => push('Error al guardar', 'error'),
  })

  const setDoc = useCallback((docId: string, field: keyof DocEstado, value: string) => {
    setDraft(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value },
    }))
  }, [])

  // Compute live compliance
  const desactualizado = ciclo < anoActual
  let totalPond = 0, cumplido = 0
  for (const d of docs) {
    const pond = esReferido ? d.pond_ref : d.pond_di
    if (!pond) continue
    totalPond += pond
    if (desactualizado) continue
    const est = draft[d.id]?.estado ?? ''
    if (est === 'completo')   cumplido += pond
    else if (est === 'incompleto') cumplido += pond * 0.5
  }
  const pct = totalPond > 0 ? Math.round((cumplido / totalPond) * 100) : 0
  const color = pctColor(pct)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-2xl bg-[#111827] border-l border-border overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111827] border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <div className="text-lg font-display font-bold text-foreground">{row.empresa}</div>
            {row.nit && <div className="text-xs text-muted">NIT: {row.nit}</div>}
            <div className="text-xs text-muted">{row.comercial.nombre} · {row.tipoCliente}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Compliance bar */}
          <div className="card-glass rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">Cumplimiento ponderado</span>
              <span className="text-2xl font-display font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <p className="text-[10px] text-muted mt-1.5">Completo=100% del peso · Incompleto=50%</p>
          </div>

          {/* Cycle */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">Ciclo documental:</span>
            <select
              value={ciclo}
              onChange={e => setCiclo(Number(e.target.value))}
              className="bg-surface border border-border rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-accent"
            >
              {[anoActual - 1, anoActual, anoActual + 1].map(y => (
                <option key={y} value={y}>{y}{y === anoActual ? ' (actual)' : ''}</option>
              ))}
            </select>
            {desactualizado && (
              <span className="text-xs text-red-400 font-semibold">Ciclo desactualizado</span>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">Documentos aplicables</div>
            {docs.map(doc => {
              const d = draft[doc.id] ?? {}
              const pond = esReferido ? doc.pond_ref : doc.pond_di
              const pctDoc = Math.round((pond || 0) * 100 * 10) / 10
              const style = d.estado ? ESTADO_STYLE[d.estado] : null
              return (
                <div
                  key={doc.id}
                  className="rounded-xl border border-border p-4 space-y-3 transition-colors"
                  style={style ? { background: style.bg, borderColor: style.border } : { background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground font-medium leading-snug">{doc.nombre}</div>
                      <div className="text-[10px] text-muted mt-0.5">Peso: {pctDoc}%</div>
                    </div>
                    {d.estado && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: ESTADO_STYLE[d.estado].bg, color: ESTADO_STYLE[d.estado].text, border: `1px solid ${ESTADO_STYLE[d.estado].border}` }}
                      >
                        {ESTADO_STYLE[d.estado].label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={d.estado ?? ''}
                      onChange={e => setDoc(doc.id, 'estado', e.target.value)}
                      className="bg-surface/80 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                    >
                      <option value="">Sin estado</option>
                      <option value="completo">Completo</option>
                      <option value="incompleto">Incompleto</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                    <input
                      type="date"
                      value={d.fecha ?? ''}
                      onChange={e => setDoc(doc.id, 'fecha', e.target.value)}
                      className="bg-surface/80 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="text"
                    value={d.obs ?? ''}
                    onChange={e => setDoc(doc.id, 'obs', e.target.value)}
                    placeholder="Observaciones..."
                    className="w-full bg-surface/80 border border-border rounded-lg px-2 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                  />
                </div>
              )
            })}
          </div>

          {/* Save */}
          <button
            onClick={() => mutate.mutate()}
            disabled={mutate.isPending}
            className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {mutate.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GestionDocumental() {
  const [search, setSearch]       = useState('')
  const [filtVenc, setFiltVenc]   = useState('')
  const [filtEst, setFiltEst]     = useState('')
  const [selected, setSelected]   = useState<GDRow | null>(null)

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['gestion-documental', search, filtVenc, filtEst],
    queryFn: () => listGD({
      search:     search || undefined,
      vencimiento: filtVenc || undefined,
      estadoDocs:  filtEst  || undefined,
    }),
    staleTime: 30_000,
  })

  // KPIs
  const total     = rows.length
  const vencidos  = rows.filter(r => r.vencimiento.status === 'vencido').length
  const porVencer = rows.filter(r => r.vencimiento.status === 'por-vencer').length
  const completos = rows.filter(r => r.estadoDocs === 'completo').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen size={22} className="text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-wide">Gestión Documental</h1>
            <p className="text-xs text-muted">BASC · 18 documentos · Solo clientes activos</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-muted hover:text-foreground text-xs transition-colors"
        >
          <RefreshCw size={13} />
          Actualizar
        </button>
      </div>

      {/* Alert banners */}
      {(vencidos > 0 || porVencer > 0) && (
        <div className="space-y-2">
          {vencidos > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm">
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
              <span className="text-red-400 font-semibold">{vencidos} cliente{vencidos > 1 ? 's' : ''} con documentación VENCIDA</span>
            </div>
          )}
          {porVencer > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
              <Clock size={15} className="text-amber-400 flex-shrink-0" />
              <span className="text-amber-400 font-semibold">{porVencer} cliente{porVencer > 1 ? 's' : ''} con documentación próxima a vencer (≤60 días)</span>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <StatBadge label="Total clientes" value={total}     color="#94a3b8" />
        <StatBadge label="Completos"       value={completos} color="#34d399" />
        <StatBadge label="Por vencer"      value={porVencer} color="#f59e0b" />
        <StatBadge label="Vencidos"        value={vencidos}  color="#f87171" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa o NIT..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filtVenc}
          onChange={e => setFiltVenc(e.target.value)}
          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
        >
          <option value="">Todos los vencimientos</option>
          <option value="con-tiempo">Al día</option>
          <option value="por-vencer">Por vencer</option>
          <option value="vencido">Vencido</option>
          <option value="sin-fecha">Sin fecha</option>
        </select>
        <select
          value={filtEst}
          onChange={e => setFiltEst(e.target.value)}
          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
        >
          <option value="">Todos los estados</option>
          <option value="completo">Completo</option>
          <option value="incompleto">Incompleto</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      {/* Table */}
      <div className="card-glass rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted uppercase tracking-[1px] text-[10px]">
              <th className="text-left px-5 py-3 font-semibold">Empresa</th>
              <th className="text-left px-4 py-3 font-semibold">Tipo cliente</th>
              <th className="text-left px-4 py-3 font-semibold">Ciclo</th>
              <th className="text-left px-4 py-3 font-semibold w-[200px]">Cumplimiento</th>
              <th className="text-left px-4 py-3 font-semibold">Estado docs</th>
              <th className="text-left px-4 py-3 font-semibold">Vencimiento</th>
              <th className="px-4 py-3 w-[50px]"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted">Cargando...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted">No hay clientes registrados.</td></tr>
            ) : rows.map(row => {
              const vStyle = VENC_STYLE[row.vencimiento.status]
              const VIcon = vStyle.icon
              const eStyle = ESTADO_STYLE[row.estadoDocs]
              const color = pctColor(row.cumplimiento)
              const anoActual = new Date().getFullYear()
              const desact = row.gd.cicloActual < anoActual

              return (
                <tr key={row.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelected(row)}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{row.empresa}</div>
                    {row.nit && <div className="text-muted text-xs">{row.nit}</div>}
                    <div className="text-muted text-xs">{row.comercial.nombre}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">{row.tipoCliente}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={desact ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                      {row.gd.cicloActual}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.cumplimiento}%`, background: color }} />
                      </div>
                      <span className="text-xs font-bold font-mono w-8 text-right" style={{ color }}>{row.cumplimiento}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: eStyle.bg, color: eStyle.text, border: `1px solid ${eStyle.border}` }}>
                      {eStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <VIcon size={13} style={{ color: vStyle.text }} />
                      <span className="text-xs font-medium" style={{ color: vStyle.text }}>{vStyle.label}</span>
                      {row.vencimiento.diasRestantes !== null && (
                        <span className="text-[10px] text-muted">
                          ({row.vencimiento.diasRestantes > 0 ? `${row.vencimiento.diasRestantes}d` : `${Math.abs(row.vencimiento.diasRestantes)}d ago`})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors ml-auto" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail panel */}
      {selected && <DocModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
