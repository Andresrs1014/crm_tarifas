import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  getCotizaciones, deleteCotizacion, duplicarCotizacion, updateCotizacion, getCotizacion,
} from '../api/cotizaciones'
import { toast } from '../store/toastStore'
import type { EstadoCotizacion } from '../types'
import { exportCotizacionPDF } from '../utils/exportPDF'
import { exportCotizacionesExcel } from '../utils/exportExcel'

// ─── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS: { value: string; label: string }[] = [
  { value: '',            label: 'Todos los estados' },
  { value: 'borrador',    label: 'Borrador' },
  { value: 'enviada',     label: 'Enviada' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'aprobada',    label: 'Aprobada' },
  { value: 'rechazada',   label: 'Rechazada' },
]

const ESTADO_BADGE: Record<string, string> = {
  borrador:    'badge-gray',
  enviada:     'badge-blue',
  negociacion: 'badge-gold',
  aprobada:    'badge-green',
  rechazada:   'badge-red',
}

const ESTADO_NEXT: Record<EstadoCotizacion, EstadoCotizacion | null> = {
  borrador:    'enviada',
  enviada:     'negociacion',
  negociacion: 'aprobada',
  aprobada:    null,
  rechazada:   null,
}

const ESTADO_NEXT_LABEL: Record<string, string> = {
  borrador:    'Marcar enviada',
  enviada:     'En negociación',
  negociacion: 'Aprobar',
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function Cotizaciones() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [estado, setEstado] = useState('')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', estado, search],
    queryFn: () => getCotizaciones({ estado: estado || undefined, search: search || undefined }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteCotizacion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Cotización eliminada')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const duplicarMut = useMutation({
    mutationFn: duplicarCotizacion,
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success(`Cotización duplicada: ${cot.numero}`)
      navigate(`/cotizaciones/${cot.id}/editar`)
    },
    onError: () => toast.error('Error al duplicar'),
  })

  const avanzarMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCotizacion }) =>
      updateCotizacion(id, { estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const rechazarMut = useMutation({
    mutationFn: (id: string) => updateCotizacion(id, { estado: 'rechazada' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Cotización rechazada')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  async function handlePDF(cotId: string, numero: string) {
    setPdfLoading(cotId)
    try {
      const cot = await getCotizacion(cotId)
      const html = cot.htmlPreview || `<h2>${cot.numero}</h2><p>${cot.empresa}</p>`
      await exportCotizacionPDF(html, `cotizacion-${numero}.pdf`)
    } catch {
      toast.error('Error generando PDF')
    } finally {
      setPdfLoading(null)
    }
  }

  // KPIs rápidos
  const aprobadas   = cotizaciones.filter((c) => c.estado === 'aprobada').length
  const enviadas    = cotizaciones.filter((c) => c.estado === 'enviada').length
  const rechazadas  = cotizaciones.filter((c) => c.estado === 'rechazada').length

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted mt-0.5">
            {cotizaciones.length} registros ·{' '}
            <span className="text-success">{aprobadas} aprobadas</span> ·{' '}
            <span className="text-accent">{enviadas} enviadas</span>
            {rechazadas > 0 && <span className="text-danger"> · {rechazadas} rechazadas</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={() => exportCotizacionesExcel(cotizaciones, 'cotizaciones.xlsx')}
            disabled={cotizaciones.length === 0}
            title="Exportar a Excel"
          >
            ↓ Excel
          </button>
          <Link to="/cotizaciones/nueva" className="btn-primary btn-sm">
            + Nueva cotización
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="filter-input flex-1 min-w-48"
          placeholder="Buscar empresa, número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
          {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="table-card">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-surface2 rounded animate-pulse" />
            ))}
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-foreground mb-1">Sin cotizaciones</p>
            <p className="text-sm">Crea la primera cotización para un cliente o prospecto.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Número</th>
                <th>Empresa</th>
                <th>Comercial</th>
                <th>Estado</th>
                <th>Líneas</th>
                <th>Tarifa</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((cot) => {
                const nextEstado = ESTADO_NEXT[cot.estado]
                return (
                  <tr key={cot.id}>
                    <td>
                      <span className="font-mono text-accent font-semibold">{cot.numero}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-foreground">{cot.empresa}</div>
                      {cot.ciudad && <div className="text-xs text-muted">{cot.ciudad}</div>}
                    </td>
                    <td className="text-sm text-muted">{cot.comercial}</td>
                    <td>
                      <span className={ESTADO_BADGE[cot.estado] ?? 'badge-gray'}>
                        {cot.estado}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {cot.lineas.slice(0, 2).map((l) => (
                          <span key={l} className="stag">{l}</span>
                        ))}
                        {cot.lineas.length > 2 && (
                          <span className="stag">+{cot.lineas.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted capitalize">{cot.tarifaTipo}</span>
                    </td>
                    <td className="text-xs text-muted whitespace-nowrap">
                      {new Date(cot.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 flex-wrap">
                        {/* Ver / Editar */}
                        {cot.estado === 'borrador' ? (
                          <button
                            className="btn-ghost btn-sm px-2 py-1 text-xs"
                            onClick={() => navigate(`/cotizaciones/${cot.id}/editar`)}
                          >
                            Editar
                          </button>
                        ) : (
                          <a
                            href={`/cot/${cot.numero}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ghost btn-sm px-2 py-1 text-xs"
                          >
                            Ver
                          </a>
                        )}

                        {/* PDF */}
                        <button
                          className="btn-ghost btn-sm px-2 py-1 text-xs"
                          disabled={pdfLoading === cot.id}
                          onClick={() => handlePDF(cot.id, cot.numero)}
                          title="Descargar PDF"
                        >
                          {pdfLoading === cot.id ? '...' : '↓ PDF'}
                        </button>

                        {/* Avanzar estado */}
                        {nextEstado && (
                          <button
                            className="btn-ghost btn-sm px-2 py-1 text-xs text-success"
                            disabled={avanzarMut.isPending}
                            onClick={() => avanzarMut.mutate({ id: cot.id, estado: nextEstado })}
                            title={ESTADO_NEXT_LABEL[cot.estado]}
                          >
                            {ESTADO_NEXT_LABEL[cot.estado] ?? '→'}
                          </button>
                        )}

                        {/* Rechazar (si no está rechazada/aprobada) */}
                        {cot.estado !== 'rechazada' && cot.estado !== 'aprobada' && (
                          <button
                            className="btn-ghost btn-sm px-2 py-1 text-xs text-danger"
                            disabled={rechazarMut.isPending}
                            onClick={() => rechazarMut.mutate(cot.id)}
                            title="Marcar rechazada"
                          >
                            Rechazar
                          </button>
                        )}

                        {/* Duplicar */}
                        <button
                          className="btn-ghost btn-sm px-2 py-1 text-xs"
                          disabled={duplicarMut.isPending}
                          onClick={() => duplicarMut.mutate(cot.id)}
                          title="Duplicar cotización"
                        >
                          ⧉
                        </button>

                        {/* Eliminar (solo borrador) */}
                        {cot.estado === 'borrador' && (
                          <button
                            className="btn-danger btn-sm px-2 py-1 text-xs"
                            onClick={() => setConfirmId(cot.id)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirm delete */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setConfirmId(null)}>
          <div className="card p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-foreground">¿Eliminar cotización?</h3>
            <p className="text-sm text-muted">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="btn-secondary btn-sm" onClick={() => setConfirmId(null)}>Cancelar</button>
              <button
                className="btn-danger btn-sm"
                disabled={deleteMut.isPending}
                onClick={() => deleteMut.mutate(confirmId)}
              >
                {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
