import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Target, Building2, DollarSign, ClipboardList, Send, Handshake, CheckCircle, XCircle } from 'lucide-react'
import { getDashboard, getRanking, getRecientes } from '../api/dashboard'
import { useAuthStore } from '../store/authStore'

const COLORS = {
  accent:  '#00c2ff',
  accent2: '#0077ff',
  gold:    '#f5a623',
  success: '#00e676',
  danger:  '#ff4444',
  purple:  '#a855f7',
  muted:   '#8899b4',
}

const ESTADO_PIPELINE_LABELS: Record<string, string> = {
  prospecto:            'Prosp.',
  reconocimiento:       'Recono.',
  propuesta:            'Prop.',
  aceptacion_propuesta: 'Acept.',
  creacion_sop:         'SOP',
  facturado:            'Facturado',
}

const COT_ESTADO_COLORS: Record<string, string> = {
  borrador:    COLORS.muted,
  enviada:     COLORS.accent,
  negociacion: COLORS.gold,
  aprobada:    COLORS.success,
  rechazada:   COLORS.danger,
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function KpiCard({ label, value, sub, color = '#00c2ff', icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div className="card-glass p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, color }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1.5">{label}</p>
        <p className="font-display text-2xl font-bold text-foreground leading-none tabular">{value}</p>
        {sub && <p className="text-2xs text-muted mt-1.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface2 border border-border rounded-lg px-3 py-2 text-xs shadow-card">
        {label && <p className="text-muted mb-1">{label}</p>}
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard(),
  })

  const { data: ranking, isLoading: loadingRanking } = useQuery({
    queryKey: ['dashboard-ranking'],
    queryFn: getRanking,
  })

  const { data: recientes } = useQuery({
    queryKey: ['dashboard-recientes'],
    queryFn: getRecientes,
  })

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches'

  if (loadingStats) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-surface2" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-64 animate-pulse bg-surface2" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) return null

  const pipelineData = Object.entries(stats.prospectos_por_estado).map(([estado, count]) => ({
    estado: ESTADO_PIPELINE_LABELS[estado] ?? estado,
    count,
  }))

  const serviciosData = stats.servicios_frecuentes.slice(0, 6)
  const donutColors = Object.values(COLORS)

  const cotData = Object.entries(stats.cotizaciones_por_estado).map(([estado, count]) => ({
    name: estado,
    value: count,
    color: COT_ESTADO_COLORS[estado] ?? COLORS.muted,
  }))

  const facturacionLineas = Object.entries(stats.facturacion_por_linea)
    .map(([linea, valor]) => ({ linea, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)

  return (
    <div className="p-6 space-y-6">

      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {saludo}, {user?.username} 👋
        </h1>
        <p className="text-sm text-muted mt-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
        <KpiCard label="Prospectos activos" value={stats.total_prospectos}
          icon={<Target size={18} />} color={COLORS.accent} sub="En pipeline" />
        <KpiCard label="Clientes" value={stats.total_clientes}
          icon={<Building2 size={18} />} color={COLORS.gold} sub="Activos en CRM" />
        <KpiCard label="Facturación total" value={fmt(stats.facturacion_total)}
          icon={<DollarSign size={18} />} color={COLORS.success} sub="Período seleccionado" />
        <KpiCard label="Cotizaciones" value={stats.total_cotizaciones}
          icon={<ClipboardList size={18} />} color={COLORS.purple} sub={`${stats.cotizaciones_aprobadas} aprobadas`} />
      </div>

      {/* KPI Cotizaciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-2">
        <KpiCard label="Enviadas"     value={stats.cotizaciones_en_curso}     icon={<Send       size={18} />} color={COLORS.accent} />
        <KpiCard label="Negociación"  value={stats.cotizaciones_negociacion}  icon={<Handshake  size={18} />} color={COLORS.gold} />
        <KpiCard label="Aprobadas"    value={stats.cotizaciones_aprobadas}    icon={<CheckCircle size={18} />} color={COLORS.success} />
        <KpiCard label="Rechazadas"   value={stats.cotizaciones_rechazadas}   icon={<XCircle    size={18} />} color={COLORS.danger} />
      </div>

      {/* Gráficas fila 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pipeline por estado */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">
            Pipeline por estado
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipelineData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" vertical={false} />
              <XAxis dataKey="estado" tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#00c2ff08' }} />
              <Bar dataKey="count" name="Registros" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia mensual */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">
            Tendencia mensual (12 meses)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.registros_por_mes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#8899b4', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="prospectos" name="Prospectos"
                stroke={COLORS.accent} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="clientes" name="Clientes"
                stroke={COLORS.gold} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#8899b4' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficas fila 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Servicios — donut */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">
            Servicios solicitados
          </h3>
          {serviciosData.length === 0 ? (
            <div className="empty-state text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={serviciosData} dataKey="count" nameKey="servicio"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {serviciosData.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8899b4' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cotizaciones — donut */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">
            Cotizaciones por estado
          </h3>
          {cotData.length === 0 ? (
            <div className="empty-state text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cotData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {cotData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#8899b4' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Facturación por línea — barras horizontales */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">
            Facturación por línea
          </h3>
          {facturacionLineas.length === 0 ? (
            <div className="empty-state text-sm">Sin datos</div>
          ) : (
            <div className="space-y-3 mt-2">
              {facturacionLineas.map((item, i) => {
                const max = facturacionLineas[0].valor || 1
                const pct = Math.round((item.valor / max) * 100)
                const color = donutColors[i % donutColors.length]
                return (
                  <div key={item.linea}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted truncate mr-2">{item.linea}</span>
                      <span className="text-foreground font-semibold flex-shrink-0">{fmt(item.valor)}</span>
                    </div>
                    <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ranking comerciales */}
      {!loadingRanking && ranking && ranking.length > 0 && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Ranking Comerciales</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Cargo</th>
                <th>Prospectos</th>
                <th>Clientes</th>
                <th>Visitas</th>
                <th>Facturado</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-bold text-foreground">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                  </td>
                  <td className="font-semibold text-foreground">{c.nombre}</td>
                  <td className="text-muted text-xs">{c.cargo || '—'}</td>
                  <td><span className="badge-blue">{c.prospectos}</span></td>
                  <td><span className="badge-gold">{c.clientes}</span></td>
                  <td className="text-foreground">{c.visitas}</td>
                  <td className="font-mono text-success text-sm">{fmt(c.facturado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Últimos registros */}
      {recientes && recientes.records.length > 0 && (
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Últimos registros</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Tipo</th>
                <th>Comercial</th>
                <th>Servicios</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.records.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold text-foreground">{r.empresa}</td>
                  <td>
                    <span className={r.tipo === 'cliente' ? 'badge-gold' : 'badge-blue'}>
                      {r.tipo}
                    </span>
                  </td>
                  <td className="text-muted text-sm">{r.comercial?.nombre || '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(r.servicios as string[]).slice(0, 2).map((s) => (
                        <span key={s} className="stag">{s}</span>
                      ))}
                      {(r.servicios as string[]).length > 2 && (
                        <span className="stag">+{(r.servicios as string[]).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted text-xs">
                    {new Date(r.createdAt).toLocaleDateString('es-CO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
