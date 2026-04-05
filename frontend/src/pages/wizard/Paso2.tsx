import { useQuery } from '@tanstack/react-query'
import { useCotWizardStore } from '../../store/cotWizardStore'
import { SERVICIO_COLORS } from '../../types'
import type { BibliotecaLinea } from '../../types'
import { getTarifasEspeciales } from '../../api/tarifas_especiales'

interface Props {
  biblioteca: BibliotecaLinea[]
}

export default function Paso2({ biblioteca }: Props) {
  const lineas = useCotWizardStore((s) => s.lineas)
  const tarifa_tipo = useCotWizardStore((s) => s.tarifa_tipo)
  const tarifa_especial_id = useCotWizardStore((s) => s.tarifa_especial_id)
  const toggleLinea = useCotWizardStore((s) => s.toggleLinea)
  const setTarifaTipo = useCotWizardStore((s) => s.setTarifaTipo)
  const setTarifaEspecialId = useCotWizardStore((s) => s.setTarifaEspecialId)

  // Fetch all tarifas especiales once — filter client-side per servicio
  const { data: tarifasEspeciales = [] } = useQuery({
    queryKey: ['tarifas_especiales'],
    queryFn: () => getTarifasEspeciales(),
    enabled: lineas.length > 0,
  })

  const serviciosDisponibles = biblioteca.map((l) => l.nombre)

  return (
    <div className="space-y-5">
      {/* Selector de líneas */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-2">
          Seleccionar líneas de servicio
        </h2>
        <p className="text-muted text-sm mb-6">
          Selecciona los servicios que incluirá esta cotización. Solo las líneas seleccionadas
          aparecerán en el Paso 3 para configurar sus ítems.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {serviciosDisponibles.map((svc) => {
            const active = lineas.includes(svc)
            const color = SERVICIO_COLORS[svc] ?? '#8899b4'
            return (
              <button
                key={svc}
                type="button"
                onClick={() => toggleLinea(svc)}
                className="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
                style={{
                  background: active ? color + '15' : 'transparent',
                  borderColor: active ? color : '#1e3050',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0 transition-all"
                  style={{ background: active ? color : '#1e3050' }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: active ? '#e8edf5' : '#8899b4' }}
                >
                  {svc}
                </span>
              </button>
            )
          })}
        </div>

        {lineas.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted">
              {lineas.length} línea{lineas.length > 1 ? 's' : ''} seleccionada{lineas.length > 1 ? 's' : ''}:{' '}
              <span style={{ color: '#e8edf5' }}>{lineas.join(', ')}</span>
            </p>
          </div>
        )}

        {lineas.length === 0 && (
          <p className="mt-5 pt-4 border-t border-border text-xs text-muted">
            Debes seleccionar al menos una línea para continuar.
          </p>
        )}
      </div>

      {/* Selector de tarifa por línea */}
      {lineas.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-condensed text-xs uppercase text-muted tracking-wider">
            Fuente de tarifas por línea
          </h2>
          <p className="text-muted text-sm">
            Elige si usar la tarifa de la biblioteca estándar o una tarifa especial
            negociada para cada línea.
          </p>

          {lineas.map((svc) => {
            const color = SERVICIO_COLORS[svc] ?? '#8899b4'
            const tipo = tarifa_tipo[svc] ?? 'biblioteca'
            const especiales = tarifasEspeciales.filter((t) => t.servicio === svc)

            return (
              <div
                key={svc}
                className="rounded-lg border p-4 space-y-3"
                style={{ borderColor: color + '44' }}
              >
                {/* Nombre de línea */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span
                    className="font-condensed font-bold text-xs uppercase tracking-wider"
                    style={{ color }}
                  >
                    {svc}
                  </span>
                </div>

                {/* Toggle biblioteca / especial */}
                <div className="flex gap-2">
                  {(['biblioteca', 'especial'] as const).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setTarifaTipo(svc, op)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize"
                      style={{
                        background: tipo === op ? color + '25' : 'transparent',
                        borderColor: tipo === op ? color : '#1e3050',
                        color: tipo === op ? '#e8edf5' : '#8899b4',
                      }}
                    >
                      {op === 'biblioteca' ? 'Biblioteca estándar' : 'Tarifa especial'}
                    </button>
                  ))}
                </div>

                {/* Dropdown de tarifas especiales */}
                {tipo === 'especial' && (
                  <div>
                    {especiales.length === 0 ? (
                      <p className="text-xs text-muted">
                        No hay tarifas especiales registradas para {svc}.
                      </p>
                    ) : (
                      <select
                        className="w-full text-xs"
                        value={tarifa_especial_id[svc] ?? ''}
                        onChange={(e) => setTarifaEspecialId(svc, e.target.value)}
                      >
                        <option value="">— Seleccionar tarifa especial —</option>
                        {especiales.map((te) => (
                          <option key={te.id} value={te.id}>
                            {te.nombre}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
