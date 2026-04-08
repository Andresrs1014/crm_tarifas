import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageContainer from '../components/PageContainer'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Copy, Link, Printer, Trash2, TrendingUp, FileText, Upload, X, ChevronRight } from 'lucide-react'
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
import { fmtDate, today } from '../utils/format'
import { SERVICIOS, SERVICIO_COLORS } from '../types'
import type { CotizacionRead, ItemsMap, WizardGrupo, WizardItem } from '../types'

// ─── Tipos para importar PDF ───────────────────────────────
interface ImpItem {
  nombre: string
  tarifa: string
  tipoTarifa: 'moneda' | 'porcentaje'
  obs: string
}
interface ImpGrupo {
  nombre: string
  items: ImpItem[]
}
interface ImpData {
  empresa: string
  linea: string
  grupos: ImpGrupo[]
}

// ─── Helpers de parseo de PDF ──────────────────────────────
function loadPdfJs(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).pdfjsLib) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar pdf.js'))
    document.head.appendChild(s)
  })
}

function agruparLineas(items: { transform: number[]; str: string }[]) {
  const byY: Record<number, { x: number; text: string }[]> = {}
  items.forEach((item) => {
    const y = Math.round(item.transform[5])
    if (!byY[y]) byY[y] = []
    byY[y].push({ x: item.transform[4], text: item.str })
  })
  return Object.entries(byY)
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))
    .map(([, its]) => ({ text: its.sort((a, b) => a.x - b.x).map((i) => i.text).join(' ').trim() }))
    .filter((l) => l.text.length > 0)
}

function detectarEmpresa(pages: { transform: number[]; str: string }[][]): string {
  const lines = agruparLineas(pages[0] || [])
  for (const line of lines) {
    const tl = line.text.toLowerCase()
    if (tl.includes('para:') || tl.includes('cliente:') || tl.includes('señores:') || tl.includes('empresa:')) {
      const after = line.text.replace(/^(para|cliente|señores|empresa)\s*:\s*/i, '').trim()
      if (after.length > 2) return after.substring(0, 80)
    }
  }
  return ''
}

