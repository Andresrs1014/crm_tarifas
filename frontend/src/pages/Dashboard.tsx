import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { getDashboardStats, getDashboardCharts } from '../api/dashboard'
import { getComercialesApi } from '../api/comerciales'
import StatCard from '../components/StatCard'
import { fmtCOP } from '../utils/format'

const PIE_COLORS = ['#00c2ff', '#a855f7', '#00e676', '#f5a623', '#ff6b6b', '#00ffcc']

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

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Dashboard
        </h1>
        {/* Filtros */}
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
        <StatCard label="Total Records"   value={stats?.total_records ?? 0}  accent="#00c2ff" />
        <StatCard label="Prospectos"      value={stats?.total_prospectos ?? 0} accent="#a855f7" />
        <StatCard label="Clientes"        value={stats?.total_clientes ?? 0}  accent="#00e676" />
        <StatCard
          label="Facturación"
          value={fmtCOP(stats?.total_facturado)}
          accent="#f5a623"
        />
        <StatCard label="Cotizaciones"    value={stats?.total_cotizaciones ?? 0} accent="#00c2ff" />
        <StatCard
          label="Aprobadas"
          value={stats?.cotizaciones_por_estado?.aprobada ?? 0}
          accent="#00e676"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 }}
                labelStyle={{ color: '#e8edf5' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Estados */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Pipeline por Estado
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.pipeline_estados ?? []}>
              <XAxis dataKey="name" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 }}
                labelStyle={{ color: '#e8edf5' }}
              />
              <Bar dataKey="value" fill="#00c2ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Servicios solicitados */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h3 className="font-condensed text-sm uppercase text-muted tracking-wider mb-4">
            Servicios Solicitados
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={charts?.servicios_solicitados ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#8899b4', fontSize: 10 }} width={110} />
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 }}
                labelStyle={{ color: '#e8edf5' }}
              />
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
              <Tooltip
                contentStyle={{ background: '#1a2235', border: '1px solid #1e3050', borderRadius: 8 }}
                labelStyle={{ color: '#e8edf5' }}
              />
              <Bar dataKey="value" fill="#00e676" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageContainer>
  )
}
