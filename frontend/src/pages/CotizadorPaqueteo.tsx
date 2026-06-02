import { useState } from 'react'

// ─── Datos Colombia ───────────────────────────────────────────────────────────

const COL_DEPTS: Record<string, string[]> = {
  'Amazonas': ['Leticia','Puerto Nariño'],
  'Antioquia': ['Medellín','Bello','Itagüí','Envigado','Rionegro','Apartadó','Turbo','Caucasia','Caldas','La Estrella','Copacabana','Girardota','Barbosa','Sabaneta','Marinilla','El Carmen de Viboral','Santa Fe de Antioquia','Andes','Yarumal','Valdivia'],
  'Arauca': ['Arauca','Saravena','Tame','Arauquita'],
  'Atlántico': ['Barranquilla','Soledad','Malambo','Sabanalarga','Galapa','Baranoa','Puerto Colombia'],
  'Bogotá D.C.': ['Bogotá'],
  'Bolívar': ['Cartagena','Magangué','El Carmen de Bolívar','Mompox','Turbaco'],
  'Boyacá': ['Tunja','Duitama','Sogamoso','Chiquinquirá','Moniquirá','Villa de Leyva','Paipa'],
  'Caldas': ['Manizales','La Dorada','Chinchiná','Villamaría','Riosucio','Anserma','Aguadas'],
  'Caquetá': ['Florencia','San Vicente del Caguán','Puerto Rico'],
  'Casanare': ['Yopal','Aguazul','Villanueva','Tauramena'],
  'Cauca': ['Popayán','Santander de Quilichao','Puerto Tejada','Patía'],
  'Cesar': ['Valledupar','Aguachica','Codazzi','Bosconia'],
  'Chocó': ['Quibdó','Istmina','Tadó'],
  'Córdoba': ['Montería','Cereté','Lorica','Sahagún','Montelíbano'],
  'Cundinamarca': ['Soacha','Zipaquirá','Facatativá','Chía','Mosquera','Madrid','Funza','Fusagasugá','Girardot','Tocancipá','Cajicá','Sopó','La Calera','Sibaté','Gachancipá'],
  'Guainía': ['Inírida'],
  'Guaviare': ['San José del Guaviare'],
  'Huila': ['Neiva','Pitalito','Garzón','La Plata'],
  'La Guajira': ['Riohacha','Maicao','Uribia','Manaure'],
  'Magdalena': ['Santa Marta','Ciénaga','Fundación','El Banco'],
  'Meta': ['Villavicencio','Acacías','Granada','Puerto López'],
  'Nariño': ['Pasto','Tumaco','Ipiales','Túquerres'],
  'Norte de Santander': ['Cúcuta','Villa del Rosario','Los Patios','Ocaña','Pamplona'],
  'Putumayo': ['Mocoa','Puerto Asís','Orito'],
  'Quindío': ['Armenia','Calarcá','Circasia','Montenegro','La Tebaida'],
  'Risaralda': ['Pereira','Dosquebradas','Santa Rosa de Cabal','La Virginia'],
  'San Andrés': ['San Andrés','Providencia'],
  'Santander': ['Bucaramanga','Floridablanca','Girón','Piedecuesta','Barrancabermeja','Socorro','San Gil','Vélez'],
  'Sucre': ['Sincelejo','Corozal','Sampués','Tolú'],
  'Tolima': ['Ibagué','Espinal','Honda','Melgar','Chaparral'],
  'Valle del Cauca': ['Cali','Palmira','Buenaventura','Buga','Tuluá','Cartago','Yumbo','Jamundí','Candelaria'],
  'Vaupés': ['Mitú'],
  'Vichada': ['Puerto Carreño'],
}

const DEPTS = Object.keys(COL_DEPTS).sort()

// ─── Tarifas couriers ─────────────────────────────────────────────────────────

interface CourierDef {
  nombre: string
  servicio: string
  color: string
  tiempos: Record<number, number>
  tarifas: Record<number, { base: number; extraKg: number; minKg: number }>
  seguro: number
}

