import type { BibliotecaLinea, TarifaEspecialGrupoMeta } from '../../types'
import { TRANSP_SCHEMA, PAQUETEO_SCHEMA, type BibSchemaCol, type PaqueteoSchemaEntry } from '../htmlV6/constants'
import type { BibliotecaItem } from '../../types'
import {
  type CotItemsSnapshot,
  type CotSnapshotItem,
  formatCampoDisplay,
  formatMoneyPunctuated,
  getSchemaForGrupo,
  isItemSelected,
  isPaqueteoLine,
  isTransporteLine,
  mergeSchemaCampos,
  parseColumnas,
  parseGrupoNombre,
  resolveGrupoSnapshotItems,
  resolveSchemaFieldValue,
  resolveSchemaToggleValue,
} from './snapshot'

/** Logos de operador por línea de negocio (paridad HTML v6, extraídos de seguimiento-zymo-v6.html). */
const SVC_LOGOS: Record<string, string> = {
  'Zona Franca': '/logos-linea/zonafranca.jpg',
  'Depósito Aduanero': '/logos-linea/deposito.jpg',
  'CEDI': '/logos-linea/cedi.jpg',
  'Transporte': '/logos-linea/cedi.jpg',
  'Paqueteo': '/logos-linea/cedi.jpg',
  'Aduana': '/logos-linea/aduana.jpg',
}
const SVC_LOGO_STYLE: Record<string, string> = {
  'Zona Franca': 'max-width:190px;height:auto;display:block;object-fit:contain',
  'Depósito Aduanero': 'max-height:90px;width:auto;display:block;object-fit:contain',
  'CEDI': 'max-height:90px;width:auto;display:block;object-fit:contain',
  'Transporte': 'max-height:90px;width:auto;display:block;object-fit:contain',
  'Paqueteo': 'max-height:90px;width:auto;display:block;object-fit:contain',
  'Aduana': 'max-width:200px;height:auto;display:block;object-fit:contain',
}

function buildSvcLogoHtml(lineas: string[]): string {
  const seen = new Set<string>()
  return lineas.map((svc) => {
    const src = SVC_LOGOS[svc]
    if (!src || seen.has(src)) return ''
    seen.add(src)
    const st = SVC_LOGO_STYLE[svc] ?? 'max-width:200px;max-height:90px;width:auto;height:auto;display:block'
    return `<img src="${src}" alt="${esc(svc)}" style="${st}">`
  }).filter(Boolean).join('')
}

function formatCotFecha(raw?: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }
  if (!raw?.trim()) return new Date().toLocaleDateString('es-CO', opts)
  const d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('es-CO', opts)
  return raw
}

