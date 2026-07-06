import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppMutation } from '../../hooks/useAppMutation'
import { getCotizacion, createCotizacion, updateCotizacion } from '../../api/cotizaciones'
import { getBiblioteca } from '../../api/biblioteca'
import { getComercialesApi } from '../../api/comerciales'
import { getRecords, getRecord } from '../../api/records'
import { toast } from '../../store/toastStore'
import type { BibliotecaLinea, CRMRecord, EstadoCotizacion } from '../../types'
import { PAQUETEO_PAQUETEADORAS } from '../../lib/htmlV6/constants'
import { COTIZACION_ESTADO_OPTIONS } from '../../lib/htmlV6/domainConfig'
import {
  type CotItemsSnapshot,
  ensureTransportePaqueteoSnapshot,
  isItemSelected,
} from '../../lib/cotizacion/snapshot'
import { buildCotHTML, flattenSnapshot } from '../../lib/cotizacion/buildCotHTML'
import {
  WizardPaso3,
  countSelectedInSnapshot,
  summarizeSnapshotItem,
  itemDisplayTarifa,
} from './WizardPaso3'

// ─── Tipos wizard ──────────────────────────────────────────────────────────────

interface WizardData {
  // Paso 1: Datos básicos
  empresa: string
  nit: string
  ciudad: string
  contacto: string
  cargo: string
  telefono: string
  email: string
  comercial: string
  paqueteadora: string
  recordId: string
  fecha: string
  vigencia: string
  asunto: string
  // Paso 2: Líneas de servicio
  lineas: string[]
  tarifaTipo: 'biblioteca' | 'especial'
  // Paso 3: Items seleccionados por línea (snapshot)
  itemsSnapshot: CotItemsSnapshot
  // Paso 4: Observaciones por línea + libres
  obsHtml: Record<string, string>
  obsLibre: string
  // Paso 5: Estado
  estado: EstadoCotizacion
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function plusDaysISO(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const EMPTY: WizardData = {
  empresa: '', nit: '', ciudad: '', contacto: '', cargo: '', telefono: '', email: '',
  comercial: '', paqueteadora: '', recordId: '', fecha: '', vigencia: '', asunto: '',
  lineas: [], tarifaTipo: 'biblioteca',
  itemsSnapshot: {}, obsHtml: {}, obsLibre: '',
  estado: 'borrador',
}

const STEPS = ['Datos básicos', 'Servicios', 'Tarifas', 'Observaciones', 'Resumen']

const WIZARD_ESTADO_OPTIONS = COTIZACION_ESTADO_OPTIONS.filter((o) => o.value !== '')

function canSaveDraftBasics(data: WizardData): boolean {
  return data.empresa.trim() !== '' && data.comercial.trim() !== ''
}

function buildWizardPayload(data: WizardData, estado: EstadoCotizacion) {
  return {
    empresa: data.empresa,
    nit: data.nit || undefined,
    ciudad: data.ciudad || undefined,
    contacto: data.contacto || undefined,
    cargo: data.cargo || undefined,
    telefono: data.telefono || undefined,
    email: data.email || undefined,
    comercial: data.comercial,
    paqueteadora: data.paqueteadora || undefined,
    recordId: data.recordId || undefined,
    tarifaTipo: data.tarifaTipo,
    estado,
    fecha: data.fecha || undefined,
    vigencia: data.vigencia || undefined,
    asunto: data.asunto || undefined,
    lineas: data.lineas,
    itemsSnapshot: data.itemsSnapshot,
    obsHtml: data.obsHtml,
    obsLibre: data.obsLibre || undefined,
  }
}

async function persistCotizacion(
  opts: {
    isEdit: boolean
    cotId: string | undefined
    data: WizardData
    estado: EstadoCotizacion
    biblioteca: BibliotecaLinea[]
  },
) {
  const basePayload = buildWizardPayload(opts.data, opts.estado)

  let cot = opts.isEdit && opts.cotId
    ? await updateCotizacion(opts.cotId, basePayload)
    : await createCotizacion(basePayload)

  const htmlPreview = buildCotHTML({
    numero: cot.numero,
    fecha: cot.fecha ?? cot.createdAt,
    vigencia: cot.vigencia,
    asunto: opts.data.asunto,
    empresa: opts.data.empresa,
    nit: opts.data.nit,
    ciudad: opts.data.ciudad,
    contacto: opts.data.contacto,
    cargo: opts.data.cargo,
    telefono: opts.data.telefono,
    email: opts.data.email,
    comercial: opts.data.comercial,
    paqueteadora: opts.data.paqueteadora,
    lineas: opts.data.lineas,
    itemsSnapshot: opts.data.itemsSnapshot,
    obsHtml: opts.data.obsHtml,
    obsLibre: opts.data.obsLibre,
  }, opts.biblioteca)

  if (htmlPreview !== cot.htmlPreview) {
    cot = await updateCotizacion(cot.id, { ...basePayload, htmlPreview })
  }

  return cot
}

function applyRecordToWizard(record: CRMRecord): Partial<WizardData> {
  const contact =
    record.contactos?.find((c) => c.cargo?.toLowerCase().includes('comercial'))
    ?? record.contactos?.[0]
  return {
    recordId: record.id,
    empresa: record.empresa,
    nit: record.nit ?? '',
    ciudad: record.ciudad ?? '',
    contacto: contact?.nombre ?? '',
    cargo: contact?.cargo ?? '',
    telefono: contact?.telefono ?? '',
    email: contact?.email ?? '',
    comercial: record.comercial?.nombre ?? '',
    paqueteadora: record.servicios?.includes('Paqueteo') ? 'COORDINADORA' : '',
  }
}

// ─── Paso 1: Datos básicos ─────────────────────────────────────────────────────

function Paso1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const [empresaQuery, setEmpresaQuery] = useState(data.empresa)
  const [showEmpresaList, setShowEmpresaList] = useState(false)

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })
  const { data: records = [] } = useQuery({
    queryKey: ['records', 'all'],
    queryFn: () => getRecords({}),
  })

  useEffect(() => {
    setEmpresaQuery(data.empresa)
  }, [data.empresa])

  const empresaMatches = empresaQuery.trim().length >= 1
    ? records.filter((r) => {
        const q = empresaQuery.toLowerCase()
        return r.empresa.toLowerCase().includes(q)
          || (r.nit ?? '').toLowerCase().includes(q)
      }).slice(0, 12)
    : []

  function selectRecord(record: CRMRecord) {
    onChange(applyRecordToWizard(record))
    setEmpresaQuery(record.empresa)
    setShowEmpresaList(false)
  }

  function onEmpresaInput(value: string) {
    setEmpresaQuery(value)
    setShowEmpresaList(true)
    const exact = records.find((r) => r.empresa.toLowerCase() === value.toLowerCase())
    if (exact) {
      onChange(applyRecordToWizard(exact))
    } else {
      onChange({ empresa: value, recordId: '' })
    }
  }

  return (
    <div className="form-grid">
      <div className="form-group full relative">
        <label>Empresa / Cliente <span className="text-danger">*</span></label>
        <input
          className="filter-input w-full"
          value={empresaQuery}
          onChange={(e) => onEmpresaInput(e.target.value)}
          onFocus={() => setShowEmpresaList(true)}
          onBlur={() => setTimeout(() => setShowEmpresaList(false), 150)}
          placeholder="Buscar prospecto o cliente..."
          autoComplete="off"
        />
        {showEmpresaList && empresaMatches.length > 0 && (
          <div className="cot-empresa-dropdown">
            {empresaMatches.map((r) => (
              <button
                key={r.id}
                type="button"
                className="cot-empresa-option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectRecord(r)}
              >
                <span className="font-semibold">{r.empresa}</span>
                <span className="text-xs text-muted">
                  {r.tipo}{r.nit ? ` · ${r.nit}` : ''}{r.ciudad ? ` · ${r.ciudad}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
        {data.recordId && (
          <p className="text-2xs text-accent mt-1">Vinculado al registro CRM</p>
        )}
      </div>
      <div className="form-group">
        <label>NIT</label>
        <input className="filter-input w-full" value={data.nit}
          onChange={(e) => onChange({ nit: e.target.value })} placeholder="900.123.456-7" />
      </div>
      <div className="form-group">
        <label>Ciudad</label>
        <input className="filter-input w-full" value={data.ciudad}
          onChange={(e) => onChange({ ciudad: e.target.value })} placeholder="Bogotá" />
      </div>
      <div className="form-group">
        <label>Contacto</label>
        <input className="filter-input w-full" value={data.contacto}
          onChange={(e) => onChange({ contacto: e.target.value })} placeholder="Nombre del contacto" />
      </div>
      <div className="form-group">
        <label>Cargo</label>
        <input className="filter-input w-full" value={data.cargo}
          onChange={(e) => onChange({ cargo: e.target.value })} placeholder="Cargo del contacto" />
      </div>
      <div className="form-group">
        <label>Teléfono</label>
        <input className="filter-input w-full" value={data.telefono}
          onChange={(e) => onChange({ telefono: e.target.value })} placeholder="Teléfono del contacto" />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" className="filter-input w-full" value={data.email}
          onChange={(e) => onChange({ email: e.target.value })} placeholder="correo@empresa.com" />
      </div>
      <div className="form-group">
        <label>Fecha de cotización</label>
        <input type="date" className="filter-input w-full" value={data.fecha}
          onChange={(e) => onChange({ fecha: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Vigencia (válida hasta)</label>
        <input type="date" className="filter-input w-full" value={data.vigencia}
          onChange={(e) => onChange({ vigencia: e.target.value })} />
      </div>
      <div className="form-group full">
        <label>Asunto / Descripción</label>
        <input className="filter-input w-full" value={data.asunto}
          onChange={(e) => onChange({ asunto: e.target.value })} placeholder="Asunto opcional de la cotización" />
      </div>
      <div className="form-group">
        <label>Paqueteadora</label>
        <select
          className="filter-select w-full"
          value={data.paqueteadora}
          onChange={(e) => onChange({ paqueteadora: e.target.value })}
        >
          <option value="">— Ninguna / otra —</option>
          {PAQUETEO_PAQUETEADORAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <p className="text-2xs text-muted mt-1">Requerida si cotizas línea Paqueteo (filtra grupos en paso 3).</p>
      </div>
      <div className="form-group">
        <label>Comercial <span className="text-danger">*</span></label>
        <select className="filter-select w-full" value={data.comercial}
          onChange={(e) => onChange({ comercial: e.target.value })}>
          <option value="">Seleccionar comercial</option>
          {comerciales.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Estado</label>
        <select
          className="filter-select w-full"
          value={data.estado}
          onChange={(e) => onChange({ estado: e.target.value as EstadoCotizacion })}
        >
          {WIZARD_ESTADO_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Paso 2: Líneas de servicio ────────────────────────────────────────────────

function Paso2({
  data, onChange, lineasDisponibles,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  lineasDisponibles: BibliotecaLinea[]
}) {
  function toggleLinea(nombre: string) {
    const next = data.lineas.includes(nombre)
      ? data.lineas.filter((l) => l !== nombre)
      : [...data.lineas, nombre]
    // Limpiar snapshot de línea eliminada
    const newSnapshot = { ...data.itemsSnapshot }
    if (!next.includes(nombre)) delete newSnapshot[nombre]
    onChange({ lineas: next, itemsSnapshot: newSnapshot })
  }

  return (
    <div className="space-y-6">
      <div className="form-group">
        <label>Tipo de tarifa</label>
        <div className="type-toggle max-w-md">
          {(['biblioteca', 'especial'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ tarifaTipo: t })}
              className={`type-btn ${data.tarifaTipo === t ? 'active' : ''}`}
            >
              {t === 'biblioteca' ? 'Biblioteca de tarifas' : 'Tarifa especial'}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          Líneas de servicio <span className="text-danger">*</span>
        </label>
        <p className="text-xs text-muted mb-3">
          Selecciona las líneas configuradas en <strong>Biblioteca de Tarifas</strong> (sidebar).
        </p>
        <div className="svc-selector-grid">
          {lineasDisponibles.map((linea) => (
            <button
              key={linea.id}
              type="button"
              onClick={() => toggleLinea(linea.nombre)}
              className={`svc-selector-card ${data.lineas.includes(linea.nombre) ? 'selected' : ''}`}
            >
              <div className="svc-icon">{data.lineas.includes(linea.nombre) ? '✓' : '○'}</div>
              <div className="svc-name">{linea.nombre}</div>
              <div className="text-2xs text-muted mt-1">{linea.grupos.length} grupos</div>
            </button>
          ))}
        </div>
        {lineasDisponibles.length === 0 && (
          <p className="text-sm text-muted">No hay líneas en la biblioteca. Configúralas en Biblioteca de Tarifas.</p>
        )}
      </div>
    </div>
  )
}

// ─── Paso 4: Observaciones ─────────────────────────────────────────────────────

function Paso4({
  data, onChange, lineasDisponibles,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  lineasDisponibles: BibliotecaLinea[]
}) {
  const [activeLinea, setActiveLinea] = useState(data.lineas[0] ?? '')
  const linea = lineasDisponibles.find((l) => l.nombre === activeLinea)

  function setObsLinea(lineaNombre: string, html: string) {
    onChange({ obsHtml: { ...data.obsHtml, [lineaNombre]: html } })
  }

  return (
    <div className="space-y-4">
      {/* Tabs líneas */}
      <div className="flex gap-0 border-b border-border">
        {data.lineas.map((l) => (
          <button
            key={l}
            onClick={() => setActiveLinea(l)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeLinea === l
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Observaciones predefinidas de la línea */}
      {linea && linea.obs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted uppercase tracking-widest">Obs. predefinidas</p>
          {linea.obs.map((obs) => (
            <div
              key={obs.id}
              onClick={() => {
                const current = data.obsHtml[activeLinea] ?? ''
                const already = current.includes(obs.html)
                setObsLinea(activeLinea, already ? current.replace(obs.html, '') : current + '\n' + obs.html)
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                (data.obsHtml[activeLinea] ?? '').includes(obs.html)
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border hover:border-muted'
              }`}
            >
              <p className="text-sm font-semibold text-foreground mb-1">{obs.nombre}</p>
              <p className="text-xs text-muted line-clamp-2"
                dangerouslySetInnerHTML={{ __html: obs.html }} />
            </div>
          ))}
        </div>
      )}

      {/* Obs. personalizadas por línea */}
      <div>
        <label className="text-xs text-muted block mb-1">Observaciones adicionales — {activeLinea}</label>
        <textarea
          className="input w-full h-28 resize-none"
          placeholder="Escribe observaciones específicas para esta línea..."
          value={data.obsHtml[activeLinea] ?? ''}
          onChange={(e) => setObsLinea(activeLinea, e.target.value)}
        />
      </div>

      {/* Obs. libres globales */}
      <div>
        <label className="text-xs text-muted block mb-1">Observaciones generales de la cotización</label>
        <textarea
          className="input w-full h-24 resize-none"
          placeholder="Validez de la oferta, condiciones generales..."
          value={data.obsLibre}
          onChange={(e) => onChange({ obsLibre: e.target.value })}
        />
      </div>
    </div>
  )
}

