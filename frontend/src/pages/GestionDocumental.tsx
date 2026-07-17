import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { FolderOpen, X, ChevronRight, RefreshCw, AlertTriangle, Clock, CheckCircle, Circle, Download, Paperclip, Eye, Trash2, History, RotateCcw, Archive, type LucideIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  listGD, upsertGD, GD_DOCS, GDRow, DocEstado, GDArchivo, HistorialCiclo,
  uploadGDArchivos, deleteGDArchivo, fetchGDArchivoBlob, getGDHistorial, iniciarCicloGD,
} from '../api/gestionDocumental'
import { useToastStore } from '../store/toastStore'
import { usePagination } from '../hooks/usePagination'
import { DataListPanel } from '../components/ui/DataListPanel'

// ─── Constants ────────────────────────────────────────────────────────────────
const ESTADO_STYLE = {
  completo:   { label: 'Completo',   bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.35)'  },
  incompleto: { label: 'Incompleto', bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', border: 'rgba(245,158,11,0.35)'  },
  pendiente:  { label: 'Pendiente',  bg: 'rgba(248,113,113,0.12)', text: '#f87171', border: 'rgba(248,113,113,0.35)' },
}

/** Pendientes primero, para identificarlos más fácil en la lista (pedido por QA). */
const ESTADO_ORDEN: Record<'completo' | 'incompleto' | 'pendiente', number> = { pendiente: 0, incompleto: 1, completo: 2 }

const VENC_STYLE = {
  'con-tiempo': { label: 'Al día',      text: '#34d399', icon: CheckCircle },
  'por-vencer': { label: 'Por vencer',  text: '#f59e0b', icon: AlertTriangle },
  'vencido':    { label: 'Vencido',     text: '#f87171', icon: AlertTriangle },
  'sin-fecha':  { label: 'Sin fecha',   text: '#94a3b8', icon: Circle       },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(pct: number): string {
  if (pct >= 80) return '#34d399'
  if (pct >= 50) return '#f59e0b'
  return '#f87171'
}

function AlertBanner({ icon: Icon, color, label, rows, onSelect }: {
  icon: LucideIcon
  color: 'red' | 'amber'
  label: string
  rows: GDRow[]
  onSelect: (row: GDRow) => void
}) {
  const tone = color === 'red'
    ? { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
    : { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
  return (
    <div className={`rounded-xl border ${tone.bg} ${tone.border} px-4 py-3 space-y-2`}>
      <div className="flex items-center gap-3 text-sm">
        <Icon size={15} className={`${tone.text} flex-shrink-0`} />
        <span className={`${tone.text} font-semibold`}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-[27px]">
        {rows.map(row => {
          const dias = row.vencimiento.diasRestantes
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => onSelect(row)}
              className={`text-[11px] font-medium px-2 py-1 rounded-md bg-black/20 border ${tone.border} ${tone.text} hover:bg-black/30 transition-colors`}
            >
              {row.empresa}{dias !== null ? ` · ${dias < 0 ? `${Math.abs(dias)}d vencido` : `${dias}d`}` : ''}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="crm-kpi-cell" style={{ borderTopColor: color }}>
      <div className="crm-kpi-label">{label}</div>
      <div className="crm-kpi-value" style={{ color }}>{value}</div>
    </div>
  )
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ARCHIVOS_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'

/** PDF e imágenes tienen visor nativo en el navegador; Word/Excel no — ahí solo tiene sentido descargar. */
function esPrevisualizable(mime: string): boolean {
  return mime === 'application/pdf' || mime.startsWith('image/')
}

async function abrirArchivo(recordId: string, docId: string, archivo: GDArchivo, modo: 'ver' | 'descargar') {
  // La pestaña debe abrirse de forma SÍNCRONA (antes del await) o el navegador la
  // degrada a descarga forzada en vez de mostrar el visor — por eso "Ver" y
  // "Descargar" se sentían iguales.
  let preview: Window | null = null
  if (modo === 'ver') {
    preview = window.open('', '_blank')
    if (preview) preview.opener = null
  }
  try {
    const blob = await fetchGDArchivoBlob(recordId, docId, archivo.id)
    const url = window.URL.createObjectURL(blob)
    if (modo === 'ver') {
      if (preview) {
        // Un blob: URL no lleva el nombre del archivo — se envuelve en un documento
        // propio para que la pestaña muestre el nombre real en vez del blob: URL.
        preview.document.title = archivo.nombre
        preview.document.body.style.margin = '0'
        const frame = preview.document.createElement('iframe')
        frame.src = url
        frame.title = archivo.nombre
        frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0'
        preview.document.body.appendChild(frame)
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = archivo.nombre
      a.click()
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 30_000)
  } catch (err) {
    preview?.close()
    throw err
  }
}

// ─── Excel export ─────────────────────────────────────────────────────────────
function exportExcel(rows: GDRow[]) {
  const data = rows.map(r => ({
    Empresa:        r.empresa,
    NIT:            r.nit ?? '',
    Tipo:           r.tipoCliente,
    Compañías:      r.companias.join(', '),
    Comercial:      r.comercial.nombre,
    'Cumplimiento%': r.cumplimiento,
    'Estado Docs':  r.estadoDocs,
    'Ciclo':        r.gd.cicloActual,
    'Última Act.':  fmtDate(r.gd.updatedAt),
    'Próx. Act.':   fmtDate(r.vencimiento.fechaVencimiento),
    'Días p/Vencer': r.vencimiento.diasRestantes ?? '',
    Status:         VENC_STYLE[r.vencimiento.status].label,
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'GestionDocumental')
  const fecha = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `GestionDocumental_ZYMO_${fecha}.xlsx`)
}

// ─── Historial de ciclos ────────────────────────────────────────────────────────
function HistorialCicloCard({ h, esReferido }: { h: HistorialCiclo; esReferido: boolean }) {
  const docs = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true)
  let completos = 0, incompletos = 0, pendientes = 0
  for (const d of docs) {
    const est = h.docs[d.id]?.estado
    if (est === 'completo') completos++
    else if (est === 'incompleto') incompletos++
    else pendientes++
  }
  const pct = Math.round((completos / docs.length) * 100)

  return (
    <details className="rounded-xl border border-border bg-surface2 overflow-hidden group" open>
      <summary className="list-none cursor-pointer bg-surface3 border-b border-border px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-extrabold text-accent">Ciclo {h.ano}</span>
          <span className="text-[11px] text-muted">Archivado el {fmtDate(h.archivedAt)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.35)' }}>Completos: {completos}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)' }}>Incompletos: {incompletos}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.35)' }}>Pendientes: {pendientes}</span>
          <span className="text-sm font-display font-bold ml-1" style={{ color: pctColor(pct) }}>{pct}%</span>
        </div>
      </summary>
      <div className="px-5 py-3 flex flex-col gap-1">
        {docs.map(doc => {
          const d = h.docs[doc.id] ?? {}
          const style = d.estado ? ESTADO_STYLE[d.estado] : null
          const nA = (d.archivos ?? []).length
          return (
            <div key={doc.id} className="flex items-center gap-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: style?.text ?? '#64748b' }} />
              <span className="text-xs text-foreground flex-1 min-w-0">{doc.nombre}</span>
              {d.fecha && <span className="text-[10px] text-muted flex-shrink-0">{d.fecha}</span>}
              {nA > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  Archivos: {nA}
                </span>
              )}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={style ? { background: style.bg, color: style.text, border: `1px solid ${style.border}` } : { color: 'var(--text2)' }}
              >
                {style?.label ?? 'Sin gestionar'}
              </span>
            </div>
          )
        })}
      </div>
    </details>
  )
}

function HistorialModal({ row, onClose }: { row: GDRow; onClose: () => void }) {
  const { data: historial, isLoading } = useQuery({
    queryKey: ['gestion-documental-historial', row.id],
    queryFn: () => getGDHistorial(row.id),
  })
  const anos = Object.values(historial ?? {}).sort((a, b) => b.ano - a.ano)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 sm:p-8 animate-fade-in" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-title"
        className="card-glass w-full max-w-3xl rounded-2xl border-2 border-accent/30 overflow-hidden animate-slide-up"
        style={{ boxShadow: '0 20px 60px rgba(0,194,255,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-border px-6 py-5 flex items-center justify-between bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <History size={18} className="text-accent" />
            </div>
            <div>
              <h2 id="historial-title" className="font-display text-lg font-bold text-foreground leading-tight">Historial Documental por Ciclo</h2>
              <p className="text-xs text-muted">{row.empresa}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-white/10 text-muted transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-sm text-muted py-8 text-center">Cargando historial...</div>
          ) : anos.length === 0 ? (
            <div className="text-center py-12 px-5 text-sm text-muted">
              <Archive size={28} className="mx-auto mb-3 opacity-40" />
              Sin ciclos archivados. El historial se crea al iniciar un nuevo ciclo anual.
            </div>
          ) : (
            anos.map(h => <HistorialCicloCard key={h.ano} h={h} esReferido={row.tipoCliente === 'referido'} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Doc Modal ────────────────────────────────────────────────────────────────
function DocModal({ row, onClose }: { row: GDRow; onClose: () => void }) {
  const qc = useQueryClient()
  const { push } = useToastStore()
  const anoActual = new Date().getFullYear()
  const esReferido = row.tipoCliente === 'referido'
  const docs = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true)

  const [draft, setDraft] = useState<Record<string, DocEstado>>(() => ({ ...row.gd.docs }))
  const [ciclo, setCiclo] = useState(row.gd.cicloActual)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showHistorial, setShowHistorial] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const mutate = useAppMutation({
    mutationFn: () => upsertGD(row.id, { docs: draft, cicloActual: ciclo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      push('Documentación actualizada', 'success')
      onClose()
    },
    onError: () => push('Error al guardar', 'error'),
  })

  const iniciarCicloMut = useAppMutation({
    mutationFn: () => iniciarCicloGD(row.id),
    onSuccess: (data) => {
      setDraft(data.docs as Record<string, DocEstado>)
      setCiclo(data.cicloActual)
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      qc.invalidateQueries({ queryKey: ['gestion-documental-historial', row.id] })
      push(`Ciclo ${data.cicloActual} activo — documentos anteriores archivados`, 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      push(msg || 'Error al iniciar el ciclo', 'error')
    },
  })

  const uploadMut = useAppMutation({
    mutationFn: ({ docId, files }: { docId: string; files: File[] }) => uploadGDArchivos(row.id, docId, files),
    onSuccess: (data, { docId }) => {
      setDraft(prev => ({ ...prev, [docId]: (data.docs as Record<string, DocEstado>)[docId] ?? prev[docId] }))
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      push('Archivo(s) subido(s)', 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      push(msg || 'Error al subir el archivo', 'error')
    },
  })

  const deleteArchivoMut = useAppMutation({
    mutationFn: ({ docId, archivoId }: { docId: string; archivoId: string }) => deleteGDArchivo(row.id, docId, archivoId),
    onSuccess: (data, { docId }) => {
      setDraft(prev => ({ ...prev, [docId]: (data.docs as Record<string, DocEstado>)[docId] ?? prev[docId] }))
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      push('Archivo eliminado', 'success')
    },
    onError: () => push('Error al eliminar el archivo', 'error'),
  })

  function handleUpload(docId: string, fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (!files.length) return
    uploadMut.mutate({ docId, files })
  }

  function handleDeleteArchivo(docId: string, archivo: GDArchivo) {
    if (!confirm(`¿Eliminar "${archivo.nombre}"?`)) return
    deleteArchivoMut.mutate({ docId, archivoId: archivo.id })
  }

  const setDoc = useCallback((docId: string, field: keyof DocEstado, value: string) => {
    setDraft(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value },
    }))
  }, [])

  function applyMassEstado(estado: 'completo' | 'incompleto' | 'pendiente') {
    if (selected.size === 0) return
    setDraft(prev => {
      const next = { ...prev }
      for (const id of selected) {
        next[id] = { ...next[id], estado }
      }
      return next
    })
  }

  // Compute live compliance — refleja el estado real de los docs, el ciclo se señaliza aparte (ver banner abajo)
  const desactualizado = ciclo < anoActual
  let totalPond = 0, cumplido = 0
  for (const d of docs) {
    const pond = esReferido ? d.pond_ref : d.pond_di
    if (!pond) continue
    totalPond += pond
    const est = draft[d.id]?.estado ?? ''
    if (est === 'completo')        cumplido += pond
    else if (est === 'incompleto') cumplido += pond * 0.5
  }
  const pct = totalPond > 0 ? Math.round((cumplido / totalPond) * 100) : 0
  const color = pctColor(pct)

  return (
    <div
      className="fixed z-50 bg-black/50 backdrop-blur-sm"
      style={{ top: 'var(--header-h)', left: 'var(--sidebar-w)', right: 0, bottom: 0 }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="docmodal-title"
        className="relative h-full w-full bg-surface border-l border-border overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <h2 id="docmodal-title" className="text-lg font-display font-bold text-foreground">{row.empresa}</h2>
            {row.nit && <div className="text-xs text-muted">NIT: {row.nit}</div>}
            <div className="text-xs text-muted">{row.comercial.nombre} · {row.tipoCliente}</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-white/10 text-muted transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Compliance bar */}
          <div className="card-glass rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">Cumplimiento ponderado</span>
              <span className="text-2xl font-display font-bold" style={{ color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <p className="text-[10px] text-muted mt-1.5">Completo=100% del peso · Incompleto=50%</p>
          </div>

          {/* Cycle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">Ciclo documental:</span>
            <select
              value={ciclo}
              onChange={e => setCiclo(Number(e.target.value))}
              className="filter-select"
            >
              {[anoActual - 1, anoActual, anoActual + 1].map(y => (
                <option key={y} value={y}>{y}{y === anoActual ? ' (actual)' : ''}</option>
              ))}
            </select>
            {desactualizado && (
              <span className="text-xs text-red-400 font-semibold">Ciclo desactualizado</span>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  if (row.gd.cicloActual >= anoActual) { push(`El ciclo ${anoActual} ya está activo`, 'info'); return }
                  if (!confirm(`¿Iniciar ciclo ${anoActual}?\n\nLos documentos del ciclo ${row.gd.cicloActual} quedarán archivados y todos los estados pasarán a Pendiente.`)) return
                  iniciarCicloMut.mutate()
                }}
                disabled={iniciarCicloMut.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 transition-colors disabled:opacity-40"
              >
                <RotateCcw size={13} />
                {iniciarCicloMut.isPending ? 'Iniciando...' : 'Iniciar ciclo'}
              </button>
              <button
                type="button"
                onClick={() => setShowHistorial(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface2 border border-border text-muted hover:text-foreground hover:bg-surface3 transition-colors"
              >
                <History size={13} />
                Ver historial
              </button>
            </div>
          </div>

          {/* Mass action bar */}
          <div className="rounded-xl border border-border bg-surface p-3 flex flex-wrap gap-3 items-center">
            <span className="text-xs text-muted">Cambiar estado de seleccionados:</span>
            <button
              onClick={() => applyMassEstado('completo')}
              disabled={selected.size === 0}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-success/10 text-success border border-success/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-success/20 transition-colors"
            >
              ✅ Completo
            </button>
            <button
              onClick={() => applyMassEstado('incompleto')}
              disabled={selected.size === 0}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-gold/10 text-gold border border-gold/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gold/20 transition-colors"
            >
              ⚠️ Incompleto
            </button>
            <button
              onClick={() => applyMassEstado('pendiente')}
              disabled={selected.size === 0}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-danger/10 text-danger border border-danger/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-danger/20 transition-colors"
            >
              🔴 Pendiente
            </button>
          </div>

          {/* Documents */}
          <div className="space-y-3">
            <div className="text-xs text-muted uppercase tracking-wider font-semibold">Documentos aplicables</div>
            {docs.map(doc => {
              const d = draft[doc.id] ?? {}
              const pond = esReferido ? doc.pond_ref : doc.pond_di
              const pctDoc = Math.round((pond || 0) * 100 * 10) / 10
              const style = d.estado ? ESTADO_STYLE[d.estado] : null
              const isSelected = selected.has(doc.id)
              return (
                <div
                  key={doc.id}
                  className="rounded-xl border p-4 space-y-3 transition-colors cursor-pointer"
                  style={style ? { background: style.bg, borderColor: style.border } : { background: 'rgba(255,255,255,0.02)', borderColor: isSelected ? 'rgba(0,194,255,0.4)' : 'var(--border-color, #1e3050)' }}
                  onClick={() => setSelected(prev => {
                    const next = new Set(prev)
                    next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id)
                    return next
                  })}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={e => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-accent flex-shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground font-medium leading-snug">{doc.nombre}</div>
                        <div className="text-[10px] text-muted mt-0.5">Peso: {pctDoc}%</div>
                      </div>
                    </div>
                    {d.estado && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
                        style={{ background: ESTADO_STYLE[d.estado].bg, color: ESTADO_STYLE[d.estado].text, border: `1px solid ${ESTADO_STYLE[d.estado].border}` }}
                      >
                        {ESTADO_STYLE[d.estado].label}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2" onClick={e => e.stopPropagation()}>
                    <select
                      value={d.estado ?? ''}
                      onChange={e => setDoc(doc.id, 'estado', e.target.value)}
                      className="cell-input"
                    >
                      <option value="">Sin estado</option>
                      <option value="completo">Completo</option>
                      <option value="incompleto">Incompleto</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                    <input
                      type="date"
                      value={d.fecha ?? ''}
                      onChange={e => setDoc(doc.id, 'fecha', e.target.value)}
                      className="cell-input"
                    />
                  </div>
                  <input
                    type="text"
                    value={d.obs ?? ''}
                    onChange={e => setDoc(doc.id, 'obs', e.target.value)}
                    onClick={e => e.stopPropagation()}
                    placeholder="Observaciones..."
                    className="cell-input"
                  />

                  {/* Archivos adjuntos */}
                  <div className="pt-2.5 border-t border-border/50 space-y-1.5" onClick={e => e.stopPropagation()}>
                    <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Archivos adjuntos</div>
                    {(d.archivos ?? []).map(archivo => (
                      <div key={archivo.id} className="flex items-center gap-2 rounded-md bg-surface2 border border-border px-2.5 py-1.5">
                        <span className="text-xs text-foreground truncate flex-1 min-w-0" title={archivo.nombre}>{archivo.nombre}</span>
                        <span className="text-[10px] text-muted flex-shrink-0">{fmtSize(archivo.size)}</span>
                        {esPrevisualizable(archivo.mime) && (
                          <button
                            type="button"
                            aria-label={`Ver ${archivo.nombre}`}
                            onClick={() => abrirArchivo(row.id, doc.id, archivo, 'ver').catch(() => push('Error al abrir el archivo', 'error'))}
                            className="p-1.5 rounded hover:bg-accent/10 text-muted hover:text-accent transition-colors flex-shrink-0"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Descargar ${archivo.nombre}`}
                          onClick={() => abrirArchivo(row.id, doc.id, archivo, 'descargar').catch(() => push('Error al descargar el archivo', 'error'))}
                          className="p-1.5 rounded hover:bg-accent/10 text-muted hover:text-accent transition-colors flex-shrink-0"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar ${archivo.nombre}`}
                          onClick={() => handleDeleteArchivo(doc.id, archivo)}
                          className="p-1.5 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors flex-shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <label className="flex items-center gap-2 bg-surface2 border border-dashed border-border rounded-md px-2.5 py-1.5 text-xs text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer">
                      <Paperclip size={13} className="flex-shrink-0" />
                      <span>{uploadMut.isPending && uploadMut.variables?.docId === doc.id ? 'Subiendo...' : 'Adjuntar archivo'}</span>
                      <input
                        type="file"
                        multiple
                        accept={ARCHIVOS_ACCEPT}
                        className="hidden"
                        disabled={uploadMut.isPending}
                        onChange={e => { handleUpload(doc.id, e.target.files); e.target.value = '' }}
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save */}
          <button
            onClick={() => mutate.mutate()}
            disabled={mutate.isPending}
            className="w-full py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {mutate.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
      {showHistorial && <HistorialModal row={row} onClose={() => setShowHistorial(false)} />}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GestionDocumental() {
  const [search, setSearch]       = useState('')
  const [filtVenc, setFiltVenc]   = useState('')
  const [filtEst, setFiltEst]     = useState('')
  const [filtTipo, setFiltTipo]   = useState('')
  const [filtCia, setFiltCia]     = useState('')
  const [filtPct, setFiltPct]     = useState('')
  const [selected, setSelected]   = useState<GDRow | null>(null)

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['gestion-documental', search, filtVenc, filtEst],
    queryFn: () => listGD({
      search:      search || undefined,
      vencimiento: filtVenc || undefined,
      estadoDocs:  filtEst  || undefined,
    }),
    staleTime: 30_000,
  })

  // Client-side filters for tipo, cia, pct
  const filteredRows = rows.filter(r => {
    if (filtTipo && r.tipoCliente !== filtTipo) return false
    if (filtCia  && !r.companias.includes(filtCia)) return false
    if (filtPct) {
      if (filtPct === '80'    && r.cumplimiento < 80) return false
      if (filtPct === '50-79' && (r.cumplimiento < 50 || r.cumplimiento > 79)) return false
      if (filtPct === '0-49'  && r.cumplimiento >= 50) return false
    }
    return true
  }).sort((a, b) => ESTADO_ORDEN[a.estadoDocs] - ESTADO_ORDEN[b.estadoDocs])

  // KPIs
  const total       = filteredRows.length
  const vencidosRows  = filteredRows.filter(r => r.vencimiento.status === 'vencido')
  const porVencerRows = filteredRows.filter(r => r.vencimiento.status === 'por-vencer')
  const vencidos  = vencidosRows.length
  const porVencer = porVencerRows.length
  const completos = filteredRows.filter(r => r.estadoDocs === 'completo').length

  // Dashboard de cumplimiento — distribución por rango + promedio por compañía
  const distGestionados = filteredRows.filter(r => r.cumplimiento >= 80).length
  const distEnProceso   = filteredRows.filter(r => r.cumplimiento >= 50 && r.cumplimiento < 80).length
  const distCriticos    = filteredRows.filter(r => r.cumplimiento < 50).length
  const promedioGeneral = total > 0 ? Math.round(filteredRows.reduce((acc, r) => acc + r.cumplimiento, 0) / total) : 0

  const companiasStats = (() => {
    const acc: Record<string, { suma: number; count: number }> = {}
    for (const r of filteredRows) {
      for (const c of r.companias) {
        acc[c] ??= { suma: 0, count: 0 }
        acc[c].suma += r.cumplimiento
        acc[c].count += 1
      }
    }
    return Object.entries(acc)
      .map(([nombre, { suma, count }]) => ({ nombre, promedio: Math.round(suma / count), count }))
      .sort((a, b) => b.promedio - a.promedio)
  })()

  const pagination = usePagination(filteredRows, {
    resetDeps: [search, filtVenc, filtEst, filtTipo, filtCia, filtPct],
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>Gestión Documental</h2>
          <p className="text-xs text-muted">BASC · 18 documentos · Solo clientes activos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportExcel(filteredRows)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-xs font-semibold transition-colors hover:bg-surface3"
            style={{ borderColor: '#00e676', color: '#00e676' }}
          >
            <Download size={13} />
            Exportar Excel
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-muted hover:text-foreground hover:bg-surface3 text-xs transition-colors"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Alert banners — con detalle por cliente, clicable al detalle */}
      {(vencidos > 0 || porVencer > 0) && (
        <div className="space-y-2">
          {vencidos > 0 && (
            <AlertBanner
              icon={AlertTriangle}
              color="red"
              label={`${vencidos} cliente${vencidos > 1 ? 's' : ''} con documentación VENCIDA`}
              rows={vencidosRows}
              onSelect={setSelected}
            />
          )}
          {porVencer > 0 && (
            <AlertBanner
              icon={Clock}
              color="amber"
              label={`${porVencer} cliente${porVencer > 1 ? 's' : ''} con documentación próxima a vencer (≤60 días)`}
              rows={porVencerRows}
              onSelect={setSelected}
            />
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="crm-kpi-strip">
        <StatBadge label="Total clientes" value={total}     color="var(--text2)" />
        <StatBadge label="Completos"       value={completos} color="var(--green)" />
        <StatBadge label="Por vencer"      value={porVencer} color="var(--gold)" />
        <StatBadge label="Vencidos"        value={vencidos}  color="var(--red)" />
      </div>

      {/* Dashboard de cumplimiento */}
      {total > 0 && (
        <div className="card-glass rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-muted uppercase tracking-wider font-semibold">Distribución de cumplimiento</span>
            <span className="text-sm font-display font-bold" style={{ color: pctColor(promedioGeneral) }}>
              Promedio general: {promedioGeneral}%
            </span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-surface">
            {distGestionados > 0 && <div style={{ width: `${(distGestionados / total) * 100}%`, background: '#34d399' }} title={`${distGestionados} gestionados (≥80%)`} />}
            {distEnProceso   > 0 && <div style={{ width: `${(distEnProceso / total) * 100}%`,   background: '#f59e0b' }} title={`${distEnProceso} en proceso (50–79%)`} />}
            {distCriticos    > 0 && <div style={{ width: `${(distCriticos / total) * 100}%`,    background: '#f87171' }} title={`${distCriticos} críticos (<50%)`} />}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#34d399' }} />Gestionados (≥80%): <strong className="text-foreground">{distGestionados}</strong></span>
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#f59e0b' }} />En proceso (50–79%): <strong className="text-foreground">{distEnProceso}</strong></span>
            <span><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: '#f87171' }} />Críticos (&lt;50%): <strong className="text-foreground">{distCriticos}</strong></span>
          </div>

          {companiasStats.length > 0 && (
            <div className="pt-3 border-t border-border/50 space-y-2">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">Cumplimiento por compañía logística</span>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {companiasStats.map(c => (
                  <div key={c.nombre} className="rounded-lg border border-border bg-surface2 px-3 py-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">{c.nombre}</span>
                      <span className="font-mono font-bold flex-shrink-0" style={{ color: pctColor(c.promedio) }}>{c.promedio}%</span>
                    </div>
                    <div className="h-1.5 mt-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.promedio}%`, background: pctColor(c.promedio) }} />
                    </div>
                    <div className="text-[10px] text-muted mt-1">{c.count} cliente{c.count > 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar empresa o NIT..."
          className="filter-input"
        />
        <select value={filtTipo} onChange={e => setFiltTipo(e.target.value)} className="filter-select">
          <option value="">Todos los tipos</option>
          <option value="directo">Directo</option>
          <option value="indirecto">Intermediario</option>
          <option value="referido">Referido</option>
        </select>
        <select value={filtCia} onChange={e => setFiltCia(e.target.value)} className="filter-select">
          <option value="">Todas las compañías</option>
          <option value="Logimat">Logimat</option>
          <option value="IMC Depósito">IMC Depósito</option>
          <option value="IMC Cargo">IMC Cargo</option>
          <option value="Aduana">Aduana</option>
        </select>
        <select value={filtPct} onChange={e => setFiltPct(e.target.value)} className="filter-select">
          <option value="">% Cumplimiento: Todos</option>
          <option value="80">≥ 80% — Gestionados</option>
          <option value="50-79">50–79% — En proceso</option>
          <option value="0-49">&lt; 50% — Críticos</option>
        </select>
        <select value={filtVenc} onChange={e => setFiltVenc(e.target.value)} className="filter-select">
          <option value="">Todos los vencimientos</option>
          <option value="con-tiempo">Al día</option>
          <option value="por-vencer">Por vencer (≤60 días)</option>
          <option value="vencido">Vencido</option>
          <option value="sin-fecha">Sin fecha</option>
        </select>
        <select
          value={filtEst}
          onChange={e => setFiltEst(e.target.value)}
          className="filter-select"
        >
          <option value="">Todos los estados</option>
          <option value="completo">Completo</option>
          <option value="incompleto">Incompleto</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      <DataListPanel
        pagination={pagination}
        loading={isLoading}
        empty={
          <div className="empty-state py-12 text-muted">No hay clientes registrados.</div>
        }
      >
        <table className="w-full text-sm min-w-[1200px]">
          <thead>
            <tr>
              <th className="text-left">Empresa</th>
              <th className="text-left">Tipo</th>
              <th className="text-left">Compañías</th>
              <th className="text-left">Ciclo</th>
              <th className="text-left w-[180px]">Cumplimiento</th>
              <th className="text-left">Estado docs</th>
              <th className="text-left">Última Act.</th>
              <th className="text-left">Próx. Act.</th>
              <th className="text-center">Días p/Vencer</th>
              <th className="text-left">Status</th>
              <th className="w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {pagination.pageItems.map(row => {
              const vStyle = VENC_STYLE[row.vencimiento.status]
              const VIcon = vStyle.icon
              const eStyle = ESTADO_STYLE[row.estadoDocs]
              const color = pctColor(row.cumplimiento)
              const anoActual = new Date().getFullYear()
              const desact = row.gd.cicloActual < anoActual
              const dias = row.vencimiento.diasRestantes

              return (
                <tr key={row.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelected(row)}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{row.empresa}</div>
                    {row.nit && <div className="text-muted text-xs">{row.nit}</div>}
                    <div className="text-muted text-xs">{row.comercial.nombre}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted capitalize">{row.tipoCliente}</td>
                  <td className="px-4 py-3">
                    {row.companias.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {row.companias.map(c => (
                          <span key={c} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{c}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className={desact ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                      {row.gd.cicloActual}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.cumplimiento}%`, background: color }} />
                      </div>
                      <span className="text-xs font-bold font-mono w-8 text-right" style={{ color }}>{row.cumplimiento}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: eStyle.bg, color: eStyle.text, border: `1px solid ${eStyle.border}` }}>
                      {eStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(row.gd.updatedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(row.vencimiento.fechaVencimiento)}</td>
                  <td className="px-4 py-3 text-center">
                    {dias !== null ? (
                      <span className={`text-xs font-bold font-mono ${dias < 0 ? 'text-red-400' : dias <= 60 ? 'text-amber-400' : 'text-green-400'}`}>
                        {dias < 0 ? `${Math.abs(dias)}d` : `${dias}d`}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <VIcon size={13} style={{ color: vStyle.text }} />
                      <span className="text-xs font-medium" style={{ color: vStyle.text }}>{vStyle.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight size={14} className="text-muted group-hover:text-accent transition-colors ml-auto" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </DataListPanel>

      {/* Detail panel */}
      {selected && <DocModal row={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
