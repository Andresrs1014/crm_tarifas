import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, ChevronLeft, ChevronRight, Check, Clock, MapPin } from 'lucide-react'
import { getActividadesCalendario, updateActividad, ActividadCalendario } from '../api/actividades'
import { getComercialesApi } from '../api/comerciales'
import { useToastStore } from '../store/toastStore'
import { useNavigate } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_CORTOS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']

function padded(n: number): string { return String(n).padStart(2, '0') }
function mesStr(y: number, m: number): string { return `${y}-${padded(m + 1)}` }
function fechaStr(y: number, m: number, d: number): string { return `${y}-${padded(m + 1)}-${padded(d)}` }

// ─── Day detail panel ─────────────────────────────────────────────────────────
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
      <div className="relative h-full w-full max-w-md bg-[#111827] border-l border-border overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[#111827] border-b border-border px-5 py-4 flex items-center justify-between">
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
                  <button
                    onClick={() => navigate(`/detalle/${v.record.id}`)}
                    className="text-sm font-semibold text-foreground hover:text-accent transition-colors text-left"
                  >
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
                  {v.hora && <span className="flex items-center gap-1"><Clock size={10} />{v.hora}</span>}
                  {v.lugar && <span className="flex items-center gap-1"><MapPin size={10} />{v.lugar}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CalendarioVisitas() {
  const now = new Date()
  const [anio, setAnio] = useState(now.getFullYear())
  const [mes, setMes]   = useState(now.getMonth())
  const [vista, setVista] = useState<'mes' | 'dia'>('mes')
  const [diaActivo, setDiaActivo] = useState<string | null>(null)
  const [filtComercial, setFiltComercial] = useState('')
  const [panelFecha, setPanelFecha] = useState<string | null>(null)

  const { data: comerciales = [] } = useQuery({ queryKey: ['comerciales'], queryFn: getComercialesApi })

  const { data: visitas = [], isLoading } = useQuery({
    queryKey: ['actividades-calendario', anio, mes, filtComercial],
    queryFn: () => getActividadesCalendario({
      tipo: 'visita',
      mes: mesStr(anio, mes),
      comercialId: filtComercial || undefined,
    }),
    staleTime: 30_000,
  })

  // Group by date string
  const byDate = useMemo(() => {
    const m: Record<string, ActividadCalendario[]> = {}
    for (const v of visitas) {
      const d = v.fecha.slice(0, 10)
      if (!m[d]) m[d] = []
      m[d].push(v)
    }
    return m
  }, [visitas])

  const hoyStr = now.toISOString().slice(0, 10)

  // Calendar grid (Mon-first)
  const primerDia = new Date(anio, mes, 1)
  const offsetLunes = (primerDia.getDay() + 6) % 7 // 0=lun
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  const totalCeldas = Math.ceil((offsetLunes + diasEnMes) / 7) * 7

  function prevMes() {
    if (mes === 0) { setAnio(a => a - 1); setMes(11) } else setMes(m => m - 1)
  }
  function nextMes() {
    if (mes === 11) { setAnio(a => a + 1); setMes(0) } else setMes(m => m + 1)
  }

  // Day-list view: current day's visitas
  const diaVisitas = diaActivo ? (byDate[diaActivo] ?? []) : []

  // Stats
  const total   = visitas.length
  const hechas  = visitas.filter(v => v.hecho).length
  const pending = total - hechas

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays size={22} className="text-accent" />
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-wide">Calendario de Visitas</h1>
            <p className="text-xs text-muted">Actividades con tipo "visita" de todos los registros</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filtComercial}
            onChange={e => setFiltComercial(e.target.value)}
            className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Todos los comerciales</option>
            {comerciales.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button onClick={() => setVista('mes')} className={`px-3 py-1.5 transition-colors ${vista === 'mes' ? 'bg-accent text-black font-bold' : 'text-muted hover:text-foreground'}`}>Mes</button>
            <button onClick={() => setVista('dia')} className={`px-3 py-1.5 transition-colors ${vista === 'dia' ? 'bg-accent text-black font-bold' : 'text-muted hover:text-foreground'}`}>Lista</button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total visitas', value: total,   color: '#94a3b8' },
          { label: 'Realizadas',    value: hechas,  color: '#64748b' },
          { label: 'Pendientes',    value: pending, color: '#34d399' },
        ].map(k => (
          <div key={k.label} className="card-glass rounded-xl p-4 border border-border flex flex-col gap-1">
            <div className="text-[10px] uppercase tracking-[1.5px] text-muted font-semibold">{k.label}</div>
            <div className="text-3xl font-display font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={prevMes} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-muted hover:text-foreground transition-colors"><ChevronLeft size={18} /></button>
        <div className="text-lg font-display font-bold text-foreground min-w-[200px] text-center">
          {MESES[mes]} {anio}
        </div>
        <button onClick={nextMes} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-muted hover:text-foreground transition-colors"><ChevronRight size={18} /></button>
        <button onClick={() => { setAnio(now.getFullYear()); setMes(now.getMonth()) }}
          className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors">
          Hoy
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted py-12 text-center">Cargando...</div>
      ) : vista === 'mes' ? (
        /* ─── Month grid ─── */
        <div className="card-glass rounded-xl border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DIAS_CORTOS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold text-muted uppercase tracking-wider">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCeldas }).map((_, i) => {
              const diaNum = i - offsetLunes + 1
              const esMes = diaNum >= 1 && diaNum <= diasEnMes
              const fStr = esMes ? fechaStr(anio, mes, diaNum) : ''
              const dayVisitas = esMes ? (byDate[fStr] ?? []) : []
              const esHoy = fStr === hoyStr
              const esFinde = i % 7 >= 5

              return (
                <div
                  key={i}
                  onClick={() => esMes && setPanelFecha(fStr)}
                  className={[
                    'min-h-[90px] p-1.5 border-b border-r border-border/50',
                    esMes ? 'cursor-pointer hover:bg-white/[0.02]' : 'bg-white/[0.01]',
                    esFinde && esMes ? 'bg-blue-500/[0.02]' : '',
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
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate"
                            style={{
                              background: v.hecho ? 'rgba(100,116,139,0.15)' : 'rgba(52,211,153,0.15)',
                              color: v.hecho ? '#64748b' : '#34d399',
                              borderLeft: `2px solid ${v.hecho ? '#64748b' : '#34d399'}`,
                              textDecoration: v.hecho ? 'line-through' : 'none',
                            }}
                          >
                            {v.record.empresa}
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
        /* ─── List view ─── */
        <div className="space-y-3">
          {Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([fecha, items]) => {
            const [fy, fm, fd] = fecha.split('-').map(Number)
            const diaN = new Date(fy, fm - 1, fd).getDay()
            const diaLabel = DIAS_CORTOS[(diaN + 6) % 7]
            return (
              <div key={fecha} className="card-glass rounded-xl border border-border overflow-hidden">
                <div
                  className="px-4 py-2.5 border-b border-border flex items-center gap-3 cursor-pointer"
                  onClick={() => setDiaActivo(diaActivo === fecha ? null : fecha)}
                >
                  <div className={`text-sm font-bold ${fecha === hoyStr ? 'text-accent' : 'text-foreground'}`}>
                    {diaLabel} {fd} {MESES[fm - 1]}
                  </div>
                  <span className="text-xs text-muted">{items.length} visita{items.length !== 1 ? 's' : ''}</span>
                  <ChevronRight size={13} className={`ml-auto text-muted transition-transform ${diaActivo === fecha ? 'rotate-90' : ''}`} />
                </div>
                {diaActivo === fecha && (
                  <div className="divide-y divide-border/50">
                    {items.map(v => (
                      <div key={v.id} className={`px-4 py-3 flex items-start gap-3 ${v.hecho ? 'opacity-60' : ''}`}>
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${v.hecho ? 'bg-muted' : 'bg-green-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{v.record.empresa}</div>
                          <div className="text-xs text-muted">{v.descripcion}</div>
                          {v.hora && <div className="text-[10px] text-muted mt-0.5">{v.hora}{v.lugar ? ' · ' + v.lugar : ''}</div>}
                        </div>
                        <div className="text-xs text-muted flex-shrink-0">{v.record.comercial.nombre}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {Object.keys(byDate).length === 0 && (
            <div className="text-sm text-muted py-12 text-center card-glass rounded-xl border border-border">
              No hay visitas registradas para {MESES[mes]} {anio}.
            </div>
          )}
        </div>
      )}

      {/* Day detail panel */}
      {panelFecha && (
        <DayPanel
          fecha={panelFecha}
          visitas={byDate[panelFecha] ?? []}
          onClose={() => setPanelFecha(null)}
        />
      )}
    </div>
  )
}
