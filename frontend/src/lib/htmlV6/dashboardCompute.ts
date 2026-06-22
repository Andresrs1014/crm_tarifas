import type { CRMRecord, Cotizacion } from '../../types'
import {
  ESTADOS_ACTIVOS,
  HTML_SERVICES,
  PIPELINE_ESTADOS,
  PIPELINE_LABELS,
  SVC_COLORS,
} from './constants'
import { resolveVigencia } from './cotUtils'

export interface DashFilters {
  comercialId: string
  mes: string
  tipo: string
}

export function filterRecords(records: CRMRecord[], filters: DashFilters): CRMRecord[] {
  let recs = records
  if (filters.comercialId) recs = recs.filter((r) => r.comercialId === filters.comercialId)
  if (filters.mes) recs = recs.filter((r) => (r.fecha?.slice(0, 7) ?? '') === filters.mes)
  if (filters.tipo) recs = recs.filter((r) => r.tipo === filters.tipo)
  return recs
}

export function buildMesOptions(records: CRMRecord[]): { value: string; label: string }[] {
  const meses = [...new Set(records.map((r) => (r.fecha?.slice(0, 7) ?? '')).filter(Boolean))].sort().reverse()
  return meses.map((m) => {
    const [y, mo] = m.split('-')
    const label = new Date(+y, +mo - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    return { value: m, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })
}

export function computeMainStats(recs: CRMRecord[]) {
  const total = recs.length
  const prospectos = recs.filter((r) => r.tipo === 'prospecto').length
  const clientes = recs.filter((r) => r.tipo === 'cliente').length
  const visitas = recs.filter(
    (r) => (r.visita && r.visita !== 'no') || (r.visitaCliente && r.visitaCliente !== 'no'),
  ).length
  const enPipeline = recs.filter(
    (r) => r.tipo === 'prospecto' && ESTADOS_ACTIVOS.includes((r.estadoProspecto || 'prospecto') as typeof ESTADOS_ACTIVOS[number]),
  ).length
  const facturados = recs.filter((r) => r.tipo === 'prospecto' && r.estadoProspecto === 'facturado').length
  return { total, prospectos, clientes, visitas, enPipeline, facturados }
}

export function computeBillingTotals(recs: CRMRecord[]) {
  const totals: Record<string, number> = {}
  HTML_SERVICES.forEach((s) => { totals[s] = 0 })

  recs.forEach((r) => {
    const lines = (r.facturacionLineas ?? {}) as Record<string, number>
    HTML_SERVICES.forEach((s) => {
      if (lines[s]) totals[s] += Number(lines[s]) || 0
    })
    if (!Object.keys(lines).length) {
      const val = Number(r.tipo === 'prospecto' ? r.valorP : r.valor) || 0
      const svcs = r.servicios ?? []
      if (val > 0 && svcs.length) {
        const share = val / svcs.length
        svcs.forEach((s) => {
          if (totals[s] !== undefined) totals[s] += share
        })
      }
    }
  })

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)
  const maxVal = Math.max(...Object.values(totals), 1)
  return { totals, grandTotal, maxVal }
}

export function computeCotStats(cots: Cotizacion[]) {
  const total = cots.length
  const aprobadas = cots.filter((c) => c.estado === 'aprobada').length
  const borradores = cots.filter((c) => c.estado === 'borrador' || !c.estado).length
  const enviadas = cots.filter((c) => c.estado === 'enviada').length
  const negociacion = cots.filter((c) => c.estado === 'negociacion').length
  const rechazadas = cots.filter((c) => c.estado === 'rechazada').length
  const enCurso = borradores + enviadas + negociacion
  const hoy = new Date()
  const vencidas = cots.filter((c) => {
    const venc = resolveVigencia(c)
    return venc < hoy && c.estado !== 'aprobada' && c.estado !== 'rechazada'
  }).length
  return { total, aprobadas, borradores, enviadas, negociacion, rechazadas, enCurso, vencidas }
}

export function computeTipoChart(recs: CRMRecord[]) {
  return {
    labels: ['Prospectos', 'Clientes'],
    data: [
      recs.filter((r) => r.tipo === 'prospecto').length,
      recs.filter((r) => r.tipo === 'cliente').length,
    ],
  }
}

export function computeEstadoChart(recs: CRMRecord[]) {
  return {
    labels: [...PIPELINE_LABELS],
    data: PIPELINE_ESTADOS.map((s) => recs.filter((r) => r.estadoProspecto === s).length),
  }
}

export function computeServiciosChart(recs: CRMRecord[]) {
  const svcCount: Record<string, number> = {}
  HTML_SERVICES.forEach((s) => { svcCount[s] = 0 })
  recs.forEach((r) => (r.servicios ?? []).forEach((s) => {
    if (svcCount[s] !== undefined) svcCount[s]++
  }))
  return {
    labels: [...HTML_SERVICES],
    data: HTML_SERVICES.map((s) => svcCount[s]),
    colors: HTML_SERVICES.map((s) => SVC_COLORS[s] || '#00c2ff'),
  }
}

export function computeComercialChart(
  recs: CRMRecord[],
  comerciales: { id: string; nombre: string }[],
  filterComercialId: string,
) {
  const coms = filterComercialId
    ? comerciales.filter((x) => x.id === filterComercialId)
    : comerciales
  return {
    labels: coms.map((x) => x.nombre.split(' ')[0]),
    prospectos: coms.map((x) => recs.filter((r) => r.comercialId === x.id && r.tipo === 'prospecto').length),
    clientes: coms.map((x) => recs.filter((r) => r.comercialId === x.id && r.tipo === 'cliente').length),
  }
}

export function computeTimelineChart(recs: CRMRecord[]) {
  const now = new Date()
  const buckets: { key: string; label: string; prospectos: number; clientes: number }[] = []
  for (let m = 11; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    buckets.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
      prospectos: 0,
      clientes: 0,
    })
  }
  recs.forEach((r) => {
    const mes = (r.fecha ?? '').slice(0, 7)
    const bucket = buckets.find((b) => b.key === mes)
    if (!bucket) return
    if (r.tipo === 'prospecto') bucket.prospectos++
    else bucket.clientes++
  })
  return buckets
}

