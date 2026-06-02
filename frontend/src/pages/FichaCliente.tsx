import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getFichas, getAnalistas } from '../api/fichas'
import { getComercialesApi } from '../api/comerciales'

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'badge-gray',
  en_proceso: 'badge-gold',
  completada: 'badge-green',
}
const ESTADO_LABEL: Record<string, string> = {
  pendiente: '⏳ Pendiente',
  en_proceso: '🔄 En Proceso',
  completada: '✅ Completada',
}

export default function FichaCliente() {
  const [filtEstado, setFiltEstado] = useState('pendiente')
  const [filtComercial, setFiltComercial] = useState('')
  const [search, setSearch] = useState('')

  const { data: fichas = [], isLoading } = useQuery({
    queryKey: ['fichas', filtEstado, filtComercial],
    queryFn: () => getFichas({
      estado: filtEstado || undefined,
      comercialId: filtComercial || undefined,
    }),
  })

  const { data: comerciales = [] } = useQuery({ queryKey: ['comerciales'], queryFn: getComercialesApi })

  // getAnalistas is imported but used only to pre-warm the cache
  useQuery({ queryKey: ['analistas'], queryFn: getAnalistas })

  const filtered = fichas.filter((f) => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.record.empresa.toLowerCase().includes(q)
  })

  // KPIs
  const total = fichas.length
  const pendientes = fichas.filter((f) => f.estado === 'pendiente').length
  const enProceso = fichas.filter((f) => f.estado === 'en_proceso').length
  const completadas = fichas.filter((f) => f.estado === 'completada').length
  const pctPromedio = fichas.length
    ? Math.round(fichas.reduce((s, f) => s + f.pct, 0) / fichas.length)
    : 0

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📋 Fichas de Cliente</h1>
          <p className="text-sm text-muted mt-0.5">Documentación SOP — Creación y seguimiento de fichas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          className="filter-input"
          placeholder="Buscar empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={filtEstado} onChange={(e) => setFiltEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">⏳ Pendiente</option>
          <option value="en_proceso">🔄 En Proceso</option>
          <option value="completada">✅ Completada</option>
        </select>
        <select className="filter-select" value={filtComercial} onChange={(e) => setFiltComercial(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {comerciales.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total fichas',   val: total,       color: '#00c2ff' },
          { label: 'Pendientes',     val: pendientes,  color: '#8899b4' },
          { label: 'En proceso',     val: enProceso,   color: '#f5a623' },
          { label: 'Completadas',    val: completadas, color: '#00e676' },
          { label: 'Progreso prom.', val: `${pctPromedio}%`, color: '#a855f7' },
        ].map((k) => (
          <div key={k.label} className="card px-4 py-3" style={{ borderTop: `3px solid ${k.color}` }}>
            <p className="text-2xs text-muted uppercase tracking-widest font-bold mb-1">{k.label}</p>
            <p className="font-bold text-2xl" style={{ color: k.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
              {k.val}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-surface2 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-foreground mb-1">Sin fichas</p>
          <p className="text-sm">Las fichas se crean desde la ficha de cada cliente.</p>
        </div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Comercial</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Progreso</th>
                <th>Actualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td className="font-semibold text-foreground">{f.record.empresa}</td>
                  <td className="text-sm text-muted">{f.record.comercial.nombre}</td>
                  <td className="text-sm capitalize">{f.record.tipoCliente}</td>
                  <td><span className={ESTADO_BADGE[f.estado] ?? 'badge-gray'}>{ESTADO_LABEL[f.estado] ?? f.estado}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface3 rounded-full h-1.5 min-w-16">
                        <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${f.pct}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted">{f.pct}%</span>
                    </div>
                  </td>
                  <td className="text-xs text-muted">{new Date(f.updatedAt).toLocaleDateString('es-CO')}</td>
                  <td>
                    <Link to={`/fichas/${f.record.id}`} className="btn-primary btn-sm text-xs px-3 py-1">
                      Abrir
                    </Link>
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
