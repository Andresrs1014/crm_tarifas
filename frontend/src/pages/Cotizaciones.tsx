import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Copy, Link, Printer, Trash2, TrendingUp, FileText } from 'lucide-react'
import {
  getCotizacionesApi,
  deleteCotizacionApi,
  duplicarCotizacionApi,
  actualizarTarifasApi,
} from '../api/cotizaciones'
import { getComercialesApi } from '../api/comerciales'
import Badge from '../components/Badge'
import ConfirmModal from '../components/ConfirmModal'
import { useToastStore } from '../store/toastStore'
import { useCotWizardStore } from '../store/cotWizardStore'
import { fmtDate } from '../utils/format'
import { SERVICIO_COLORS } from '../types'
import type { CotizacionRead } from '../types'

/** Extrae nombres de ítems tipo_tarifa='moneda' del snapshot */
function extractMonedaItems(snapshot: Record<string, unknown>): string[] {
  const names: string[] = []
  for (const linea of Object.values(snapshot)) {
    for (const grupo of Object.values(linea as Record<string, unknown>)) {
      const g = grupo as { items?: Array<{ nombre: string; tipo_tarifa: string }> }
      for (const item of g.items ?? []) {
        if (item.tipo_tarifa === 'moneda' && !names.includes(item.nombre)) {
          names.push(item.nombre)
        }
      }
    }
  }
  return names
}

const ESTADO_COLORS: Record<string, string> = {
  borrador:    '#8899b4',
  enviada:     '#00c2ff',
  negociacion: '#f5a623',
  aprobada:    '#00e676',
  rechazada:   '#ff6b6b',
}

