import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCotizacion, createCotizacion, updateCotizacion } from '../../api/cotizaciones'
import { getBiblioteca } from '../../api/biblioteca'
import { getComercialesApi } from '../../api/comerciales'
import { getRecords, getRecord } from '../../api/records'
import { toast } from '../../store/toastStore'
import type { BibliotecaLinea, CRMRecord, EstadoCotizacion } from '../../types'

// ─── Tipos wizard ──────────────────────────────────────────────────────────────

interface WizardData {
  // Paso 1: Datos básicos
  empresa: string
  nit: string
  ciudad: string
  contacto: string
  email: string
  comercial: string
  paqueteadora: string
  recordId: string
  // Paso 2: Líneas de servicio
  lineas: string[]
  tarifaTipo: 'biblioteca' | 'especial'
  // Paso 3: Items seleccionados por línea (snapshot)
  itemsSnapshot: Record<string, unknown>
  // Paso 4: Observaciones por línea + libres
  obsHtml: Record<string, string>
  obsLibre: string
  // Paso 5: Estado
  estado: EstadoCotizacion
}

const EMPTY: WizardData = {
  empresa: '', nit: '', ciudad: '', contacto: '', email: '',
  comercial: '', paqueteadora: '', recordId: '',
  lineas: [], tarifaTipo: 'biblioteca',
  itemsSnapshot: {}, obsHtml: {}, obsLibre: '',
  estado: 'borrador',
}

