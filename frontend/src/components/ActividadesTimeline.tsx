import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MapPin, Briefcase, FileText, MessageSquare } from 'lucide-react'
import { addActividad } from '../api/records'
import { useToastStore } from '../store/toastStore'
import { fmtDate, today } from '../utils/format'
import type { Actividad, ActividadTipo } from '../types'

const TIPO_CONFIG: Record<ActividadTipo, { label: string; icon: React.ReactNode; color: string }> = {
  visit:   { label: 'Visita',       icon: <MapPin size={14} />,       color: '#00c2ff' },
  service: { label: 'Nuevo servicio', icon: <Briefcase size={14} />,  color: '#00e676' },
  invoice: { label: 'Facturación',  icon: <FileText size={14} />,     color: '#f5a623' },
  note:    { label: 'Nota',         icon: <MessageSquare size={14} />, color: '#a855f7' },
}

interface Props {
  actividades: Actividad[]
  recordId: string
  queryKey: string[]
}

export default function ActividadesTimeline({ actividades, recordId, queryKey }: Props) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<ActividadTipo>('visit')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(today())
  const toast = useToastStore()
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => addActividad(recordId, { tipo, descripcion, fecha }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      toast.add('Actividad registrada')
      setDescripcion('')
      setFecha(today())
      setOpen(false)
    },
    onError: () => toast.add('Error al registrar actividad', 'error'),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-condensed uppercase text-muted tracking-wider">Actividades</h3>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-accent text-xs hover:text-blue-300"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      {open && (
        <div className="bg-surface2 border border-border rounded-lg p-3 mb-4 space-y-2">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as ActividadTipo)}>
            {Object.entries(TIPO_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <textarea
            rows={2}
            placeholder="Descripción *"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="text-muted text-sm hover:text-white">
              Cancelar
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!descripcion || mutation.isPending}
              className="bg-accent text-bg px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
            >
              {mutation.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {actividades.length === 0 && (
          <p className="text-muted text-sm text-center py-4">Sin actividades registradas</p>
        )}
        {actividades.map((a) => {
          const cfg = TIPO_CONFIG[a.tipo]
          return (
            <div key={a.id} className="flex gap-3 bg-surface2 rounded-lg p-3 border border-border">
              <div
                className="mt-0.5 p-1.5 rounded"
                style={{ color: cfg.color, backgroundColor: cfg.color + '22' }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs text-muted shrink-0">{fmtDate(a.fecha)}</span>
                </div>
                <p className="text-sm mt-0.5" style={{ color: '#e8edf5' }}>{a.descripcion}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
