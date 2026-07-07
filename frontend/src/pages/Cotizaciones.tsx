import { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { Link, useNavigate } from 'react-router-dom'
import {
  getCotizaciones, deleteCotizacion, duplicarCotizacion, updateCotizacion, getCotizacion,
  actualizarTarifas,
} from '../api/cotizaciones'
import { getBiblioteca } from '../api/biblioteca'
import { buildCotHTML, flattenSnapshot } from '../lib/cotizacion/buildCotHTML'
import { isMonedaCampo } from '../lib/cotizacion/snapshot'
import { toast } from '../store/toastStore'
import type { EstadoCotizacion } from '../types'
import { exportCotizacionPDF } from '../utils/exportPDF'
import { exportCotizacionDetalladoExcel } from '../utils/exportExcel'
import { fmtEstado } from '../utils/fmtEstado'
import {
  COTIZACION_BADGE,
  COTIZACION_ESTADO_OPTIONS,
  COTIZACION_ESTADO_NEXT,
  COTIZACION_ESTADO_NEXT_LABEL,
} from '../lib/htmlV6/domainConfig'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel, TableScrollArea } from '../components/ui/DataListPanel'

const ESTADOS = COTIZACION_ESTADO_OPTIONS

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

function normalizeSnapshot(raw: unknown): Record<string, unknown> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

