import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { getRecords } from '../api/records'
import { getCotizaciones } from '../api/cotizaciones'
import { getComercialesApi } from '../api/comerciales'
import { COT_PIPELINE_CHART, HTML_SERVICES, PIPELINE_CHART_COLORS, SVC_COLORS } from '../lib/htmlV6/domainConfig'
import {
  barActiveBar,
  CHART_AXIS,
  CHART_AXIS_Y_CATEGORY,
  CHART_BAR_COMERCIAL,
  CHART_DONUT_TIPO,
  CHART_GESTION_CLIENTES,
  CHART_GRID,
  CHART_LINE_TIMELINE,
  CHART_MUTED_FALLBACK,
  CHART_PIE_STROKE_DARK,
  chartLegendProps,
  chartTooltipProps,
  currencyTooltipFormatter,
  PIPELINE_YAXIS_WIDTH,
} from '../lib/htmlV6/chartTheme'
import { PieActiveShape } from '../lib/htmlV6/PieActiveShape'
import {
  buildMesOptions,
  computeBillingTotals,
  computeComercialChart,
  computeCotLineasChart,
  computeCotStats,
  computeEstadoChart,
  computeGestionChart,
  computeMainStats,
  computeServiciosChart,
  computeTimelineChart,
  computeTipoChart,
  cotEstadoBadge,
  filterRecords,
} from '../lib/htmlV6/dashboardCompute'
import { EstadoBadge } from '../lib/htmlV6/estadoBadge'
import { cotFechaDisplay } from '../lib/htmlV6/cotUtils'
import { exportRecordsExcel } from '../utils/exportExcel'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'
import { GerencialPanel } from './DashboardGerencial'