export function computeGestionChart(recs: CRMRecord[]) {
  const clientes = recs.filter((r) => r.tipo === 'cliente')
  return {
    labels: ['Activos', 'En Riesgo', 'Inactivos', 'Con Visita', 'Nuevo Svc', 'Facturados'],
    data: [
      clientes.filter((r) => r.estadoCliente === 'activo').length,
      clientes.filter((r) => r.estadoCliente === 'en-riesgo').length,
      clientes.filter((r) => r.estadoCliente === 'inactivo').length,
      clientes.filter((r) => r.visitaCliente && r.visitaCliente !== 'no').length,
      clientes.filter((r) => r.nuevoServicio === 'si').length,
      clientes.filter((r) => r.facturado && r.facturado !== 'no').length,
    ],
    hasClientes: clientes.length > 0,
  }
}

export function computeCotLineasChart(cots: Cotizacion[]) {
  const lineasCount: Record<string, number> = {}
  HTML_SERVICES.forEach((s) => { lineasCount[s] = 0 })
  cots.forEach((c) => (c.lineas ?? []).forEach((s) => {
    if (lineasCount[s] !== undefined) lineasCount[s]++
  }))
  const nonZero = HTML_SERVICES.filter((s) => lineasCount[s] > 0)
  return {
    labels: nonZero,
    data: nonZero.map((s) => lineasCount[s]),
    colors: nonZero.map((s) => SVC_COLORS[s] || '#00c2ff'),
  }
}

export function cotEstadoBadge(cot: Cotizacion): { className: string; label: string } {
  const hoy = new Date()
  const isVenc = resolveVigencia(cot) < hoy && cot.estado !== 'aprobada' && cot.estado !== 'rechazada'
  if (cot.estado === 'aprobada') return { className: 'badge-green', label: '✅ Aprobada' }
  if (cot.estado === 'rechazada') return { className: 'badge-red', label: '❌ Rechazada' }
  if (isVenc) return { className: 'badge-red', label: '⌛ Vencida' }
  if (cot.estado === 'negociacion') return { className: 'badge-gold', label: '🤝 Negociación' }
  if (cot.estado === 'enviada') return { className: 'badge-cyan', label: '📤 Enviada' }
  return { className: 'badge-gray', label: '📝 Borrador' }
}
