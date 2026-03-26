import { useCotWizardStore } from '../../store/cotWizardStore'
import { SERVICIO_COLORS } from '../../types'
import type { BibliotecaLinea } from '../../types'

interface Props {
  biblioteca: BibliotecaLinea[]
}

export default function Paso3({ biblioteca }: Props) {
  const lineas = useCotWizardStore((s) => s.lineas)
  const items = useCotWizardStore((s) => s.items)
  const toggleGrupo = useCotWizardStore((s) => s.toggleGrupo)
  const toggleItem = useCotWizardStore((s) => s.toggleItem)
  const updateItemField = useCotWizardStore((s) => s.updateItemField)
  const updateItemExtraCol = useCotWizardStore((s) => s.updateItemExtraCol)

  const bibMap = new Map(biblioteca.map((l) => [l.nombre, l]))

  if (lineas.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted">
        No hay líneas seleccionadas. Vuelve al Paso 2.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-muted text-sm">
        Selecciona los ítems que incluirás y edita sus valores si es necesario.
        Editar aquí <strong className="text-white">no modifica la biblioteca</strong> — solo esta cotización.
      </p>

      {lineas.map((svc) => {
        const color = SERVICIO_COLORS[svc] ?? '#8899b4'
        const gruposMap = items[svc] ?? {}
        const linea = bibMap.get(svc)
        const extraCols = linea?.columnas ?? []

        return (
          <div key={svc} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Header de línea */}
            <div
              className="px-5 py-3 flex items-center gap-3"
              style={{ background: color + '18', borderBottom: `2px solid ${color}44` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="font-condensed font-bold text-sm tracking-wider uppercase" style={{ color }}>
                {svc}
              </span>
              <span className="text-xs text-muted ml-auto">
                {Object.values(gruposMap).reduce(
                  (acc, g) => acc + g.items.filter((i) => i.sel).length,
                  0
                )}{' '}
                ítems seleccionados
              </span>
            </div>

            {/* Grupos */}
            <div className="divide-y divide-border">
              {Object.entries(gruposMap).map(([gid, grupo]) => (
                <div key={gid}>
                  {/* Fila de grupo */}
                  <div className="px-4 py-2.5 flex items-center gap-3 bg-surface2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-purple-500"
                      checked={grupo.sel}
                      onChange={(e) => toggleGrupo(svc, gid, e.target.checked)}
                    />
                    <span className="font-condensed font-bold text-sm uppercase tracking-wider text-muted">
                      {grupo.nombre}
                    </span>
                    <span className="text-xs text-muted ml-auto">
                      {grupo.items.filter((i) => i.sel).length}/{grupo.items.length}
                    </span>
                  </div>

                  {/* Ítems */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="w-8 px-4 py-2" />
                          <th className="text-left px-3 py-2 text-muted font-condensed uppercase tracking-wider min-w-[180px]">
                            Nombre
                          </th>
                          <th className="text-left px-3 py-2 text-muted font-condensed uppercase tracking-wider w-28">
                            Tarifa
                          </th>
                          <th className="text-left px-3 py-2 text-muted font-condensed uppercase tracking-wider w-28">
                            Tipo
                          </th>
                          <th className="text-left px-3 py-2 text-muted font-condensed uppercase tracking-wider min-w-[160px]">
                            Observación
                          </th>
                          {extraCols.map((col) => (
                            <th
                              key={col.id}
                              className="text-left px-3 py-2 text-muted font-condensed uppercase tracking-wider w-28"
                            >
                              {col.nombre}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border last:border-0 transition"
                            style={{ background: item.sel ? color + '08' : 'transparent' }}
                          >
                            <td className="px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                style={{ accentColor: color }}
                                checked={item.sel}
                                onChange={(e) => toggleItem(svc, gid, idx, e.target.checked)}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                className="text-xs py-1"
                                value={item.nombre}
                                onChange={(e) =>
                                  updateItemField(svc, gid, idx, 'nombre', e.target.value)
                                }
                                disabled={!item.sel}
                                style={{ opacity: item.sel ? 1 : 0.4 }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                className="text-xs py-1"
                                value={item.tarifa}
                                onChange={(e) =>
                                  updateItemField(svc, gid, idx, 'tarifa', e.target.value)
                                }
                                disabled={!item.sel}
                                style={{ opacity: item.sel ? 1 : 0.4 }}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <select
                                className="text-xs py-1"
                                value={item.tipo_tarifa}
                                onChange={(e) =>
                                  updateItemField(
                                    svc,
                                    gid,
                                    idx,
                                    'tipo_tarifa',
                                    e.target.value
                                  )
                                }
                                disabled={!item.sel}
                                style={{ opacity: item.sel ? 1 : 0.4 }}
                              >
                                <option value="moneda">$</option>
                                <option value="porcentaje">%</option>
                              </select>
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                className="text-xs py-1"
                                value={item.obs}
                                onChange={(e) =>
                                  updateItemField(svc, gid, idx, 'obs', e.target.value)
                                }
                                placeholder="—"
                                disabled={!item.sel}
                                style={{ opacity: item.sel ? 1 : 0.4 }}
                              />
                            </td>
                            {extraCols.map((col) => (
                              <td key={col.id} className="px-3 py-1.5">
                                <input
                                  className="text-xs py-1"
                                  value={item.extra_cols[col.id] ?? ''}
                                  onChange={(e) =>
                                    updateItemExtraCol(svc, gid, idx, col.id, e.target.value)
                                  }
                                  placeholder="—"
                                  disabled={!item.sel}
                                  style={{ opacity: item.sel ? 1 : 0.4 }}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {Object.keys(gruposMap).length === 0 && (
                <div className="px-5 py-4 text-muted text-sm">
                  Sin grupos configurados para esta línea.
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