const COURIERS: CourierDef[] = [
  {
    nombre: 'Coordinadora',
    servicio: 'Servicio E-Commerce',
    color: '#e8001c',
    tiempos: { 1: 1, 2: 2, 3: 3 },
    tarifas: {
      1: { base: 8500,  extraKg: 1800, minKg: 1 },
      2: { base: 11000, extraKg: 2200, minKg: 1 },
      3: { base: 14500, extraKg: 2800, minKg: 1 },
    },
    seguro: 0.003,
  },
  {
    nombre: 'TCC',
    servicio: 'Paquetería',
    color: '#005baa',
    tiempos: { 1: 2, 2: 2, 3: 4 },
    tarifas: {
      1: { base: 14000, extraKg: 2500, minKg: 1 },
      2: { base: 17500, extraKg: 3200, minKg: 1 },
      3: { base: 22000, extraKg: 4000, minKg: 1 },
    },
    seguro: 0.005,
  },
  {
    nombre: 'Servientrega',
    servicio: 'Entrega Express',
    color: '#f7941d',
    tiempos: { 1: 1, 2: 2, 3: 3 },
    tarifas: {
      1: { base: 10500, extraKg: 2000, minKg: 1 },
      2: { base: 13000, extraKg: 2600, minKg: 1 },
      3: { base: 16500, extraKg: 3200, minKg: 1 },
    },
    seguro: 0.004,
  },
]

const ZONA1 = ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Manizales','Cúcuta','Ibagué']
const ZONA2 = ['Villavicencio','Neiva','Pasto','Santa Marta','Valledupar','Montería','Sincelejo','Armenia','Popayán','Florencia','Tunja','Yopal','Riohacha','Soledad','Bello','Itagüí','Envigado','Palmira','Buenaventura','Soacha','Zipaquirá','Dosquebradas','Floridablanca','Girón','Barrancabermeja']

function getZona(mun: string) {
  if (ZONA1.includes(mun)) return 1
  if (ZONA2.includes(mun)) return 2
  return 3
}

