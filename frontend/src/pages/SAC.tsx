import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSacContactos, getSacFda, updateSacFotos, updateSacContacto } from '../api/sac'
import { toast } from '../store/toastStore'
import type { ContactoSAC } from '../types'

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const CAT_COLOR: Record<string, string> = { A: '#f5a623', B: '#00c2ff', C: '#8899b4' }

function diasParaCumpleanos(cumpleanos: string | null | undefined): number | null {
  if (!cumpleanos) return null
  const hoy = new Date()
  const [, mes, dia] = cumpleanos.split('-').map(Number)
  const proximo = new Date(hoy.getFullYear(), mes - 1, dia)
  if (proximo < hoy) proximo.setFullYear(hoy.getFullYear() + 1)
  return Math.ceil((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function exportSacExcel(contactos: ContactoSAC[], nombre: string) {
  const rows = contactos.map((c) => ({
    Nombre:      c.nombre,
    Cargo:       c.cargo ?? '',
    Email:       c.email ?? '',
    Teléfono:    c.telefono ?? '',
    Empresa:     c.empresa,
    Categoría:   c.categoria ?? '',
    Comercial:   c.comercial,
    Cumpleaños:  c.cumpleanos ?? '',
    'Recibe regalo': c.recibeRegalos ? 'Sí' : 'No',
    'FDA Entregado': c.fdaEntregado ? 'Sí' : 'No',
  }))
  const header = Object.keys(rows[0] ?? {})
  const csv = [header.join(','), ...rows.map((r) =>
    header.map((h) => `"${String((r as Record<string,string>)[h] ?? '').replace(/"/g,'""')}"`).join(',')
  )].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nombre
  a.click()
}

// ─── Modal editar contacto ────────────────────────────────────────────────────

function EditModal({
  contacto,
  onClose,
  onSaved,
}: {
  contacto: ContactoSAC
  onClose: () => void
  onSaved: () => void
}) {
  const [cargo,     setCargo]     = useState(contacto.cargo     ?? '')
  const [telefono,  setTelefono]  = useState(contacto.telefono  ?? '')
  const [email,     setEmail]     = useState(contacto.email     ?? '')
  const [direccion, setDireccion] = useState(contacto.direccion ?? '')
  const [fotos,     setFotos]     = useState<string[]>(contacto.fotosEntrega ?? [])

  const datosMut = useMutation({
    mutationFn: () => updateSacContacto(contacto.id, { cargo, telefono, email, direccion }),
    onSuccess: () => { toast.success('Contacto actualizado'); onSaved(); onClose() },
    onError:   () => toast.error('Error al guardar'),
  })

  const fotosMut = useMutation({
    mutationFn: (nuevasFotos: string[]) => updateSacFotos(contacto.id, { fotos: nuevasFotos }),
    onSuccess: (_data, nuevasFotos) => { setFotos(nuevasFotos); toast.success('Fotos actualizadas') },
    onError:   () => toast.error('Error al actualizar fotos'),
  })

  function handleAgregarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const readers = files.map(
      (f) =>
        new Promise<string>((res) => {
          const r = new FileReader()
          r.onload = () => res(r.result as string)
          r.readAsDataURL(f)
        })
    )
    Promise.all(readers).then((b64s) => {
      const nuevasFotos = [...fotos, ...b64s]
      fotosMut.mutate(nuevasFotos)
    })
    e.target.value = ''
  }

  function handleEliminarFoto(idx: number) {
    const nuevasFotos = fotos.filter((_, i) => i !== idx)
    fotosMut.mutate(nuevasFotos)
  }

  const tipoLabel = contacto.tipoCliente === 'referido' ? 'Referido' : contacto.tipoCliente === 'directo' ? 'Directo' : '—'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground text-lg">👤 {contacto.nombre}</h3>
            <p className="text-sm text-muted mt-0.5">{contacto.empresa}</p>
          </div>
          <button className="text-muted hover:text-foreground text-xl" onClick={onClose}>×</button>
        </div>

        {/* Info empresa (solo lectura) */}
        <div className="rounded-lg border border-border bg-surface2 p-4 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-muted mb-0.5">📋 Empresa</div><div className="font-semibold text-foreground">{contacto.empresa}</div></div>
          <div><div className="text-xs text-muted mb-0.5">Tipo</div><div className="text-foreground">{tipoLabel}</div></div>
          <div><div className="text-xs text-muted mb-0.5">Comercial</div><div className="text-foreground">{contacto.comercial}</div></div>
          <div><div className="text-xs text-muted mb-0.5">Cumpleaños</div><div className="text-gold font-semibold">{contacto.cumpleanos?.slice(5) ?? '—'}</div></div>
        </div>

        {/* Campos editables */}
        <div>
          <p className="text-xs text-accent font-bold uppercase tracking-widest mb-3">✏️ Datos editables</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted uppercase tracking-widest">Cargo</label>
              <input className="input w-full" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Cargo..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted uppercase tracking-widest">Teléfono</label>
              <input className="input w-full" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono..." />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted uppercase tracking-widest">Correo electrónico</label>
              <input className="input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@empresa.com" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted uppercase tracking-widest">Dirección</label>
              <input className="input w-full" value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección..." />
            </div>
          </div>
        </div>

        {/* Fotos de entrega */}
        <div>
          <p className="text-xs text-gold font-bold uppercase tracking-widest mb-3">📸 Foto de entrega de regalo</p>
          {fotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {fotos.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`foto-${i}`} className="w-20 h-20 object-cover rounded-lg border border-border" />
                  <button
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                    onClick={() => handleEliminarFoto(i)}
                    disabled={fotosMut.isPending}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 bg-surface2 border border-dashed border-border rounded-lg px-4 py-2.5 cursor-pointer text-sm text-muted hover:border-accent transition-colors">
            <span>📷</span> Subir foto de entrega
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleAgregarFotos} disabled={fotosMut.isPending} />
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn-primary btn-sm" disabled={datosMut.isPending} onClick={() => datosMut.mutate()}>
            {datosMut.isPending ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SAC() {
  const qc = useQueryClient()
  const mesActual = new Date().getMonth() + 1
  const [mes,         setMes]         = useState(mesActual)
  const [search,      setSearch]      = useState('')
  const [fdaCat,      setFdaCat]      = useState('')
  const [fdaSearch,   setFdaSearch]   = useState('')
  const [editContacto, setEditContacto] = useState<ContactoSAC | null>(null)

  // ── Cumpleaños del mes ──────────────────────────────────────────────────────
  const { data: contactos = [], isLoading } = useQuery({
    queryKey: ['sac', mes],
    queryFn: () => getSacContactos(mes),
  })

  // ── FDA — todos los que reciben regalo ──────────────────────────────────────
  const { data: fdaTodos = [] } = useQuery({
    queryKey: ['sac-fda'],
    queryFn: getSacFda,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fdaEntregado?: boolean } }) =>
      updateSacFotos(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sac'] })
      qc.invalidateQueries({ queryKey: ['sac-fda'] })
      toast.success('Registro actualizado')
    },
    onError: () => toast.error('Error al actualizar'),
  })

  // ── Cumpleaños filtrados ────────────────────────────────────────────────────
  const filtered = contactos.filter((c) => {
    const q = search.toLowerCase()
    return c.nombre.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q) || c.comercial?.toLowerCase().includes(q)
  })
  const conRegalos  = filtered.filter((c) => c.recibeRegalos)
  const sinRegalos  = filtered.filter((c) => !c.recibeRegalos)
  const fdaEntregados = conRegalos.filter((c) => c.fdaEntregado).length

  // ── FDA filtrado ────────────────────────────────────────────────────────────
  const fdaFiltrado = fdaTodos.filter((c) => {
    const matchCat  = !fdaCat    || c.categoria === fdaCat
    const q = fdaSearch.toLowerCase()
    const matchQ = !q || c.nombre.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q)
    return matchCat && matchQ
  })
  const fdaEntregadosTotal  = fdaTodos.filter((c) => c.fdaEntregado).length
  const fdaPendientesTotal  = fdaTodos.filter((c) => !c.fdaEntregado).length

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title" style={{ marginBottom: 0 }}>SAC — Servicio al Cliente</h2>
          <p className="text-sm text-muted mt-0.5">
            {filtered.length} contactos con cumpleaños en {MESES[mes - 1]}
            {conRegalos.length > 0 && (
              <> · <span className="text-gold font-semibold">🎁 {conRegalos.length} reciben regalos</span>
              {fdaEntregados > 0 && <span className="text-success ml-2">· {fdaEntregados} FDA entregado</span>}
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="filter-select" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <button
            className="btn-secondary btn-sm"
            onClick={() => exportSacExcel(filtered, `sac-cumpleanos-${MESES[mes-1].toLowerCase()}.csv`)}
            disabled={filtered.length === 0}
          >
            📥 Descargar reporte
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="crm-kpi-strip">
        {[
          { label: 'Total cumpleaños', value: filtered.length,                    color: 'var(--accent)' },
          { label: 'Reciben regalo',   value: conRegalos.length,                  color: 'var(--gold)'   },
          { label: 'FDA entregados',   value: fdaEntregados,                      color: 'var(--green)'  },
          { label: 'FDA pendientes',   value: conRegalos.length - fdaEntregados,  color: 'var(--red)'    },
        ].map((k) => (
          <div key={k.label} className="crm-kpi-cell" style={{ borderTopColor: k.color }}>
            <div className="crm-kpi-label">{k.label}</div>
            <div className="crm-kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filtro búsqueda */}
      <input
        className="filter-input w-full"
        placeholder="Buscar contacto, empresa..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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

      {/* ── Cumpleaños del mes ──────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-gold uppercase tracking-widest mb-3">🎂 Cumpleaños del mes</h2>

        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-surface2 rounded-xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-3">🎂</div>
            <p className="font-semibold text-foreground mb-1">Sin cumpleaños este mes</p>
            <p className="text-sm">Agrega fechas de cumpleaños en los contactos de cada registro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conRegalos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">🎁 Reciben regalo ({conRegalos.length})</h3>
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
                              <button className="font-semibold text-foreground hover:text-accent transition-colors text-left" onClick={() => setEditContacto(c)}>
                                {c.nombre}
                              </button>
                              {c.cargo && <div className="text-xs text-muted">{c.cargo}</div>}
                            </td>
                            <td className="text-sm">{c.empresa}</td>
                            <td className="text-sm text-muted">{c.comercial}</td>
                            <td className="font-mono text-sm">{c.cumpleanos ? c.cumpleanos.slice(5) : '—'}</td>
                            <td>
                              {dias !== null && (
                                <span className={`text-sm font-bold ${dias <= 7 ? 'text-danger' : dias <= 30 ? 'text-gold' : 'text-muted'}`}>
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

            {sinRegalos.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Otros cumpleaños ({sinRegalos.length})</h3>
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
                            <td className="text-sm">{c.empresa}</td>
                            <td className="text-sm text-muted">{c.comercial}</td>
                            <td className="font-mono text-sm">{c.cumpleanos ? c.cumpleanos.slice(5) : '—'}</td>
                            <td>
                              {dias !== null && (
                                <span className={`text-sm font-bold ${dias <= 7 ? 'text-danger' : dias <= 30 ? 'text-gold' : 'text-muted'}`}>
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

      {/* ── Control de Detalles Fin de Año ─────────────────────────────────── */}
      <div className="space-y-4">
        {/* Header FDA */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xs font-bold text-accent uppercase tracking-widest">🎄 Control de Detalles Fin de Año</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              className="filter-input w-48"
              placeholder="Buscar empresa o contacto..."
              value={fdaSearch}
              onChange={(e) => setFdaSearch(e.target.value)}
            />
            <select className="filter-select" value={fdaCat} onChange={(e) => setFdaCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              <option value="A">🏆 Categoría A</option>
              <option value="B">🥈 Categoría B</option>
              <option value="C">🥉 Categoría C</option>
            </select>
            <button
              className="btn-secondary btn-sm"
              onClick={() => exportSacExcel(fdaFiltrado, 'sac-fin-de-ano.csv')}
              disabled={fdaFiltrado.length === 0}
            >
              📥 Reporte Excel
            </button>
          </div>
        </div>

        {/* KPIs FDA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total reciben regalo', value: fdaTodos.length,       color: '#f5a623' },
            { label: 'Categoría A',          value: fdaTodos.filter((c) => c.categoria === 'A').length, color: '#f5a623' },
            { label: 'FDA entregados',        value: fdaEntregadosTotal,    color: '#00e676' },
            { label: 'FDA pendientes',        value: fdaPendientesTotal,    color: '#f87171' },
          ].map((k) => (
            <div key={k.label} className="card p-4">
              <div className="text-xs text-muted uppercase tracking-widest mb-1">{k.label}</div>
              <div className="font-bold text-3xl" style={{ color: k.color, fontFamily: "'Barlow Condensed', sans-serif" }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabla FDA */}
        {fdaFiltrado.length === 0 ? (
          <div className="empty-state">
            <p className="text-sm text-muted">Sin contactos con regalos{fdaCat ? ` en categoría ${fdaCat}` : ''}.</p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Empresa</th>
                  <th>Cat.</th>
                  <th>Comercial</th>
                  <th>Cumpleaños</th>
                  <th>FDA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fdaFiltrado.map((c) => (
                  <tr key={c.id} className={c.fdaEntregado ? 'opacity-50' : ''}>
                    <td>
                      <button className="font-semibold text-foreground hover:text-accent transition-colors text-left" onClick={() => setEditContacto(c)}>
                        {c.nombre}
                      </button>
                      {c.cargo && <div className="text-xs text-muted">{c.cargo}</div>}
                    </td>
                    <td className="text-sm">{c.empresa}</td>
                    <td>
                      {c.categoria ? (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: `${CAT_COLOR[c.categoria]}20`, color: CAT_COLOR[c.categoria] }}>
                          {c.categoria}
                        </span>
                      ) : <span className="text-muted text-xs">—</span>}
                    </td>
                    <td className="text-sm text-muted">{c.comercial}</td>
                    <td className="font-mono text-sm">{c.cumpleanos ? c.cumpleanos.slice(5) : '—'}</td>
                    <td>
                      <span className={c.fdaEntregado ? 'badge-green' : 'badge-gray'}>
                        {c.fdaEntregado ? 'Entregado' : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn-sm px-2 py-1 text-xs ${c.fdaEntregado ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={updateMut.isPending}
                        onClick={() => updateMut.mutate({ id: c.id, data: { fdaEntregado: !c.fdaEntregado } })}
                      >
                        {c.fdaEntregado ? 'Desmarcar' : 'Marcar FDA'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal editar contacto */}
      {editContacto && (
        <EditModal
          contacto={editContacto}
          onClose={() => setEditContacto(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['sac'] })
            qc.invalidateQueries({ queryKey: ['sac-fda'] })
          }}
        />
      )}
    </div>
  )
}
