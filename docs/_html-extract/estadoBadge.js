function estadoBadge(rec){
  if(rec.tipo==='prospecto'){
    const map={
      prospecto:'badge-blue',
      reconocimiento:'badge-blue',
      propuesta:'badge-purple',
      resolucion:'badge-purple',
      aceptacion_alcance:'badge-gold',
      aceptacion_propuesta:'badge-gold',
      firma_contrato:'badge-green',
      creacion_sop:'badge-green',
      facturado:'badge-green',
      frio:'badge-gray',
      perdido:'badge-red',
      // legado
      seguimiento:'badge-blue', cerrado:'badge-green'
    };
    const labels={
      prospecto:'Prospecto',
      reconocimiento:'Visita',
      propuesta:'Propuesta Comercial',
      resolucion:'Resolución de Dudas',
      aceptacion_alcance:'Acept. Alcance',
      aceptacion_propuesta:'Acept. Propuesta',
      firma_contrato:'Firma Contrato',
      creacion_sop:'Creación Ficha Cliente',
      facturado:'Facturado',
      frio:'Frío',
      perdido:'Perdido',
      seguimiento:'En Seguimiento', cerrado:'Cerrado'
    };
    const est = rec.estadoProspecto||'prospecto';
    return `<span class="badge ${map[est]||'badge-gray'}">${labels[est]||est}</span>`;
  } else {
    const map={activo:'badge-green',inactivo:'badge-gray',riesgo:'badge-red'};
    const labels={activo:'Activo',inactivo:'Inactivo',riesgo:'En Riesgo'};
    const est = rec.estadoCliente||'activo';
    return `<span class="badge ${map[est]||'badge-gray'}">${labels[est]||est}</span>`;
  }
}