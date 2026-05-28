import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSacContactos, updateSacFotos } from '../api/sac'
import { toast } from '../store/toastStore'

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function diasParaCumpleanos(cumpleanos: string | null | undefined): number | null {
  if (!cumpleanos) return null
  const hoy = new Date()
  const [, mes, dia] = cumpleanos.split('-').map(Number)
  const proximo = new Date(hoy.getFullYear(), mes - 1, dia)
  if (proximo < hoy) proximo.setFullYear(hoy.getFullYear() + 1)
  return Math.ceil((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

export default function SAC() {
  const qc = useQueryClient()
  const mesActual = new Date().getMonth() + 1
  const [mes, setMes] = useState(mesActual)
  const [search, setSearch] = useState('')

  const { data: contactos = [], isLoading } = useQuery({
    queryKey: ['sac', mes],
    queryFn: () => getSacContactos(mes),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fdaEntregado?: boolean } }) =>
      updateSacFotos(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sac'] })
      toast.success('Registro actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const filtered = contactos.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.empresa.toLowerCase().includes(q) ||
      c.comercial?.toLowerCase().includes(q)
    )
  })

  const conRegalos    = filtered.filter((c) => c.recibeRegalos)
  const sinRegalos    = filtered.filter((c) => !c.recibeRegalos)
  const fdaEntregados = conRegalos.filter((c) => c.fdaEntregado).length

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SAC — Seguimiento a Contactos</h1>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length} contactos con cumpleaños en {MESES[mes - 1]}
            {conRegalos.length > 0 && (
              <> · <span className="text-gold font-semibold">🎁 {conRegalos.length} reciben regalos</span>
              {fdaEntregados > 0 && <span className="text-success ml-2">· {fdaEntregados} FDA entregado</span>}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          className="filter-input flex-1 min-w-48"
          placeholder="Buscar contacto, empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
          {MESES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Alerta FDA pendiente */}
      {conRegalos.filter((c) => !c.fdaEntregado).length > 0 && (
        <div className="rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm">
          <span className="text-gold font-semibold">⚠ FDA pendiente:</span>{' '}
          <span className="text-muted">
            {conRegalos.filter((c) => !c.fdaEntregado).map((c) => c.nombre).slice(0, 4).join(', ')}
            {conRegalos.filter((c) => !c.fdaEntregado).length > 4 &&
              ` y ${conRegalos.filter((c) => !c.fdaEntregado).length - 4} más`}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface2 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="text-5xl mb-4">🎂</div>
          <p className="font-semibold text-foreground mb-1">Sin cumpleaños este mes</p>
          <p className="text-sm">Agrega fechas de cumpleaños en los contactos de cada registro.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Contactos que reciben regalos */}
          {conRegalos.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
                🎁 Reciben regalo ({conRegalos.length})
              </h3>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Contacto</th>
                      <th>Empresa</th>
                      <th>Comercial</th>
                      <th>Cumpleaños</th>
                      <th>Días</th>
                      <th>FDA</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {conRegalos.map((c) => {
                      const dias = diasParaCumpleanos(c.cumpleanos)
                      return (
                        <tr key={c.id} className={c.fdaEntregado ? 'opacity-50' : ''}>
                          <td>
                            <div className="font-semibold text-foreground">{c.nombre}</div>
                            {c.cargo && <div className="text-xs text-muted">{c.cargo}</div>}
                          </td>
                          <td className="text-sm text-foreground">{c.empresa}</td>
                          <td className="text-sm text-muted">{c.comercial}</td>
                          <td className="font-mono text-sm text-foreground">
                            {c.cumpleanos ? c.cumpleanos.slice(5) : '—'}
                          </td>
                          <td>
                            {dias !== null && (
                              <span className={`text-sm font-bold ${
                                dias <= 7 ? 'text-danger' : dias <= 30 ? 'text-gold' : 'text-muted'
                              }`}>
                                {dias === 0 ? '🎂 Hoy!' : `${dias}d`}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={c.fdaEntregado ? 'badge-green' : 'badge-gray'}>
                              {c.fdaEntregado ? 'Entregado' : 'Pendiente'}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className={`btn-sm px-2 py-1 text-xs ${c.fdaEntregado ? 'btn-secondary' : 'btn-primary'}`}
                              disabled={updateMut.isPending}
                              onClick={() => updateMut.mutate({ id: c.id, data: { fdaEntregado: !c.fdaEntregado } })}
                            >
                              {c.fdaEntregado ? 'Desmarcar' : 'Marcar FDA'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resto de contactos */}
          {sinRegalos.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
                Otros cumpleaños ({sinRegalos.length})
              </h3>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>Contacto</th>
                      <th>Empresa</th>
                      <th>Comercial</th>
                      <th>Cumpleaños</th>
                      <th>Días</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sinRegalos.map((c) => {
                      const dias = diasParaCumpleanos(c.cumpleanos)
                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="font-semibold text-foreground">{c.nombre}</div>
                            {c.cargo && <div className="text-xs text-muted">{c.cargo}</div>}
                          </td>
                          <td className="text-sm text-foreground">{c.empresa}</td>
                          <td className="text-sm text-muted">{c.comercial}</td>
                          <td className="font-mono text-sm text-foreground">
                            {c.cumpleanos ? c.cumpleanos.slice(5) : '—'}
                          </td>
                          <td>
                            {dias !== null && (
                              <span className={`text-sm font-bold ${
                                dias <= 7 ? 'text-danger' : dias <= 30 ? 'text-gold' : 'text-muted'
                              }`}>
                                {dias === 0 ? '🎂 Hoy!' : `${dias}d`}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
