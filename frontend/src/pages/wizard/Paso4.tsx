import { useCotWizardStore } from '../../store/cotWizardStore'
import { SERVICIO_COLORS } from '../../types'
import type { BibliotecaLinea } from '../../types'

interface Props {
  biblioteca: BibliotecaLinea[]
}

export default function Paso4({ biblioteca }: Props) {
  const lineas = useCotWizardStore((s) => s.lineas)
  const obs_plantillas = useCotWizardStore((s) => s.obs_plantillas)
  const obs_libre = useCotWizardStore((s) => s.obs_libre)
  const toggleObsPlantilla = useCotWizardStore((s) => s.toggleObsPlantilla)
  const setObsLibre = useCotWizardStore((s) => s.setObsLibre)

  const bibMap = new Map(biblioteca.map((l) => [l.nombre, l]))

  return (
    <div className="space-y-5">
      <p className="text-muted text-sm">
        Selecciona las plantillas de observaciones que se incluirán al final de la cotización.
      </p>

      {lineas.map((svc) => {
        const color = SERVICIO_COLORS[svc] ?? '#8899b4'
        const linea = bibMap.get(svc)
        const observaciones = linea?.observaciones ?? []
        const sel = obs_plantillas[svc] ?? []

        if (observaciones.length === 0) return null

        return (
          <div key={svc} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: color + '18', borderBottom: `2px solid ${color}44` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="font-condensed font-bold text-sm tracking-wider uppercase" style={{ color }}>
                {svc}
              </span>
              <span className="text-xs text-muted ml-auto">
                {sel.length} seleccionada{sel.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Plantillas */}
            <div className="divide-y divide-border">
              {observaciones.map((obs) => {
                const isSelected = sel.includes(obs.id)
                return (
                  <label
                    key={obs.id}
                    className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-surface2 transition"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 shrink-0"
                      style={{ accentColor: color }}
                      checked={isSelected}
                      onChange={() => toggleObsPlantilla(svc, obs.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: isSelected ? '#e8edf5' : '#8899b4' }}
                      >
                        {obs.nombre}
                      </p>
                      {isSelected && (
                        <div
                          className="text-xs text-muted leading-relaxed line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: obs.html }}
                        />
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Observaciones libres */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <label className="block text-xs text-muted mb-2 uppercase tracking-wider font-condensed">
          Observaciones adicionales (texto libre)
        </label>
        <textarea
          className="h-28 resize-none"
          placeholder="Escribe condiciones adicionales, notas especiales, etc."
          value={obs_libre}
          onChange={(e) => setObsLibre(e.target.value)}
        />
        <p className="text-xs text-muted mt-1">
          Se agregará al final de la cotización como un bloque separado.
        </p>
      </div>

      {lineas.every((svc) => (bibMap.get(svc)?.observaciones ?? []).length === 0) && (
        <div className="bg-surface border border-border rounded-xl p-5 text-center text-muted text-sm">
          Las líneas seleccionadas no tienen plantillas de observaciones configuradas en la biblioteca.
          Puedes usar el campo de texto libre de abajo.
        </div>
      )}
    </div>
  )
}