const COT_STYLES = `
.cot-preview{background:#fff;color:#1a1a2e;border-radius:12px;padding:48px;max-width:820px;margin:0 auto;box-shadow:0 8px 48px rgba(0,0,0,0.12);font-family:'Barlow',Arial,sans-serif;line-height:1.5}
.cot-preview-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:3px solid #002366}
.cot-preview-logo{line-height:0}
.cot-preview-logo img{height:80px;max-width:230px;object-fit:contain}
.cot-preview-meta{text-align:right;font-size:13px;color:#555;line-height:1.6}
.cot-preview-meta strong{display:block;font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:20px;font-weight:800;color:#002366;letter-spacing:1px;margin-bottom:4px}
.cot-cliente-box{background:#f0f4ff;border-left:4px solid #002366;border-radius:4px;padding:16px 20px;margin-bottom:28px;font-size:13px;color:#333}
.cot-cliente-box strong{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:17px;font-weight:700;color:#002366;display:block;margin-bottom:6px}
.cot-seccion-bloque{page-break-inside:avoid;margin-bottom:8px}
.cot-seccion-titulo{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:20px;font-weight:800;color:#002366;letter-spacing:2px;text-transform:uppercase;margin:28px 0 4px;padding-bottom:8px;border-bottom:2px solid #002366}
.cot-grupo-titulo{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:14px;font-weight:700;color:#444;letter-spacing:1.5px;text-transform:uppercase;margin:18px 0 8px}
.cot-tabla{width:100%;border-collapse:collapse;margin-bottom:8px}
.cot-tabla th{background:#002366;color:#fff;padding:10px 14px;font-size:12px;text-transform:uppercase;letter-spacing:1px;text-align:left;font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-weight:700}
.cot-tabla td{padding:9px 14px;border-bottom:1px solid #e0e4f0;font-size:13px;color:#333;word-wrap:break-word;vertical-align:top}
.cot-tabla.cot-tabla-compact th{padding:6px;font-size:9px;letter-spacing:0;white-space:normal;vertical-align:bottom}
.cot-tabla.cot-tabla-compact td{padding:6px;font-size:11px}
.cot-tabla.cot-tabla-paq th{padding:7px 10px;font-size:11px;text-align:center;vertical-align:bottom}
.cot-tabla.cot-tabla-paq td{padding:7px 10px;font-size:12px;text-align:center}
.cot-tabla.cot-tabla-esp th{text-align:center;padding:8px 10px}
.cot-tabla.cot-tabla-esp td{text-align:center;padding:8px 10px;vertical-align:middle}
.cot-tabla.cot-tabla-esp td:first-child{text-align:left}
.cot-tabla tr:nth-child(even) td{background:#f8f9ff}
.cot-tabla td.tarifa{font-weight:700;color:#002366;white-space:nowrap;font-variant-numeric:tabular-nums}
.cot-obs-box{background:#f8f9ff;border:1px solid #dde3f5;border-radius:8px;padding:20px 24px;margin-top:16px}
.cot-obs-titulo{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:14px;font-weight:700;color:#002366;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px}
.cot-footer-line{margin-top:36px;padding-top:16px;border-top:2px solid #002366;display:flex;justify-content:space-between;gap:16px;font-size:11px;color:#666;line-height:1.5}
.cot-footer-line span:last-child{font-variant-numeric:tabular-nums;color:#002366;font-weight:600}
@media print{
  .cot-preview{background:#fff!important;color:#1a1a2e!important;box-shadow:none!important;border-radius:0!important;padding:16mm 14mm!important;max-width:100%!important}
  .cot-preview-header{margin-bottom:20px!important;padding-bottom:16px!important}
  .cot-preview-logo img{height:90px!important;max-width:240px!important}
  .cot-tabla th{background:#002366!important;color:#fff!important;font-size:8px!important;padding:5px 4px!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cot-tabla td{font-size:9px!important;padding:5px 4px!important;border-bottom:1px solid #e0e4f0!important}
  .cot-tabla tr:nth-child(even) td{background:#f8f9ff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cot-seccion-bloque,.cot-obs-box{page-break-inside:avoid!important}
  .cot-preview,.cot-tabla th,.cot-tabla td{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
`

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function selectedItems(lineSnap: Record<string, CotSnapshotItem[]> | undefined, grupoId: string, grupoNombre: string): CotSnapshotItem[] {
  const raw = lineSnap?.[grupoId] ?? lineSnap?.[grupoNombre] ?? []
  return raw.filter(isItemSelected)
}

function renderSchemaTable(
  items: CotSnapshotItem[],
  cols: BibSchemaCol[],
  tableClass: string,
  bibItemsById?: Map<string, BibliotecaItem>,
  entry?: PaqueteoSchemaEntry,
): string {
  let thead = `<thead><tr>${cols.map((c) => `<th>${esc(c.nombre)}</th>`).join('')}</tr></thead>`

  if (entry?.colspanGroups) {
    const spanColIds = new Set(entry.colspanGroups.flatMap((g) => g.cols))
    const leadCols = cols.filter((c) => !spanColIds.has(c.id))
    thead = `<thead>
      <tr>
        ${leadCols.map((c) => `<th rowspan="2">${esc(c.nombre)}</th>`).join('')}
        ${entry.colspanGroups.map((g) => `<th colspan="${g.cols.length}">${esc(g.label)}</th>`).join('')}
      </tr>
      <tr>
        ${entry.colspanGroups.flatMap((g) =>
          g.cols.map((colId) => {
            const col = cols.find((c) => c.id === colId)
            return `<th>${esc(col?.nombre ?? colId)}</th>`
          }),
        ).join('')}
      </tr>
    </thead>`
  }

  const rows = items.map((item) => {
    const bibItem = bibItemsById?.get(item.id)
    const { campos, tiposCampo } = mergeSchemaCampos(item, bibItem)
    return `<tr>${cols.map((col) => {
      const val = resolveSchemaFieldValue(campos, col.id)
      const toggle = resolveSchemaToggleValue(tiposCampo, col.id, campos)
      const isTarifa = col.tipo !== 'texto' && col.tipo !== 'numero'
      const cls = isTarifa ? ' class="tarifa"' : ''
      return `<td${cls}>${esc(formatCampoDisplay(val, col.tipo, toggle))}</td>`
    }).join('')}</tr>`
  }).join('')

  return `<table class="cot-tabla ${tableClass}">${thead}<tbody>${rows}</tbody></table>`
}

