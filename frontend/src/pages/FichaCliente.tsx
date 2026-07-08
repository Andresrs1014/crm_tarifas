import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getFichas, getAnalistas, getFichaByRecord } from '../api/fichas'
import { getComercialesApi } from '../api/comerciales'
import { getRecord } from '../api/records'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'
import { buildFichaHTML } from '../lib/ficha/buildFichaHTML'
import { EMPTY_DATA, type FichaData } from './FichaDetalle'
import { exportCotizacionPDF } from '../utils/exportPDF'
import { toast } from '../store/toastStore'

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
  const [filtEstado, setFiltEstado] = useState('')
  const [filtComercial, setFiltComercial] = useState('')
  const [search, setSearch] = useState('')
  const [pdfLoadingId, setPdfLoadingId] = useState('')

  const { data: analistasAll = [] } = useQuery({ queryKey: ['analistas'], queryFn: getAnalistas })

  async function handlePDF(recordId: string) {
    setPdfLoadingId(recordId)
    try {
      const [ficha, record] = await Promise.all([getFichaByRecord(recordId), getRecord(recordId)])
      const fichaData: FichaData = { ...EMPTY_DATA, ...(ficha.data as Partial<FichaData>) }
      const analistaNombre = analistasAll.find((a) => a.id === fichaData.analistaId)?.nombre ?? ''
      const html = buildFichaHTML(record, fichaData, analistaNombre)
      await exportCotizacionPDF(html, `ficha-${record.empresa}.pdf`)
    } catch {
      toast.error('Error generando PDF')
    } finally {
      setPdfLoadingId('')
    }
  }

  const { data: fichas = [], isLoading } = useQuery({
    queryKey: ['fichas', filtEstado, filtComercial],
    queryFn: () => getFichas({
      estado: filtEstado || undefined,
      comercialId: filtComercial || undefined,
    }),
  })

  const { data: fichasAll = [] } = useQuery({
    queryKey: ['fichas-all', filtComercial],
    queryFn: () => getFichas({ comercialId: filtComercial || undefined }),
  })

  const { data: comerciales = [] } = useQuery({ queryKey: ['comerciales'], queryFn: getComercialesApi })

  const filtered = fichas.filter((f) => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.record.empresa.toLowerCase().includes(q)
  })

  // KPIs — calculados sobre fichasAll (sin filtro de estado) para mostrar totales reales
  const total = fichasAll.length
  const pendientes = fichasAll.filter((f) => f.estado === 'pendiente').length
  const enProceso = fichasAll.filter((f) => f.estado === 'en_proceso').length
  const completadas = fichasAll.filter((f) => f.estado === 'completada').length
  const pctPromedio = fichasAll.length
    ? Math.round(fichasAll.reduce((s, f) => s + f.pct, 0) / fichasAll.length)
    : 0

  const pagination = usePagination(filtered, {
    resetDeps: [search, filtEstado, filtComercial],
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Fichas de Cliente</h2>
          <p className="text-sm text-muted mt-0.5">Documentación SOP — Creación y seguimiento de fichas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
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

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-foreground mb-1">Sin fichas</p>
            <p className="text-sm">Abre la ficha desde el detalle del cliente (botón «Ficha SOP») o desde la lista de clientes activos.</p>
          </div>
        }
      >
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
              {pagination.pageItems.map((f) => (
                <tr key={f.recordId}>
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
                  <td className="text-xs text-muted">{f.updatedAt ? new Date(f.updatedAt).toLocaleDateString('es-CO') : '—'}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Link to={`/fichas/${f.record.id}`} className="btn-primary btn-sm text-xs px-3 py-1">
                        Abrir
                      </Link>
                      <button
                        type="button"
                        className="btn-secondary btn-sm text-xs px-2 py-1"
                        disabled={f.estado !== 'completada' || pdfLoadingId === f.recordId}
                        title={f.estado !== 'completada' ? 'Solo disponible para fichas completadas' : 'Descargar PDF'}
                        onClick={() => handlePDF(f.recordId)}
                      >
                        {pdfLoadingId === f.recordId ? '…' : '📄'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </DataListPanel>
    </div>
  )
}
