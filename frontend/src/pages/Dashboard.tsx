import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { getDashboardStats, getDashboardCharts, getRankingApi } from '../api/dashboard'
import { getComercialesApi } from '../api/comerciales'
import StatCard from '../components/StatCard'
import { fmtCOP } from '../utils/format'

const PIE_COLORS = ['#00c2ff', '#a855f7', '#00e676', '#f5a623', '#ff6b6b', '#00ffcc']

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 },
  labelStyle: { color: '#e8edf5' },
}

export default function Dashboard() {
  const [comercialId, setComercialId] = useState('')
  const [mes, setMes] = useState('')

  const filters = {
    ...(comercialId ? { comercial_id: comercialId } : {}),
    ...(mes ? { mes } : {}),
  }

  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats', filters],
    queryFn: () => getDashboardStats(filters),
  })

  const { data: charts } = useQuery({
    queryKey: ['dashboard', 'charts', filters],
    queryFn: () => getDashboardCharts(filters),
  })

  const { data: comerciales } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: ranking } = useQuery({
    queryKey: ['dashboard', 'ranking'],
    queryFn: getRankingApi,
  })

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Dashboard
        </h1>
        <div className="flex gap-3">
          <select
            className="w-44"
            value={comercialId}
            onChange={(e) => setComercialId(e.target.value)}
          >
            <option value="">Todos los comerciales</option>
            {comerciales?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <input
            type="month"
            className="w-36"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Records"   value={stats?.total_records ?? 0}    accent="#00c2ff" />
        <StatCard label="Prospectos"      value={stats?.total_prospectos ?? 0}  accent="#a855f7" />
        <StatCard label="Clientes"        value={stats?.total_clientes ?? 0}    accent="#00e676" />
        <StatCard label="Facturación"     value={fmtCOP(stats?.total_facturado)} accent="#f5a623" />
        <StatCard label="Cotizaciones"    value={stats?.total_cotizaciones ?? 0} accent="#00c2ff" />
        <StatCard label="Aprobadas"       value={stats?.cotizaciones_por_estado?.aprobada ?? 0} accent="#00e676" />
      </div>

      {/* Fila 1 — Registros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Prospectos vs Clientes */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Prospectos vs Clientes
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={charts?.prospectos_vs_clientes ?? []}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {charts?.prospectos_vs_clientes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline por Estado */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Pipeline por Estado
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.pipeline_estados ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#00c2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servicios Solicitados */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Servicios Solicitados
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.servicios_solicitados ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={110} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Actividad por Comercial */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Actividad por Comercial
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.actividad_por_comercial?.map(c => ({ name: c.name, value: c.total })) ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#8899b4', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#00e676" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fila 2 — Cotizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Pipeline Cotizaciones */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Pipeline Cotizaciones
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={charts?.pipeline_cotizaciones ?? []}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {charts?.pipeline_cotizaciones.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Líneas Cotizadas */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Líneas más Cotizadas
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.lineas_cotizadas ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={100} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#f5a623" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Facturación por Línea */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Facturación por Línea
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.billing_por_linea ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={100} />
              <Tooltip
                {...TOOLTIP_STYLE}
                formatter={(v: number) => fmtCOP(v)}
              />
              <Bar dataKey="value" fill="#00ffcc" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking por Comercial */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
          Ranking por Comercial
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left pb-3 font-condensed">#</th>
                <th className="text-left pb-3 font-condensed">Comercial</th>
                <th className="text-right pb-3 font-condensed">Prospectos</th>
                <th className="text-right pb-3 font-condensed">Clientes</th>
                <th className="text-right pb-3 font-condensed">Visitas</th>
                <th className="text-right pb-3 font-condensed">Facturado</th>
              </tr>
            </thead>
            <tbody>
              {(ranking ?? []).map((r, i) => (
                <tr key={r.comercial_id} className="border-b border-border/50 hover:bg-white/5 transition">
                  <td className="py-3 pr-4 text-muted font-condensed">{i + 1}</td>
                  <td className="py-3 font-medium" style={{ color: '#e8edf5' }}>{r.nombre}</td>
                  <td className="py-3 text-right" style={{ color: '#a855f7' }}>{r.prospectos}</td>
                  <td className="py-3 text-right" style={{ color: '#00e676' }}>{r.clientes}</td>
                  <td className="py-3 text-right" style={{ color: '#00c2ff' }}>{r.visitas}</td>
                  <td className="py-3 text-right font-condensed" style={{ color: '#f5a623' }}>
                    {fmtCOP(r.valor_facturado)}
                  </td>
                </tr>
              ))}
              {!ranking?.length && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted text-sm">
                    Sin datos de comerciales
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  )
}