const STEPS = ['Datos básicos', 'Servicios', 'Tarifas', 'Observaciones', 'Resumen']

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
    email: contact?.email ?? '',
    comercial: record.comercial?.nombre ?? '',
    paqueteadora: record.servicios?.includes('Paqueteo') ? 'Paqueteo' : (record.servicios?.[0] ?? ''),
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
        <label>Email</label>
        <input type="email" className="filter-input w-full" value={data.email}
          onChange={(e) => onChange({ email: e.target.value })} placeholder="correo@empresa.com" />
      </div>
      <div className="form-group">
        <label>Paqueteadora</label>
        <input className="filter-input w-full" value={data.paqueteadora}
          onChange={(e) => onChange({ paqueteadora: e.target.value })} placeholder="Nombre paqueteadora" />
      </div>
      <div className="form-group">
        <label>Comercial <span className="text-danger">*</span></label>
        <select className="filter-select w-full" value={data.comercial}
          onChange={(e) => onChange({ comercial: e.target.value })}>
          <option value="">Seleccionar comercial</option>
          {comerciales.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
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

// ─── Paso 3: Selección de items ────────────────────────────────────────────────

function Paso3({
  data, onChange, lineasDisponibles,
}: {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
  lineasDisponibles: BibliotecaLinea[]
}) {
  const [activeLinea, setActiveLinea] = useState(data.lineas[0] ?? '')
  const linea = lineasDisponibles.find((l) => l.nombre === activeLinea)

  function toggleItem(lineaNombre: string, grupoNombre: string, item: {
    id: string; nombre: string; tarifa: string; tipoTarifa: string; obs?: string
  }) {
    const prev = (data.itemsSnapshot[lineaNombre] as Record<string, unknown[]> | undefined) ?? {}
    const grupoItems = (prev[grupoNombre] as { id: string }[] | undefined) ?? []
    const exists = grupoItems.some((i: { id: string }) => i.id === item.id)
    const nextGrupo = exists
      ? grupoItems.filter((i: { id: string }) => i.id !== item.id)
      : [...grupoItems, item]
    onChange({
      itemsSnapshot: {
        ...data.itemsSnapshot,
        [lineaNombre]: { ...prev, [grupoNombre]: nextGrupo },
      },
    })
  }

  function isSelected(lineaNombre: string, grupoNombre: string, itemId: string) {
    const snap = data.itemsSnapshot[lineaNombre] as Record<string, { id: string }[]> | undefined
    return (snap?.[grupoNombre] ?? []).some((i) => i.id === itemId)
  }

  return (
    <div className="space-y-4">
      {/* Tabs de líneas */}
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

      {/* Grupos e items */}
      {linea ? (
        <div className="space-y-4">
          {linea.grupos.map((grupo) => (
            <div key={grupo.id} className="grupo-card">
              <div className="grupo-header grupo-header--open">
                <div className="grupo-title">{grupo.nombre}</div>
                <div className="text-xs text-muted flex-shrink-0">{grupo.items.length} ítems</div>
              </div>
              <div className="grupo-body space-y-1">
                {grupo.items.map((item) => {
                  const selected = isSelected(activeLinea, grupo.nombre, item.id)
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(activeLinea, grupo.nombre, {
                        id: item.id, nombre: item.nombre, tarifa: item.tarifa,
                        tipoTarifa: item.tipoTarifa, obs: item.obs,
                      })}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors ${
                        selected
                          ? 'border-accent/40 bg-accent/5'
                          : 'border-transparent hover:border-border hover:bg-surface2'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-2xs ${
                          selected ? 'border-accent bg-accent' : 'border-border'
                        }`}>
                          {selected && <span className="text-black font-bold">✓</span>}
                        </div>
                        <span className="text-sm text-foreground">{item.nombre}</span>
                        {item.obs && <span className="text-2xs text-muted">({item.obs})</span>}
                      </div>
                      <span className={`text-sm font-mono font-semibold ${selected ? 'text-accent' : 'text-muted'}`}>
                        {item.tarifa}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">Selecciona una línea.</p>
      )}
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

function Paso5({ data }: { data: WizardData }) {
  const totalItems = Object.values(data.itemsSnapshot).reduce((sum: number, linSnap) => {
    return sum + Object.values(linSnap as Record<string, unknown[]>).reduce(
      (s: number, items) => s + (items as unknown[]).length, 0
    )
  }, 0)

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Datos</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted">Empresa:</span> <span className="text-foreground font-semibold">{data.empresa}</span></div>
          {data.nit && <div><span className="text-muted">NIT:</span> <span className="font-mono text-foreground">{data.nit}</span></div>}
          {data.ciudad && <div><span className="text-muted">Ciudad:</span> <span className="text-foreground">{data.ciudad}</span></div>}
          {data.contacto && <div><span className="text-muted">Contacto:</span> <span className="text-foreground">{data.contacto}</span></div>}
          <div><span className="text-muted">Comercial:</span> <span className="text-foreground">{data.comercial}</span></div>
          <div><span className="text-muted">Tarifa:</span> <span className="text-foreground capitalize">{data.tarifaTipo}</span></div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Líneas seleccionadas</h3>
        {data.lineas.map((l) => {
          const snap = data.itemsSnapshot[l] as Record<string, { id: string; nombre: string; tarifa: string }[]> | undefined
          const items = snap ? Object.values(snap).flat() : []
          return (
            <div key={l} className="border-b border-border last:border-0 pb-3 last:pb-0">
              <p className="text-sm font-semibold text-foreground mb-1">{l}</p>
              {items.length > 0 ? (
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="text-muted">{item.nombre}</span>
                      <span className="font-mono text-accent">{item.tarifa}</span>
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

      <div className="card p-5 space-y-3">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest">Estado inicial</h3>
        <div className="flex gap-3">
          {(['borrador', 'enviada'] as EstadoCotizacion[]).map((e) => (
            <span key={e} className={e === 'borrador' ? 'badge-gray' : 'badge-blue'}>{e}</span>
          ))}
        </div>
        <p className="text-xs text-muted">La cotización se guardará como <strong>borrador</strong>. Puedes cambiar el estado desde la lista.</p>
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
  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    ...EMPTY,
    recordId: initialRecordId,
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
        email: cotExistente.email ?? '',
        comercial: cotExistente.comercial,
        paqueteadora: cotExistente.paqueteadora ?? '',
        recordId: cotExistente.recordId ?? '',
        lineas: cotExistente.lineas,
        tarifaTipo: cotExistente.tarifaTipo as 'biblioteca' | 'especial',
        itemsSnapshot: cotExistente.itemsSnapshot as Record<string, unknown>,
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

  // Validar paso actual
  function canAdvance() {
    if (step === 0) return data.empresa.trim() !== '' && data.comercial !== ''
    if (step === 1) return data.lineas.length > 0
    return true
  }

  // Mutations
  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        empresa: data.empresa,
        nit: data.nit || undefined,
        ciudad: data.ciudad || undefined,
        contacto: data.contacto || undefined,
        email: data.email || undefined,
        comercial: data.comercial,
        paqueteadora: data.paqueteadora || undefined,
        recordId: data.recordId || undefined,
        tarifaTipo: data.tarifaTipo,
        estado: 'borrador' as EstadoCotizacion,
        lineas: data.lineas,
        itemsSnapshot: data.itemsSnapshot,
        obsHtml: data.obsHtml,
        obsLibre: data.obsLibre || undefined,
      }
      return isEdit
        ? updateCotizacion(id!, payload)
        : createCotizacion(payload)
    },
    onSuccess: (cot) => {
      qc.invalidateQueries({ queryKey: ['cotizaciones'] })
      toast.success(isEdit ? 'Cotización actualizada' : `Cotización ${cot.numero} creada`)
      navigate('/cotizaciones')
    },
    onError: () => toast.error('Error al guardar la cotización'),
  })

  const stepComponents = [
    <Paso1 key={0} data={data} onChange={onChange} />,
    <Paso2 key={1} data={data} onChange={onChange} lineasDisponibles={biblioteca} />,
    <Paso3 key={2} data={data} onChange={onChange} lineasDisponibles={biblioteca} />,
    <Paso4 key={3} data={data} onChange={onChange} lineasDisponibles={biblioteca} />,
    <Paso5 key={4} data={data} />,
  ]

  return (
    <div className="p-6 space-y-6 cot-wizard-page">

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

      <div className="flex justify-between cot-wizard-nav">
        <button
          className="btn-secondary btn-sm"
          onClick={() => step === 0 ? navigate('/cotizaciones') : setStep((s) => s - 1)}
        >
          {step === 0 ? 'Cancelar' : '← Anterior'}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            className="btn-primary btn-sm"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
          >
            Siguiente →
          </button>
        ) : (
          <button
            className="btn-primary btn-sm"
            disabled={saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cotización'}
          </button>
        )}
      </div>
    </div>
  )
}
