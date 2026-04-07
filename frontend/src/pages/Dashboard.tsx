import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import { getDashboardStats, getDashboardCharts, getRankingApi, getRecientesApi } from '../api/dashboard'
import { getComercialesApi } from '../api/comerciales'
import StatCard from '../components/StatCard'
import { fmtCOP } from '../utils/format'

const PIE_COLORS = ['#00c2ff', '#a855f7', '#00e676', '#f5a623', '#ff6b6b', '#00ffcc']
const GESTION_COLORS = ['#00e676', '#f5a623', '#8899b4', '#00c2ff', '#a855f7', '#f5a623']

const TOOLTIP_STYLE = {
  contentStyle: { background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 },
  labelStyle: { color: '#e8edf5' },
}

const ESTADO_BADGE: Record<string, { label: string; color: string }> = {
  borrador:    { label: 'Borrador',    color: '#8899b4' },
  enviada:     { label: 'Enviada',     color: '#00c2ff' },
  negociacion: { label: 'Negociación', color: '#f5a623' },
  aprobada:    { label: 'Aprobada',    color: '#00e676' },
  rechazada:   { label: 'Rechazada',   color: '#ff4444' },
}

export default function Dashboard() {
  const navigate = useNavigate()
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
  const { data: recientes } = useQuery({
    queryKey: ['dashboard', 'recientes'],
    queryFn: getRecientesApi,
  })

  return (
    <PageContainer>
      {/* Header + Filtros */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>Dashboard</h1>
        <div className="flex gap-3">
          <select className="w-44" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
            <option value="">Todos los comerciales</option>
            {comerciales?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input type="month" className="w-36" value={mes} onChange={(e) => setMes(e.target.value)} />
        </div>
      </div>

      {/* Stat Cards — Records */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Records"  value={stats?.total_records ?? 0}    accent="#00c2ff" />
        <StatCard label="Prospectos"     value={stats?.total_prospectos ?? 0}  accent="#a855f7" />
        <StatCard label="Clientes"       value={stats?.total_clientes ?? 0}    accent="#00e676" />
        <StatCard label="Facturación"    value={fmtCOP(stats?.total_facturado)} accent="#f5a623" />
        <StatCard label="Cotizaciones"   value={stats?.total_cotizaciones ?? 0} accent="#00c2ff" />
        <StatCard label="Aprobadas"      value={stats?.cotizaciones_por_estado?.aprobada ?? 0} accent="#00e676" />
      </div>

      {/* Stat Cards — Cotizaciones extra */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="En Curso"       value={stats?.cotizaciones_en_curso ?? 0}  accent="#f5a623" sub="Borrador · Enviada · Neg." />
        <StatCard label="Vencidas"       value={stats?.cotizaciones_vencidas ?? 0}  accent="#ff4444" sub="Sin respuesta" />
        <StatCard label="Rechazadas"     value={stats?.cotizaciones_por_estado?.rechazada ?? 0} accent="#8899b4" />
        <StatCard label="Negociación"    value={stats?.cotizaciones_por_estado?.negociacion ?? 0} accent="#a855f7" />
      </div>

      {/* Fila 1 — Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Prospectos vs Clientes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts?.prospectos_vs_clientes ?? []} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {charts?.prospectos_vs_clientes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Pipeline por Estado</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.pipeline_estados ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#00c2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Servicios Solicitados</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.servicios_solicitados ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={110} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#a855f7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Actividad por Comercial</h3>
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

      {/* Fila 2 — Línea de tiempo + Gestión clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border p-5 lg:col-span-2">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Registros por Mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={charts?.registros_por_mes ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8899b4' }} />
              <Line type="monotone" dataKey="prospectos" stroke="#00c2ff" strokeWidth={2} dot={false} name="Prospectos" />
              <Line type="monotone" dataKey="clientes" stroke="#00e676" strokeWidth={2} dot={false} name="Clientes" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Gestión Clientes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.gestion_clientes ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={80} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {charts?.gestion_clientes.map((_, i) => (
                  <Cell key={i} fill={GESTION_COLORS[i % GESTION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fila 3 — Cotizaciones charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Pipeline Cotizaciones</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={charts?.pipeline_cotizaciones ?? []} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}>
                {charts?.pipeline_cotizaciones.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Líneas más Cotizadas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.lineas_cotizadas ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={100} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#f5a623" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Facturación por Línea</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.billing_por_linea ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={100} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => fmtCOP(v)} />
              <Bar dataKey="value" fill="#00ffcc" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablas recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Últimos Registros */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Últimos Registros</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left pb-2 font-condensed">Empresa</th>
                  <th className="text-left pb-2 font-condensed">Tipo</th>
                  <th className="text-left pb-2 font-condensed">Comercial</th>
                  <th className="text-left pb-2 font-condensed">Estado</th>
                  <th className="text-left pb-2 font-condensed">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(recientes?.registros ?? []).map((r) => (
                  <tr key={r.id}
                    className="border-b border-border/40 hover:bg-white/5 cursor-pointer transition"
                    onClick={() => navigate(`/${r.tipo === 'prospecto' ? 'prospectos' : 'clientes'}/${r.id}`)}
                  >
                    <td className="py-2 font-medium" style={{ color: '#e8edf5' }}>{r.empresa}</td>
                    <td className="py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-condensed"
                        style={{ background: r.tipo === 'prospecto' ? 'rgba(168,85,247,0.2)' : 'rgba(0,230,118,0.2)', color: r.tipo === 'prospecto' ? '#a855f7' : '#00e676' }}>
                        {r.tipo === 'prospecto' ? 'Prospecto' : 'Cliente'}
                      </span>
                    </td>
                    <td className="py-2 text-muted text-xs">{r.comercial_nombre ?? '—'}</td>
                    <td className="py-2 text-xs text-muted">{r.estado || '—'}</td>
                    <td className="py-2 text-xs text-muted">{r.fecha}</td>
                  </tr>
                ))}
                {!recientes?.registros.length && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted text-sm">Sin registros recientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cotizaciones Recientes */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-condensed text-sm uppercase text-muted tracking-wider">Cotizaciones Recientes</h3>
            <button className="text-xs text-muted hover:text-white transition" onClick={() => navigate('/cotizaciones')}>
              Ver todas →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left pb-2 font-condensed">N°</th>
                  <th className="text-left pb-2 font-condensed">Empresa</th>
                  <th className="text-left pb-2 font-condensed">Estado</th>
                  <th className="text-left pb-2 font-condensed">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {(recientes?.cotizaciones ?? []).map((c) => {
                  const badge = c.vencida
                    ? { label: 'Vencida', color: '#ff4444' }
                    : (ESTADO_BADGE[c.estado] ?? { label: c.estado, color: '#8899b4' })
                  return (
                    <tr key={c.id} className="border-b border-border/40 hover:bg-white/5 transition">
                      <td className="py-2 font-condensed font-bold" style={{ color: '#e8edf5' }}>{c.numero}</td>
                      <td className="py-2 text-xs" style={{ color: '#e8edf5' }}>{c.empresa}</td>
                      <td className="py-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-condensed"
                          style={{ background: `${badge.color}22`, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-muted">{c.fecha}</td>
                    </tr>
                  )
                })}
                {!recientes?.cotizaciones.length && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted text-sm">Sin cotizaciones recientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Ranking por Comercial */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">Ranking por Comercial</h3>
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
                  <td className="py-3 text-right font-condensed" style={{ color: '#f5a623' }}>{fmtCOP(r.valor_facturado)}</td>
                </tr>
              ))}
              {!ranking?.length && (
                <tr><td colSpan={6} className="py-6 text-center text-muted text-sm">Sin datos de comerciales</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  )
}