function buildPreview(snapshot: Record<string, unknown>, pct: number): PreviewItem[] {
  const items: PreviewItem[] = []
  const factor = 1 + pct / 100
  for (const grupos of Object.values(snapshot)) {
    if (!grupos || typeof grupos !== 'object' || Array.isArray(grupos)) continue
    for (const arr of Object.values(grupos as Record<string, unknown>)) {
      if (!Array.isArray(arr)) continue
      for (const item of arr) {
        if (!item || typeof item !== 'object') continue
        const row = item as Record<string, unknown>
        if (row.tipoTarifa === 'moneda' && typeof row.tarifa === 'string') {
          const val = parseTarifaMoneda(row.tarifa)
          if (val !== null) {
            items.push({
              descripcion: (row.nombre as string) || (row.descripcion as string) || '—',
              antes: row.tarifa,
              despues: fmtMoneda(val * factor),
            })
          }
        }

        // Ítems de Transporte/Paqueteo (schema): el valor vive en `campos`, no en `tarifa`.
        const campos = row.campos as Record<string, string> | undefined
        if (campos) {
          const tiposCampo = row.tiposCampo as Record<string, string> | undefined
          for (const [colId, raw] of Object.entries(campos)) {
            if (!raw || !isMonedaCampo(colId, tiposCampo)) continue
            const val = parseTarifaMoneda(raw)
            if (val === null) continue
            items.push({
              descripcion: `${(row.nombre as string) || '—'} · ${colId}`,
              antes: raw,
              despues: fmtMoneda(val * factor),
            })
          }
        }
      }
    }
  }
  return items
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function Cotizaciones() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [estado, setEstado] = useState('')
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<string | null>(null)
  const [excelLoading, setExcelLoading] = useState<string | null>(null)
  const [actualizarId, setActualizarId] = useState<string | null>(null)
  const [incremento, setIncremento] = useState('')

  const closeActualizarModal = useCallback(() => {
    setActualizarId(null)
    setIncremento('')
  }, [])

  useEffect(() => {
    if (!actualizarId) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeActualizarModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [actualizarId, closeActualizarModal])

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

  const deleteMut = useAppMutation({
    mutationFn: deleteCotizacion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Cotización eliminada')
      setConfirmId(null)
    },
    onError: () => toast.error('Error al eliminar'),
  })

  const duplicarMut = useAppMutation({
    mutationFn: duplicarCotizacion,
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success(`Cotización duplicada: ${cot.numero}`)
      navigate(`/cotizaciones/${cot.id}/editar`)
    },
    onError: () => toast.error('Error al duplicar'),
  })

  const avanzarMut = useAppMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCotizacion }) =>
      updateCotizacion(id, { estado }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const rechazarMut = useAppMutation({
    mutationFn: (id: string) => updateCotizacion(id, { estado: 'rechazada' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success('Cotización rechazada')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  // ── Actualizar Tarifas ──────────────────────────────────────────────────────
  const { data: cotActualizar, isLoading: loadingActualizar, isError: errorActualizar } = useQuery({
    queryKey: ['cotizacion-detail', actualizarId],
    queryFn: () => getCotizacion(actualizarId!),
    enabled: !!actualizarId,
  })

  const pct = parseFloat(incremento) || 0
  const previewItems = useMemo(() => {
    if (!cotActualizar?.itemsSnapshot) return []
    return buildPreview(normalizeSnapshot(cotActualizar.itemsSnapshot), pct)
  }, [cotActualizar, pct])

  const actualizarMut = useAppMutation({
    mutationFn: ({ id, inc }: { id: string; inc: number }) => actualizarTarifas(id, inc),
    onSuccess: ({ cotizacion, itemsActualizados }) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success(`Nueva cotización ${cotizacion.numero} creada · ${itemsActualizados} ítems actualizados`)
      closeActualizarModal()
      navigate(`/cotizaciones/${cotizacion.id}/editar`)
    },
    onError: () => toast.error('Error al actualizar tarifas'),
  })

  async function handlePDF(cotId: string, numero: string) {
    setPdfLoading(cotId)
    try {
      const [cot, biblioteca] = await Promise.all([getCotizacion(cotId), getBiblioteca()])
      const html = biblioteca.length
        ? buildCotHTML({
          numero: cot.numero,
          fecha: cot.fecha ?? cot.createdAt,
          vigencia: cot.vigencia,
          asunto: cot.asunto,
          empresa: cot.empresa,
          nit: cot.nit,
          ciudad: cot.ciudad,
          contacto: cot.contacto,
          cargo: cot.cargo,
          telefono: cot.telefono,
          email: cot.email,
          comercial: cot.comercial,
          paqueteadora: cot.paqueteadora,
          lineas: cot.lineas,
          itemsSnapshot: flattenSnapshot(cot.itemsSnapshot),
          obsHtml: cot.obsHtml,
          obsLibre: cot.obsLibre,
          tarifaTipoPorLinea: cot.tarifaTipoPorLinea,
          tarifaEspecialGrupos: cot.tarifaEspecialGrupos,
        }, biblioteca)
        : (cot.htmlPreview || `<h2>${cot.numero}</h2><p>${cot.empresa}</p>`)
      await exportCotizacionPDF(html, `cotizacion-${numero}.pdf`)
    } catch {
      toast.error('Error generando PDF')
    } finally {
      setPdfLoading(null)
    }
  }

  async function handleExcel(cotId: string) {
    setExcelLoading(cotId)
    try {
      const [cot, biblioteca] = await Promise.all([getCotizacion(cotId), getBiblioteca()])
      exportCotizacionDetalladoExcel({
        numero: cot.numero,
        empresa: cot.empresa,
        nit: cot.nit,
        contacto: cot.contacto,
        fecha: cot.fecha ?? cot.createdAt,
        vigencia: cot.vigencia,
        estado: cot.estado,
        comercial: cot.comercial,
        lineas: cot.lineas,
        itemsSnapshot: flattenSnapshot(cot.itemsSnapshot),
        tarifaTipoPorLinea: cot.tarifaTipoPorLinea,
        tarifaEspecialGrupos: cot.tarifaEspecialGrupos,
      }, biblioteca)
    } catch {
      toast.error('Error generando Excel')
    } finally {
      setExcelLoading(null)
    }
  }

  // KPIs rápidos (sobre la lista ya filtrada)
  const aprobadas   = cotizacionesFiltradas.filter((c) => c.estado === 'aprobada').length
  const enviadas    = cotizacionesFiltradas.filter((c) => c.estado === 'enviada').length
  const rechazadas  = cotizacionesFiltradas.filter((c) => c.estado === 'rechazada').length

  const pagination = usePagination(cotizacionesFiltradas, {
    resetDeps: [estado, search, comercialFiltro],
  })

  return (
    <div className="space-y-5">

      {/* CO-01: section-title */}
      <h2 className="section-title">Cotizaciones</h2>

      {/* CO-04: KPI strip */}
      <div className="crm-kpi-strip">
        <div className="crm-kpi-cell" style={{ borderTopColor: 'var(--accent)' }}>
          <div className="crm-kpi-label">Total</div>
          <div className="crm-kpi-value">{cotizacionesFiltradas.length}</div>
        </div>
        <div className="crm-kpi-cell" style={{ borderTopColor: 'var(--green)' }}>
          <div className="crm-kpi-label">Aprobadas</div>
          <div className="crm-kpi-value" style={{ color: 'var(--green)' }}>{aprobadas}</div>
        </div>
        <div className="crm-kpi-cell" style={{ borderTopColor: 'var(--accent)' }}>
          <div className="crm-kpi-label">Enviadas</div>
          <div className="crm-kpi-value text-accent">{enviadas}</div>
        </div>
        <div className="crm-kpi-cell" style={{ borderTopColor: 'var(--red)' }}>
          <div className="crm-kpi-label">Rechazadas</div>
          <div className="crm-kpi-value" style={{ color: 'var(--red)' }}>{rechazadas}</div>
        </div>
      </div>

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-foreground mb-1">Sin cotizaciones</p>
            <p className="text-sm">Crea la primera cotización para un cliente o prospecto.</p>
          </div>
        }
        header={
          <div className="table-header-2row">
            <div className="table-header-top">
              <span className="table-title">Lista de Cotizaciones</span>
              <div className="table-header-actions">
                <Link to="/cotizaciones/nueva" className="btn-primary btn-sm">
                  + Nueva Cotización
                </Link>
              </div>
            </div>
            <div className="table-filters">
              <input
                className="filter-input"
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
          </div>
        }
      >
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
              {pagination.pageItems.map((cot) => {
                const nextEstado = COTIZACION_ESTADO_NEXT[cot.estado] as EstadoCotizacion | null
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
                      <span className={COTIZACION_BADGE[cot.estado] ?? 'badge-gray'}>
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
                      {new Date(cot.fecha ?? cot.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="cot-row-actions">
                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          onClick={() => navigate(`/cotizaciones/${cot.id}/editar?step=4`)}
                          title="Ver / Editar (Vista Previa)"
                        >
                          ✏️
                        </button>
                        <a
                          href={`/cot/${cot.numero}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary btn-sm cot-action-btn"
                          title="Ver enlace público"
                        >
                          👁
                        </a>

                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          disabled={pdfLoading === cot.id}
                          onClick={() => handlePDF(cot.id, cot.numero)}
                          title="Descargar PDF"
                        >
                          {pdfLoading === cot.id ? '…' : '⬇'}
                        </button>

                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          disabled={excelLoading === cot.id}
                          onClick={() => handleExcel(cot.id)}
                          title="Descargar Excel"
                        >
                          {excelLoading === cot.id ? '…' : '📊'}
                        </button>

                        {nextEstado && (
                          <button
                            type="button"
                            className="btn-secondary btn-sm cot-action-btn"
                            disabled={avanzarMut.isPending}
                            onClick={() => avanzarMut.mutate({ id: cot.id, estado: nextEstado })}
                            title={COTIZACION_ESTADO_NEXT_LABEL[cot.estado]}
                          >
                            →
                          </button>
                        )}

                        {cot.estado !== 'rechazada' && cot.estado !== 'aprobada' && (
                          <button
                            type="button"
                            className="btn-secondary btn-sm cot-action-btn cot-action-danger"
                            disabled={rechazarMut.isPending}
                            onClick={() => rechazarMut.mutate(cot.id)}
                            title="Rechazar"
                          >
                            ✕
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          onClick={() => { setActualizarId(cot.id); setIncremento('') }}
                          title="Actualizar tarifas"
                        >
                          📈
                        </button>

                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          title="Copiar link público"
                          onClick={() => {
                            const url = `${window.location.origin}/cot/${cot.numero}`
                            navigator.clipboard.writeText(url).then(() => toast.success('Link copiado'))
                          }}
                        >
                          🔗
                        </button>

                        <button
                          type="button"
                          className="btn-secondary btn-sm cot-action-btn"
                          disabled={duplicarMut.isPending}
                          onClick={() => duplicarMut.mutate(cot.id)}
                          title="Duplicar"
                        >
                          ⧉
                        </button>

                        {cot.estado === 'borrador' && (
                          <button
                            type="button"
                            className="btn-secondary btn-sm cot-action-btn cot-action-danger"
                            onClick={() => setConfirmId(cot.id)}
                            title="Eliminar"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
      </DataListPanel>

      {/* Modal actualizar tarifas — portal sobre todo el layout (z-index header/sidebar) */}
      {actualizarId && createPortal(
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cot-actualizar-title"
          onClick={closeActualizarModal}
        >
          <div
            className="modal-panel cot-actualizar-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-panel-header">
              <div>
                <h3 id="cot-actualizar-title" className="font-bold text-foreground text-lg">
                  📈 Actualizar Tarifas
                </h3>
                {cotActualizar && (
                  <p className="text-sm text-muted mt-0.5">
                    Base: <span className="font-mono text-accent">{cotActualizar.numero}</span>
                    {' · '}{cotActualizar.empresa}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="modal-close-btn"
                aria-label="Cerrar"
                onClick={closeActualizarModal}
              >
                ×
              </button>
            </div>

            <div className="modal-panel-body">
              {errorActualizar ? (
                <div className="text-center py-6 text-danger text-sm">
                  No se pudo cargar la cotización. Cierra e intenta de nuevo.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
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
                    <p className="text-xs text-muted flex-1 min-w-[200px]">
                      La cotización original queda intacta. Se crea una nueva con número nuevo.
                    </p>
                  </div>

                  {loadingActualizar ? (
                    <div className="space-y-2 mt-4">
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
                    <div className="mt-4">
                      <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-2">
                        Preview · {previewItems.length} ítem{previewItems.length !== 1 ? 's' : ''} monetarios
                      </p>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <TableScrollArea>
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
                        </TableScrollArea>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-panel-footer">
              <button type="button" className="btn-secondary btn-sm" onClick={closeActualizarModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary btn-sm"
                disabled={errorActualizar || pct <= 0 || previewItems.length === 0 || actualizarMut.isPending}
                onClick={() => actualizarMut.mutate({ id: actualizarId, inc: pct })}
              >
                {actualizarMut.isPending ? 'Creando...' : '✅ Aplicar y crear nueva cotización'}
              </button>
            </div>
          </div>
        </div>,
        document.body,
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
