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
import { HTML_SERVICES, PIPELINE_CHART_COLORS, SVC_COLORS } from '../lib/htmlV6/constants'
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

function StatCard({ tone, label, value, sub }: {
  tone: 'blue' | 'cyan' | 'green' | 'gold' | 'purple' | 'red'
  label: string
  value: number | string
  sub: string
}) {
  const toneColor: Record<string, string> = {
    blue: '#38bdf8', cyan: '#00ffcc', green: '#34d399',
    gold: '#f59e0b', purple: '#a78bfa', red: '#f87171',
  }
  return (
    <div className={`html-stat-card ${tone}`}>
      <div className="html-stat-label">{label}</div>
      <div className="html-stat-value" style={{ color: toneColor[tone] }}>{value}</div>
      <div className="html-stat-sub">{sub}</div>
    </div>
  )
}

export default function Dashboard() {
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

  const recent = useMemo(() => [...recs].reverse().slice(0, 8), [recs])
  const recentCots = useMemo(() => [...cots].reverse().slice(0, 6), [cots])

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

  const cotPipelineData = [
    { name: 'Aprobada', value: cotStats.aprobadas, fill: 'rgba(0,230,118,0.8)' },
    { name: 'Borrador', value: cotStats.borradores, fill: 'rgba(136,153,180,0.5)' },
    { name: 'Enviada', value: cotStats.enviadas, fill: 'rgba(0,194,255,0.8)' },
    { name: 'Negociación', value: cotStats.negociacion, fill: 'rgba(245,166,35,0.8)' },
    { name: 'Rechazada', value: cotStats.rechazadas, fill: 'rgba(255,68,68,0.8)' },
    { name: 'Vencida', value: cotStats.vencidas, fill: 'rgba(200,50,50,0.6)' },
  ].filter((d) => d.value > 0)

  if (loadingRecords) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-surface2 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Filtros — HTML v6 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase tracking-[1.5px] text-muted font-semibold">Filtros:</span>
          <select
            className="input min-w-[190px] py-2 text-sm"
            value={filterCom}
            onChange={(e) => setFilterCom(e.target.value)}
          >
            <option value="">👥 Todos los comerciales</option>
            {comerciales.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <select
            className="input min-w-[160px] py-2 text-sm"
            value={filterMes}
            onChange={(e) => setFilterMes(e.target.value)}
          >
            <option value="">📅 Todos los meses</option>
            {mesOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="input min-w-[160px] py-2 text-sm"
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
          className="btn-secondary btn-sm text-xs border-accent text-accent"
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

      {/* KPIs — renderDashboard stats-row */}
      <div className="html-stats-row">
        <StatCard tone="blue" label="Total Registros" value={stats.total} sub="Empresas en sistema" />
        <StatCard tone="cyan" label="Prospectos" value={stats.prospectos} sub="En pipeline" />
        <StatCard tone="green" label="Clientes" value={stats.clientes} sub="Bajo gestión" />
        <StatCard tone="gold" label="Facturados" value={stats.facturados} sub="Prospectos facturados" />
        <StatCard tone="purple" label="En Gestión" value={stats.enPipeline} sub="Prospectos activos" />
        <StatCard tone="red" label="Visitas / Contactos" value={stats.visitas} sub="Total realizados" />
      </div>

      {/* Charts grid 1 */}
      <div className="html-charts-grid">
        <div className="html-chart-card">
          <div className="html-chart-title">Prospectos vs Clientes</div>
          <div className="html-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={tipoChart.labels.map((l, i) => ({ name: l, value: tipoChart.data[i] }))}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  stroke="#00c2ff" strokeWidth={2}>
                  <Cell fill="rgba(0,194,255,0.8)" />
                  <Cell fill="rgba(0,230,118,0.8)" />
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="html-chart-card">
          <div className="html-chart-title">Estado del Pipeline</div>
          <div className="html-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estadoChart.labels.map((l, i) => ({ name: l, count: estadoChart.data[i] }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={4}>
                  {estadoChart.data.map((_, i) => (
                    <Cell key={i} fill={PIPELINE_CHART_COLORS[i] || '#8899b4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="html-chart-card">
          <div className="html-chart-title">Servicios más Solicitados</div>
          <div className="html-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviciosChart.labels.map((l, i) => ({ name: l, count: serviciosChart.data[i] }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={6}>
                  {serviciosChart.colors.map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="html-chart-card">
          <div className="html-chart-title">Actividad por Comercial</div>
          <div className="html-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comercialData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Prospectos" fill="rgba(0,194,255,0.7)" radius={4} />
                <Bar dataKey="Clientes" fill="rgba(0,230,118,0.7)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Facturación por línea — renderBillingDashboard */}
      <div className="html-chart-card mb-5">
        <div className="html-chart-title">💰 Facturación por Línea de Negocio</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] uppercase tracking-[1.5px] text-muted mb-3.5">
              Valor Facturado por Servicio (COP)
            </div>
            {HTML_SERVICES.map((s) => {
              const val = billing.totals[s] || 0
              const pct = billing.grandTotal > 0 ? Math.round((val / billing.grandTotal) * 100) : 0
              const color = SVC_COLORS[s] || '#00c2ff'
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
            <div className="h-[200px]">
              {HTML_SERVICES.some((s) => billing.totals[s] > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={HTML_SERVICES.filter((s) => billing.totals[s] > 0).map((s) => ({
                        name: s, value: Math.round(billing.totals[s]),
                      }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      stroke="#111827" strokeWidth={3}
                    >
                      {HTML_SERVICES.filter((s) => billing.totals[s] > 0).map((s) => (
                        <Cell key={s} fill={SVC_COLORS[s]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `$${v.toLocaleString('es-CO')}`} />
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
        <div className="html-stats-row mb-4">
          <StatCard tone="blue" label="Total Cotizaciones" value={cotStats.total} sub="Emitidas" />
          <StatCard tone="green" label="Aprobadas" value={cotStats.aprobadas} sub="Confirmadas" />
          <StatCard tone="gold" label="En Curso" value={cotStats.enCurso} sub="Borrador · Enviada · Neg." />
          <StatCard tone="red" label="Vencidas" value={cotStats.vencidas} sub="Sin respuesta" />
        </div>

        <div className="html-charts-grid mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="html-chart-card">
            <div className="html-chart-title">📄 Pipeline de Cotizaciones</div>
            <div className="h-[200px]">
              {cotStats.total > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={cotPipelineData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70}>
                      {cotPipelineData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state py-10 text-center text-muted text-sm">
                  <div className="text-3xl mb-2">📄</div>Sin cotizaciones aún
                </div>
              )}
            </div>
          </div>
          <div className="html-chart-card">
            <div className="html-chart-title">📊 Líneas más Cotizadas</div>
            <div className="h-[200px]">
              {cotLineas.labels.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cotLineas.labels.map((l, i) => ({ name: l, count: cotLineas.data[i] }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={4}>
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

        <div className="table-card">
          <div className="table-header flex justify-between items-center">
            <span className="table-title">📄 Cotizaciones Recientes</span>
            <Link to="/cotizaciones" className="btn-secondary btn-sm text-xs">Ver todas →</Link>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>N°</th><th>Empresa</th><th>Líneas</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentCots.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state py-8">Sin cotizaciones</div></td></tr>
                ) : recentCots.map((c) => {
                  const badge = cotEstadoBadge(c)
                  return (
                    <tr key={c.id}>
                      <td><strong>{c.numero || '—'}</strong></td>
                      <td>{c.empresa || '—'}</td>
                      <td>
                        <div>{(c.lineas ?? []).map((s) => <span key={s} className="html-stag">{s}</span>)}</div>
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
          </div>
        </div>
      </div>

      {/* Timeline + Gestión */}
      <div className="html-charts-grid mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <div className="html-chart-card">
          <div className="html-chart-title">Registros por Mes</div>
          <div className="html-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="prospectos" name="Prospectos" stroke="#00c2ff" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="clientes" name="Clientes" stroke="#00e676" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="html-chart-card">
          <div className="html-chart-title">Gestión Clientes</div>
          <div className="html-chart-wrap">
            {gestion.hasClientes ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gestion.labels.map((l, i) => ({ name: l, count: gestion.data[i] }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={6} fill="rgba(0,230,118,0.75)" />
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
      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Últimos Registros</span>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th><th>Tipo</th><th>Comercial</th><th>Servicios</th><th>Estado</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state py-8">Sin registros</div></td></tr>
              ) : recent.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.empresa}</strong></td>
                  <td>
                    {r.tipo === 'prospecto'
                      ? <span className="badge-blue">Prospecto</span>
                      : <span className="badge-green">Cliente</span>}
                  </td>
                  <td className="text-xs">{r.comercial?.nombre ?? '—'}</td>
                  <td>
                    {(r.servicios ?? []).slice(0, 3).map((s) => <span key={s} className="html-stag">{s}</span>)}
                    {(r.servicios?.length ?? 0) > 3 && <span className="html-stag">+{r.servicios!.length - 3}</span>}
                  </td>
                  <td><EstadoBadge rec={r} /></td>
                  <td className="text-xs text-muted">{r.fecha?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