function renderStandardTable(
  items: CotSnapshotItem[],
  headers: [string, string, string],
  extraCols: string[],
): string {
  const head = [headers[0], headers[1], headers[2], ...extraCols].map((h) => `<th>${esc(h)}</th>`).join('')
  const rows = items.map((item) => {
    const tarifaCell = item.tipoTarifa === 'porcentaje'
      ? esc(item.tarifa.includes('%') ? item.tarifa : `${item.tarifa}%`)
      : esc(formatMoneyPunctuated(item.tarifa))
    const extras = extraCols.map((col) => `<td>${esc(item.extraCols?.[col] ?? '—')}</td>`).join('')
    return `<tr>
      <td>${esc(item.nombre)}</td>
      <td class="tarifa">${tarifaCell}</td>
      <td>${esc(item.obs ?? '—')}</td>
      ${extras}
    </tr>`
  }).join('')

  return `<table class="cot-tabla cot-tabla-esp"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`
}

export interface BuildCotHTMLInput {
  numero: string
  fecha?: string
  vigencia?: string
  asunto?: string
  empresa: string
  nit?: string
  ciudad?: string
  contacto?: string
  cargo?: string
  telefono?: string
  email?: string
  comercial: string
  paqueteadora?: string
  lineas: string[]
  itemsSnapshot: CotItemsSnapshot
  obsHtml: Record<string, string>
  obsLibre?: string
  tarifaTipoPorLinea?: Record<string, string>
  tarifaEspecialGrupos?: Record<string, TarifaEspecialGrupoMeta[]>
}

/** Render de una línea en modo Tarifa Especial — no hay grupo de biblioteca real, se usa la metadata congelada. */
function renderEspecialLinea(lineaNombre: string, metaList: TarifaEspecialGrupoMeta[], lineSnap: Record<string, CotSnapshotItem[]> | undefined): string {
  const isTransporte = isTransporteLine(lineaNombre)
  const isPaqueteo = isPaqueteoLine(lineaNombre)
  let body = ''

  for (const meta of metaList) {
    const items = (lineSnap?.[meta.gid] ?? []).filter(isItemSelected)
    if (!items.length) continue

    body += `<div class="cot-grupo-titulo">${esc(meta.nombre)}</div>`

    if (isTransporte) {
      const schema = TRANSP_SCHEMA[meta.tipo as keyof typeof TRANSP_SCHEMA] ?? TRANSP_SCHEMA.local
      body += renderSchemaTable(items, schema.cols, 'cot-tabla-compact')
    } else if (isPaqueteo) {
      const entry = PAQUETEO_SCHEMA[meta.tipo]
      if (entry) body += renderSchemaTable(items, entry.cols, 'cot-tabla-paq', undefined, entry)
    } else {
      body += renderStandardTable(items, ['Servicio', 'Tarifa', 'Observación'], [])
    }
  }
  return body
}