function extraerGrupos(pages: { transform: number[]; str: string }[][], linea: string): ImpGrupo[] {
  const grupos: ImpGrupo[] = []
  const moneyRe = /\$?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/
  const pctRe = /([\d.,]+)\s*%/

  pages.forEach((pageItems) => {
    const lines = agruparLineas(pageItems)
    let curGrp: ImpGrupo | null = null

    lines.forEach((line, i) => {
      const t = line.text
      const tl = t.toLowerCase()
      if (/^\d+$/.test(t.trim())) return
      if (tl.includes('página') || tl.includes('page ')) return

      const hasMoney = moneyRe.test(t) || /\$[\d.,]+/.test(t)
      const hasPct = pctRe.test(t)
      const isHeader = !hasMoney && !hasPct && t.length > 3 && t.length < 100 &&
        (t === t.toUpperCase() || /^[A-ZÁÉÍÓÚÑ]/.test(t)) &&
        !tl.includes('para:') && !tl.includes('fecha') && !tl.includes('vigencia') &&
        !tl.includes('contacto') && !tl.includes('comercial')

      if (isHeader) {
        const nextLine = lines[i + 1]?.text || ''
        if (moneyRe.test(nextLine) || pctRe.test(nextLine) || /\$/.test(nextLine) || i === 0) {
          if (curGrp !== null && curGrp.items.length > 0) grupos.push(curGrp as ImpGrupo)
          curGrp = { nombre: t.trim(), items: [] }
          return
        }
      }

      if (hasMoney || hasPct) {
        if (!curGrp) curGrp = { nombre: linea, items: [] }
        let nombre = t, tarifa = '', tipoTarifa: 'moneda' | 'porcentaje' = 'moneda', obs = ''

        const pm = t.match(pctRe)
        if (pm) {
          tarifa = pm[1].replace(',', '.')
          tipoTarifa = 'porcentaje'
          nombre = t.replace(pctRe, '').trim()
        }
        if (!tarifa) {
          const mm = t.match(/\$?\s*([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/)
          if (mm) {
            tarifa = mm[1].replace(/\./g, '').replace(',', '.')
            nombre = t.substring(0, t.lastIndexOf(mm[0])).trim()
          } else {
            const any = t.match(/\$?\s*([\d.,]{3,})/)
            if (any) {
              tarifa = any[1].replace(/\./g, '').replace(',', '.')
              nombre = t.replace(any[0], '').replace(/\$/g, '').trim()
            }
          }
        }
        nombre = nombre.replace(/^[\s:\-–]+/, '').replace(/[\s:\-–]+$/, '').trim()
        if (nombre.length < 2) nombre = 'Ítem ' + (curGrp.items.length + 1)
        const nextL = lines[i + 1]
        if (nextL && !moneyRe.test(nextL.text) && !pctRe.test(nextL.text) && nextL.text.length < 150) {
          obs = nextL.text.trim()
        }
        curGrp.items.push({ nombre, tarifa, tipoTarifa, obs })
      }
    })

    const finalGrp = curGrp as ImpGrupo | null
    if (finalGrp !== null && finalGrp.items.length > 0) grupos.push(finalGrp)
  })

  return grupos
    .map((g) => ({ ...g, items: g.items.filter((it, i, arr) => arr.findIndex((x) => x.nombre === it.nombre) === i) }))
    .filter((g) => g.items.length > 0)
}

async function procesarPDF(file: File, linea: string): Promise<ImpData> {
  await loadPdfJs()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib = (window as any).pdfjsLib
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: { transform: number[]; str: string }[][] = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    pages.push(content.items as { transform: number[]; str: string }[])
  }
  const empresa = detectarEmpresa(pages)
  const grupos = extraerGrupos(pages, linea)
  if (grupos.length === 0) {
    grupos.push({ nombre: linea, items: [{ nombre: '(Sin datos detectados — agrega manualmente)', tarifa: '', tipoTarifa: 'moneda', obs: '' }] })
  }
  return { empresa, linea, grupos }
}

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
  const [showPdfModal, setShowPdfModal] = useState(false)
  const navigate = useNavigate()
  const toast = useToastStore()
  const qc = useQueryClient()
  const resetWizard = useCotWizardStore((s) => s.resetWizard)
  const setDatosGenerales = useCotWizardStore((s) => s.setDatosGenerales)
  const toggleLinea = useCotWizardStore((s) => s.toggleLinea)

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-white border border-border transition"
          >
            <Upload size={14} /> Importar desde PDF
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: '#00c2ff', color: '#0a0e1a' }}
          >
            <Plus size={16} /> Nueva cotización
          </button>
        </div>
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

      {/* Modal Importar desde PDF */}
      {showPdfModal && (
        <ImportPDFModal
          onClose={() => setShowPdfModal(false)}
          onImport={(data) => {
            resetWizard()
            setDatosGenerales({
              empresa: data.empresa,
              fecha: today(),
            })
            // Toggle the selected line
            toggleLinea(data.linea)
            // Build items map directly from extracted groups
            const defVig = new Date()
            defVig.setDate(defVig.getDate() + 30)
            const itemsMap: ItemsMap = {}
            itemsMap[data.linea] = {}
            data.grupos.forEach((g, gi) => {
              const gid = `imp_${gi}_${Date.now()}`
              const grupo: WizardGrupo = {
                sel: true,
                nombre: g.nombre,
                items: g.items.map((it): WizardItem => ({
                  sel: true,
                  nombre: it.nombre,
                  tarifa: it.tarifa,
                  tipo_tarifa: it.tipoTarifa,
                  obs: it.obs,
                  extra_cols: {},
                })),
              }
              itemsMap[data.linea][gid] = grupo
            })
            useCotWizardStore.setState({
              items: itemsMap,
              vigencia: defVig.toISOString().split('T')[0],
              tarifa_tipo: { [data.linea]: 'especial' },
            })
            setShowPdfModal(false)
            toast.add(`PDF importado como ${data.linea} — completa los datos del cliente`, 'success')
            navigate('/cotizaciones/nueva')
          }}
        />
      )}

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

// ─────────────────────────────────────────────────────────
// Modal: Importar desde PDF
// ─────────────────────────────────────────────────────────