export function StatCard({ tone, label, value, sub }: {
  tone: 'blue' | 'cyan' | 'green' | 'gold' | 'purple' | 'red'
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

export default function Dashboard() {
  const [view, setView] = useState<'operativo' | 'gerencial'>('operativo')
  const [filterCom, setFilterCom] = useState('')
  const [filterMes, setFilterMes] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const { data: allRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['records-all-dashboard'],
    queryFn: () => getRecords(),
    staleTime: 60_000,
  })

  const { data: cots = [] } = useQuery({
    queryKey: ['cotizaciones-all-dashboard'],
    queryFn: () => getCotizaciones(),
    staleTime: 60_000,
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const mesOptions = useMemo(() => buildMesOptions(allRecords), [allRecords])

  const recs = useMemo(
    () => filterRecords(allRecords, { comercialId: filterCom, mes: filterMes, tipo: filterTipo }),
    [allRecords, filterCom, filterMes, filterTipo],
  )

  const stats = useMemo(() => computeMainStats(recs), [recs])
  const billing = useMemo(() => computeBillingTotals(recs), [recs])
  const cotStats = useMemo(() => computeCotStats(cots), [cots])
  const tipoChart = useMemo(() => computeTipoChart(recs), [recs])
  const estadoChart = useMemo(() => computeEstadoChart(recs), [recs])
  const serviciosChart = useMemo(() => computeServiciosChart(recs), [recs])
  const comercialChart = useMemo(
    () => computeComercialChart(recs, comerciales, filterCom),
    [recs, comerciales, filterCom],
  )
  const timeline = useMemo(() => computeTimelineChart(recs), [recs])
  const gestion = useMemo(() => computeGestionChart(recs), [recs])
  const cotLineas = useMemo(() => computeCotLineasChart(cots), [cots])

  const recentAll = useMemo(() => [...recs].reverse(), [recs])
  const recentCotsAll = useMemo(() => [...cots].reverse(), [cots])
  const recentPagination = usePagination(recentAll, { resetDeps: [filterCom, filterMes, filterTipo] })
  const recentCotsPagination = usePagination(recentCotsAll)

  const bannerParts: string[] = []
  if (filterCom) {
    const c = comerciales.find((x) => x.id === filterCom)
    bannerParts.push(`👤 ${c?.nombre ?? '—'}`)
  }
  if (filterMes) {
    const opt = mesOptions.find((o) => o.value === filterMes)
    bannerParts.push(`📅 ${opt?.label ?? filterMes}`)
  }
  if (filterTipo) {
    bannerParts.push(filterTipo === 'prospecto' ? '🎯 Solo Prospectos' : '🏢 Solo Clientes')
  }

  const comercialData = comercialChart.labels.map((label, i) => ({
    name: label,
    Prospectos: comercialChart.prospectos[i],
    Clientes: comercialChart.clientes[i],
  }))

  const cotPipelineData = COT_PIPELINE_CHART
    .map(({ key, name, fill }) => ({ name, value: cotStats[key], fill }))
    .filter((d) => d.value > 0)

  if (loadingRecords) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-surface2 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tabs: Operativo / Gerencial */}
      <div className="flex bg-surface2 border border-border rounded-lg p-0.5 text-xs w-fit">
        <button
          type="button"
          onClick={() => setView('operativo')}
          className={`px-3 py-1.5 rounded-md transition-colors ${view === 'operativo' ? 'bg-accent/15 text-accent font-semibold' : 'text-muted hover:text-foreground'}`}
        >
          📊 Dashboard Operativo
        </button>
        <button
          type="button"
          onClick={() => setView('gerencial')}
          className={`px-3 py-1.5 rounded-md transition-colors ${view === 'gerencial' ? 'bg-accent/15 text-accent font-semibold' : 'text-muted hover:text-foreground'}`}
        >
          📈 Dashboard Gerencial
        </button>
      </div>

      {/* Filtros — HTML v6 */}
      <div className="filter-bar filter-bar--page">
        <div className="filter-bar-group">
          <span className="filter-bar-label">Filtros:</span>
          <select
            className="filter-select"
            value={filterCom}
            onChange={(e) => setFilterCom(e.target.value)}
          >
            <option value="">👥 Todos los comerciales</option>
            {comerciales.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
          >
            <option value="">📅 Todos los meses</option>
            {mesOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <option value="">📋 Todos los tipos</option>
            <option value="prospecto">🎯 Prospectos</option>
            <option value="cliente">🏢 Clientes Antiguos</option>
          </select>
        </div>
        <button
          type="button"
          className="btn-secondary btn-sm text-xs border-accent text-accent shrink-0"
          onClick={() => exportRecordsExcel(recs, 'registros-dashboard.xlsx')}
        >
          📥 Exportar Excel
        </button>
      </div>

      {bannerParts.length > 0 && (
        <div className="mb-5 rounded-[10px] border border-accent/30 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent">
          Filtros activos: {bannerParts.join(' · ')}
          <span className="ml-2 text-xs font-normal text-muted">({recs.length} registros)</span>
        </div>
      )}

      {view === 'gerencial' && <GerencialPanel recs={recs} />}

      {view === 'operativo' && <>
      {/* KPIs — renderDashboard stats-row */}
      <div className="stats-row">
        <StatCard tone="blue" label="Total Registros" value={stats.total} sub="Empresas en sistema" />
        <StatCard tone="cyan" label="Prospectos" value={stats.prospectos} sub="En pipeline" />
        <StatCard tone="green" label="Clientes" value={stats.clientes} sub="Bajo gestión" />
        <StatCard tone="gold" label="Facturados" value={stats.facturados} sub="Prospectos facturados" />
        <StatCard tone="purple" label="En Gestión" value={stats.enPipeline} sub="Prospectos activos" />
        <StatCard tone="red" label="Visitas / Contactos" value={stats.visitas} sub="Total realizados" />
      </div>

      {/* Charts grid 1 */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Prospectos vs Clientes</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  nameKey="name"
                  activeShape={PieActiveShape}
                  data={tipoChart.labels.map((l, i) => ({ name: l, value: tipoChart.data[i] }))}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  stroke={CHART_DONUT_TIPO.prospecto.stroke} strokeWidth={2}
                >
                  <Cell fill={CHART_DONUT_TIPO.prospecto.fill} />
                  <Cell fill={CHART_DONUT_TIPO.cliente.fill} />
                </Pie>
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Estado del Pipeline</div>
          <div className="chart-wrap chart-wrap--pipeline">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={estadoChart.labels.map((l, i) => ({ name: l, count: estadoChart.data[i] }))}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 4 }}
                barCategoryGap="20%"
                barSize={14}
              >
                <CartesianGrid {...CHART_GRID} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={CHART_AXIS.tick} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={PIPELINE_YAXIS_WIDTH}
                  tick={CHART_AXIS_Y_CATEGORY.tick}
                  axisLine={CHART_AXIS_Y_CATEGORY.axisLine}
                  tickLine={false}
                  interval={0}
                />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="count" radius={4} activeBar={barActiveBar}>
                  {estadoChart.data.map((_, i) => (
                    <Cell key={i} fill={PIPELINE_CHART_COLORS[i] || CHART_MUTED_FALLBACK} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Servicios más Solicitados</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviciosChart.labels.map((l, i) => ({ name: l, count: serviciosChart.data[i] }))}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS.tick} />
                <YAxis allowDecimals={false} tick={CHART_AXIS.tick} />
                <Tooltip {...chartTooltipProps} />
                <Bar dataKey="count" radius={6} activeBar={barActiveBar}>
                  {serviciosChart.colors.map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Actividad por Comercial</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comercialData}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS.tick} />
                <YAxis allowDecimals={false} tick={CHART_AXIS.tick} />
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Bar dataKey="Prospectos" fill={CHART_BAR_COMERCIAL.prospectos} radius={4} activeBar={barActiveBar} />
                <Bar dataKey="Clientes" fill={CHART_BAR_COMERCIAL.clientes} radius={4} activeBar={barActiveBar} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Facturación por línea — renderBillingDashboard */}
      <div className="chart-card mb-5">
        <div className="chart-title">💰 Facturación por Línea de Negocio</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] uppercase tracking-[1.5px] text-muted mb-3.5">
              Valor Facturado por Servicio (COP)
            </div>
            {HTML_SERVICES.map((s) => {
              const val = billing.totals[s] || 0
              const pct = billing.grandTotal > 0 ? Math.round((val / billing.grandTotal) * 100) : 0
              const color = SVC_COLORS[s] || CHART_DONUT_TIPO.prospecto.stroke
              const width = val > 0 ? Math.max((val / billing.maxVal) * 100, 2) : 0
              return (
                <div key={s} className="mb-3.5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                      {s}
                    </div>
                    <div className="text-right">
                      <span className="font-bold" style={{ color, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        ${Math.round(val).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[11px] text-muted ml-1.5">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-surface2 rounded overflow-hidden">
                    <div className="h-full rounded transition-all" style={{ width: `${width}%`, background: color }} />
                  </div>
                </div>
              )
            })}
            <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-border">
              <span className="text-xs uppercase tracking-wide text-muted font-semibold">Total General</span>
              <span className="text-[28px] font-extrabold text-gold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                ${Math.round(billing.grandTotal).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[1.5px] text-muted mb-3.5">Distribución %</div>
            <div className="chart-wrap">
              {HTML_SERVICES.some((s) => billing.totals[s] > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={HTML_SERVICES.filter((s) => billing.totals[s] > 0).map((s) => ({
                        name: s, value: Math.round(billing.totals[s]),
                      }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      activeShape={PieActiveShape}
                      stroke={CHART_PIE_STROKE_DARK} strokeWidth={3}
                    >
                      {HTML_SERVICES.filter((s) => billing.totals[s] > 0).map((s) => (
                        <Cell key={s} fill={SVC_COLORS[s]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipProps} formatter={currencyTooltipFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state text-sm h-full flex items-center justify-center">Sin facturación</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cotizaciones — renderCotDashboard */}
      <div className="mb-5">
        <div className="stats-row mb-4">
          <StatCard tone="blue" label="Total Cotizaciones" value={cotStats.total} sub="Emitidas" />
          <StatCard tone="green" label="Aprobadas" value={cotStats.aprobadas} sub="Confirmadas" />
          <StatCard tone="gold" label="En Curso" value={cotStats.enCurso} sub="Borrador · Enviada · Neg." />
          <StatCard tone="red" label="Vencidas" value={cotStats.vencidas} sub="Sin respuesta" />
        </div>

        <div className="charts-grid mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="chart-card">
            <div className="chart-title">📄 Pipeline de Cotizaciones</div>
            <div className="chart-wrap">
              {cotStats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cotPipelineData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      activeShape={PieActiveShape}
                    >
                      {cotPipelineData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Tooltip {...chartTooltipProps} />
                    <Legend {...chartLegendProps} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-10 text-center text-muted text-sm">
                  <div className="text-3xl mb-2">📄</div>Sin cotizaciones aún
                </div>
              )}
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-title">📊 Líneas más Cotizadas</div>
            <div className="chart-wrap">
              {cotLineas.labels.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cotLineas.labels.map((l, i) => ({ name: l, count: cotLineas.data[i] }))}>
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="name" tick={CHART_AXIS.tick} />
                    <YAxis allowDecimals={false} tick={CHART_AXIS.tick} />
                    <Tooltip {...chartTooltipProps} />
                    <Bar dataKey="count" radius={4} activeBar={barActiveBar}>
                      {cotLineas.colors.map((c, i) => <Cell key={i} fill={c} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-10 text-center text-muted text-sm">
                  <div className="text-3xl mb-2">📊</div>Sin líneas cotizadas aún
                </div>
              )}
            </div>
          </div>
        </div>

        <DataListPanel
          pagination={recentCotsPagination}
          header={
            <div className="table-header flex justify-between items-center">
              <span className="table-title">📄 Cotizaciones Recientes</span>
              <Link to="/cotizaciones" className="btn-secondary btn-sm text-xs">Ver todas →</Link>
            </div>
          }
          empty={<div className="empty-state py-8">Sin cotizaciones</div>}
        >
          <table>
            <thead>
              <tr>
                <th>N°</th><th>Empresa</th><th>Líneas</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recentCotsPagination.pageItems.map((c) => {
                const badge = cotEstadoBadge(c)
                return (
                  <tr key={c.id}>
                    <td><strong>{c.numero || '—'}</strong></td>
                    <td>{c.empresa || '—'}</td>
                    <td>
                      <div>{(c.lineas ?? []).map((s) => <span key={s} className="stag">{s}</span>)}</div>
                    </td>
                    <td><span className={`badge ${badge.className}`}>{badge.label}</span></td>
                    <td className="text-xs text-muted">{cotFechaDisplay(c)}</td>
                    <td>
                      <Link to={`/cotizaciones/${c.id}/editar`} className="btn-secondary btn-sm text-xs">Ver</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataListPanel>
      </div>

      {/* Timeline + Gestión */}
      <div className="charts-grid mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Registros por Mes</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="label" tick={CHART_AXIS.tick} />
                <YAxis allowDecimals={false} tick={CHART_AXIS.tick} />
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Line type="monotone" dataKey="prospectos" name="Prospectos" stroke={CHART_LINE_TIMELINE.prospectos} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6, strokeWidth: 2 }} />
                <Line type="monotone" dataKey="clientes" name="Clientes" stroke={CHART_LINE_TIMELINE.clientes} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Gestión Clientes</div>
          <div className="chart-wrap">
            {gestion.hasClientes ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gestion.labels.map((l, i) => ({ name: l, count: gestion.data[i] }))}
                  layout="vertical"
                >
                  <CartesianGrid {...CHART_GRID} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={CHART_AXIS.tick} />
                  <YAxis type="category" dataKey="name" width={90} tick={CHART_AXIS.tick} />
                  <Tooltip {...chartTooltipProps} />
                  <Bar dataKey="count" radius={6} fill={CHART_GESTION_CLIENTES} activeBar={barActiveBar} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state py-10 text-center text-muted text-sm">
                <div className="text-3xl mb-2">🏢</div>Sin clientes registrados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimos registros */}
      <DataListPanel
        pagination={recentPagination}
        header={
          <div className="table-header">
            <span className="table-title">Últimos Registros</span>
          </div>
        }
        empty={<div className="empty-state py-8">Sin registros</div>}
      >
        <table>
          <thead>
            <tr>
              <th>Empresa</th><th>Tipo</th><th>Comercial</th><th>Servicios</th><th>Estado</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recentPagination.pageItems.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.empresa}</strong></td>
                <td>
                  {r.tipo === 'prospecto'
                    ? <span className="badge-blue">Prospecto</span>
                    : <span className="badge-green">Cliente</span>}
                </td>
                <td className="text-xs">{r.comercial?.nombre ?? '—'}</td>
                <td>
                  {(r.servicios ?? []).slice(0, 3).map((s) => <span key={s} className="stag">{s}</span>)}
                  {(r.servicios?.length ?? 0) > 3 && <span className="stag">+{r.servicios!.length - 3}</span>}
                </td>
                <td><EstadoBadge rec={r} /></td>
                <td className="text-xs text-muted">{r.fecha?.slice(0, 10) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataListPanel>
      </>}
    </div>
  )
}