export function buildCotHTML(input: BuildCotHTMLInput, biblioteca: BibliotecaLinea[]): string {
  const fecha = formatCotFecha(input.fecha)
  const vigencia = input.vigencia ? formatCotFecha(input.vigencia) : ''

  const clienteParts = [
    input.nit ? `NIT: ${esc(input.nit)}` : '',
    input.ciudad ? `Ciudad: ${esc(input.ciudad)}` : '',
    input.contacto ? `Contacto: ${esc(input.contacto)}${input.cargo ? ` (${esc(input.cargo)})` : ''}` : '',
    input.telefono ? `Tel: ${esc(input.telefono)}` : '',
    input.email ? esc(input.email) : '',
  ].filter(Boolean).join(' · ')

  let body = ''

  for (const lineaNombre of input.lineas) {
    const isEspecial = input.tarifaTipoPorLinea?.[lineaNombre] === 'especial'
    const lineSnap = input.itemsSnapshot[lineaNombre]

    let lineaBody = ''

    if (isEspecial) {
      lineaBody = renderEspecialLinea(lineaNombre, input.tarifaEspecialGrupos?.[lineaNombre] ?? [], lineSnap)
    } else {
      const linea = biblioteca.find((l) => l.nombre === lineaNombre)
      if (linea) {
        const grupos = [...linea.grupos].sort((a, b) => a.orden - b.orden)
        const claimedGrupoKeys = new Set<string>()
        for (const grupo of grupos) {
          const items = resolveGrupoSnapshotItems(lineSnap, grupo, linea, claimedGrupoKeys)
          if (!items.length) continue

          const { display } = parseGrupoNombre(grupo.nombre)
          lineaBody += `<div class="cot-grupo-titulo">${esc(display || grupo.nombre)}</div>`

          const bibItemsById = new Map(grupo.items.map((i) => [i.id, i]))
          const schema = getSchemaForGrupo(linea, grupo)
          if (schema?.kind === 'transporte') {
            lineaBody += renderSchemaTable(items, schema.cols, 'cot-tabla-compact', bibItemsById)
          } else if (schema?.kind === 'paqueteo') {
            lineaBody += renderSchemaTable(items, schema.cols, 'cot-tabla-paq', bibItemsById, schema.entry)
          } else {
            const { headers, extra } = parseColumnas((linea.columnas as string[]) ?? [])
            lineaBody += renderStandardTable(items, headers, extra)
          }
        }
      }
    }

    if (!lineaBody) continue

    body += `<div class="cot-seccion-bloque"><div class="cot-seccion-titulo">${esc(lineaNombre)}</div>${lineaBody}`

    const obs = input.obsHtml[lineaNombre]?.trim()
    if (obs) {
      body += `<div class="cot-obs-box"><div class="cot-obs-titulo">Observaciones — ${esc(lineaNombre)}</div>${obs}</div>`
    }
    body += `</div>`
  }

  if (input.obsLibre?.trim()) {
    body += `<div class="cot-obs-box"><div class="cot-obs-titulo">Observaciones generales</div><p>${esc(input.obsLibre).replace(/\n/g, '<br>')}</p></div>`
  }

  const svcLogoHtml = buildSvcLogoHtml(input.lineas)

  return `<style>${COT_STYLES}</style>
<div class="cot-preview">
  <div class="cot-preview-header">
    <div class="cot-preview-logo"><img src="/logo.png" alt="Logo" /></div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
      ${svcLogoHtml ? `<div style="display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:20px;flex-wrap:nowrap">${svcLogoHtml}</div>` : ''}
      <div class="cot-preview-meta">
        <strong>COTIZACIÓN ${esc(input.numero)}</strong>
        Fecha: ${esc(fecha)}<br>
        ${vigencia ? `Válida hasta: ${esc(vigencia)}<br>` : ''}
        Comercial: ${esc(input.comercial)}
        ${input.paqueteadora ? `<br>Paqueteadora: ${esc(input.paqueteadora)}` : ''}
      </div>
    </div>
  </div>
  <div class="cot-cliente-box">
    <strong>${esc(input.empresa)}</strong>
    ${clienteParts || '—'}
  </div>
  ${input.asunto?.trim() ? `<p style="font-size:14px;font-weight:700;color:#002366;margin:-16px 0 20px">Asunto: ${esc(input.asunto)}</p>` : ''}
  ${body || '<p style="color:#888;font-size:13px">Sin ítems seleccionados.</p>'}
  <div class="cot-footer-line">
    <span>Propuesta comercial · Grupo ZYMO</span>
    <span>Ref. ${esc(input.numero)}</span>
  </div>
</div>`
}

/** Compatibilidad con snapshots legacy (grupoId anidado con sel/items). */
export function flattenSnapshot(raw: unknown): CotItemsSnapshot {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: CotItemsSnapshot = {}

  for (const [linea, grupos] of Object.entries(raw as Record<string, unknown>)) {
    if (!grupos || typeof grupos !== 'object' || Array.isArray(grupos)) continue
    out[linea] = {}

    for (const [grupoKey, val] of Object.entries(grupos as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        out[linea][grupoKey] = val as CotSnapshotItem[]
        continue
      }
      if (val && typeof val === 'object' && Array.isArray((val as { items?: unknown }).items)) {
        const block = val as { sel?: boolean; items: CotSnapshotItem[] }
        out[linea][grupoKey] = block.sel === false
          ? block.items.map((i) => ({ ...i, sel: false }))
          : block.items
      }
    }
  }

  return out
}
