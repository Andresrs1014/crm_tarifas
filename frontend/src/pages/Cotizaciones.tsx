import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  getCotizaciones, deleteCotizacion, duplicarCotizacion, updateCotizacion, getCotizacion,
  actualizarTarifas,
} from '../api/cotizaciones'
import { toast } from '../store/toastStore'
import type { EstadoCotizacion } from '../types'
import { exportCotizacionPDF } from '../utils/exportPDF'
import { exportCotizacionesExcel } from '../utils/exportExcel'

// ─── Helpers para preview de incremento ────────────────────────────────────────

function parseTarifaMoneda(tarifa: string): number | null {
  const cleaned = tarifa.replace(/\$/g, '').replace(/\./g, '').replace(/,/g, '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function fmtMoneda(value: number): string {
  return '$' + Math.round(value).toLocaleString('es-CO')
}

interface PreviewItem {
  descripcion: string
  antes: string
  despues: string
}

function buildPreview(snapshot: Record<string, unknown>, pct: number): PreviewItem[] {
  const items: PreviewItem[] = []
  const factor = 1 + pct / 100
  for (const grupos of Object.values(snapshot)) {
    for (const arr of Object.values(grupos as Record<string, unknown>)) {
      for (const item of arr as Array<Record<string, unknown>>) {
        if (item.tipoTarifa === 'moneda' && typeof item.tarifa === 'string') {
          const val = parseTarifaMoneda(item.tarifa)
          if (val !== null) {
            items.push({
              descripcion: (item.descripcion as string) || '—',
              antes: item.tarifa,
              despues: fmtMoneda(val * factor),
            })
          }
        }
      }
    }
  }
  return items
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtEstado(value: string | undefined, map: { value: string; label: string }[]): string {
  if (!value) return '—'
  return map.find(e => e.value === value)?.label ?? value.replace(/_/g, ' ')
}

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
  const [actualizarId, setActualizarId] = useState<string | null>(null)
  const [incremento, setIncremento] = useState('')

  const [comercialFiltro, setComercialFiltro] = useState('')

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', estado, search],
    queryFn: () => getCotizaciones({ estado: estado || undefined, search: search || undefined }),
  })

  // Filtro comercial client-side (cotizacion.comercial es string, no FK)
  const cotizacionesFiltradas = comercialFiltro
    ? cotizaciones.filter((c) => c.comercial === comercialFiltro)
    : cotizaciones

  // Lista única de comerciales para el filtro
  const comercialesUnicos = [...new Set(cotizaciones.map((c) => c.comercial).filter(Boolean))].sort()

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

  // ── Actualizar Tarifas ──────────────────────────────────────────────────────
  const { data: cotActualizar, isLoading: loadingActualizar } = useQuery({
    queryKey: ['cotizacion-detail', actualizarId],
    queryFn: () => getCotizacion(actualizarId!),
    enabled: !!actualizarId,
  })

  const pct = parseFloat(incremento) || 0
  const previewItems = useMemo(() => {
    if (!cotActualizar?.itemsSnapshot) return []
    return buildPreview(cotActualizar.itemsSnapshot as Record<string, unknown>, pct)
  }, [cotActualizar, pct])

  const actualizarMut = useMutation({
    mutationFn: ({ id, inc }: { id: string; inc: number }) => actualizarTarifas(id, inc),
    onSuccess: ({ cotizacion, itemsActualizados }) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success(`Nueva cotización ${cotizacion.numero} creada · ${itemsActualizados} ítems actualizados`)
      setActualizarId(null)
      setIncremento('')
      navigate(`/cotizaciones/${cotizacion.id}/editar`)
    },
    onError: () => toast.error('Error al actualizar tarifas'),
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

  // KPIs rápidos (sobre la lista ya filtrada)
  const aprobadas   = cotizacionesFiltradas.filter((c) => c.estado === 'aprobada').length
  const enviadas    = cotizacionesFiltradas.filter((c) => c.estado === 'enviada').length
  const rechazadas  = cotizacionesFiltradas.filter((c) => c.estado === 'rechazada').length

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted mt-0.5">
            {cotizacionesFiltradas.length} registros ·{' '}
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
        <select className="filter-select" value={comercialFiltro} onChange={(e) => setComercialFiltro(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {comercialesUnicos.map((c) => <option key={c} value={c}>{c}</option>)}
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
        ) : cotizacionesFiltradas.length === 0 ? (
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
              {cotizacionesFiltradas.map((cot) => {
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
                        {fmtEstado(cot.estado, ESTADOS)}
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

                        {/* Actualizar Tarifas */}
                        <button
                          className="btn-ghost btn-sm px-2 py-1 text-xs text-gold"
                          onClick={() => { setActualizarId(cot.id); setIncremento('') }}
                          title="Actualizar tarifas con incremento %"
                        >
                          📈
                        </button>

                        {/* Copiar link */}
                        <button
                          className="btn-ghost btn-sm px-2 py-1 text-xs"
                          title="Copiar link público"
                          onClick={() => {
                            const url = `${window.location.origin}/cot/${cot.numero}`
                            navigator.clipboard.writeText(url).then(() => toast.success('Link copiado'))
                          }}
                        >
                          🔗
                        </button>

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

      {/* Modal actualizar tarifas */}
      {actualizarId && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => { setActualizarId(null); setIncremento('') }}
        >
          <div
            className="card w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground text-lg">📈 Actualizar Tarifas</h3>
                {cotActualizar && (
                  <p className="text-sm text-muted mt-0.5">
                    Base: <span className="font-mono text-accent">{cotActualizar.numero}</span>
                    {' · '}{cotActualizar.empresa}
                  </p>
                )}
              </div>
              <button
                className="text-muted hover:text-foreground text-xl leading-none"
                onClick={() => { setActualizarId(null); setIncremento('') }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* % input */}
              <div className="flex items-center gap-4">
                <label className="text-xs text-muted uppercase tracking-widest font-semibold whitespace-nowrap">
                  % Incremento
                </label>
                <input
                  type="number"
                  className="filter-input w-32 font-mono text-lg text-center"
                  placeholder="Ej: 5"
                  min="0"
                  max="200"
                  step="0.1"
                  value={incremento}
                  onChange={(e) => setIncremento(e.target.value)}
                  autoFocus
                />
                <span className="text-gold font-bold text-2xl">%</span>
                <p className="text-xs text-muted">
                  La cotización original queda intacta. Se crea una nueva con número nuevo.
                </p>
              </div>

              {/* Preview */}
              {loadingActualizar ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-8 bg-surface2 rounded animate-pulse" />
                  ))}
                </div>
              ) : previewItems.length === 0 ? (
                <div className="text-center py-6 text-muted text-sm">
                  {pct === 0
                    ? 'Ingresa un porcentaje para ver el preview'
                    : 'Esta cotización no tiene ítems de tipo moneda para actualizar'}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-2">
                    Preview · {previewItems.length} ítem{previewItems.length !== 1 ? 's' : ''} monetarios
                  </p>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface2">
                          <th className="text-left px-3 py-2 text-xs text-muted font-semibold">Ítem</th>
                          <th className="text-right px-3 py-2 text-xs text-muted font-semibold">Antes</th>
                          <th className="text-right px-3 py-2 text-xs text-muted font-semibold">Después</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewItems.map((item, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 text-foreground truncate max-w-xs">{item.descripcion}</td>
                            <td className="px-3 py-2 text-right font-mono text-muted line-through">{item.antes}</td>
                            <td className="px-3 py-2 text-right font-mono text-gold font-semibold">{item.despues}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                className="btn-secondary btn-sm"
                onClick={() => { setActualizarId(null); setIncremento('') }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary btn-sm"
                disabled={pct <= 0 || previewItems.length === 0 || actualizarMut.isPending}
                onClick={() => actualizarMut.mutate({ id: actualizarId, inc: pct })}
              >
                {actualizarMut.isPending ? 'Creando...' : '✅ Aplicar y crear nueva cotización'}
              </button>
            </div>
          </div>
        </div>
      )}

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
