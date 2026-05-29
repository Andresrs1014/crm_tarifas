import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Target, Building2, DollarSign, ClipboardList,
  Send, Handshake, CheckCircle, XCircle,
  TrendingUp, Clock, AlertTriangle, Users,
} from 'lucide-react'
import { getDashboard, getRanking, getRecientes } from '../api/dashboard'
import { getRecords } from '../api/records'
import { useAuthStore } from '../store/authStore'
import type { CRMRecord } from '../types'

// ─── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  accent:  '#00c2ff',
  gold:    '#f5a623',
  success: '#00e676',
  danger:  '#ff4444',
  purple:  '#a855f7',
  muted:   '#8899b4',
  cyan:    '#00ffcc',
}

const ETAPAS = [
  { key: 'prospecto',            label: 'Prospecto' },
  { key: 'reconocimiento',       label: 'Visita' },
  { key: 'propuesta',            label: 'Propuesta' },
  { key: 'aceptacion_propuesta', label: 'Aceptación' },
  { key: 'creacion_sop',         label: 'Ficha Cliente' },
  { key: 'facturado',            label: 'Facturado' },
]

const FUNNEL_COLORS = [C.accent, C.success, C.purple, C.gold, '#fb923c', C.danger]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

const ESTADO_PIPELINE_LABELS: Record<string, string> = {
  prospecto: 'Prosp.', reconocimiento: 'Recono.', propuesta: 'Prop.',
  aceptacion_propuesta: 'Acept.', creacion_sop: 'SOP', facturado: 'Facturado',
}

const COT_ESTADO_COLORS: Record<string, string> = {
  borrador: C.muted, enviada: C.accent, negociacion: C.gold,
  aprobada: C.success, rechazada: C.danger,
}