// ─── Paso 5: Resumen ───────────────────────────────────────────────────────────

function Paso5({
  data, onChange,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}) {
  const totalItems = countSelectedInSnapshot(data.itemsSnapshot)

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Datos</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted">Empresa:</span> <span className="text-foreground font-semibold">{data.empresa}</span></div>
          {data.nit && <div><span className="text-muted">NIT:</span> <span className="font-mono text-foreground">{data.nit}</span></div>}
          {data.ciudad && <div><span className="text-muted">Ciudad:</span> <span className="text-foreground">{data.ciudad}</span></div>}
          {data.contacto && <div><span className="text-muted">Contacto:</span> <span className="text-foreground">{data.contacto}{data.cargo ? ` (${data.cargo})` : ''}</span></div>}
          {data.telefono && <div><span className="text-muted">Teléfono:</span> <span className="text-foreground">{data.telefono}</span></div>}
          <div><span className="text-muted">Comercial:</span> <span className="text-foreground">{data.comercial}</span></div>
          <div><span className="text-muted">Tarifa:</span> <span className="text-foreground capitalize">{data.tarifaTipo}</span></div>
          {data.fecha && <div><span className="text-muted">Fecha:</span> <span className="text-foreground">{data.fecha}</span></div>}
          {data.vigencia && <div><span className="text-muted">Válida hasta:</span> <span className="text-foreground">{data.vigencia}</span></div>}
          {data.asunto && <div className="col-span-2"><span className="text-muted">Asunto:</span> <span className="text-foreground">{data.asunto}</span></div>}
          {!data.recordId && (
            <div className="col-span-2 text-xs text-gold">
              Sin vínculo CRM — la cotización quedará sin prospecto/cliente asociado.
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Líneas seleccionadas</h3>
        {data.lineas.map((l) => {
          const lineSnap = data.itemsSnapshot[l]
          const items = lineSnap
            ? Object.values(lineSnap).flat().filter(isItemSelected)
            : []
          return (
            <div key={l} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-semibold text-foreground mb-1">{l}</p>
              {items.length > 0 ? (
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-muted">{summarizeSnapshotItem(item)}</span>
                      <span className="font-mono text-accent">{itemDisplayTarifa(item)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Sin items seleccionados</p>
              )}
            </div>
          )
        })}
        <p className="text-xs text-muted pt-1">{totalItems} item{totalItems !== 1 ? 's' : ''} en total</p>
      </div>

      {(data.obsLibre || Object.values(data.obsHtml).some(Boolean)) && (
        <div className="card p-5 space-y-2">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Observaciones</h3>
          {data.obsLibre && <p className="text-sm text-foreground whitespace-pre-wrap">{data.obsLibre}</p>}
        </div>
      )}

      <div className="card p-5 space-y-2">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Estado al guardar</h3>
        <p className="text-sm text-foreground font-semibold">
          {WIZARD_ESTADO_OPTIONS.find((o) => o.value === data.estado)?.label}
        </p>
        <p className="text-xs text-muted">
          Definido en «Datos básicos» — vuelve al paso 1 para cambiarlo antes de confirmar.
        </p>
      </div>
    </div>
  )
}

// ─── WizardLayout principal ────────────────────────────────────────────────────

export default function WizardLayout() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const isEdit = !!id

  const initialRecordId = searchParams.get('recordId') ?? ''
  const initialStep = Math.min(
    Math.max(parseInt(searchParams.get('step') ?? '0', 10) || 0, 0),
    STEPS.length - 1,
  )
  const [step, setStep] = useState(initialStep)
  const [data, setData] = useState<WizardData>(() => {
    const fecha = todayISO()
    return { ...EMPTY, recordId: initialRecordId, fecha, vigencia: plusDaysISO(fecha, 30) }
  })

  const { data: recordPrefill } = useQuery({
    queryKey: ['record', initialRecordId],
    queryFn: () => getRecord(initialRecordId),
    enabled: !!initialRecordId && !isEdit,
  })

  // Cargar cotización existente para editar
  const { data: cotExistente } = useQuery({
    queryKey: ['cotizacion', id],
    queryFn: () => getCotizacion(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (recordPrefill && !isEdit && !cotExistente) {
      setData((prev) => ({ ...prev, ...applyRecordToWizard(recordPrefill) }))
    }
  }, [recordPrefill, isEdit, cotExistente])

  useEffect(() => {
    if (cotExistente) {
      setData({
        empresa: cotExistente.empresa,
        nit: cotExistente.nit ?? '',
        ciudad: cotExistente.ciudad ?? '',
        contacto: cotExistente.contacto ?? '',
        cargo: cotExistente.cargo ?? '',
        telefono: cotExistente.telefono ?? '',
        email: cotExistente.email ?? '',
        comercial: cotExistente.comercial,
        paqueteadora: cotExistente.paqueteadora ?? '',
        recordId: cotExistente.recordId ?? '',
        fecha: cotExistente.fecha ? cotExistente.fecha.slice(0, 10) : '',
        vigencia: cotExistente.vigencia ? cotExistente.vigencia.slice(0, 10) : '',
        asunto: cotExistente.asunto ?? '',
        lineas: cotExistente.lineas,
        tarifaTipo: cotExistente.tarifaTipo as 'biblioteca' | 'especial',
        itemsSnapshot: flattenSnapshot(cotExistente.itemsSnapshot),
        obsHtml: cotExistente.obsHtml,
        obsLibre: cotExistente.obsLibre ?? '',
        estado: cotExistente.estado,
      })
    }
  }, [cotExistente])

  // Líneas disponibles
  const { data: biblioteca = [] } = useQuery({
    queryKey: ['biblioteca'],
    queryFn: getBiblioteca,
  })

  function onChange(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }))
  }

  const handleSnapshotChange = useCallback((snap: CotItemsSnapshot) => {
    onChange({ itemsSnapshot: snap })
  }, [])

  function advanceStep() {
    if (step === 1 && biblioteca.length) {
      const ensured = ensureTransportePaqueteoSnapshot(
        data.itemsSnapshot,
        data.lineas,
        biblioteca,
        data.paqueteadora,
      )
      if (ensured !== data.itemsSnapshot) {
        onChange({ itemsSnapshot: ensured })
      }
    }
    setStep((s) => s + 1)
  }

  function canAdvance() {
    if (step === 0) return data.empresa.trim() !== '' && data.comercial !== ''
    if (step === 1) {
      if (data.lineas.length === 0) return false
      if (data.lineas.includes('Paqueteo') && !data.paqueteadora.trim()) return false
      return true
    }
    return true
  }

  // Mutations
  const saveMut = useAppMutation({
    mutationFn: () => persistCotizacion({
      isEdit,
      cotId: id,
      data,
      estado: data.estado,
      biblioteca,
    }),
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      const estadoLabel = data.estado === 'enviada' ? ' (enviada)' : ''
      if (!data.recordId) {
        toast.success(
          isEdit
            ? `Cotización actualizada${estadoLabel} (sin vínculo CRM)`
            : `Cotización ${cot.numero} creada${estadoLabel} (sin vínculo CRM)`,
        )
      } else {
        toast.success(
          isEdit
            ? `Cotización actualizada${estadoLabel}`
            : `Cotización ${cot.numero} creada${estadoLabel}`,
        )
      }
      navigate('/cotizaciones')
    },
    onError: () => toast.error('Error al guardar la cotización'),
  })

  const draftMut = useAppMutation({
    mutationFn: () => persistCotizacion({
      isEdit,
      cotId: id,
      data,
      estado: 'borrador',
      biblioteca,
    }),
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      onChange({ estado: 'borrador' })
      if (!isEdit) {
        toast.success(`Borrador ${cot.numero} guardado — puedes continuar después`)
        navigate(`/cotizaciones/${cot.id}/editar?step=${step}`, { replace: true })
      } else {
        toast.success(`Borrador ${cot.numero} actualizado`)
      }
    },
    onError: () => toast.error('Error al guardar el borrador'),
  })

  const stepComponents = [
    <Paso1 key={0} data={data} onChange={onChange} />,
    <Paso2 key={1} data={data} onChange={onChange} lineasDisponibles={biblioteca} />,
    <WizardPaso3
      key={2}
      lineas={data.lineas}
      paqueteadora={data.paqueteadora}
      snapshot={data.itemsSnapshot}
      lineasDisponibles={biblioteca}
      onChange={handleSnapshotChange}
    />,
    <Paso4 key={3} data={data} onChange={onChange} lineasDisponibles={biblioteca} />,
    <Paso5 key={4} data={data} onChange={onChange} />,
  ]

  const saveDraftEnabled = canSaveDraftBasics(data)
  const finalLabel = isEdit
    ? (data.estado === 'enviada' ? 'Guardar como enviada' : 'Guardar cambios')
    : (data.estado === 'enviada' ? 'Crear y marcar enviada' : 'Crear cotización')

  return (
    <div className="space-y-6 cot-wizard-page">

      <div>
        <button type="button" onClick={() => navigate('/cotizaciones')} className="text-xs text-muted hover:text-foreground mb-2">
          ← Volver a cotizaciones
        </button>
        <h2 className="section-title">{isEdit ? 'Editar cotización' : 'Nueva cotización'}</h2>
      </div>

      <div className="step-bar">
        {STEPS.map((label, i) => (
          <div key={label} className="step-item">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className="flex items-center w-full">
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
                  disabled={i > step}
                >
                  {i < step ? '✓' : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`step-line flex-1 ${i < step ? 'done' : ''}`} />
                )}
              </div>
              <span className="step-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="form-card cot-wizard-step">
        <h3 className="table-title mb-5">{STEPS[step]}</h3>
        {stepComponents[step]}
      </div>

      {isEdit && cotExistente && (
        <p className="text-xs text-muted">
          Editando <strong className="text-foreground">{cotExistente.numero}</strong>
          {' · '}
          Estado actual: <strong className="text-foreground">{cotExistente.estado}</strong>
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-3 cot-wizard-nav">
        <button
          className="btn-secondary btn-sm"
          onClick={() => step === 0 ? navigate('/cotizaciones') : setStep((s) => s - 1)}
        >
          {step === 0 ? 'Cancelar' : '← Anterior'}
        </button>

        <div className="flex flex-wrap gap-2 justify-end">
          <button
            type="button"
            className="btn-secondary btn-sm"
            disabled={!saveDraftEnabled || draftMut.isPending || saveMut.isPending}
            onClick={() => draftMut.mutate()}
            title={saveDraftEnabled ? undefined : 'Completa empresa y comercial para guardar borrador'}
          >
            {draftMut.isPending ? 'Guardando borrador...' : 'Guardar borrador'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              className="btn-primary btn-sm"
              disabled={!canAdvance()}
              onClick={advanceStep}
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="btn-primary btn-sm"
              disabled={saveMut.isPending || draftMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? 'Guardando...' : finalLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
