import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, RefreshCw, AlertTriangle, Clock, CheckCircle, Circle, Download, type LucideIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import { listGD, GDRow } from '../api/gestionDocumental'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'
import { ESTADO_STYLE, pctColor, fmtDate } from '../lib/gestionDocumental/shared'

// ─── Constants ────────────────────────────────────────────────────────────────
/** Pendientes primero, para identificarlos más fácil en la lista (pedido por QA). */
const ESTADO_ORDEN: Record<'completo' | 'incompleto' | 'pendiente', number> = { pendiente: 0, incompleto: 1, completo: 2 }

const VENC_STYLE = {
  'con-tiempo': { label: 'Al día',      text: '#34d399', icon: CheckCircle },
  'por-vencer': { label: 'Por vencer',  text: '#f59e0b', icon: AlertTriangle },
  'vencido':    { label: 'Vencido',     text: '#f87171', icon: AlertTriangle },
  'sin-fecha':  { label: 'Sin fecha',   text: '#94a3b8', icon: Circle       },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function AlertBanner({ icon: Icon, color, label, rows, onSelect }: {
  icon: LucideIcon
  color: 'red' | 'amber'
  label: string
  rows: GDRow[]
  onSelect: (row: GDRow) => void
}) {
  const tone = color === 'red'
    ? { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
    : { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
  return (
    <div className={`rounded-xl border ${tone.bg} ${tone.border} px-4 py-3 space-y-2`}>
      <div className="flex items-center gap-3 text-sm">
        <Icon size={15} className={`${tone.text} flex-shrink-0`} />
        <span className={`${tone.text} font-semibold`}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-[27px]">
        {rows.map(row => {
          const dias = row.vencimiento.diasRestantes
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row)}
              className={`text-[11px] font-medium px-2 py-1 rounded-md bg-black/20 border ${tone.border} ${tone.text} hover:bg-black/30 transition-colors`}
            >
              {row.empresa}{dias !== null ? ` · ${dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`}` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="crm-kpi-cell" style={{ borderTopColor: color }}>
      <div className="crm-kpi-label">{label}</div>
      <div className="crm-kpi-value" style={{ color }}>{value}</div>
    </div>
  )
}

// ─── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows: GDRow[]) {
  const data = rows.map(r => ({
    Empresa:        r.empresa,
    NIT:            r.nit ?? '',
    Tipo:           r.tipoCliente,
    Compañías:      r.companias.join(', '),
    Comercial:      r.comercial.nombre,
    'Cumplimiento%': r.cumplimiento,
    'Estado Docs':  r.estadoDocs,
    'Ciclo':        r.gd.cicloActual,
    'Última Act.':  fmtDate(r.gd.updatedAt),
    'Próx. Act.':   fmtDate(r.vencimiento.fechaVencimiento),
    'Días p/Vencer': r.vencimiento.diasRestantes ?? '',
    Status:         VENC_STYLE[r.vencimiento.status].label,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'GestionDocumental')
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `GestionDocumental_ZYMO_${fecha}.xlsx`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GestionDocumental() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [filtVenc, setFiltVenc]   = useState('')
  const [filtEst, setFiltEst]     = useState('')
  const [filtTipo, setFiltTipo]   = useState('')
  const [filtCia, setFiltCia]     = useState('')
  const [filtPct, setFiltPct]     = useState('')

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['gestion-documental', search, filtVenc, filtEst],
    queryFn: () => listGD({
      search:      search || undefined,
      vencimiento: filtVenc || undefined,
      estadoDocs:  filtEst  || undefined,
    }),
    staleTime: 30_000,
  })

  // Client-side filters for tipo, cia, pct
  const filteredRows = rows.filter(r => {
    if (filtTipo && r.tipoCliente !== filtTipo) return false
    if (filtCia  && !r.companias.includes(filtCia)) return false
    if (filtPct) {
      if (filtPct === '80'    && r.cumplimiento < 80) return false
      if (filtPct === '50-79' && (r.cumplimiento < 50 || r.cumplimiento > 79)) return false
      if (filtPct === '0-49'  && r.cumplimiento >= 50) return false
    }
    return true
  }).sort((a, b) => ESTADO_ORDEN[a.estadoDocs] - ESTADO_ORDEN[b.estadoDocs])

  // KPIs
  const total       = filteredRows.length
  const vencidosRows  = filteredRows.filter(r => r.vencimiento.status === 'vencido')
  const porVencerRows = filteredRows.filter(r => r.vencimiento.status === 'por-vencer')
  const vencidos  = vencidosRows.length
  const porVencer = porVencerRows.length
  const completos = filteredRows.filter(r => r.estadoDocs === 'completo').length

  // Dashboard de cumplimiento — distribución por rango + promedio por compañía
  const distGestionados = filteredRows.filter(r => r.cumplimiento >= 80).length
  const distEnProceso   = filteredRows.filter(r => r.cumplimiento >= 50 && r.cumplimiento < 80).length
  const distCriticos    = filteredRows.filter(r => r.cumplimiento < 50).length
  const promedioGeneral = total > 0 ? Math.round(filteredRows.reduce((acc, r) => acc + r.cumplimiento, 0) / total) : 0

  const companiasStats = (() => {
    const acc: Record<string, { suma: number; count: number }> = {}
    for (const r of filteredRows) {
      for (const c of r.companias) {
        acc[c] ??= { suma: 0, count: 0 }
        acc[c].suma += r.cumplimiento
        acc[c].count += 1
      }
    }
    return Object.entries(acc)
      .map(([nombre, { suma, count }]) => ({ nombre, promedio: Math.round(suma / count), count }))
      .sort((a, b) => b.promedio - a.promedio)
  })()

  const pagination = usePagination(filteredRows, {
    resetDeps: [search, filtVenc, filtEst, filtTipo, filtCia, filtPct],
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Gestión Documental</h2>
          <p className="text-xs text-muted">BASC · 18 documentos · Solo clientes activos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExcel(filteredRows)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-xs font-semibold transition-colors hover:bg-surface3"
            style={{ borderColor: '#00e676', color: '#00e676' }}
          >
            <Download size={13} />
            Exportar Excel
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-muted hover:text-foreground hover:bg-surface3 text-xs transition-colors"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alert banners — con detalle por cliente, clicable al detalle */}
      {(vencidos > 0 || porVencer > 0) && (
        <div className="space-y-2">
          {vencidos > 0 && (
            <AlertBanner
              icon={AlertTriangle}
              color="red"
              label={`${vencidos} cliente${vencidos > 1 ? 's' : ''} con documentación VENCIDA`}
              rows={vencidosRows}
              onSelect={(row) => navigate(`/gestion-documental/${row.id}`)}
            />
          )}
          {porVencer > 0 && (
            <AlertBanner
              icon={Clock}
              color="amber"
              label={`${porVencer} cliente${porVencer > 1 ? 's' : ''} con documentación próxima a vencer (≤60 días)`}
              rows={porVencerRows}
              onSelect={(row) => navigate(`/gestion-documental/${row.id}`)}
            />
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="crm-kpi-strip">
        <StatBadge label="Total clientes" value={total}     color="var(--text2)" />
        <StatBadge label="Completos"       value={completos} color="var(--green)" />
        <StatBadge label="Por vencer"      value={porVencer} color="var(--gold)" />
        <StatBadge label="Vencidos"        value={vencidos}  color="var(--red)" />
      </div>

      {/* Dashboard de cumplimiento */}
      {total > 0 && (
        <div className="card-glass rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">Distribución de cumplimiento</span>
            <span className="text-sm font-display font-bold" style={{ color: pctColor(promedioGeneral) }}>
              Promedio general: {promedioGeneral}%
            </span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
            {distGestionados > 0 && <div style={{ width: `${(distGestionados / total) * 100}%`, background: '#34d399' }} title={`${distGestionados} gestionados (≥80%)`} />}
            {distEnProceso   > 0 && <div style={{ width: `${(distEnProceso / total) * 100}%`,   background: '#f59e0b' }} title={`${distEnProceso} en proceso (50–79%)`} />}
            {distCriticos    > 0 && <div style={{ width: `${(distCriticos / total) * 100}%`,    background: '#f87171' }} title={`${distCriticos} críticos (<50%)`} />}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#34d399' }} />Gestionados (≥80%): <strong className="text-foreground">{distGestionados}</strong></span>
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#f59e0b' }} />En proceso (50–79%): <strong className="text-foreground">{distEnProceso}</strong></span>
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#f87171' }} />Críticos (&lt;50%): <strong className="text-foreground">{distCriticos}</strong></span>
          </div>

          {companiasStats.length > 0 && (
            <div className="pt-3 border-t border-border/50 space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">Cumplimiento por compañía logística</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {companiasStats.map(c => (
                  <div key={c.nombre} className="rounded-lg border border-border bg-surface2 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">{c.nombre}</span>
                      <span className="font-mono font-bold flex-shrink-0" style={{ color: pctColor(c.promedio) }}>{c.promedio}%</span>
                    </div>
                    <div className="h-1.5 mt-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.promedio}%`, background: pctColor(c.promedio) }} />
                    </div>
                    <div className="text-[10px] text-muted mt-1">{c.count} cliente{c.count > 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa o NIT..."
          className="filter-input"
        />
        <select value={filtTipo} onChange={e => setFiltTipo(e.target.value)} className="filter-select">
          <option value="">Todos los tipos</option>
          <option value="directo">Directo</option>
          <option value="indirecto">Intermediario</option>
          <option value="referido">Referido</option>
        </select>
        <select value={filtCia} onChange={e => setFiltCia(e.target.value)} className="filter-select">
          <option value="">Todas las compañías</option>
          <option value="Logimat">Logimat</option>
          <option value="IMC Depósito">IMC Depósito</option>
          <option value="IMC Cargo">IMC Cargo</option>
          <option value="Aduana">Aduana</option>
        </select>
        <select value={filtPct} onChange={e => setFiltPct(e.target.value)} className="filter-select">
          <option value="">% Cumplimiento: Todos</option>
          <option value="80">≥ 80% — Gestionados</option>
          <option value="50-79">50–79% — En proceso</option>
          <option value="0-49">&lt; 50% — Críticos</option>
        </select>
        <select value={filtVenc} onChange={e => setFiltVenc(e.target.value)} className="filter-select">
          <option value="">Todos los vencimientos</option>
          <option value="con-tiempo">Al día</option>
          <option value="por-vencer">Por vencer (≤60 días)</option>
          <option value="vencido">Vencido</option>
          <option value="sin-fecha">Sin fecha</option>
        </select>
        <select
          value={filtEst}
          onChange={e => setFiltEst(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="completo">Completo</option>
          <option value="incompleto">Incompleto</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state py-12 text-muted">No hay clientes registrados.</div>
        }
      >
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr>
              <th className="text-left">Empresa</th>
              <th className="text-left">Tipo</th>
              <th className="text-left">Compañías</th>
              <th className="text-left">Ciclo</th>
              <th className="text-left w-[180px]">Cumplimiento</th>
              <th className="text-left">Estado docs</th>
              <th className="text-left">Última Act.</th>
              <th className="text-left">Próx. Act.</th>
              <th className="text-center">Días p/Vencer</th>
              <th className="text-left">Status</th>
              <th className="w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map(row => {
              const vStyle = VENC_STYLE[row.vencimiento.status]
              const VIcon = vStyle.icon
              const eStyle = ESTADO_STYLE[row.estadoDocs]
              const color = pctColor(row.cumplimiento)
              const anoActual = new Date().getFullYear()
              const desact = row.gd.cicloActual < anoActual
              const dias = row.vencimiento.diasRestantes

              return (
                <tr key={row.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => navigate(`/gestion-documental/${row.id}`)}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{row.empresa}</div>
                    {row.nit && <div className="text-muted text-xs">{row.nit}</div>}
                    <div className="text-muted text-xs">{row.comercial.nombre}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">{row.tipoCliente}</td>
                  <td className="px-4 py-3">
                    {row.companias.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.companias.map(c => (
                          <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{c}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
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
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(row.gd.updatedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(row.vencimiento.fechaVencimiento)}</td>
                  <td className="px-4 py-3 text-center">
                    {dias !== null ? (
                      <span className={`text-xs font-bold font-mono ${dias < 0 ? 'text-red-400' : dias <= 60 ? 'text-amber-400' : 'text-green-400'}`}>
                        {dias < 0 ? `${Math.abs(dias)}d` : `${dias}d`}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <VIcon size={13} style={{ color: vStyle.text }} />
                      <span className="text-xs font-medium" style={{ color: vStyle.text }}>{vStyle.label}</span>
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
      </DataListPanel>
    </div>
  )
}
