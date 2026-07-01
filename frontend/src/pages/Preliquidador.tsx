import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calculator, Search, ChevronRight, ChevronDown, Check, X, Printer, History, Trash2 } from 'lucide-react'
import { getCotizaciones } from '../api/cotizaciones'
import { getPreliqHistorial, savePreliqHistorial, deletePreliqEntry, PreliqEntry } from '../api/preliqHistorial'
import { toast } from '../store/toastStore'
import type { Cotizacion } from '../types'
import { SVC_COLORS } from '../lib/htmlV6/domainConfig'

// ─── Types ────────────────────────────────────────────────────────────────────
interface PreliqItem {
  id: string
  nombre: string
  tarifa: string
  tipoTarifa: 'moneda' | 'porcentaje'
  obs?: string
  _grupo: string
  _linea: string
}

interface FormState {
  producto: string
  cif: string
  tipo: '' | 'lcl' | 'cont20' | 'cont40'
  numCont: number
  peso: string
  pallets: string
  unidades: string
}

interface ResultLine {
  _seccion?: string
  concepto?: string
  base?: string
  nota?: string
  resultado?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseTarifa(raw: string): number {
  return parseFloat(String(raw || '0').replace(/\./g, '').replace(',', '.')) || 0
}

function esPorcentaje(item: PreliqItem): boolean {
  return item.tipoTarifa === 'porcentaje' || String(item.tarifa).includes('%')
}

function tarifaNum(item: PreliqItem): number {
  const raw = String(item.tarifa || '0').replace('%', '').replace(',', '.')
  const n = parseFloat(raw) || 0
  return esPorcentaje(item) ? n / 100 : parseTarifa(item.tarifa)
}

function fmtCOP(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function fmtPct(item: PreliqItem): string {
  const n = tarifaNum(item) * 100
  return n.toFixed(2).replace('.', ',') + '%'
}

// ─── Extract items from cotizacion snapshot ───────────────────────────────────
function getItemsFromCot(cot: Cotizacion): PreliqItem[] {
  const snap = cot.itemsSnapshot as Record<string, Record<string, { id: string; nombre: string; tarifa: string; tipoTarifa: string; obs?: string }[]>>
  const result: PreliqItem[] = []
  for (const linea of (cot.lineas ?? [])) {
    const grupos = snap[linea]
    if (!grupos) continue
    for (const [grupo, items] of Object.entries(grupos)) {
      if (!Array.isArray(items)) continue
      for (const item of items) {
        result.push({ ...item, tipoTarifa: item.tipoTarifa as 'moneda' | 'porcentaje', _grupo: grupo, _linea: linea })
      }
    }
  }
  return result
}

// ─── Detect which form fields are needed ─────────────────────────────────────
function detectFields(items: PreliqItem[]) {
  let needCif = false, needPeso = false, needTipo = false, needPallets = false, needUnidades = false

  for (const item of items) {
    const nom   = item.nombre.toLowerCase()
    const grupo = item._grupo.toLowerCase()
    const pct   = esPorcentaje(item)

    const esAdv = nom === 'ad valorem' || nom.startsWith('ad valorem')
    if (esAdv) { needCif = true; needTipo = true }

    const esSeg = grupo.includes('segur') || nom.includes('seguro') || nom.includes('tasa de segur')
    if (esSeg && pct && !esAdv) needCif = true

    const esMinCont = (nom.includes('contenedor') || nom.includes('cont')) &&
      (grupo.includes('manipul') || grupo.includes('almacen'))
    if (esMinCont) needTipo = true

    const esManip = grupo.includes('manipul') || grupo.includes('recib') ||
      nom.includes('kilo') || nom.includes('/kg') || nom.includes('valor kilo')
    if (esManip) needPeso = true

    const esPallet = grupo.includes('almacen') || grupo.includes('posici') || grupo.includes('pallet') ||
      nom.includes('pallet') || nom.includes('posici')
    if (esPallet) needPallets = true

    const esDespach = grupo.includes('despach') || grupo.includes('alistam') || grupo.includes('picking') ||
      nom.includes('despach') || nom.includes('alistam') || nom.includes('picking')
    if (esDespach) needUnidades = true
  }
  return { needCif, needPeso, needTipo, needPallets, needUnidades }
}

// ─── Calculation engine (ported from original JS) ────────────────────────────
function calcItem(
  item: PreliqItem,
  opts: { cif: number; peso: number; tipo: string; numCont: number; pallets: number; unidades: number },
  allItemsInLinea: PreliqItem[]
): ResultLine | null {
  const { cif, peso, tipo, numCont, pallets, unidades } = opts
  const nom   = item.nombre.toLowerCase()
  const grupo = item._grupo.toLowerCase()
  const pct   = esPorcentaje(item)
  const tn    = tarifaNum(item)
  const esCont = tipo === 'cont20' || tipo === 'cont40'

  const esAdv   = nom === 'ad valorem' || nom.startsWith('ad valorem')
  const esSeg   = grupo.includes('segur') || nom.includes('tasa de segur') || nom.includes('seguro')
  const esMinSeg= esSeg && !pct
  const esAlmac = grupo.includes('almacen') || grupo.includes('posici') || grupo.includes('pallet')
  const esPallet= nom.includes('pallet') || nom.includes('posici') || esAlmac
  const esManip = grupo.includes('manipul') || grupo.includes('recib')
  const esKg    = nom.includes('kilo') || nom.includes('/kg') || nom.includes('valor kilo') || nom.includes('kg')
  const esDespach = grupo.includes('despach') || grupo.includes('alistam') || grupo.includes('picking') ||
    nom.includes('despach') || nom.includes('alistam') || nom.includes('picking')

  let resultado = 0, base = '', nota = item.obs || ''
  const concepto = item._grupo || item.nombre

  if (esAdv && pct) {
    resultado = cif * tn
    base = fmtPct(item) + ' × ' + fmtCOP(cif) + ' CIF'
    // Find minimum by tipo
    const frags = tipo === 'lcl' ? ['aer', 'lcl', 'consolid', 'minima aer', 'minima lcl']
      : tipo === 'cont20' ? ['20 pie', '20p', 'cont 20']
      : tipo === 'cont40' ? ['40 pie', '40p', 'cont 40', '40 pies'] : []
    if (frags.length) {
      const minItem = allItemsInLinea.find(i => {
        if (i.id === item.id || esPorcentaje(i)) return false
        const n = i.nombre.toLowerCase()
        return frags.some(f => n.includes(f))
      })
      if (minItem) {
        const minVal = parseTarifa(minItem.tarifa) * (esCont ? numCont : 1)
        if (resultado < minVal) {
          nota = 'Calculado ' + fmtCOP(resultado) + ' < mínima. Se cobra mínima' + (esCont ? ' x ' + numCont + ' cont.' : '')
          resultado = minVal
        }
      }
    }
  } else if (esSeg && pct) {
    const calcSeg = cif * tn
    const minSegItem = allItemsInLinea.find(i => {
      const g = i._grupo.toLowerCase(), n = i.nombre.toLowerCase()
      return !esPorcentaje(i) && (g.includes('segur') || n.includes('segur') || n.includes('minim'))
    })
    const minValSeg = minSegItem ? parseTarifa(minSegItem.tarifa) : 0
    if (minValSeg > 0) {
      if (calcSeg >= minValSeg) {
        resultado = calcSeg
        base = fmtPct(item) + ' × ' + fmtCOP(cif)
        nota = 'Mayor que la mínima (' + fmtCOP(minValSeg) + ').'
      } else {
        resultado = minValSeg
        base = 'Mínima de seguro'
        nota = 'Calculado ' + fmtCOP(calcSeg) + ' < mínima.'
      }
    } else {
      resultado = calcSeg
      base = fmtPct(item) + ' × ' + fmtCOP(cif)
    }
  } else if (esMinSeg) {
    return null // absorbed by tasa calculation
  } else if (esPallet && !pct) {
    const n = pallets || 1
    const calcPal = tn * n
    // find minima in same grupo
    const minItem = allItemsInLinea.find(i => i._grupo === item._grupo && i.id !== item.id && !esPorcentaje(i) && parseTarifa(i.tarifa) > tn)
    const minimaVal = minItem ? parseTarifa(minItem.tarifa) : 0
    if (minimaVal > 0 && calcPal < minimaVal) {
      resultado = minimaVal
      base = 'Mínima de almacenamiento'
      nota = 'Calculado ' + fmtCOP(calcPal) + ' (' + n + ' pallets) < mínima.'
    } else {
      resultado = calcPal
      base = fmtCOP(tn) + ' x ' + n + ' pallets/posiciones'
      if (minimaVal > 0) nota = 'Mayor que mínima (' + fmtCOP(minimaVal) + ').'
    }
  } else if (esKg && !pct) {
    const calcKg = tn * peso
    const minItem = allItemsInLinea.find(i => i._grupo === item._grupo && i.id !== item.id && !esPorcentaje(i) && parseTarifa(i.tarifa) > tn)
    const minimaVal = minItem ? parseTarifa(minItem.tarifa) : 0
    if (minimaVal > 0) {
      if (calcKg >= minimaVal) {
        resultado = calcKg
        base = fmtCOP(tn) + '/kg x ' + peso.toLocaleString('es-CO') + ' kg'
        nota = 'Mayor que la mínima (' + fmtCOP(minimaVal) + ').'
      } else {
        resultado = minimaVal
        base = 'Mínima de manipulación'
        nota = 'Calculado ' + fmtCOP(calcKg) + ' < mínima.'
      }
    } else {
      resultado = calcKg
      base = fmtCOP(tn) + '/kg x ' + peso.toLocaleString('es-CO') + ' kg'
    }
  } else if (esManip && !pct) {
    const mult = esCont ? numCont : 1
    resultado = tn * mult
    base = mult > 1 ? fmtCOP(tn) + ' x ' + mult + ' contenedor(es)' : fmtCOP(tn) + ' (mínima)'
  } else if (esDespach && !pct) {
    const multU = (nom.includes('unidad') || nom.includes('caja') || nom.includes('und')) ? (unidades || 1) : 1
    resultado = tn * multU
    base = multU > 1 ? fmtCOP(tn) + ' x ' + multU + ' unidades' : fmtCOP(tn)
  } else if (pct) {
    resultado = cif * tn
    base = fmtPct(item) + ' × ' + fmtCOP(cif)
  } else {
    resultado = tn
    base = fmtCOP(tn) + ' (tarifa fija)'
  }

  return { concepto, base, nota, resultado: Math.round(resultado) }
}

function calcPreliq(selectedItems: PreliqItem[], form: FormState, allItemsByLinea: Record<string, PreliqItem[]>): ResultLine[] {
  const cif      = parseTarifa(form.cif)
  const peso     = parseFloat(form.peso) || 0
  const tipo     = form.tipo
  const numCont  = form.numCont || 1
  const pallets  = parseFloat(form.pallets) || 0
  const unidades = parseFloat(form.unidades) || 0

  // Group by linea
  const porLinea: Record<string, PreliqItem[]> = {}
  for (const item of selectedItems) {
    if (!porLinea[item._linea]) porLinea[item._linea] = []
    porLinea[item._linea].push(item)
  }

  const result: ResultLine[] = []
  for (const [linea, items] of Object.entries(porLinea)) {
    result.push({ _seccion: linea })
    const all = allItemsByLinea[linea] ?? []
    // Deduplicate by grupo: if two items in same grupo, keep the one that's not a "minima" fija
    const seen = new Set<string>()
    for (const item of items) {
      const key = item._grupo
      if (seen.has(key)) continue
      seen.add(key)
      const line = calcItem(item, { cif, peso, tipo, numCont, pallets, unidades }, all)
      if (line) result.push(line)
    }
  }
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Preliquidador() {
  const [search, setSearch]         = useState('')
  const [showDropdown, setDropdown] = useState(false)
  const [selectedCot, setSelectedCot] = useState<Cotizacion | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [step, setStep]             = useState<1 | 2 | 3>(1)
  const [form, setForm]             = useState<FormState>({ producto: '', cif: '', tipo: '', numCont: 1, peso: '', pallets: '', unidades: '' })
  const [result, setResult]         = useState<ResultLine[] | null>(null)

  const qc = useQueryClient()

  const { data: cots = [] } = useQuery({
    queryKey: ['cotizaciones', 'preliq'],
    queryFn: () => getCotizaciones({}),
  })

  const { data: historial = [] } = useQuery({
    queryKey: ['preliq-historial'],
    queryFn: getPreliqHistorial,
    staleTime: 30_000,
  })

  const saveMut = useMutation({
    mutationFn: savePreliqHistorial,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preliq-historial'] })
      toast.success('Preliquidación guardada en historial')
    },
    onError: () => toast.error('Error al guardar en historial'),
  })

  const deleteMut = useMutation({
    mutationFn: deletePreliqEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['preliq-historial'] })
      toast.success('Entrada eliminada')
    },
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cots.filter(c =>
      (c.lineas?.length ?? 0) > 0 && Object.keys(c.itemsSnapshot ?? {}).length > 0 &&
      (!q || c.empresa.toLowerCase().includes(q) || c.numero.toLowerCase().includes(q))
    ).slice(0, 20)
  }, [cots, search])

  const allItems: PreliqItem[] = useMemo(() =>
    selectedCot ? getItemsFromCot(selectedCot) : [], [selectedCot])

  const allItemsByLinea: Record<string, PreliqItem[]> = useMemo(() => {
    const m: Record<string, PreliqItem[]> = {}
    for (const i of allItems) {
      if (!m[i._linea]) m[i._linea] = []
      m[i._linea].push(i)
    }
    return m
  }, [allItems])

  const groupedByLinea = useMemo(() => {
    const m: Record<string, Record<string, PreliqItem[]>> = {}
    for (const i of allItems) {
      if (!m[i._linea]) m[i._linea] = {}
      if (!m[i._linea][i._grupo]) m[i._linea][i._grupo] = []
      m[i._linea][i._grupo].push(i)
    }
    return m
  }, [allItems])

  const checkedItems = allItems.filter(i => selectedItems.has(`${i._linea}::${i._grupo}::${i.id}`))
  const fields = detectFields(checkedItems)

  function selectCot(cot: Cotizacion) {
    setSelectedCot(cot)
    setSearch(cot.empresa + ' — ' + cot.numero)
    setDropdown(false)
    setSelectedItems(new Set())
    setStep(1)
    setResult(null)
  }

  function toggleItem(item: PreliqItem) {
    const key = `${item._linea}::${item._grupo}::${item.id}`
    setSelectedItems(prev => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key); else n.add(key)
      return n
    })
  }

  function confirmar() {
    if (checkedItems.length === 0) return
    setStep(2)
    setResult(null)
  }

  function calcular() {
    const lines = calcPreliq(checkedItems, form, allItemsByLinea)
    setResult(lines)
    setStep(3)
    // Auto-save to historial
    if (selectedCot) {
      const total = lines.filter(l => !l._seccion).reduce((s, l) => s + (l.resultado ?? 0), 0)
      const servicios = [...new Set(checkedItems.map(i => i._linea))]
      saveMut.mutate({
        empresa:    selectedCot.empresa,
        cotNumero:  selectedCot.numero,
        servicios,
        parametros: { ...form },
        lineas:     lines,
        total,
      })
    }
  }

  function loadFromHistory(entry: PreliqEntry) {
    setResult(entry.lineas as ResultLine[])
    setStep(3)
    setForm({ ...({ producto: '', cif: '', tipo: '', numCont: 1, peso: '', pallets: '', unidades: '' }), ...entry.parametros } as FormState)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total = result?.filter(l => !l._seccion).reduce((s, l) => s + (l.resultado ?? 0), 0) ?? 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="section-title" style={{ marginBottom: 4 }}>Preliquidador</h2>
        <p className="text-xs text-muted">Estimación de costos a partir de una cotización existente</p>
      </div>

      {/* Step 1: Select cotizacion + items */}
      <div className="card p-5 space-y-5">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">1</span>
          Seleccionar cotización
        </div>

        {/* Search combobox */}
        <div className="relative">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setDropdown(true) }}
              onFocus={() => setDropdown(true)}
              placeholder="Buscar cotización por empresa o número..."
              className="w-full pl-8 pr-8 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            />
            {selectedCot && (
              <button onClick={() => { setSelectedCot(null); setSearch(''); setSelectedItems(new Set()); setResult(null); setStep(1) }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-[#0e1320] border border-border rounded-xl overflow-hidden shadow-xl">
              {filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectCot(c)}
                  className="w-full text-left px-4 py-3 hover:bg-white/[0.05] border-b border-border/50 last:border-0 transition-colors"
                >
                  <div className="text-sm font-semibold text-foreground">{c.empresa}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {c.numero} · <span className="text-accent">{(c.lineas ?? []).join(', ')}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Item selection */}
        {selectedCot && allItems.length > 0 && (
          <div className="space-y-4">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">2</span>
              Seleccionar ítems a preliquidar
            </div>
            {Object.entries(groupedByLinea).map(([linea, grupos]) => (
              <div key={linea} className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-surface/80 border-b border-border flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: SVC_COLORS[linea] ?? '#00c2ff' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: SVC_COLORS[linea] ?? '#00c2ff' }}>{linea}</span>
                </div>
                {Object.entries(grupos).map(([grupo, items]) => (
                  <div key={grupo} className="border-b border-border/50 last:border-0">
                    <div className="px-4 py-1.5 text-[10px] text-muted uppercase tracking-wider bg-white/[0.02]">{grupo}</div>
                    {items.map(item => {
                      const key = `${item._linea}::${item._grupo}::${item.id}`
                      const checked = selectedItems.has(key)
                      return (
                        <label key={item.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border/30 last:border-0 ${checked ? 'bg-accent/[0.06]' : 'hover:bg-white/[0.03]'}`}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${checked ? 'bg-accent border-accent' : 'border-border'}`}
                            onClick={() => toggleItem(item)}>
                            {checked && <Check size={10} className="text-black" />}
                          </div>
                          <span className="text-sm text-foreground flex-1">{item.nombre}</span>
                          {item.tarifa && (
                            <span className="text-xs text-amber-400 font-semibold flex-shrink-0">{item.tarifa}</span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
            <button
              onClick={confirmar}
              disabled={checkedItems.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              Continuar ({checkedItems.length} ítems) <ChevronRight size={15} />
            </button>
          </div>
        )}
        {selectedCot && allItems.length === 0 && (
          <div className="text-sm text-muted py-4">Esta cotización no tiene ítems seleccionados. Edítala primero en el módulo de Cotizaciones.</div>
        )}
      </div>

      {/* Step 2: Dynamic form */}
      {step >= 2 && checkedItems.length > 0 && (
        <div className="card p-5 space-y-5">
          <div className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold">3</span>
            Datos para el cálculo
          </div>

          {/* Items summary */}
          <div className="flex flex-wrap gap-2">
            {checkedItems.map(i => (
              <div key={i.id} className="text-xs px-2.5 py-1 rounded-lg bg-surface border border-border text-muted">
                <span className="font-medium text-foreground">{i.nombre}</span>
                {i.tarifa && <span className="ml-1.5 text-amber-400">{i.tarifa}</span>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">Producto / Mercancía</label>
              <input value={form.producto} onChange={e => setForm(p => ({ ...p, producto: e.target.value }))}
                placeholder="Ej: Paneles Solares"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
            </div>

            {fields.needCif && (
              <div>
                <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">Valor CIF / Mercancía (COP)</label>
                <input value={form.cif} onChange={e => setForm(p => ({ ...p, cif: e.target.value }))}
                  placeholder="Ej: 50.000.000"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            )}

            {fields.needTipo && (
              <>
                <div>
                  <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">Tipo de Ingreso</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as FormState['tipo'] }))}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent">
                    <option value="">-- Selecciona --</option>
                    <option value="lcl">Aérea / LCL (Consolidado)</option>
                    <option value="cont20">Contenedor 20 pies</option>
                    <option value="cont40">Contenedor 40 pies (Std / HC)</option>
                  </select>
                </div>
                {(form.tipo === 'cont20' || form.tipo === 'cont40') && (
                  <div>
                    <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">N° de Contenedores</label>
                    <input type="number" min="1" value={form.numCont} onChange={e => setForm(p => ({ ...p, numCont: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
                  </div>
                )}
              </>
            )}

            {fields.needPeso && (
              <div>
                <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">Peso total (kg)</label>
                <input type="number" min="0" value={form.peso} onChange={e => setForm(p => ({ ...p, peso: e.target.value }))}
                  placeholder="Ej: 2500"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            )}

            {fields.needPallets && (
              <div>
                <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">N° de Pallets / Posiciones</label>
                <input type="number" min="0" value={form.pallets} onChange={e => setForm(p => ({ ...p, pallets: e.target.value }))}
                  placeholder="Ej: 10"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            )}

            {fields.needUnidades && (
              <div>
                <label className="text-xs text-muted block mb-1.5 uppercase tracking-wider">N° de Unidades / Cajas</label>
                <input type="number" min="0" value={form.unidades} onChange={e => setForm(p => ({ ...p, unidades: e.target.value }))}
                  placeholder="Ej: 50"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-accent" />
              </div>
            )}
          </div>

          <button
            onClick={calcular}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-black font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            <Calculator size={15} />
            Calcular preliquidación
          </button>
        </div>
      )}

      {/* Step 3: Result — saved indicator */}
      {saveMut.isPending && (
        <div className="text-xs text-muted animate-pulse">Guardando en historial...</div>
      )}

      {/* Step 3: Result */}
      {result && (
        <div className="rounded-xl border border-border overflow-hidden" id="preliq-result">
          {/* Header */}
          <div className="px-6 py-5 border-b-2 border-accent" style={{ background: 'linear-gradient(135deg,#0d2a4a,#0a1f38)' }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] tracking-[3px] text-muted uppercase mb-1">Preliquidación Estimada</div>
                <div className="text-lg font-display font-bold text-accent">{selectedCot?.empresa}</div>
                <div className="text-xs text-muted mt-0.5">Cot. <strong className="text-foreground">{selectedCot?.numero}</strong></div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {form.producto && <Chip label="Producto" value={form.producto} />}
                {form.cif && <Chip label="Valor CIF" value={'$' + parseTarifa(form.cif).toLocaleString('es-CO')} />}
                {form.peso && <Chip label="Peso" value={form.peso + ' kg'} />}
                {form.tipo && <Chip label="Tipo" value={form.tipo === 'lcl' ? 'Aérea/LCL' : form.tipo === 'cont20' ? 'Cont. 20\'' : 'Cont. 40\''} />}
              </div>
            </div>
          </div>

          {/* Lines table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface/80 text-[10px] text-muted uppercase tracking-[1.5px]">
                  <th className="text-left px-5 py-3">Concepto</th>
                  <th className="text-left px-4 py-3">Base de cálculo</th>
                  <th className="text-left px-4 py-3">Nota</th>
                  <th className="text-right px-5 py-3">Valor (COP)</th>
                </tr>
              </thead>
              <tbody>
                {result.map((line, i) => line._seccion ? (
                  <tr key={i} className="bg-black/20">
                    <td colSpan={4} className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: SVC_COLORS[line._seccion] ?? '#00c2ff' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[2px]" style={{ color: SVC_COLORS[line._seccion] ?? '#00c2ff' }}>
                          {line._seccion}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-5 py-3 font-medium text-foreground">{line.concepto}</td>
                    <td className="px-4 py-3 text-xs text-muted">{line.base}</td>
                    <td className="px-4 py-3 text-xs text-muted italic">{line.nota}</td>
                    <td className="px-5 py-3 text-right font-bold text-green-400 whitespace-nowrap font-mono">
                      {(line.resultado ?? 0) > 0 ? fmtCOP(line.resultado!) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-5 py-4 bg-surface border-t-2 border-border flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider mb-0.5">TOTAL ESTIMADO</div>
              <div className="text-3xl font-display font-bold text-green-400">{fmtCOP(total)} <span className="text-base text-muted font-normal">COP</span></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setResult(null); setStep(1); setSelectedItems(new Set()); setSelectedCot(null); setSearch('') }}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-muted text-sm hover:text-foreground transition-colors">
                Nueva
              </button>
              <button onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface border border-border text-sm text-foreground hover:bg-white/[0.05] transition-colors">
                <Printer size={14} />
                Imprimir
              </button>
            </div>
          </div>

          <div className="px-5 py-2.5 text-xs text-amber-400/80" style={{ background: 'rgba(245,166,35,0.06)', borderTop: '1px solid rgba(245,166,35,0.2)' }}>
            Valores estimados. La facturación final puede variar según las condiciones reales de la operación.
          </div>
        </div>
      )}
      {/* Historial */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History size={15} className="text-muted" />
          <span className="text-xs font-semibold text-muted uppercase tracking-wider">Historial de Preliquidaciones</span>
          <span className="text-[10px] text-muted/60">({historial.length})</span>
        </div>

        {historial.length === 0 ? (
          <div className="text-sm text-muted text-center py-6 rounded-xl border border-border bg-surface/40">
            No hay preliquidaciones guardadas aún.
          </div>
        ) : (
          <div className="space-y-2.5">
            {historial.map(entry => (
              <div key={entry.id} className="card px-5 py-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <span className="font-semibold text-foreground text-sm">{entry.empresa}</span>
                    <span className="text-[10px] text-muted bg-surface border border-border rounded px-1.5 py-0.5">Cot. {entry.cotNumero}</span>
                    {entry.servicios.map(s => (
                      <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{s}</span>
                    ))}
                  </div>
                  <div className="text-xs text-muted">
                    {new Date(entry.createdAt).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {entry.parametros.producto && <span className="ml-2">· {entry.parametros.producto}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-muted uppercase tracking-wider">Total</div>
                    <div className="text-lg font-display font-bold text-green-400">{fmtCOP(entry.total)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => loadFromHistory(entry)}
                      className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground hover:bg-white/[0.05] transition-colors"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => deleteMut.mutate(entry.id)}
                      disabled={deleteMut.isPending}
                      className="p-1.5 rounded-lg bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(0,194,255,0.08)', border: '1px solid rgba(0,194,255,0.2)' }}>
      <div className="text-[9px] text-muted uppercase tracking-wider">{label}</div>
      <div className="text-xs font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  )
}

function _ChevronDown({ size }: { size: number }) {
  return <ChevronDown size={size} />
}

// suppress unused import warning
void _ChevronDown