function ImportPDFModal({ onClose, onImport }: { onClose: () => void; onImport: (data: ImpData) => void }) {
  const [step, setStep] = useState<'select' | 'processing' | 'preview' | 'error'>('select')
  const [linea, setLinea] = useState<string>(SERVICIOS[0])
  const [status, setStatus] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [data, setData] = useState<ImpData | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setErrorMsg('Solo se aceptan archivos PDF (.pdf)')
      setStep('error')
      return
    }
    setStep('processing')
    setStatus('Cargando pdf.js...')
    try {
      setStatus('Leyendo páginas...')
      const extracted = await procesarPDF(file, linea)
      setData(extracted)
      setStep('preview')
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'No se pudo leer el PDF.')
      setStep('error')
    }
  }

  const updateGrupoNombre = (gi: number, v: string) => {
    if (!data) return
    const g = [...data.grupos]
    g[gi] = { ...g[gi], nombre: v }
    setData({ ...data, grupos: g })
  }

  const updateItem = (gi: number, ii: number, field: keyof ImpItem, v: string) => {
    if (!data) return
    const g = [...data.grupos]
    const its = [...g[gi].items]
    its[ii] = { ...its[ii], [field]: v }
    g[gi] = { ...g[gi], items: its }
    setData({ ...data, grupos: g })
  }

  const removeItem = (gi: number, ii: number) => {
    if (!data) return
    const g = [...data.grupos]
    g[gi] = { ...g[gi], items: g[gi].items.filter((_, i) => i !== ii) }
    setData({ ...data, grupos: g.filter((gr) => gr.items.length > 0) })
  }

  const addItem = (gi: number) => {
    if (!data) return
    const g = [...data.grupos]
    g[gi] = { ...g[gi], items: [...g[gi].items, { nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' }] }
    setData({ ...data, grupos: g })
  }

  const removeGrupo = (gi: number) => {
    if (!data) return
    setData({ ...data, grupos: data.grupos.filter((_, i) => i !== gi) })
  }

  const addGrupo = () => {
    if (!data) return
    setData({ ...data, grupos: [...data.grupos, { nombre: 'Nuevo grupo', items: [{ nombre: '', tarifa: '', tipoTarifa: 'moneda', obs: '' }] }] })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ margin: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-condensed font-bold text-lg" style={{ color: '#a855f7' }}>
            Importar desde PDF
          </h2>
          <button onClick={onClose} className="text-muted hover:text-white transition"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* STEP: select */}
          {step === 'select' && (
            <>
              <p className="text-xs text-muted">Selecciona la línea de negocio y carga el PDF. El sistema extrae los grupos y tarifas para que los revises.</p>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">1. Línea de negocio del PDF</label>
                <select value={linea} onChange={(e) => setLinea(e.target.value)}>
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted mb-2 uppercase tracking-wider font-condensed">2. Cargar PDF</label>
                <div
                  className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-8 cursor-pointer transition"
                  style={{
                    borderColor: dragging ? '#a855f7' : '#2a3347',
                    background: dragging ? '#a855f711' : 'transparent',
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragging(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                  }}
                  onClick={() => fileRef.current?.click()}
                >
                  <FileText size={32} className="opacity-40" />
                  <p className="text-sm" style={{ color: '#e8edf5' }}>Arrastra el PDF aquí</p>
                  <p className="text-xs text-muted">o haz clic para seleccionar</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFile(file)
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* STEP: processing */}
          {step === 'processing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-8 h-8 border-2 border-t-purple-500 rounded-full animate-spin" style={{ borderColor: '#2a3347', borderTopColor: '#a855f7' }} />
              <p className="font-condensed font-bold text-lg" style={{ color: '#a855f7' }}>Procesando PDF...</p>
              <p className="text-xs text-muted">{status}</p>
            </div>
          )}

          {/* STEP: error */}
          {step === 'error' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#ff6b6b' }}>Error al leer el PDF:</p>
              <p className="text-xs text-muted bg-surface2 rounded p-3">{errorMsg}</p>
              <button
                className="w-full py-2 rounded-lg border border-border text-sm text-muted hover:text-white transition"
                onClick={() => setStep('select')}
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* STEP: preview */}
          {step === 'preview' && data && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted mb-1">
                <span style={{ color: '#00e676' }}>✓ PDF procesado</span>
                <span>—</span>
                <span>Línea: <strong style={{ color: '#a855f7' }}>{data.linea}</strong></span>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Empresa detectada</label>
                <input
                  value={data.empresa}
                  onChange={(e) => setData({ ...data, empresa: e.target.value })}
                  placeholder="Empresa cliente"
                />
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {data.grupos.map((g, gi) => (
                  <div key={gi} className="bg-surface2 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        className="flex-1 text-sm font-bold"
                        style={{ color: '#f5a623' }}
                        value={g.nombre}
                        onChange={(e) => updateGrupoNombre(gi, e.target.value)}
                        placeholder="Nombre del grupo"
                      />
                      <button onClick={() => removeGrupo(gi)} className="text-muted hover:text-danger transition flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid text-xs text-muted mb-1 px-1 gap-1" style={{ gridTemplateColumns: '1fr 72px 36px 20px' }}>
                      <span>Ítem</span><span>Tarifa</span><span>Tipo</span><span></span>
                    </div>
                    {g.items.map((it, ii) => (
                      <div key={ii} className="grid gap-1 mb-1 items-center" style={{ gridTemplateColumns: '1fr 72px 36px 20px' }}>
                        <input
                          className="text-xs px-2 py-1"
                          value={it.nombre}
                          onChange={(e) => updateItem(gi, ii, 'nombre', e.target.value)}
                          placeholder="Ítem"
                        />
                        <input
                          className="text-xs px-2 py-1 text-right"
                          style={{ color: '#f5a623' }}
                          value={it.tarifa}
                          onChange={(e) => updateItem(gi, ii, 'tarifa', e.target.value)}
                          placeholder="0"
                        />
                        <select
                          className="text-xs px-1 py-1"
                          value={it.tipoTarifa}
                          onChange={(e) => updateItem(gi, ii, 'tipoTarifa', e.target.value)}
                        >
                          <option value="moneda">$</option>
                          <option value="porcentaje">%</option>
                        </select>
                        <button onClick={() => removeItem(gi, ii)} className="text-muted hover:text-danger transition">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      className="w-full mt-1 text-xs text-muted border border-dashed border-border rounded py-1 hover:text-white transition"
                      onClick={() => addItem(gi)}
                    >
                      + Ítem
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="w-full text-xs text-muted border border-dashed border-border rounded-lg py-2 hover:text-white transition"
                onClick={addGrupo}
              >
                + Agregar grupo
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  className="flex-1 py-2 rounded-lg border border-border text-sm text-muted hover:text-white transition"
                  onClick={() => { setStep('select'); setData(null) }}
                >
                  Volver
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition"
                  style={{ background: '#a855f7', color: '#fff' }}
                  onClick={() => onImport(data)}
                >
                  Abrir en wizard <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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
