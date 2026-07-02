import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock, MapPin } from 'lucide-react'
import { getActividadesCalendario, updateActividad, ActividadCalendario } from '../api/actividades'
import { getComercialesApi } from '../api/comerciales'
import { useToastStore } from '../store/toastStore'
import { useNavigate } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────
const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const DIAS_LARGOS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const HORA_INICIO = 6
const HORA_FIN    = 21
const ALTURA_HORA = 64 // px

function padded(n: number): string { return String(n).padStart(2, '0') }
function mesStr(y: number, m: number): string { return `${y}-${padded(m + 1)}` }
function fechaStr(y: number, m: number, d: number): string { return `${y}-${padded(m + 1)}-${padded(d)}` }

// ─── Day detail panel (slide-in) ──────────────────────────────────────────────
function DayPanel({
  fecha, visitas, onClose,
}: {
  fecha: string; visitas: ActividadCalendario[]; onClose: () => void
}) {
  const qc = useQueryClient()
  const { push } = useToastStore()
  const navigate = useNavigate()

  const mutateHecho = useMutation({
    mutationFn: ({ id, hecho }: { id: string; hecho: boolean }) => updateActividad(id, { hecho }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['actividades-calendario'] }); push('Visita actualizada', 'success') },
    onError: () => push('Error al actualizar', 'error'),
  })

  const [y, m, d] = fecha.split('-').map(Number)
  const label = `${DIAS_CORTOS[(new Date(y, m-1, d).getDay() + 6) % 7]}, ${d} de ${MESES[m - 1]} ${y}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="relative h-full w-full max-w-md bg-surface border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-display font-bold text-accent">{label}</div>
            <div className="text-xs text-muted">{visitas.length} visita{visitas.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {visitas.length === 0 ? (
            <div className="text-sm text-muted py-8 text-center">No hay visitas para este día.</div>
          ) : visitas.map(v => (
            <div
              key={v.id}
              className={`rounded-xl border p-4 space-y-2 transition-colors ${v.hecho ? 'border-border/50 opacity-60' : 'border-green-500/30 bg-green-500/[0.04]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <button onClick={() => navigate(`/detalle/${v.record.id}`)} className="text-sm font-semibold text-foreground hover:text-accent transition-colors text-left">
                    {v.record.empresa}
                  </button>
                  <div className="text-xs text-muted mt-0.5">{v.record.comercial.nombre}</div>
                </div>
                <button
                  onClick={() => mutateHecho.mutate({ id: v.id, hecho: !v.hecho })}
                  className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${v.hecho ? 'bg-muted/20 border-muted/40 text-muted' : 'border-green-400/50 hover:bg-green-400/10 text-green-400'}`}
                  title={v.hecho ? 'Marcar pendiente' : 'Marcar hecho'}
                >
                  <Check size={11} />
                </button>
              </div>
              <p className={`text-xs leading-relaxed ${v.hecho ? 'line-through text-muted' : 'text-foreground/80'}`}>
                {v.descripcion}
              </p>
              {(v.hora || v.lugar) && (
                <div className="flex flex-wrap gap-3 text-[10px] text-muted">
                  {v.hora  && <span className="flex items-center gap-1"><Clock  size={10} />{v.hora}</span>}
                  {v.lugar && <span className="flex items-center gap1"><MapPin size={10} />{v.lugar}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Timeline (vista día) ─────────────────────────────────────────────────────
function Timeline({
  visitas, fechaActual,
}: {
  visitas: ActividadCalendario[]; fechaActual: string
}) {
  const navigate  = useNavigate()
  const nowRef    = useRef<HTMLDivElement>(null)
  const now       = new Date()
  const esHoy     = fechaActual === now.toISOString().slice(0, 10)
  const horaActual = now.getHours()

  useEffect(() => {
    if (esHoy && nowRef.current) {
      nowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [esHoy])

  // split by hora
  const conHora: Record<number, ActividadCalendario[]> = {}
  const sinHora: ActividadCalendario[] = []
  for (const v of visitas) {
    if (v.hora) {
      const h = parseInt(v.hora.split(':')[0])
      if (!conHora[h]) conHora[h] = []
      conHora[h].push(v)
    } else {
      sinHora.push(v)
    }
  }

  function VisitaCard({ v }: { v: ActividadCalendario }) {
    const col = v.hecho ? '#64748b' : '#34d399'
    return (
      <div
        onClick={() => navigate(`/detalle/${v.record.id}`)}
        className="mx-2 my-1 rounded-lg px-3 py-2 cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: col + '18', borderLeft: `3px solid ${col}` }}
      >
        <div className="text-xs font-bold" style={{ color: col }}>{v.record.empresa}</div>
        {v.descripcion && <div className="text-[10px] text-muted mt-0.5 line-clamp-1">{v.descripcion}</div>}
        {v.lugar       && <div className="text-[10px] text-muted mt-0.5">📍 {v.lugar}</div>}
        <div className="text-[10px] text-muted mt-0.5">{v.record.comercial.nombre}</div>
      </div>
    )
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
      {Array.from({ length: HORA_FIN - HORA_INICIO + 1 }).map((_, i) => {
        const h     = HORA_INICIO + i
        const hStr  = `${padded(h)}:00`
        const items = conHora[h] ?? []
        const esAhora = esHoy && h === horaActual

        return (
          <div key={h} className="flex border-t border-border/60 relative" style={{ minHeight: ALTURA_HORA }}>
            {/* Hora label */}
            <div className="w-14 flex-shrink-0 px-2 pt-1 text-right text-[11px] font-semibold text-muted leading-none select-none">
              {hStr}
            </div>
            {/* Slot */}
            <div className="flex-1 border-l border-border/60 relative min-h-full">
              {esAhora && (
                <div ref={nowRef} className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 z-10" />
              )}
              {items.map(v => <VisitaCard key={v.id} v={v} />)}
            </div>
          </div>
        )
      })}

      {/* Slot sin hora */}
      <div className="flex border-t border-border" style={{ minHeight: 48 }}>
        <div className="w-14 flex-shrink-0 px-2 pt-1 text-right text-[10px] text-muted leading-none select-none">
          Sin hora
        </div>
        <div className="flex-1 border-l border-border/60 py-1">
          {sinHora.map(v => (
            <div
              key={v.id}
              onClick={() => navigate(`/detalle/${v.record.id}`)}
              className="mx-2 my-0.5 rounded-lg px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: (v.hecho ? '#64748b' : '#34d399') + '18', borderLeft: `3px solid ${v.hecho ? '#64748b' : '#34d399'}` }}
            >
              <span className="text-xs font-semibold" style={{ color: v.hecho ? '#64748b' : '#34d399' }}>{v.record.empresa}</span>
              {v.descripcion && <span className="text-[10px] text-muted ml-2">{v.descripcion}</span>}
            </div>
          ))}
          {sinHora.length === 0 && <p className="text-[10px] text-muted px-3 py-2">—</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CalendarioVisitas() {
  const now = new Date()
  const [anio, setAnio]       = useState(now.getFullYear())
  const [mes, setMes]         = useState(now.getMonth())
  const [dia, setDia]         = useState(now.getDate())
  const [vista, setVista]     = useState<'mes' | 'dia'>('mes')
  const [filtComercial, setFiltComercial] = useState('')
  const [panelFecha, setPanelFecha]       = useState<string | null>(null)

  const { data: comerciales = [] } = useQuery({ queryKey: ['comerciales'], queryFn: getComercialesApi })

  const { data: visitasMes = [], isLoading } = useQuery({
    queryKey: ['actividades-calendario', anio, mes, filtComercial],
    queryFn: () => getActividadesCalendario({
      tipo: 'visita',
      mes: mesStr(anio, mes),
      comercialId: filtComercial || undefined,
    }),
    staleTime: 30_000,
  })

  // For day view: fetch that specific day (same endpoint, filter client-side)
  const diaStr = fechaStr(anio, mes, dia)

  const { data: visitasDiaRaw = [] } = useQuery({
    queryKey: ['actividades-calendario', anio, mes, filtComercial, 'dia'],
    queryFn: () => getActividadesCalendario({
      tipo: 'visita',
      mes: mesStr(anio, mes),
      comercialId: filtComercial || undefined,
    }),
    enabled: vista === 'dia',
    staleTime: 30_000,
  })

  const visitasDia = useMemo(
    () => visitasDiaRaw.filter(v => v.fecha.slice(0, 10) === diaStr),
    [visitasDiaRaw, diaStr]
  )

  // Group month visitas by date
  const byDate = useMemo(() => {
    const m: Record<string, ActividadCalendario[]> = {}
    for (const v of visitasMes) {
      const d = v.fecha.slice(0, 10)
      if (!m[d]) m[d] = []
      m[d].push(v)
    }
    return m
  }, [visitasMes])

  const hoyStr = now.toISOString().slice(0, 10)

  // Calendar grid (Mon-first)
  const primerDia   = new Date(anio, mes, 1)
  const offsetLunes = (primerDia.getDay() + 6) % 7
  const diasEnMes   = new Date(anio, mes + 1, 0).getDate()
  const totalCeldas = Math.ceil((offsetLunes + diasEnMes) / 7) * 7

  // Navigation — month or day depending on vista
  function prevPeriodo() {
    if (vista === 'dia') {
      const d = new Date(anio, mes, dia - 1)
      setAnio(d.getFullYear()); setMes(d.getMonth()); setDia(d.getDate())
    } else {
      if (mes === 0) { setAnio(a => a - 1); setMes(11) } else setMes(m => m - 1)
    }
  }
  function nextPeriodo() {
    if (vista === 'dia') {
      const d = new Date(anio, mes, dia + 1)
      setAnio(d.getFullYear()); setMes(d.getMonth()); setDia(d.getDate())
    } else {
      if (mes === 11) { setAnio(a => a + 1); setMes(0) } else setMes(m => m + 1)
    }
  }
  function irHoy() {
    setAnio(now.getFullYear()); setMes(now.getMonth()); setDia(now.getDate())
  }
  function abrirDia(fStr: string) {
    const d = new Date(fStr + 'T12:00:00')
    setAnio(d.getFullYear()); setMes(d.getMonth()); setDia(d.getDate())
    setVista('dia')
  }

  // Period label
  const periodoLabel = vista === 'dia'
    ? `${DIAS_LARGOS[new Date(anio, mes, dia).getDay()]} ${dia} de ${MESES[mes]} ${anio}`
    : `${MESES[mes]} ${anio}`

  // KPIs (based on current month)
  const total   = visitasMes.length
  const hechas  = visitasMes.filter(v => v.hecho).length
  const pending = total - hechas

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} className="text-accent" />
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Calendario de Visitas</h2>
            <p className="text-xs text-muted">Actividades con tipo "visita" de todos los registros</p>
          </div>
        </div>
        <div className="table-header-actions">
          <select
            value={filtComercial}
            onChange={e => setFiltComercial(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los comerciales</option>
            {comerciales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>

          {/* Vista toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
            <button
              onClick={() => setVista('mes')}
              className={`px-4 py-1.5 font-bold transition-colors ${vista === 'mes' ? 'bg-accent2 text-white' : 'text-muted hover:text-foreground'}`}
            >
              Mes
            </button>
            <button
              onClick={() => setVista('dia')}
              className={`px-4 py-1.5 font-bold transition-colors ${vista === 'dia' ? 'bg-accent2 text-white' : 'text-muted hover:text-foreground'}`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="crm-kpi-strip">
        {[
          { label: 'Total visitas', value: total,   color: 'var(--text2)' },
          { label: 'Realizadas',    value: hechas,  color: 'var(--accent)' },
          { label: 'Pendientes',    value: pending, color: 'var(--green)' },
        ].map(k => (
          <div key={k.label} className="crm-kpi-cell" style={{ borderTopColor: k.color }}>
            <div className="crm-kpi-label">{k.label}</div>
            <div className="crm-kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center gap-3">
        <button onClick={prevPeriodo} className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-base font-display font-bold text-foreground min-w-[240px] text-center">
          {periodoLabel}
        </div>
        <button onClick={nextPeriodo} className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors">
          <ChevronRight size={18} />
        </button>
        <button
          onClick={irHoy}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
        >
          Hoy
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted py-12 text-center">Cargando...</div>
      ) : vista === 'mes' ? (

        /* ─── Month grid ─── */
        <div className="card-glass rounded-xl border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-surface3">
            {DIAS_CORTOS.map((d, i) => (
              <div key={d} className={`py-2.5 text-center text-[10px] font-bold uppercase tracking-wider ${i >= 5 ? 'text-accent' : 'text-muted'}`}>
                {d}
              </div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCeldas }).map((_, i) => {
              const diaNum    = i - offsetLunes + 1
              const esMes     = diaNum >= 1 && diaNum <= diasEnMes
              const fStr      = esMes ? fechaStr(anio, mes, diaNum) : ''
              const dayVisitas = esMes ? (byDate[fStr] ?? []) : []
              const esHoy     = fStr === hoyStr
              const esFinde   = i % 7 >= 5

              return (
                <div
                  key={i}
                  onClick={() => esMes && setPanelFecha(fStr)}
                  className={[
                    'min-h-[90px] p-1.5 border-b border-r border-border/40',
                    esMes ? 'cursor-pointer hover:bg-white/[0.02]' : 'bg-white/[0.01]',
                    esFinde && esMes ? 'bg-blue-500/[0.015]' : '',
                  ].join(' ')}
                >
                  {esMes && (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${esHoy ? 'bg-accent text-black' : esFinde ? 'text-blue-400' : 'text-muted'}`}>
                        {diaNum}
                      </div>
                      <div className="space-y-0.5">
                        {dayVisitas.slice(0, 3).map(v => (
                          <div
                            key={v.id}
                            onClick={e => { e.stopPropagation(); abrirDia(fStr) }}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate cursor-pointer"
                            style={{
                              background:     v.hecho ? 'rgba(100,116,139,0.15)' : 'rgba(52,211,153,0.15)',
                              color:          v.hecho ? '#64748b' : '#34d399',
                              borderLeft:     `2px solid ${v.hecho ? '#64748b' : '#34d399'}`,
                              textDecoration: v.hecho ? 'line-through' : 'none',
                            }}
                          >
                            {v.hora ? `${v.hora} ` : ''}{v.record.empresa}
                          </div>
                        ))}
                        {dayVisitas.length > 3 && (
                          <div className="text-[9px] text-muted pl-1">+{dayVisitas.length - 3} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      ) : (

        /* ─── Day timeline view ─── */
        <div className="card-glass rounded-xl border border-border overflow-hidden">
          {/* Day header */}
          <div className="bg-surface3 border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="font-display text-xl font-bold text-foreground">{periodoLabel}</div>
            <div className="text-xs text-muted">{visitasDia.length} visita{visitasDia.length !== 1 ? 's' : ''}</div>
          </div>
          <Timeline visitas={visitasDia} fechaActual={diaStr} />
        </div>

      )}

      {/* Day detail panel (only in month view) */}
      {panelFecha && vista === 'mes' && (
        <DayPanel
          fecha={panelFecha}
          visitas={byDate[panelFecha] ?? []}
          onClose={() => setPanelFecha(null)}
        />
      )}
    </div>
  )
}
