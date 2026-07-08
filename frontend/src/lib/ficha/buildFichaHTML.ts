import type { CRMRecord } from '../../types'
import type { FichaData } from '../../pages/FichaDetalle'

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function row(label: string, value?: string): string {
  const v = value?.trim()
  if (!v) return ''
  return `<tr><td class="fp-label">${esc(label)}</td><td class="fp-value">${esc(v)}</td></tr>`
}

function section(title: string, rows: string): string {
  const filled = rows.trim()
  if (!filled) return ''
  return `<div class="fp-seccion"><div class="fp-seccion-titulo">${esc(title)}</div><table class="fp-tabla">${filled}</table></div>`
}

const FP_STYLES = `
.fp-doc{background:#fff;color:#1a1a2e;border-radius:12px;padding:40px;max-width:820px;margin:0 auto;font-family:'Barlow',Arial,sans-serif;line-height:1.5}
.fp-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #002366}
.fp-header h1{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:24px;font-weight:800;color:#002366;margin:0 0 4px}
.fp-header-meta{text-align:right;font-size:12px;color:#555;line-height:1.6}
.fp-seccion{margin-bottom:20px}
.fp-seccion-titulo{font-family:'Barlow Condensed','Barlow',Arial,sans-serif;font-size:16px;font-weight:800;color:#002366;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #002366}
.fp-tabla{width:100%;border-collapse:collapse}
.fp-tabla td{padding:6px 10px;font-size:13px;vertical-align:top;border-bottom:1px solid #e0e4f0}
.fp-label{color:#666;width:220px;font-weight:600}
.fp-value{color:#1a1a2e}
.fp-mini-table{width:100%;border-collapse:collapse;margin-top:6px}
.fp-mini-table th{background:#002366;color:#fff;padding:6px 8px;font-size:10px;text-transform:uppercase;text-align:left}
.fp-mini-table td{padding:6px 8px;font-size:12px;border-bottom:1px solid #e0e4f0}
.fp-footer{margin-top:28px;padding-top:12px;border-top:2px solid #002366;font-size:11px;color:#666;display:flex;justify-content:space-between}
`

/** Genera el documento imprimible de la Ficha de Cliente (paridad HTML descargarFichaPDF,
 *  simplificado: mismo contenido por sección, sin replicar el maquetado pixel-a-pixel). */
