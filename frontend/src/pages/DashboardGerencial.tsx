import { useMemo } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { CRMRecord } from '../types'
import {
  barActiveBar,
  CHART_AXIS,
  CHART_AXIS_Y_CATEGORY,
  CHART_GRID,
  chartTooltipProps,
  currencyTooltipFormatter,
  PIPELINE_YAXIS_WIDTH,
} from '../lib/htmlV6/chartTheme'
import { PieActiveShape } from '../lib/htmlV6/PieActiveShape'
import {
  computeAbandonoFunnel,
  computeGerencialKpis,
  computeIngresosComercialChart,
  computeTiempoCierreChart,
} from '../lib/htmlV6/dashboardCompute'
import { fmtMoney } from '../utils/fmtMoney'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'
import { StatCard } from './Dashboard'

const RIESGO_COLORS = ['#00e676', '#f5a623', '#ff4444']

export function GerencialPanel({ recs }: { recs: CRMRecord[] }) {
  const prospectos = useMemo(() => recs.filter((r) => r.tipo === 'prospecto'), [recs])

  const kpis = useMemo(() => computeGerencialKpis(recs), [recs])
  const tiempoChart = useMemo(() => computeTiempoCierreChart(prospectos), [prospectos])
  const ingresosChart = useMemo(() => computeIngresosComercialChart(recs), [recs])
  const funnel = useMemo(() => computeAbandonoFunnel(prospectos), [prospectos])

  const riesgoData = [
    { name: 'Activos', value: kpis.activos },
    { name: 'En Riesgo', value: kpis.enRiesgo },
    { name: 'Inactivos', value: kpis.inactivos },
  ].filter((d) => d.value > 0)

  const vencerPagination = usePagination(kpis.vencerList, { resetDeps: [recs] })

  return (
    <div className="space-y-4">
      <div className="stats-row">
        <StatCard tone="blue" label="Tasa Conversión" value={`${kpis.tasaConversion}%`} sub={`${kpis.convertidos} de ${kpis.totalProspectos} prospectos`} />
        <StatCard tone="gold" label="Tiempo de Cierre" value={`${kpis.diasCierre}d`} sub="Promedio por negocio cerrado" />
        <StatCard tone="green" label="Ingresos Realizados" value={fmtMoney(kpis.ingresosRealizados)} sub={`Esperados: ${fmtMoney(kpis.ingresosEsperados)}`} />
        <StatCard tone={kpis.pctRiesgo > 25 ? 'red' : 'purple'} label="Clientes en Riesgo" value={`${kpis.pctRiesgo}%`} sub={`${kpis.enRiesgo} de ${kpis.totalClientes} clientes`} />
        <StatCard tone="red" label="Seguim. Vencidos" value={kpis.vencidos} sub={`${kpis.totalVencer} en alerta (≤7 días)`} />
        <StatCard tone="cyan" label="Total Portafolio" value={kpis.totalPortafolio} sub={`${kpis.totalProspectos} prospectos · ${kpis.totalClientes} clientes`} />
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="chart-card">
          <div className="chart-title">Tiempo Promedio de Cierre por Etapa</div>
          <div className="chart-wrap chart-wrap--pipeline">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tiempoChart}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
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
                <Tooltip {...chartTooltipProps} formatter={(v: number) => [`${v} días`, 'Promedio']} />
                <Bar dataKey="dias" radius={4} activeBar={barActiveBar} fill="#00c2ff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">% Clientes por Estado de Relación</div>
          <div className="chart-wrap">
            {riesgoData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    nameKey="name"
                    data={riesgoData}
                    activeShape={PieActiveShape}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    strokeWidth={2}
                  >
                    {riesgoData.map((d, i) => <Cell key={d.name} fill={RIESGO_COLORS[i]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipProps} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state text-sm h-full flex items-center justify-center">Sin clientes registrados</div>
            )}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Ingresos Esperados vs. Realizados por Comercial</div>
        <div className="chart-wrap">
          {ingresosChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ingresosChart}>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey="name" tick={CHART_AXIS.tick} />
                <YAxis tick={CHART_AXIS.tick} tickFormatter={(v: number) => fmtMoney(v)} />
                <Tooltip {...chartTooltipProps} formatter={currencyTooltipFormatter} />
                <Bar dataKey="Esperado" fill="rgba(0,194,255,0.5)" radius={4} activeBar={barActiveBar} />
                <Bar dataKey="Realizado" fill="rgba(0,230,118,0.8)" radius={4} activeBar={barActiveBar} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state text-sm h-full flex items-center justify-center">Sin datos de ingresos</div>
          )}
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">Tasa de Abandono por Etapa del Pipeline</div>
        <div className="space-y-2 pt-2">
          {funnel.map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <div className="w-40 shrink-0 text-right text-xs text-muted">{f.label}</div>
              <div className="flex-1 h-7 bg-surface2 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center pl-2.5 text-[11px] font-bold text-black transition-all"
                  style={{ width: `${f.pctBarra}%`, background: f.color }}
                >
                  {f.n} prospectos
                </div>
              </div>
              <div
                className="w-14 shrink-0 text-right text-xs font-extrabold"
                style={{ color: f.abandono > 50 ? '#ff4444' : f.abandono > 25 ? '#f5a623' : '#00e676' }}
              >
                {f.esUltima ? '—' : `-${f.abandono}%`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <DataListPanel
        pagination={vencerPagination}
        header={
          <div className="table-header flex justify-between items-center">
            <span className="table-title">⏰ Prospectos con Seguimiento Vencido o Por Vencer</span>
            <span className="text-xs text-muted">
              {kpis.totalVencer > 0 ? `${kpis.vencidos} vencidos · ${kpis.totalVencer} en alerta` : 'Sin alertas activas'}
            </span>
          </div>
        }
        empty={<div className="empty-state py-8">Sin prospectos con seguimiento próximo a vencer</div>}
      >
        <table>
          <thead>
            <tr>
              <th>Empresa</th><th>Comercial</th><th>Ingresos Esperados</th><th>Fecha Seguimiento</th><th>Urgencia</th>
            </tr>
          </thead>
          <tbody>
            {vencerPagination.pageItems.map(({ rec, dias }) => {
              const urgencia = dias <= 0
                ? { cls: 'badge-red', label: `🔴 ${Math.abs(dias)}d vencido` }
                : dias <= 3
                  ? { cls: 'badge-gold', label: `⚠️ Urgente (${dias}d)` }
                  : { cls: 'badge-blue', label: `📅 Próximo (${dias}d)` }
              return (
                <tr key={rec.id}>
                  <td><strong>{rec.empresa}</strong></td>
                  <td className="text-xs">{rec.comercial?.nombre ?? '—'}</td>
                  <td className="text-xs">
                    {rec.ingresosEsperados ? `$${Math.round(rec.ingresosEsperados).toLocaleString('es-CO')}` : '—'}
                  </td>
                  <td className="text-xs text-muted">{rec.proximoSeguimiento?.slice(0, 10) ?? '—'}</td>
                  <td><span className={`badge ${urgencia.cls}`}>{urgencia.label}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataListPanel>
    </div>
  )
}