const SIZES = [
  { label: 'Pequeño (Ej. celular) — 20×15×10 cm',         value: '20x15x10|0.5',   desc: 'Ideal para celulares, accesorios, documentos' },
  { label: 'Mediano (Ej. zapatos) — 35×25×15 cm',         value: '35x25x15|2.63',  desc: 'Ideal para zapatos, libros, ropa' },
  { label: 'Grande (Ej. microondas) — 60×40×30 cm',       value: '60x40x30|8',     desc: 'Ideal para electrodomésticos pequeños, juguetes' },
  { label: 'Más Grande (Ej. lavadora) — 100×100×120 cm',  value: '100x100x120|25', desc: 'Ideal para electrodomésticos grandes, muebles' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resultado {
  courier: string
  servicio: string
  color: string
  tarifa: number
  pesoCobrable: string
  dias: number
  trayecto: 'LOCAL' | 'NACIONAL'
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CotizadorPaqueteo() {
  const [origenDep, setOrigenDep] = useState('')
  const [origenMun, setOrigenMun] = useState('')
  const [destinoDep, setDestinoDep] = useState('')
  const [destinoMun, setDestinoMun] = useState('')

  const [tab, setTab] = useState<'estandar' | 'custom'>('estandar')
  const [stdSize, setStdSize] = useState('')
  const [largo, setLargo] = useState('0')
  const [ancho, setAncho] = useState('0')
  const [alto, setAlto] = useState('0')
  const [peso, setPeso] = useState('0')
  const [valorDeclarado, setValorDeclarado] = useState('0')

  const [error, setError] = useState('')
  const [resultados, setResultados] = useState<Resultado[] | null>(null)

  // ── Info tamaño estándar seleccionado
  const stdInfo = stdSize
    ? SIZES.find((s) => s.value === stdSize)
    : null

  // ── Peso precargado al elegir tamaño estándar
  function onStdSize(val: string) {
    setStdSize(val)
    if (val) {
      const pesoStd = val.split('|')[1]
      setPeso(pesoStd)
    }
  }

  function calcular() {
    setError('')
    setResultados(null)

    if (!origenMun) { setError('Selecciona el municipio de origen'); return }
    if (!destinoMun) { setError('Selecciona el municipio de destino'); return }
    const pesoReal = parseFloat(peso) || 0
    if (pesoReal <= 0) { setError('Ingresa el peso del paquete'); return }

    // Peso volumétrico
    let pesoVol = 0
    if (tab === 'estandar' && stdSize) {
      const dims = stdSize.split('|')[0]
      const [l, a, h] = dims.split('x').map(Number)
      pesoVol = (l * a * h) / 5000
    } else if (tab === 'custom') {
      const l = parseFloat(largo) || 0
      const a = parseFloat(ancho) || 0
      const h = parseFloat(alto)  || 0
      pesoVol = (l * a * h) / 5000
    }

    const pesoCobrable = Math.max(pesoReal, pesoVol)
    const zona = getZona(destinoMun)
    const mismoMun = origenMun === destinoMun
    const valDec = parseFloat(valorDeclarado) || 0

    const res: Resultado[] = COURIERS.map((c) => {
      const t = c.tarifas[zona]
      const pesoExtra = Math.max(0, pesoCobrable - t.minKg)
      let tarifa = t.base + pesoExtra * t.extraKg
      if (valDec > 0) tarifa += valDec * c.seguro
      if (mismoMun) tarifa *= 0.7
      tarifa = Math.round(tarifa)
      const dias = mismoMun ? 1 : c.tiempos[zona]
      return {
        courier: c.nombre,
        servicio: c.servicio,
        color: c.color,
        tarifa,
        pesoCobrable: pesoCobrable.toFixed(2),
        dias,
        trayecto: (mismoMun ? 'LOCAL' : 'NACIONAL') as 'LOCAL' | 'NACIONAL',
      }
    }).sort((a, b) => a.tarifa - b.tarifa)

    setResultados(res)
    setTimeout(() => {
      document.getElementById('cot-resultados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const fmtCOP = (n: number) => new Intl.NumberFormat('es-CO').format(n)

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📦 Cotizador Paqueteo</h1>
          <p className="text-sm text-muted mt-0.5">Calcula el costo de tu envío con las principales paqueteras</p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--surface2)' }}>

        {/* Card header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'linear-gradient(135deg,#f5a623,#e8890a)' }}>
          <span className="text-xl">📦</span>
          <div>
            <div className="font-bold text-white text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
              Calculadora de Envíos
            </div>
            <div className="text-xs text-white/80">Complete los datos para obtener su cotización</div>
          </div>
        </div>

        <div className="p-7 space-y-6">

          {/* Origen */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-gold text-lg">📍</span>
              <span className="font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, letterSpacing: 1 }}>Origen</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Departamento</label>
                <select className="input w-full" value={origenDep} onChange={(e) => { setOrigenDep(e.target.value); setOrigenMun('') }}>
                  <option value="">Seleccione departamento</option>
                  {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Municipio</label>
                <select className="input w-full" value={origenMun} onChange={(e) => setOrigenMun(e.target.value)} disabled={!origenDep}>
                  <option value="">Seleccione municipio</option>
                  {(COL_DEPTS[origenDep] ?? []).sort().map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Destino */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-danger text-lg">📍</span>
              <span className="font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, letterSpacing: 1 }}>Destino</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Departamento</label>
                <select className="input w-full" value={destinoDep} onChange={(e) => { setDestinoDep(e.target.value); setDestinoMun('') }}>
                  <option value="">Seleccione departamento</option>
                  {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Municipio</label>
                <select className="input w-full" value={destinoMun} onChange={(e) => setDestinoMun(e.target.value)} disabled={!destinoDep}>
                  <option value="">Seleccione municipio</option>
                  {(COL_DEPTS[destinoDep] ?? []).sort().map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent text-lg">📦</span>
              <span className="font-bold text-foreground" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 17, letterSpacing: 1 }}>Dimensiones del Paquete</span>
            </div>

            {/* Tab toggle */}
            <div className="grid grid-cols-2 border border-border rounded-xl overflow-hidden mb-4">
              {(['estandar', 'custom'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="py-2.5 text-sm font-bold transition-all"
                  style={{
                    background: tab === t ? 'var(--gold)' : 'var(--surface3)',
                    color: tab === t ? '#000' : 'var(--muted)',
                  }}
                >
                  {t === 'estandar' ? 'Tamaño Estándar' : 'Dimensiones Personalizadas'}
                </button>
              ))}
            </div>

            {/* Panel estándar */}
            {tab === 'estandar' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted uppercase tracking-widest">Seleccione un tamaño</label>
                  <select className="input w-full" value={stdSize} onChange={(e) => onStdSize(e.target.value)}>
                    <option value="">Seleccione un tamaño estándar</option>
                    {SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                {stdInfo && (
                  <div className="rounded-lg px-4 py-2.5 text-xs text-muted border" style={{ background: 'rgba(245,166,35,0.08)', borderColor: 'rgba(245,166,35,0.25)' }}>
                    <strong className="text-foreground">Dimensiones:</strong> {stdInfo.value.split('|')[0].replace(/x/g,' × ')} cm<br />
                    {stdInfo.desc}
                  </div>
                )}
              </div>
            )}

            {/* Panel custom */}
            {tab === 'custom' && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: 'Largo (cm)',  val: largo,  set: setLargo },
                  { label: 'Ancho (cm)',  val: ancho,  set: setAncho },
                  { label: 'Alto (cm)',   val: alto,   set: setAlto  },
                ].map(({ label, val, set }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs text-muted uppercase tracking-widest">{label}</label>
                    <input type="number" min="0" className="input w-full" value={val} onChange={(e) => set(e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            {/* Peso y valor */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Peso (kg) *</label>
                <input type="number" min="0" step="0.01" className="input w-full" value={peso} onChange={(e) => setPeso(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted uppercase tracking-widest">Valor Declarado (COP)</label>
                <input type="number" min="0" className="input w-full" value={valorDeclarado} onChange={(e) => setValorDeclarado(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg px-4 py-2.5 text-sm text-danger border border-danger/30 bg-danger/5">
              ⚠ {error}
            </div>
          )}

          {/* Botón calcular */}
          <button
            onClick={calcular}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#f5a623,#e8890a)', color: '#000' }}
          >
            <span>📦</span> Calcular Cotización
          </button>

        </div>
      </div>

      {/* Resultados */}
      {resultados && (
        <div id="cot-resultados" className="rounded-2xl border border-border overflow-hidden" style={{ background: 'var(--surface2)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ background: 'linear-gradient(135deg,#f5a623,#e8890a)' }}>
            <span className="text-xl">📊</span>
            <div className="font-bold text-white text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1 }}>
              Resultados de Cotización
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="table-card">
              <table>
                <thead>
                  <tr>
                    <th>Courier</th>
                    <th>Servicio</th>
                    <th className="text-center">⏱ Tiempo</th>
                    <th className="text-right">$ Tarifa</th>
                    <th className="text-center">Kg-Courier</th>
                    <th className="text-center">Trayecto</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, i) => (
                    <tr key={r.courier} style={i === 0 ? { background: 'rgba(245,166,35,0.05)' } : undefined}>
                      <td>
                        <span className="font-bold text-sm" style={{ color: r.color }}>{r.courier}</span>
                        {i === 0 && (
                          <span className="ml-2 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--gold)', color: '#000' }}>
                            MEJOR PRECIO
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-muted">{r.servicio}</td>
                      <td className="text-sm text-foreground text-center">
                        {r.dias} {r.dias === 1 ? 'día' : 'días'}
                      </td>
                      <td className="text-right">
                        <span className="font-bold text-base text-success">
                          $ {fmtCOP(r.tarifa)}
                        </span>
                      </td>
                      <td className="text-sm text-muted text-center">{r.pesoCobrable} kg</td>
                      <td className="text-center">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded"
                          style={{
                            background: r.trayecto === 'LOCAL' ? 'rgba(0,230,118,0.15)' : 'rgba(0,194,255,0.12)',
                            color: r.trayecto === 'LOCAL' ? 'var(--success)' : 'var(--accent)',
                          }}
                        >
                          {r.trayecto}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg p-3 text-xs text-muted border" style={{ background: 'rgba(0,194,255,0.06)', borderColor: 'rgba(0,194,255,0.2)' }}>
                <span className="text-accent font-bold">ℹ️ Información:</span> El peso cobrable (Kg-Courier) es el mayor entre el peso real y el peso volumétrico. El peso volumétrico se calcula como: (Largo × Ancho × Alto) / 5000.
              </div>
              <div className="rounded-lg p-3 text-xs text-muted border" style={{ background: 'rgba(0,230,118,0.06)', borderColor: 'rgba(0,230,118,0.2)' }}>
                <span className="text-success font-bold">📊 Comparación:</span> Se muestran las tarifas de {resultados.length} paqueterías. Puedes elegir la que mejor se ajuste a tus necesidades de precio y tiempo de entrega.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