export function buildFichaHTML(record: CRMRecord, data: FichaData, analistaNombre: string): string {
  const comercialNombre = record.comercial?.nombre ?? ''
  const contactosRows = data.contactos.length
    ? `<table class="fp-mini-table"><thead><tr><th>Cargo</th><th>Tipo</th><th>Contacto</th><th>Email</th><th>Teléfono</th><th>Celular</th></tr></thead><tbody>${
      data.contactos.map((c) => `<tr><td>${esc(c.cargo)}</td><td>${esc(c.tipo)}</td><td>${esc(c.nombre)}</td><td>${esc(c.email)}</td><td>${esc(c.tel)}</td><td>${esc(c.cel)}</td></tr>`).join('')
    }</tbody></table>`
    : ''

  const asistentesRows = data.asistentes.length
    ? `<table class="fp-mini-table"><thead><tr><th>Cargo</th><th>Contacto</th></tr></thead><tbody>${
      data.asistentes.map((a) => `<tr><td>${esc(a.cargo)}</td><td>${esc(a.contacto)}</td></tr>`).join('')
    }</tbody></table>`
    : ''

  const lineasNegocio = [
    data.lineasNegocio.deposito && 'Depósito Aduanero',
    data.lineasNegocio.zf && 'Zona Franca',
    data.lineasNegocio.tlocal && 'Transporte Local',
    data.lineasNegocio.cedi && 'CEDI IMC',
  ].filter(Boolean).join(', ')

  const body = [
    section('Info General', [
      row('Tipo de cliente', data.tipoCliente),
      row('Manejo', data.manejo.join(', ')),
      row('Sector / Tipo de mercancía', data.sector),
      row('Canal de comunicación', data.canal),
      row('Líneas de negocio', lineasNegocio),
      row('Fecha tentativa 1er proceso', data.fechaProceso),
      row('Analista de operaciones', analistaNombre),
      row('Observaciones generales', data.obsGeneral),
    ].join('')),
    data.contactos.length ? `<div class="fp-seccion"><div class="fp-seccion-titulo">Contactos</div>${contactosRows}</div>` : '',
    (data.tipoCliente === 'Intermediario' || data.tipoCliente === 'Referido')
      ? section('Cliente que refiere', [
        row('Empresa intermediaria', data.refEmpresa),
        row('NIT', data.refNit),
        row('Dirección', data.refDir),
        row('Teléfono', data.refTel),
      ].join(''))
      : '',
    section('Facturación', [
      row('Forma de pago', data.formaPago),
      row('Fecha de cierre de facturación', data.fechaCierre),
      row('Facturar a', data.facturarA),
      row('Buzón facturación electrónica', data.buzon),
      row('Pago realizado por', data.pagoPor),
      row('Teléfono contacto', data.telContacto),
      row('Tipo de tarifa', data.tipoTarifa),
      row('Aplica comisión', data.comision),
      row('Aplica cobro seguro', data.seguro),
      row('Contacto pago a proveedores', data.contactoPago),
      row('Almacenamiento LOGIMAT (1er / 2do mes)', [data.almLg.p1, data.almLg.p2].filter(Boolean).join(' / ')),
      row('Almacenamiento IMCC CARGO (1er / 2do mes)', [data.almIc.p1, data.almIc.p2].filter(Boolean).join(' / ')),
      row('Almacenamiento IMC DEPÓSITO (1er / 2do mes)', [data.almId.p1, data.almId.p2].filter(Boolean).join(' / ')),
      row('Facturación LOGIMAT', data.factLg),
      row('Facturación IMCC CARGO', data.factIc),
      row('Facturación IMC DEPÓSITO', data.factId),
      row('Conteo pallet Logimat', data.pallet),
      row('Conteo pallet IMCC Cargo', data.palletIc),
      row('Rotación', data.rotacion),
    ].join('')),
    section('Operación', [
      row('Tipo de producto', data.tipoProducto),
      row('Aplica producto textil', data.textil),
      row('Aplica reempaque pallets', data.reempaque),
      row('Embalaje de mercancía', data.embalaje),
      row('Control de inventario', data.controlInv),
      row('Nacionaliza', data.nacionaliza),
      row('Proceso especial / adicionales', data.procesoEsp),
      row('Descripción proceso especial', data.procesoDesc),
      row('Manipulación / almacenamiento especial', data.manipulacion),
      row('Detalle general de despachos', data.despachos),
      row('Realizan salidas parciales', data.salidasParciales),
      row('Rotación de mercancía', data.rotacionMerc),
      row('Agencia de aduanas', data.agencia),
      row('Coordinador importaciones aduana', data.coordAduana),
      row('Tipo de entrega servicio masivo', data.entregaTipo),
      row('Horarios de entrega', data.horarios),
      row('Requiere escolta', data.escolta),
      row('Tipología de vehículo', data.vehiculo),
      row('Requiere citas para entrega', data.citas),
      row('Requerimientos cargue/descargue', data.cargue),
      row('Observaciones transporte', data.obsTransporte),
    ].join('')),
    (data.asistentes.length || data.obsKickoff.trim())
      ? `<div class="fp-seccion"><div class="fp-seccion-titulo">Kick Off</div>${asistentesRows}${
        data.obsKickoff.trim() ? `<p style="font-size:13px;margin-top:10px">${esc(data.obsKickoff)}</p>` : ''
      }</div>`
      : '',
  ].join('')

  return `<style>${FP_STYLES}</style>
<div class="fp-doc">
  <div class="fp-header">
    <div>
      <h1>Ficha de Cliente</h1>
      <div style="font-size:14px;font-weight:700;color:#002366">${esc(record.empresa)}</div>
      ${record.nit ? `<div style="font-size:12px;color:#555">NIT: ${esc(record.nit)}</div>` : ''}
    </div>
    <div class="fp-header-meta">
      Comercial: ${esc(comercialNombre || '—')}<br>
      Ciudad: ${esc(record.ciudad || '—')}<br>
      Fecha: ${esc(new Date().toLocaleDateString('es-CO'))}
    </div>
  </div>
  ${body || '<p style="color:#888;font-size:13px">Sin datos registrados.</p>'}
  <div class="fp-footer">
    <span>Ficha de Cliente · Grupo ZYMO</span>
    <span>${esc(record.empresa)}</span>
  </div>
</div>`
}