export default function Cotizaciones() {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [comercialId, setComercialId] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [actualizarCot, setActualizarCot] = useState<CotizacionRead | null>(null)
  const [actualizarPct, setActualizarPct] = useState('5')
  const [actualizarItems, setActualizarItems] = useState<string[]>([])
  const navigate = useNavigate()
  const toast = useToastStore()
  const qc = useQueryClient()
  const resetWizard = useCotWizardStore((s) => s.resetWizard)

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', search, estado, comercialId],
    queryFn: () =>
      getCotizacionesApi({
        ...(search ? { search } : {}),
        ...(estado ? { estado } : {}),
        ...(comercialId ? { comercial_id: comercialId } : {}),
      }),
  })

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCotizacionApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.add('Cotización eliminada')
      setDeleteId(null)
    },
    onError: () => toast.add('Error al eliminar', 'error'),
  })

  const duplicarMutation = useMutation({
    mutationFn: duplicarCotizacionApi,
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.add(`Duplicada como ${cot.numero}`)
    },
    onError: () => toast.add('Error al duplicar', 'error'),
  })

  const actualizarMutation = useMutation({
    mutationFn: ({ id, porcentaje, items_keys }: { id: string; porcentaje: number; items_keys: string[] }) =>
      actualizarTarifasApi(id, { porcentaje, items_keys }),
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.add(`Nueva versión creada: ${cot.numero}`)
      setActualizarCot(null)
    },
    onError: () => toast.add('Error al actualizar tarifas', 'error'),
  })

  const openActualizar = (cot: CotizacionRead) => {
    const allItems = extractMonedaItems(cot.items_snapshot as Record<string, unknown>)
    setActualizarCot(cot)
    setActualizarPct('5')
    setActualizarItems(allItems) // todos seleccionados por defecto
  }

  const toggleActualizarItem = (name: string) => {
    setActualizarItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  const comercialNombre = (id: string | null) =>
    comerciales.find((c) => c.id === id)?.nombre ?? '—'

  const copyLink = (cot: CotizacionRead) => {
    const slug = cot.numero.replace('COT-', 'COT')
    const url = `${window.location.origin}/cot/${slug}`
    navigator.clipboard.writeText(url)
    toast.add('Link copiado al portapapeles')
  }

  const openPrint = (cot: CotizacionRead) => {
    const slug = cot.numero.replace('COT-', 'COT')
    window.open(`/cot/${slug}`, '_blank')
  }

  const handleNew = () => {
    resetWizard()
    navigate('/cotizaciones/nueva')
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-condensed font-bold text-2xl" style={{ color: '#e8edf5' }}>
          Cotizaciones
        </h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
          style={{ background: '#00c2ff', color: '#0a0e1a' }}
        >
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por empresa, NIT o número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="w-44" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="borrador">Borrador</option>
          <option value="enviada">Enviada</option>
          <option value="negociacion">Negociación</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <select className="w-44" value={comercialId} onChange={(e) => setComercialId(e.target.value)}>
          <option value="">Todos los comerciales</option>
          {comerciales.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Número', 'Empresa', 'Líneas', 'Estado', 'Comercial', 'Fecha', 'Vigencia', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-condensed uppercase text-muted tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {['30%', '65%', '70%', '40%', '50%', '45%', '45%', '20%'].map((w, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-surface2 rounded animate-pulse" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && cotizaciones.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted">
                      <FileText size={36} className="opacity-30" />
                      <p className="text-sm">No hay cotizaciones que mostrar</p>
                    </div>
                  </td>
                </tr>
              )}
              {cotizaciones.map((cot) => (
                <tr
                  key={cot.id}
                  className="border-b border-border hover:bg-surface2 transition"
                >
                  <td className="px-4 py-3">
                    <span className="font-condensed font-bold text-sm" style={{ color: '#00c2ff' }}>
                      {cot.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium" style={{ color: '#e8edf5' }}>{cot.empresa}</p>
                    {cot.nit && <p className="text-xs text-muted">NIT {cot.nit}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {cot.lineas.slice(0, 3).map((l) => (
                        <span
                          key={l}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            background: SERVICIO_COLORS[l] + '22',
                            color: SERVICIO_COLORS[l],
                          }}
                        >
                          {l}
                        </span>
                      ))}
                      {cot.lineas.length > 3 && (
                        <span className="text-xs text-muted">+{cot.lineas.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: (ESTADO_COLORS[cot.estado] ?? '#8899b4') + '22',
                        color: ESTADO_COLORS[cot.estado] ?? '#8899b4',
                      }}
                    >
                      {cot.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{comercialNombre(cot.comercial_id)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(cot.fecha)}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{fmtDate(cot.vigencia)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <ActionBtn title="Ver" onClick={() => navigate(`/cotizaciones/${cot.id}`)}>
                        <Eye size={14} />
                      </ActionBtn>
                      <ActionBtn title="Editar" onClick={() => navigate(`/cotizaciones/${cot.id}/editar`)}>
                        <Pencil size={14} />
                      </ActionBtn>
                      <ActionBtn title="Duplicar" onClick={() => duplicarMutation.mutate(cot.id)}>
                        <Copy size={14} />
                      </ActionBtn>
                      <ActionBtn title="Actualizar tarifas" onClick={() => openActualizar(cot)}>
                        <TrendingUp size={14} />
                      </ActionBtn>
                      <ActionBtn title="Copiar link público" onClick={() => copyLink(cot)}>
                        <Link size={14} />
                      </ActionBtn>
                      <ActionBtn title="PDF / Imprimir" onClick={() => openPrint(cot)}>
                        <Printer size={14} />
                      </ActionBtn>
                      <ActionBtn title="Eliminar" danger onClick={() => setDeleteId(cot.id)}>
                        <Trash2 size={14} />
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteId}
        message="¿Eliminar esta cotización? Esta acción no se puede deshacer."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMutation.isPending}
      />

      {/* Modal Actualizar Tarifas */}
      {actualizarCot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActualizarCot(null)}
        >
          <div
            className="bg-surface border border-border rounded-xl p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-condensed font-bold text-lg" style={{ color: '#e8edf5' }}>
              Actualizar tarifas — {actualizarCot.numero}
            </h2>
            <p className="text-xs text-muted">
              Crea una nueva cotización con las tarifas en moneda incrementadas. La original no se modifica.
            </p>

            <div className="flex items-center gap-3">
              <label className="text-xs text-muted whitespace-nowrap">Incremento %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                className="w-24"
                value={actualizarPct}
                onChange={(e) => setActualizarPct(e.target.value)}
              />
            </div>

            {(() => {
              const allMonedaItems = extractMonedaItems(actualizarCot.items_snapshot as Record<string, unknown>)
              return allMonedaItems.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted">Ítems en moneda a actualizar:</p>
                    <button
                      className="text-xs text-accent hover:underline"
                      onClick={() => setActualizarItems(
                        actualizarItems.length === allMonedaItems.length ? [] : [...allMonedaItems]
                      )}
                    >
                      {actualizarItems.length === allMonedaItems.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {allMonedaItems.map((name) => (
                      <label key={name} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={actualizarItems.includes(name)}
                          onChange={() => toggleActualizarItem(name)}
                          className="w-3.5 h-3.5 accent-purple-500"
                        />
                        <span style={{ color: '#e8edf5' }}>{name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted">Esta cotización no tiene ítems de tipo moneda.</p>
              )
            })()}

            <div className="flex gap-3 justify-end pt-2">
              <button
                className="px-4 py-2 text-sm rounded-lg border border-border text-muted hover:text-white transition"
                onClick={() => setActualizarCot(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-sm rounded-lg font-medium transition"
                style={{ background: '#00c2ff', color: '#0a0e1a' }}
                disabled={actualizarMutation.isPending || actualizarItems.length === 0}
                onClick={() =>
                  actualizarMutation.mutate({
                    id: actualizarCot.id,
                    porcentaje: parseFloat(actualizarPct) || 0,
                    items_keys: actualizarItems,
                  })
                }
              >
                {actualizarMutation.isPending ? 'Creando...' : 'Crear nueva versión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}

function ActionBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition ${
        danger ? 'text-muted hover:text-danger' : 'text-muted hover:text-accent'
      }`}
    >
      {children}
    </button>
  )
}
