import { useCotWizardStore } from '../../store/cotWizardStore'
import { SERVICIOS, SERVICIO_COLORS } from '../../types'

export default function Paso2() {
  const lineas = useCotWizardStore((s) => s.lineas)
  const toggleLinea = useCotWizardStore((s) => s.toggleLinea)

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-condensed text-xs uppercase text-muted tracking-wider mb-2">
        Seleccionar líneas de servicio
      </h2>
      <p className="text-muted text-sm mb-6">
        Selecciona los servicios que incluirá esta cotización. Solo las líneas seleccionadas
        aparecerán en el Paso 3 para configurar sus ítems.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICIOS.map((svc) => {
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
  )
}
