import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCotWizardStore } from '../../store/cotWizardStore'
import { getComercialesApi } from '../../api/comerciales'
import { getRecords } from '../../api/records'
import { today } from '../../utils/format'
import type { RecordRead } from '../../types'

export default function Paso1() {
  const s = useCotWizardStore()
  const set = s.setDatosGenerales

  // Autocomplete empresa
  const [empQuery, setEmpQuery] = useState(s.empresa)
  const [empDropdown, setEmpDropdown] = useState(false)
  const empRef = useRef<HTMLDivElement>(null)

  const { data: comerciales = [] } = useQuery({
    queryKey: ['comerciales'],
    queryFn: getComercialesApi,
  })

  const { data: empSuggestions = [] } = useQuery({
    queryKey: ['records-emp-search', empQuery],
    queryFn: () => getRecords({ search: empQuery }),
    enabled: empQuery.length >= 2 && empDropdown,
    staleTime: 1000 * 30,
  })

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setEmpDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectEmpresa = (r: RecordRead) => {
    set({
      empresa: r.empresa,
      nit: r.nit ?? '',
      record_id: r.id,
    })
    setEmpQuery(r.empresa)
    setEmpDropdown(false)
  }

  const handleEmpChange = (v: string) => {
    setEmpQuery(v)
    set({ empresa: v, record_id: null })
    setEmpDropdown(true)
  }

  // Vigencia por defecto: 30 días desde hoy
  const defaultVigencia = () => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-5">
      <h2 className="font-condensed text-xs uppercase text-muted tracking-wider">
        Datos generales
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Empresa — autocomplete */}
        <div className="col-span-2 relative" ref={empRef}>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">
            Empresa *
          </label>
          <input
            value={empQuery}
            onChange={(e) => handleEmpChange(e.target.value)}
            onFocus={() => empQuery.length >= 2 && setEmpDropdown(true)}
            placeholder="Nombre de empresa (busca en CRM o escribe nuevo)"
          />
          {empDropdown && empSuggestions.length > 0 && (
            <div
              className="absolute z-50 w-full mt-1 rounded-xl border border-border overflow-hidden shadow-xl"
              style={{ background: '#111827' }}
            >
              {empSuggestions.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface2 transition"
                  onClick={() => selectEmpresa(r)}
                >
                  <span style={{ color: '#e8edf5' }}>{r.empresa}</span>
                  {r.nit && <span className="text-muted text-xs ml-2">NIT {r.nit}</span>}
                  <span
                    className="text-xs ml-2 capitalize"
                    style={{ color: r.tipo === 'cliente' ? '#00e676' : '#00c2ff' }}
                  >
                    {r.tipo}
                  </span>
                </button>
              ))}
            </div>
          )}
          {s.record_id && (
            <p className="text-xs mt-1" style={{ color: '#00e676' }}>
              Vinculado al CRM
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">NIT</label>
          <input
            value={s.nit}
            onChange={(e) => set({ nit: e.target.value })}
            placeholder="900.123.456-7"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Comercial</label>
          <select value={s.comercial_id} onChange={(e) => set({ comercial_id: e.target.value })}>
            <option value="">Sin asignar</option>
            {comerciales.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Contacto</label>
          <input
            value={s.contacto}
            onChange={(e) => set({ contacto: e.target.value })}
            placeholder="Nombre del contacto"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Cargo</label>
          <input
            value={s.cargo}
            onChange={(e) => set({ cargo: e.target.value })}
            placeholder="Cargo del contacto"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Email</label>
          <input
            type="email"
            value={s.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="email@empresa.com"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Teléfono</label>
          <input
            value={s.telefono}
            onChange={(e) => set({ telefono: e.target.value })}
            placeholder="Teléfono"
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Fecha</label>
          <input
            type="date"
            value={s.fecha || today()}
            onChange={(e) => set({ fecha: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Vigencia</label>
          <input
            type="date"
            value={s.vigencia || defaultVigencia()}
            onChange={(e) => set({ vigencia: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Estado</label>
          <select value={s.estado} onChange={(e) => set({ estado: e.target.value as typeof s.estado })}>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="negociacion">Negociación</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider font-condensed">Asunto</label>
          <input
            value={s.asunto}
            onChange={(e) => set({ asunto: e.target.value })}
            placeholder="Ej: Propuesta comercial servicios de Zona Franca"
          />
        </div>
      </div>
    </div>
  )
}
