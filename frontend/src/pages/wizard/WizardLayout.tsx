import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCotizacion, createCotizacion, updateCotizacion } from '../../api/cotizaciones'
import { getBiblioteca } from '../../api/biblioteca'
import { getComercialesApi } from '../../api/comerciales'
import { getRecords } from '../../api/records'
import { toast } from '../../store/toastStore'
import type { BibliotecaLinea, EstadoCotizacion } from '../../types'

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

// ─── Paso 1: Datos básicos ─────────────────────────────────────────────────────

function Paso1({ data, onChange }: { data: WizardData; onChange: (d: Partial<WizardData>) => void }) {
  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })
  const { data: records = [] } = useQuery({
    queryKey: ['records', 'all'],
    queryFn: () => getRecords({}),
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted block mb-1">Empresa <span className="text-danger">*</span></label>
          <input className="input w-full" value={data.empresa}
            onChange={(e) => onChange({ empresa: e.target.value })} placeholder="Nombre de la empresa" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">NIT</label>
          <input className="input w-full" value={data.nit}
            onChange={(e) => onChange({ nit: e.target.value })} placeholder="900.123.456-7" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Ciudad</label>
          <input className="input w-full" value={data.ciudad}
            onChange={(e) => onChange({ ciudad: e.target.value })} placeholder="Bogotá" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Contacto</label>
          <input className="input w-full" value={data.contacto}
            onChange={(e) => onChange({ contacto: e.target.value })} placeholder="Nombre del contacto" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Email</label>
          <input type="email" className="input w-full" value={data.email}
            onChange={(e) => onChange({ email: e.target.value })} placeholder="correo@empresa.com" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Paqueteadora</label>
          <input className="input w-full" value={data.paqueteadora}
            onChange={(e) => onChange({ paqueteadora: e.target.value })} placeholder="Nombre paqueteadora" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Comercial <span className="text-danger">*</span></label>
          <select className="filter-select w-full" value={data.comercial}
            onChange={(e) => onChange({ comercial: e.target.value })}>
            <option value="">Seleccionar comercial</option>
            {comerciales.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Vincular a registro CRM</label>
          <select className="filter-select w-full" value={data.recordId}
            onChange={(e) => onChange({ recordId: e.target.value })}>
            <option value="">Sin vincular</option>
            {records.map((r) => (
              <option key={r.id} value={r.id}>{r.empresa} ({r.tipo})</option>
            ))}
          </select>
        </div>
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
    <div className="space-y-5">
      <div>
        <label className="text-xs text-muted block mb-3">Tipo de tarifa</label>
        <div className="flex gap-3">
          {(['biblioteca', 'especial'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ tarifaTipo: t })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                data.tarifaTipo === t
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'border-border text-muted hover:border-muted'
              }`}
            >
              {t === 'biblioteca' ? 'Biblioteca de tarifas' : 'Tarifa especial'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-muted block mb-3">
          Líneas de servicio <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {lineasDisponibles.map((linea) => (
            <button
              key={linea.id}
              type="button"
              onClick={() => toggleLinea(linea.nombre)}
              className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                data.lineas.includes(linea.nombre)
                  ? 'bg-accent/10 border-accent text-accent'
                  : 'border-border text-muted hover:border-muted hover:text-foreground'
              }`}
            >
              <div className="text-base mb-1">
                {data.lineas.includes(linea.nombre) ? '✓' : '○'}
              </div>
              {linea.nombre}
              <div className="text-2xs font-normal mt-0.5">
                {linea.grupos.length} grupos
              </div>
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
            <div key={grupo.id} className="card p-4 space-y-3">
              <h4 className="text-sm font-bold text-foreground">{grupo.nombre}</h4>
              <div className="space-y-1">
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

  const [step, setStep] = useState(0)
  const [data, setData] = useState<WizardData>({
    ...EMPTY,
    recordId: searchParams.get('recordId') ?? '',
  })

  // Cargar cotización existente para editar
  const { data: cotExistente } = useQuery({
    queryKey: ['cotizacion', id],
    queryFn: () => getCotizacion(id!),
    enabled: isEdit,
  })

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
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <button onClick={() => navigate('/cotizaciones')} className="text-xs text-muted hover:text-foreground mb-2">
          ← Volver a cotizaciones
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEdit ? 'Editar cotización' : 'Nueva cotización'}
        </h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                i === step ? 'text-accent' : i < step ? 'text-success cursor-pointer' : 'text-muted'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                i === step ? 'border-accent bg-accent/10 text-accent'
                : i < step ? 'border-success bg-success/10 text-success'
                : 'border-border text-muted'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-success/40' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del paso */}
      <div className="card p-6">
        <h2 className="text-sm font-bold text-foreground mb-4 uppercase tracking-widest">
          {STEPS[step]}
        </h2>
        {stepComponents[step]}
      </div>

      {/* Navegación */}
      <div className="flex justify-between">
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