// ─── Shared sub-components ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = C.accent, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode
}) {
  return (
    <div className="card-glass p-5 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, color }}
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

const DarkTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string
}) => {
  if (!active || !payload?.length) return null
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

// ─── Panel Gerencial ──────────────────────────────────────────────────────────
function GerencialPanel() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['records-all-gerencial'],
    queryFn: () => getRecords(),
    staleTime: 1000 * 60 * 2,
  })

  const hoy = useMemo(() => new Date(), [])

  const { prospectos, clientes, metricas, tiempoData, ingresosData, riesgoData, funnelData, vencerData } =
    useMemo(() => {
      const prospectos = records.filter((r) => r.tipo === 'prospecto')
      const clientes   = records.filter((r) => r.tipo === 'cliente')

      // ── Tasa de conversión
      const totalProspectos = prospectos.length
      const convertidos     = prospectos.filter((r) => r.estadoProspecto === 'facturado').length
      const tasaConversion  = totalProspectos > 0 ? Math.round((convertidos / totalProspectos) * 100) : 0

      // ── Tiempo de cierre promedio
      const cierresConFecha = prospectos.filter((r) => r.estadoProspecto === 'facturado' && r.fecha)
      const diasCierre = cierresConFecha.length > 0
        ? Math.round(cierresConFecha.reduce((s, r) => {
            const ini = new Date(r.fecha + 'T12:00')
            const fin = r.fechaVisita ? new Date(r.fechaVisita + 'T12:00') : hoy
            return s + Math.max(0, Math.ceil((fin.getTime() - ini.getTime()) / 86_400_000))
          }, 0) / cierresConFecha.length)
        : 0

      // ── Ingresos
      const ingresosEsperados = prospectos
        .filter((r) => r.estadoProspecto !== 'facturado')
        .reduce((s, r) => s + (r.ingresosEsperados || 0), 0)
      const ingresosRealizados = records.reduce((s, r) => {
        return s + Object.values(r.facturacionLineas || {}).reduce((a, b) => a + (Number(b) || 0), 0)
      }, 0)

      // ── Riesgo clientes
      const totalClientes = clientes.length
      const enRiesgo  = clientes.filter((r) => r.estadoCliente === 'en-riesgo').length
      const inactivos = clientes.filter((r) => r.estadoCliente === 'inactivo').length
      const activos   = clientes.filter((r) => !r.estadoCliente || r.estadoCliente === 'activo').length
      const pctRiesgo = totalClientes > 0 ? Math.round((enRiesgo / totalClientes) * 100) : 0

      // ── Seguimientos por vencer (≤7 días)
      const vencerProspectos = prospectos
        .filter((r) => {
          if (!r.proximoSeguimiento) return false
          const diff = Math.ceil((new Date(r.proximoSeguimiento + 'T12:00').getTime() - hoy.getTime()) / 86_400_000)
          return diff <= 7
        })
        .sort((a, b) => new Date(a.proximoSeguimiento! + 'T12:00').getTime() - new Date(b.proximoSeguimiento! + 'T12:00').getTime())

      const vencidos = vencerProspectos.filter((r) => {
        const diff = Math.ceil((new Date(r.proximoSeguimiento! + 'T12:00').getTime() - hoy.getTime()) / 86_400_000)
        return diff <= 0
      }).length

      // ── Tiempo por etapa (días promedio desde registro hasta hoy, agrupado por estado actual)
      const sumaEtapa: Record<string, number> = {}
      const cntEtapa:  Record<string, number> = {}
      ETAPAS.forEach((e) => { sumaEtapa[e.key] = 0; cntEtapa[e.key] = 0 })
      prospectos.forEach((r) => {
        const est = r.estadoProspecto || 'prospecto'
        if (!(est in sumaEtapa)) return
        const fechaReg = r.fecha ? new Date(r.fecha + 'T12:00') : hoy
        const dias = Math.max(0, Math.ceil((hoy.getTime() - fechaReg.getTime()) / 86_400_000))
        sumaEtapa[est] += dias
        cntEtapa[est]++
      })
      const tiempoData = ETAPAS.map((e) => ({
        label: e.label,
        dias: cntEtapa[e.key] > 0 ? Math.round(sumaEtapa[e.key] / cntEtapa[e.key]) : 0,
      }))

      // ── Ingresos por comercial
      const mapaC: Record<string, { esperado: number; realizado: number }> = {}
      records.forEach((r) => {
        const com = r.comercial?.nombre || 'Sin asignar'
        if (!mapaC[com]) mapaC[com] = { esperado: 0, realizado: 0 }
        if (r.tipo === 'prospecto' && r.estadoProspecto !== 'facturado')
          mapaC[com].esperado += r.ingresosEsperados || 0
        Object.values(r.facturacionLineas || {}).forEach((v) => {
          mapaC[com].realizado += Number(v) || 0
        })
      })
      const ingresosData = Object.entries(mapaC)
        .filter(([, v]) => v.esperado > 0 || v.realizado > 0)
        .sort((a, b) => (b[1].esperado + b[1].realizado) - (a[1].esperado + a[1].realizado))
        .map(([comercial, v]) => ({ comercial, esperado: v.esperado, realizado: v.realizado }))

      // ── Donut clientes
      const riesgoData = [
        { name: 'Activos',    value: activos,   color: C.success },
        { name: 'En Riesgo',  value: enRiesgo,  color: C.gold },
        { name: 'Inactivos',  value: inactivos, color: C.muted },
      ].filter((d) => d.value > 0)

      // ── Funnel abandono
      const conteoEtapa: Record<string, number> = {}
      ETAPAS.forEach((e) => { conteoEtapa[e.key] = 0 })
      prospectos.forEach((r) => {
        const est = r.estadoProspecto || 'prospecto'
        if (est in conteoEtapa) conteoEtapa[est]++
      })
      const keys = ETAPAS.map((e) => e.key)
      const llegaron = ETAPAS.map((_, i) =>
        keys.slice(i).reduce((s, k) => s + (conteoEtapa[k] || 0), 0)
      )
      const maxLlego = llegaron[0] || 1
      const funnelData = ETAPAS.map((e, i) => {
        const n    = llegaron[i]
        const nSig = i < llegaron.length - 1 ? llegaron[i + 1] : n
        const abandono = n > 0 ? Math.round(((n - nSig) / n) * 100) : 0
        const pctBarra = Math.round((n / maxLlego) * 100)
        return { label: e.label, n, pctBarra, abandono, color: FUNNEL_COLORS[i] }
      })

      // ── Tabla seguimientos
      const vencerData = vencerProspectos.map((r) => {
        const fechaSeg = new Date(r.proximoSeguimiento! + 'T12:00')
        const diffDias = Math.ceil((fechaSeg.getTime() - hoy.getTime()) / 86_400_000)
        const diasTxt  = diffDias < 0 ? `${Math.abs(diffDias)}d vencido`
          : diffDias === 0 ? 'Hoy'
          : `En ${diffDias}d`
        const urgencia: 'critico' | 'alto' | 'normal' = diffDias < 0 ? 'critico'
          : diffDias <= 3 ? 'alto' : 'normal'
        const urgenciaLabel = diffDias < 0 ? `🔴 ${Math.abs(diffDias)}d vencido`
          : diffDias <= 3 ? `⚠️ Urgente (${diffDias}d)` : `📅 Próximo (${diffDias}d)`
        const urgenciaColor = urgencia === 'critico' ? C.danger : urgencia === 'alto' ? C.gold : C.accent
        return { r, diffDias, diasTxt, urgenciaLabel, urgenciaColor, fechaSeg }
      })

      return {
        prospectos, clientes,
        metricas: {
          tasaConversion, convertidos, totalProspectos, diasCierre,
          cierresLen: cierresConFecha.length,
          ingresosEsperados, ingresosRealizados,
          pctRiesgo, enRiesgo, totalClientes, activos, inactivos,
          vencidos, totalVencer: vencerProspectos.length,
          totalPortafolio: totalProspectos + totalClientes,
        },
        tiempoData, ingresosData, riesgoData, funnelData, vencerData,
      }
    }, [records, hoy])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-surface2 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const m = metricas
  const fechaCorte = hoy.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  // Gauge SVG
  const R = 80, gcx = 130, gcy = 100
  const circum = Math.PI * R
  const gaugeColor = m.tasaConversion >= 30 ? C.success : m.tasaConversion >= 15 ? C.gold : C.danger
  const dashOffset = circum - (circum * m.tasaConversion / 100)

  // KPI cards tendencias
  const gap = m.ingresosEsperados > 0 ? Math.round((m.ingresosRealizados / m.ingresosEsperados) * 100) : 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-wide">📈 KPIs Gerenciales</h2>
          <p className="text-xs text-muted mt-0.5">Indicadores estratégicos de conversión y rentabilidad</p>
        </div>
        <div className="text-xs text-muted border border-border rounded-full px-3 py-1.5 bg-surface2">
          Corte: {fechaCorte}
        </div>
      </div>

      {/* ── 6 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Tasa conversión */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${C.accent}` }}>
          <div className="text-lg mb-1">🎯</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Tasa Conversión</div>
          <div className="font-display text-3xl font-bold" style={{ color: C.accent }}>{m.tasaConversion}%</div>
          <div className="text-2xs text-muted mt-1">{m.convertidos} de {m.totalProspectos} prospectos</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${m.tasaConversion >= 30 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {m.tasaConversion >= 30 ? '▲ Meta ≥30%' : '▼ Bajo meta 30%'}
          </div>
        </div>

        {/* Tiempo cierre */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${C.gold}` }}>
          <div className="text-lg mb-1">⏱</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Tiempo Cierre</div>
          <div className="font-display text-3xl font-bold" style={{ color: C.gold }}>
            {m.diasCierre}<span className="text-base font-normal"> d</span>
          </div>
          <div className="text-2xs text-muted mt-1">Promedio por negocio cerrado</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${m.diasCierre <= 30 ? 'bg-success/10 text-success' : 'bg-gold/10 text-gold'}`}>
            {m.diasCierre <= 30 ? '▲ Eficiente ≤30d' : '⚠ Supera 30 días'}
          </div>
        </div>

        {/* Ingresos realizados */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${C.success}` }}>
          <div className="text-lg mb-1">💰</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Ingresos Realizados</div>
          <div className="font-display text-2xl font-bold" style={{ color: C.success }}>{fmt(m.ingresosRealizados)}</div>
          <div className="text-2xs text-muted mt-1">Esperados: {fmt(m.ingresosEsperados)}</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${gap >= 80 ? 'bg-success/10 text-success' : gap >= 50 ? 'bg-gold/10 text-gold' : 'bg-danger/10 text-danger'}`}>
            {gap >= 80 ? `▲ ${gap}% de meta` : gap >= 50 ? `⚠ ${gap}% de meta` : `▼ ${gap}% de meta`}
          </div>
        </div>

        {/* Clientes en riesgo */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${m.pctRiesgo > 25 ? C.danger : m.pctRiesgo > 10 ? C.gold : C.purple}` }}>
          <div className="text-lg mb-1">⚠️</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Clientes en Riesgo</div>
          <div className="font-display text-3xl font-bold"
            style={{ color: m.pctRiesgo > 25 ? C.danger : m.pctRiesgo > 10 ? C.gold : C.purple }}>
            {m.pctRiesgo}%
          </div>
          <div className="text-2xs text-muted mt-1">{m.enRiesgo} de {m.totalClientes} clientes</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${m.pctRiesgo <= 10 ? 'bg-success/10 text-success' : m.pctRiesgo <= 25 ? 'bg-gold/10 text-gold' : 'bg-danger/10 text-danger'}`}>
            {m.pctRiesgo <= 10 ? '▲ Riesgo bajo' : m.pctRiesgo <= 25 ? '⚠ Riesgo moderado' : '▼ Riesgo alto'}
          </div>
        </div>

        {/* Seguimientos vencidos */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${C.danger}` }}>
          <div className="text-lg mb-1">🔴</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Seguim. Vencidos</div>
          <div className="font-display text-3xl font-bold" style={{ color: C.danger }}>{m.vencidos}</div>
          <div className="text-2xs text-muted mt-1">{m.totalVencer} en alerta (≤7 días)</div>
          <div className={`mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full ${m.vencidos === 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
            {m.vencidos === 0 ? '▲ Sin vencidos' : '▼ Requiere acción'}
          </div>
        </div>

        {/* Total portafolio */}
        <div className="card p-4 relative overflow-hidden"
          style={{ borderTop: `3px solid ${C.cyan}` }}>
          <div className="text-lg mb-1">🏢</div>
          <div className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Total Portafolio</div>
          <div className="font-display text-3xl font-bold" style={{ color: C.cyan }}>{m.totalPortafolio}</div>
          <div className="text-2xs text-muted mt-1">{m.totalProspectos} prospectos · {m.totalClientes} clientes</div>
          <div className="mt-2 inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            📊 Activos en CRM
          </div>
        </div>
      </div>

      {/* ── Fila 2: Gauge + Tiempo por etapa ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Gauge tasa de conversión */}
        <div className="card p-6">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1 h-4 rounded bg-accent inline-block" />
            Tasa de Conversión de Prospectos
          </div>
          <p className="text-2xs text-muted mb-5">Prospectos que alcanzaron estado "Facturado" sobre el total</p>

          <div className="flex flex-col items-center">
            <svg viewBox="0 0 260 120" style={{ width: 260, height: 120, overflow: 'visible' }}>
              {/* Fondo arco */}
              <path
                d={`M ${gcx - R} ${gcy} A ${R} ${R} 0 0 1 ${gcx + R} ${gcy}`}
                fill="none" stroke="#1e3050" strokeWidth="14" strokeLinecap="round"
              />
              {/* Progreso */}
              <path
                d={`M ${gcx - R} ${gcy} A ${R} ${R} 0 0 1 ${gcx + R} ${gcy}`}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circum}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
              />
              {/* Valor central */}
              <text x={gcx} y={gcy + 14} textAnchor="middle"
                fontFamily="var(--font-display,sans-serif)" fontSize="42" fontWeight="800"
                fill={gaugeColor}>{m.tasaConversion}%</text>
              <text x={gcx} y={gcy + 30} textAnchor="middle" fontSize="11" fill="#8899b4">
                Tasa de conversión
              </text>
              {/* Extremos */}
              <text x={gcx - R - 8} y={gcy + 4} textAnchor="end" fontSize="10" fill="#8899b4">0%</text>
              <text x={gcx + R + 8} y={gcy + 4} textAnchor="start" fontSize="10" fill="#8899b4">100%</text>
              {/* Marca 30% */}
              <line
                x1={gcx + R * Math.cos(Math.PI - Math.PI * 0.3)}
                y1={gcy - R * Math.sin(Math.PI - Math.PI * 0.3)}
                x2={gcx + (R - 18) * Math.cos(Math.PI - Math.PI * 0.3)}
                y2={gcy - (R - 18) * Math.sin(Math.PI - Math.PI * 0.3)}
                stroke={C.gold} strokeWidth="2"
              />
              <text
                x={gcx + (R + 10) * Math.cos(Math.PI - Math.PI * 0.3)}
                y={gcy - (R + 10) * Math.sin(Math.PI - Math.PI * 0.3)}
                textAnchor="middle" fontSize="9" fill={C.gold}>Meta 30%</text>
            </svg>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
              <div className="text-center rounded-lg p-3" style={{ background: 'rgba(0,230,118,0.07)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <div className="font-display text-2xl font-bold" style={{ color: C.success }}>{m.convertidos}</div>
                <div className="text-2xs text-muted uppercase tracking-widest">Convertidos</div>
              </div>
              <div className="text-center rounded-lg p-3" style={{ background: 'rgba(0,194,255,0.07)', border: '1px solid rgba(0,194,255,0.2)' }}>
                <div className="font-display text-2xl font-bold" style={{ color: C.accent }}>{m.totalProspectos - m.convertidos}</div>
                <div className="text-2xs text-muted uppercase tracking-widest">En Pipeline</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tiempo promedio por etapa */}
        <div className="card p-6">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1 h-4 rounded bg-accent inline-block" />
            Tiempo Promedio de Cierre por Etapa
          </div>
          <p className="text-2xs text-muted mb-5">Días promedio que permanece un prospecto en cada estado</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tiempoData} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false}
                label={{ value: 'Días', position: 'insideBottomRight', offset: -4, fill: '#8899b4', fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={90}
                tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`${v} días`, 'Promedio']}
              />
              <Bar dataKey="dias" name="Días promedio" radius={[0, 4, 4, 0]}>
                {tiempoData.map((entry, i) => {
                  const maxDias = Math.max(...tiempoData.map((d) => d.dias), 1)
                  const ratio = entry.dias / maxDias
                  const color = ratio > 0.7 ? C.danger : ratio > 0.4 ? C.gold : C.accent
                  return <Cell key={i} fill={color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Fila 3: Ingresos por comercial (full width) ── */}
      <div className="card p-6">
        <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
          <span className="w-1 h-4 rounded bg-accent inline-block" />
          Ingresos Esperados vs. Realizados por Comercial
        </div>
        <p className="text-2xs text-muted mb-5">Comparación entre el potencial proyectado en prospectos activos y la facturación efectiva (COP)</p>

        {ingresosData.length === 0 ? (
          <div className="empty-state text-sm">Sin datos de ingresos</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ingresosData} barSize={28} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" vertical={false} />
                <XAxis dataKey="comercial" tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(0)}M`
                    : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [fmt(v), name]}
                />
                <Bar dataKey="esperado" name="Ingresos Esperados"
                  fill={`${C.accent}40`} stroke={C.accent} strokeWidth={2} radius={[4, 4, 0, 0]} />
                <Bar dataKey="realizado" name="Ingresos Realizados"
                  fill={`${C.success}a0`} stroke={C.success} strokeWidth={0} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 justify-center mt-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="w-7 h-3 rounded" style={{ background: `${C.accent}40`, border: `2px solid ${C.accent}` }} />
                Ingresos Esperados (prospectos activos)
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="w-7 h-3 rounded" style={{ background: `${C.success}a0` }} />
                Ingresos Realizados (facturación efectiva)
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fila 4: Donut clientes + Funnel abandono ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Donut clientes por estado */}
        <div className="card p-6">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1 h-4 rounded bg-accent inline-block" />
            % Clientes por Estado de Relación
          </div>
          <p className="text-2xs text-muted mb-4">Distribución del portafolio según estado de riesgo</p>

          {riesgoData.length === 0 ? (
            <div className="empty-state text-sm">Sin clientes registrados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={riesgoData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {riesgoData.map((entry, i) => (
                      <Cell key={i} fill={entry.color + 'cc'} stroke={entry.color} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, name: string) => {
                      const total = m.totalClientes || 1
                      return [`${v} clientes (${Math.round(v / total * 100)}%)`, name]
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-2">
                {riesgoData.map((d) => {
                  const pct = m.totalClientes > 0 ? Math.round(d.value / m.totalClientes * 100) : 0
                  return (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs text-muted">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-lg font-bold" style={{ color: d.color }}>{d.value}</span>
                        <span className="text-xs text-muted w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Funnel tasa de abandono */}
        <div className="card p-6">
          <div className="text-xs font-bold text-muted uppercase tracking-widest mb-1 flex items-center gap-2">
            <span className="w-1 h-4 rounded bg-accent inline-block" />
            Tasa de Abandono por Etapa del Pipeline
          </div>
          <p className="text-2xs text-muted mb-5">% de prospectos que no avanzan desde cada estado</p>

          <div className="space-y-2.5">
            {funnelData.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-24 text-right text-xs text-muted flex-shrink-0">{f.label}</div>
                <div className="flex-1 h-7 rounded-md overflow-hidden" style={{ background: '#131a28' }}>
                  <div
                    className="h-full rounded-md flex items-center pl-2"
                    style={{
                      width: `${f.pctBarra}%`,
                      background: f.color,
                      transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                      minWidth: f.n > 0 ? 40 : 0,
                    }}
                  >
                    <span className="text-2xs font-bold text-black/80 whitespace-nowrap">
                      {f.n} prosp.
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 text-right text-sm font-bold flex-shrink-0"
                  style={{ color: i < funnelData.length - 1
                    ? f.abandono > 50 ? C.danger : f.abandono > 25 ? C.gold : C.success
                    : '#8899b4' }}
                >
                  {i < funnelData.length - 1 ? `-${f.abandono}%` : '—'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-4 flex-wrap text-2xs text-muted">
            <span><span style={{ color: C.success }}>■</span> Bajo (&lt;25%)</span>
            <span><span style={{ color: C.gold }}>■</span> Moderado (25–50%)</span>
            <span><span style={{ color: C.danger }}>■</span> Alto (&gt;50%)</span>
          </div>
        </div>
      </div>

      {/* ── Tabla seguimientos vencidos ── */}
      <div className="table-card">
        <div className="table-header flex items-center justify-between">
          <span className="table-title">⏰ Seguimientos Vencidos o Por Vencer</span>
          <span className="text-xs text-muted">
            {m.vencidos > 0
              ? <><span className="text-danger font-bold">{m.vencidos} vencidos</span> · {m.totalVencer} en alerta</>
              : <span className="text-success">✓ Sin alertas activas</span>}
          </span>
        </div>

        {vencerData.length === 0 ? (
          <div className="empty-state">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm">No hay prospectos con seguimiento vencido o próximo a vencer.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Comercial</th>
                <th>Estado</th>
                <th>Ingresos Esperados</th>
                <th>Fecha Seguimiento</th>
                <th>Días</th>
                <th>Urgencia</th>
              </tr>
            </thead>
            <tbody>
              {vencerData.map(({ r, diasTxt, urgenciaLabel, urgenciaColor, fechaSeg }, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-semibold text-foreground">{r.empresa}</div>
                    {r.nit && <div className="text-2xs text-muted">NIT: {r.nit}</div>}
                  </td>
                  <td className="text-sm text-muted">{r.comercial?.nombre || '—'}</td>
                  <td>
                    <span className="text-2xs text-muted">{r.estadoProspecto || '—'}</span>
                  </td>
                  <td>
                    <span className="font-display text-base font-bold" style={{ color: C.gold }}>
                      {r.ingresosEsperados ? fmt(r.ingresosEsperados) : '—'}
                    </span>
                  </td>
                  <td className="text-xs text-muted whitespace-nowrap">
                    {fechaSeg.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <span className="font-display text-lg font-bold" style={{ color: urgenciaColor }}>
                      {diasTxt}
                    </span>
                  </td>
                  <td>
                    <span
                      className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{
                        background: `${urgenciaColor}18`,
                        color: urgenciaColor,
                        border: `1px solid ${urgenciaColor}40`,
                      }}
                    >
                      {urgenciaLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

// ─── Dashboard principal ────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<'operativo' | 'gerencial'>('operativo')

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

  const pipelineData = stats
    ? Object.entries(stats.prospectos_por_estado).map(([estado, count]) => ({
        estado: ESTADO_PIPELINE_LABELS[estado] ?? estado,
        count,
      }))
    : []

  const serviciosData = stats?.servicios_frecuentes.slice(0, 6) ?? []
  const donutColors = Object.values(C)

  const cotData = stats
    ? Object.entries(stats.cotizaciones_por_estado).map(([estado, count]) => ({
        name: estado,
        value: count,
        color: COT_ESTADO_COLORS[estado] ?? C.muted,
      }))
    : []

  const facturacionLineas = stats
    ? Object.entries(stats.facturacion_por_linea)
        .map(([linea, valor]) => ({ linea, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6)
    : []

  return (
    <div className="p-6 space-y-6">

      {/* Saludo */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {saludo}, {user?.username} 👋
          </h1>
          <p className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface2 border border-border rounded-lg p-1">
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === 'operativo'
                ? 'bg-accent text-bg font-bold'
                : 'text-muted hover:text-foreground'
            }`}
            onClick={() => setTab('operativo')}
          >
            Operativo
          </button>
          <button
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
              tab === 'gerencial'
                ? 'bg-accent text-bg font-bold'
                : 'text-muted hover:text-foreground'
            }`}
            onClick={() => setTab('gerencial')}
          >
            📈 Gerencial
          </button>
        </div>
      </div>

      {/* ────── PESTAÑA OPERATIVO ────── */}
      {tab === 'operativo' && (
        <>
          {loadingStats ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse bg-surface2" />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-64 animate-pulse bg-surface2" />)}
              </div>
            </div>
          ) : !stats ? null : (
            <>
              {/* KPI Cards principales */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-1">
                <KpiCard label="Prospectos activos" value={stats.total_prospectos}
                  icon={<Target size={18} />} color={C.accent} sub="En pipeline" />
                <KpiCard label="Clientes" value={stats.total_clientes}
                  icon={<Building2 size={18} />} color={C.gold} sub="Activos en CRM" />
                <KpiCard label="Facturación total" value={fmt(stats.facturacion_total)}
                  icon={<DollarSign size={18} />} color={C.success} sub="Período seleccionado" />
                <KpiCard label="Cotizaciones" value={stats.total_cotizaciones}
                  icon={<ClipboardList size={18} />} color={C.purple} sub={`${stats.cotizaciones_aprobadas} aprobadas`} />
              </div>

              {/* KPI Cotizaciones */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up stagger-2">
                <KpiCard label="Enviadas"    value={stats.cotizaciones_en_curso}    icon={<Send        size={18} />} color={C.accent} />
                <KpiCard label="Negociación" value={stats.cotizaciones_negociacion} icon={<Handshake   size={18} />} color={C.gold} />
                <KpiCard label="Aprobadas"   value={stats.cotizaciones_aprobadas}   icon={<CheckCircle size={18} />} color={C.success} />
                <KpiCard label="Rechazadas"  value={stats.cotizaciones_rechazadas}  icon={<XCircle     size={18} />} color={C.danger} />
              </div>

              {/* Gráficas fila 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Pipeline por estado</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={pipelineData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" vertical={false} />
                      <XAxis dataKey="estado" tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: '#00c2ff08' }} />
                      <Bar dataKey="count" name="Registros" fill={C.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Tendencia mensual (12 meses)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={stats.registros_por_mes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3050" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fill: '#8899b4', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#8899b4', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<DarkTooltip />} />
                      <Line type="monotone" dataKey="prospectos" name="Prospectos"
                        stroke={C.accent} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="clientes" name="Clientes"
                        stroke={C.gold} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Legend wrapperStyle={{ fontSize: 12, color: '#8899b4' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráficas fila 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card p-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Servicios solicitados</h3>
                  {serviciosData.length === 0 ? (
                    <div className="empty-state text-sm">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={serviciosData} dataKey="count" nameKey="servicio"
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {serviciosData.map((_, i) => <Cell key={i} fill={donutColors[i % donutColors.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#8899b4' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card p-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Cotizaciones por estado</h3>
                  {cotData.length === 0 ? (
                    <div className="empty-state text-sm">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={cotData} dataKey="value" nameKey="name"
                          cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {cotData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e3050', borderRadius: 8, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#8899b4' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card p-5">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Facturación por línea</h3>
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
                        <th>#</th><th>Nombre</th><th>Cargo</th>
                        <th>Prospectos</th><th>Clientes</th><th>Visitas</th><th>Facturado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((c, i) => (
                        <tr key={c.id}>
                          <td><span className="font-bold text-foreground">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span></td>
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
                        <th>Empresa</th><th>Tipo</th><th>Comercial</th><th>Servicios</th><th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recientes.records.slice(0, 8).map((r) => (
                        <tr key={r.id}>
                          <td className="font-semibold text-foreground">{r.empresa}</td>
                          <td>
                            <span className={r.tipo === 'cliente' ? 'badge-gold' : 'badge-blue'}>{r.tipo}</span>
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
            </>
          )}
        </>
      )}

      {/* ────── PESTAÑA GERENCIAL ────── */}
      {tab === 'gerencial' && <GerencialPanel />}

    </div>
  )
}
