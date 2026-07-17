import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../hooks/useAppMutation'
import { X, Download, Paperclip, Eye, Trash2, History, RotateCcw, Archive } from 'lucide-react'
import {
  getGDRow, upsertGD, GD_DOCS, DocEstado, GDArchivo, HistorialCiclo,
  uploadGDArchivos, deleteGDArchivo, fetchGDArchivoBlob, getGDHistorial, iniciarCicloGD,
} from '../api/gestionDocumental'
import { useToastStore } from '../store/toastStore'
import { ESTADO_STYLE, pctColor, fmtDate, fmtSize } from '../lib/gestionDocumental/shared'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select'

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

function HistorialModal({ recordId, empresa, tipoCliente, onClose }: { recordId: string; empresa: string; tipoCliente: string; onClose: () => void }) {
  const { data: historial, isLoading } = useQuery({
    queryKey: ['gestion-documental-historial', recordId],
    queryFn: () => getGDHistorial(recordId),
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
              <p className="text-xs text-muted">{empresa}</p>
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
            anos.map(h => <HistorialCicloCard key={h.ano} h={h} esReferido={tipoCliente === 'referido'} />)
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página de detalle ──────────────────────────────────────────────────────────
export default function GestionDocumentalDetalle() {
  const { recordId } = useParams<{ recordId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { push } = useToastStore()

  const { data: row, isLoading } = useQuery({
    queryKey: ['gestion-documental-row', recordId],
    queryFn: () => getGDRow(recordId!),
    enabled: !!recordId,
  })

  const anoActual = new Date().getFullYear()
  const esReferido = row?.tipoCliente === 'referido'
  const docs = GD_DOCS.filter(d => esReferido ? d.aplica === 'todos' : true)

  const [draft, setDraft] = useState<Record<string, DocEstado>>({})
  const [ciclo, setCiclo] = useState(anoActual)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showHistorial, setShowHistorial] = useState(false)

  useEffect(() => {
    if (row) {
      setDraft({ ...row.gd.docs })
      setCiclo(row.gd.cicloActual)
    }
  }, [row])

  const mutate = useAppMutation({
    mutationFn: () => upsertGD(recordId!, { docs: draft, cicloActual: ciclo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      qc.invalidateQueries({ queryKey: ['gestion-documental-row', recordId] })
      push('Documentación actualizada', 'success')
    },
    onError: () => push('Error al guardar', 'error'),
  })

  const iniciarCicloMut = useAppMutation({
    mutationFn: () => iniciarCicloGD(recordId!),
    onSuccess: (data) => {
      setDraft(data.docs as Record<string, DocEstado>)
      setCiclo(data.cicloActual)
      qc.invalidateQueries({ queryKey: ['gestion-documental'] })
      qc.invalidateQueries({ queryKey: ['gestion-documental-row', recordId] })
      qc.invalidateQueries({ queryKey: ['gestion-documental-historial', recordId] })
      push(`Ciclo ${data.cicloActual} activo — documentos anteriores archivados`, 'success')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      push(msg || 'Error al iniciar el ciclo', 'error')
    },
  })

  const uploadMut = useAppMutation({
    mutationFn: ({ docId, files }: { docId: string; files: File[] }) => uploadGDArchivos(recordId!, docId, files),
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
    mutationFn: ({ docId, archivoId }: { docId: string; archivoId: string }) => deleteGDArchivo(recordId!, docId, archivoId),
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

  if (isLoading) return (
    <div className="space-y-4 p-6">
      <div className="h-10 w-64 bg-surface2 rounded animate-pulse" />
      <div className="h-64 bg-surface2 rounded-xl animate-pulse" />
    </div>
  )

  if (!row) return (
    <div className="p-6 text-center text-muted">
      Cliente no encontrado.
      <div className="mt-3"><button onClick={() => navigate('/gestion-documental')} className="btn-secondary btn-sm">← Volver</button></div>
    </div>
  )

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
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="flex items-start justify-between flex-wrap gap-3 p-4 border-b border-border bg-surface2 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/gestion-documental')} className="btn-secondary btn-sm flex items-center gap-1">← Volver</button>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground leading-tight">{row.empresa}</h2>
            <div className="text-xs text-muted mt-0.5">{row.nit ? `NIT: ${row.nit} · ` : ''}{row.comercial.nombre} · {row.tipoCliente}</div>
          </div>
        </div>
        <button
          onClick={() => mutate.mutate()}
          disabled={mutate.isPending}
          className="btn-primary btn-sm"
        >
          {mutate.isPending ? 'Guardando...' : '💾 Guardar cambios'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-4xl">
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
          <Select value={String(ciclo)} onValueChange={v => setCiclo(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[anoActual - 1, anoActual, anoActual + 1].map(y => (
                <SelectItem key={y} value={String(y)}>{y}{y === anoActual ? ' (actual)' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <Select value={d.estado || '__sin_estado__'} onValueChange={v => setDoc(doc.id, 'estado', v === '__sin_estado__' ? '' : v)}>
                    <SelectTrigger className="!py-1.5 !text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__sin_estado__">Sin estado</SelectItem>
                      <SelectItem value="completo">Completo</SelectItem>
                      <SelectItem value="incompleto">Incompleto</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
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
                          onClick={() => abrirArchivo(recordId!, doc.id, archivo, 'ver').catch(() => push('Error al abrir el archivo', 'error'))}
                          className="p-1.5 rounded hover:bg-accent/10 text-muted hover:text-accent transition-colors flex-shrink-0"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Descargar ${archivo.nombre}`}
                        onClick={() => abrirArchivo(recordId!, doc.id, archivo, 'descargar').catch(() => push('Error al descargar el archivo', 'error'))}
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
      </div>

      {showHistorial && (
        <HistorialModal recordId={recordId!} empresa={row.empresa} tipoCliente={row.tipoCliente} onClose={() => setShowHistorial(false)} />
      )}
    </div>
  )
}
