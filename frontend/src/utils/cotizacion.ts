import type { BibliotecaLinea, Comercial, ItemsMap } from '../types'
import { fmtTarifa, fmtDate } from './format'

const SVC_ICONS: Record<string, string> = {
  'Zona Franca':       '🏭',
  'Depósito Aduanero': '📦',
  'CEDI':              '🏗️',
  'Transporte':        '🚛',
  'Paqueteo':          '📬',
  'Aduana':            '🛃',
}

export interface BuildCotParams {
  numero: string | null
  empresa: string
  nit: string
  contacto: string
  cargo: string
  email: string
  telefono: string
  fecha: string
  vigencia: string
  asunto: string
  lineas: string[]
  items: ItemsMap
  obs_plantillas: Record<string, string[]>
  obs_libre: string
}

/**
 * Genera el HTML completo de la cotización.
 * Usado en Paso5 (preview) y en CotPublica.
 * El HTML es renderizado vía dangerouslySetInnerHTML dentro de un contenedor
 * que ya tiene las clases .cot-preview cargadas en el CSS.
 */
export function buildCotHTML(
  wiz: BuildCotParams,
  comercial: Comercial | null,
  biblioteca: BibliotecaLinea[]
): string {
  const bibMap = new Map(biblioteca.map((l) => [l.nombre, l]))

  // ── Secciones de ítems ──
  let seccionesHtml = ''
  for (const svc of wiz.lineas) {
    const gruposMap = wiz.items[svc] ?? {}
    const linea = bibMap.get(svc)
    const extraCols = linea?.columnas ?? []

    let tablas = ''
    for (const grupo of Object.values(gruposMap)) {
      if (!grupo.sel) continue
      const selItems = grupo.items.filter((i) => i.sel)
      if (selItems.length === 0) continue

      const extraThs = extraCols.map((c) => `<th>${c.nombre}</th>`).join('')
      const rows = selItems
        .map(
          (i) => `
        <tr>
          <td>${i.nombre}</td>
          <td class="tarifa">${fmtTarifa(i.tarifa, i.tipo_tarifa)}</td>
          <td>${i.obs || '—'}</td>
          ${extraCols.map((c) => `<td>${i.extra_cols[c.id] || '—'}</td>`).join('')}
        </tr>`
        )
        .join('')

      tablas += `
        <div class="cot-grupo-titulo">${grupo.nombre}</div>
        <table class="cot-tabla">
          <thead><tr>
            <th>Servicio</th><th>Tarifa</th><th>Observaciones</th>${extraThs}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`
    }
    if (!tablas) continue

    seccionesHtml += `
      <div class="cot-seccion-titulo">${SVC_ICONS[svc] ?? ''} ${svc}</div>
      ${tablas}`
  }

  // ── Bloques de observaciones ──
  const obsBlocks: { nombre: string; html: string }[] = []
  for (const svc of wiz.lineas) {
    const linea = bibMap.get(svc)
    if (!linea) continue
    const sel = wiz.obs_plantillas[svc] ?? []
    for (const obs of linea.observaciones) {
      if (sel.includes(obs.id)) {
        obsBlocks.push({ nombre: obs.nombre, html: obs.html })
      }
    }
  }
  if (wiz.obs_libre) {
    const libreHtml = wiz.obs_libre
      .split('\n')
      .filter(Boolean)
      .map((l) => `<p style="margin:4px 0">${l}</p>`)
      .join('')
    if (libreHtml) obsBlocks.push({ nombre: 'Observaciones Adicionales', html: libreHtml })
  }

  const obsHtml = obsBlocks.length
    ? `<div class="cot-obs-box">
        <div class="cot-obs-titulo">Observaciones y Condiciones</div>
        ${obsBlocks
          .map(
            (b) => `
          <div style="margin-bottom:18px">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;
              color:#002366;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;
              padding-bottom:4px;border-bottom:1px solid #dde3f5">${b.nombre}</div>
            <div style="font-family:'Barlow',sans-serif;font-size:13px;color:#333;line-height:1.7">
              ${b.html}
            </div>
          </div>`
          )
          .join('')}
      </div>`
    : ''

  // ── Firma del comercial ──
  const firmaHtml = `
    <div style="margin-top:40px;padding-top:24px;border-top:2px solid #002366;display:flex;justify-content:flex-end">
      <div style="min-width:260px;text-align:center">
        <div style="height:52px;border-bottom:2px solid #002366;margin-bottom:10px"></div>
        <div style="font-size:14px;font-weight:700;color:#002366">${comercial?.nombre ?? ''}</div>
        <div style="font-size:12px;color:#555;margin-top:3px">
          ${comercial?.cargo ?? 'Asesor Comercial'} · Grupo ZYMO
        </div>
        ${comercial?.email ? `<div style="font-size:11px;color:#888;margin-top:2px">${comercial.email}</div>` : ''}
        ${comercial?.tel ? `<div style="font-size:11px;color:#888">${comercial.tel}</div>` : ''}
      </div>
    </div>`

  return `
    <div class="cot-preview" id="cot-doc">
      <div class="cot-preview-header">
        <div class="cot-preview-logo">
          <img src="/logo.png" alt="Zymo" style="height:48px;width:auto;display:block;" />
        </div>
        <div class="cot-preview-meta">
          <strong>${wiz.numero ?? 'BORRADOR'}</strong>
          <span>Fecha: ${fmtDate(wiz.fecha)}</span><br>
          <span>Vigencia: ${fmtDate(wiz.vigencia)}</span>
          ${comercial ? `<br><span>${comercial.nombre}</span>` : ''}
        </div>
      </div>

      <div class="cot-cliente-box">
        <strong>${wiz.empresa || '—'}</strong>
        ${wiz.nit ? `NIT: ${wiz.nit} &nbsp;·&nbsp;` : ''}
        ${wiz.contacto ? `Contacto: ${wiz.contacto}` : ''}
        ${wiz.cargo ? ` &mdash; ${wiz.cargo}` : ''}
        ${wiz.email ? `<br>${wiz.email}` : ''}
        ${wiz.telefono ? `<br>${wiz.telefono}` : ''}
        ${wiz.asunto ? `<div style="margin-top:8px;font-weight:600;color:#002366">${wiz.asunto}</div>` : ''}
      </div>

      ${seccionesHtml}
      ${obsHtml}
      ${firmaHtml}

      <div class="cot-footer-line">
        <span>Grupo ZYMO &middot; www.grupozymo.com</span>
        <span>${wiz.numero ?? ''} &middot; ${fmtDate(wiz.fecha)}</span>
      </div>
    </div>`
}
