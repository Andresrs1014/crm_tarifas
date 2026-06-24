function saveRecord(){
  const empresa = document.getElementById('f-empresa').value.trim();
  const comercialId = document.getElementById('f-comercial').value;
  if(!empresa){ toast('⚠️','Ingresa el nombre de la empresa','#f5a623'); return; }
  if(!comercialId){ toast('⚠️','Selecciona un comercial responsable','#f5a623'); return; }
  if(selectedServices.length===0){ toast('⚠️','Selecciona al menos un servicio','#f5a623'); return; }

  const tipo = document.getElementById('tipo-registro').value;
  const comercial = db.comerciales.find(c=>c.id===comercialId);

  const contactos = getContactosForm();
  const contactoPrincipal = contactos[0] || {};

  const rec = {
    id: 'r'+Date.now(),
    tipo,
    empresa,
    nit: document.getElementById('f-nit').value,
    contacto:  contactoPrincipal.nombre  || '',
    cargo:     contactoPrincipal.cargo   || '',
    telefono:  contactoPrincipal.telefono|| '',
    email:     contactoPrincipal.email   || '',
    contactos,
    ciudad:     document.getElementById('f-ciudad').value,
    direccion: document.getElementById('f-direccion')?.value.trim()||'',
    comercialId,
    comercialNombre: comercial?.nombre||'—',
    servicios: [...selectedServices],
    fecha: document.getElementById('f-fecha').value || today(),
    categoria: document.getElementById('f-categoria')?.value || '',
    actividades: []
  };

  if(tipo === 'cliente'){
    rec.tipoCliente = document.getElementById('f-tipo-cliente')?.value || 'directo';
    if(rec.tipoCliente === 'referido'){
      rec.clienteIndirectoId = document.getElementById('f-cliente-indirecto')?.value || '';
      const ind = db.records.find(r=>r.id===rec.clienteIndirectoId);
      rec.clienteIndirectoNombre = ind?.empresa || '';
    }
    if(rec.tipoCliente === 'indirecto'){
      rec.comision = document.getElementById('f-comision')?.value || '';
    }
  }

  if(tipo==='prospecto'){
    rec.estadoProspecto    = document.getElementById('f-estado-prospecto').value;
    rec.visita             = document.getElementById('f-visita').value;
    rec.fechaVisita        = document.getElementById('f-fecha-visita').value;
    rec.proximoSeguimiento = document.getElementById('f-proximo-seguimiento').value;
    rec.ingresosEsperados  = Number(document.getElementById('f-ingresos-esperados').value)||0;
    rec.observaciones      = document.getElementById('f-obs-prospecto').value;
    rec.facturadoP         = document.getElementById('f-facturado-p').value;
    if(rec.facturadoP !== 'no'){
      rec.facturacionLineas = getBillingLines('p');
      rec.valorP = calcTotalBilling(rec.facturacionLineas);
    } else {
      rec.facturacionLineas = {};
      rec.valorP = 0;
    }
    if(rec.visita!=='no') rec.actividades.push({tipo:'visit',fecha:rec.fechaVisita||rec.fecha,desc:'Visita/Contacto: '+rec.visita});
    if(rec.valorP>0) rec.actividades.push({tipo:'invoice',fecha:rec.fecha,desc:'Facturación: $'+rec.valorP.toLocaleString('es-CO')});
  } else {
    rec.estadoCliente      = document.getElementById('f-estado-cliente').value;
    rec.visitaCliente      = document.getElementById('f-visita-cliente').value;
    rec.fechaVisitaCliente = document.getElementById('f-fecha-visita-cliente').value;
    rec.nuevoServicio      = document.getElementById('f-nuevo-servicio').value;
    rec.servicioNuevo      = document.getElementById('f-servicio-nuevo').value;
    rec.facturado          = document.getElementById('f-facturado').value;
    rec.observaciones      = document.getElementById('f-obs-cliente').value;
    if(rec.facturado !== 'no'){
      rec.facturacionLineas = getBillingLines('c');
      rec.valor = calcTotalBilling(rec.facturacionLineas);
    } else {
      rec.facturacionLineas = {};
      rec.valor = 0;
    }
    if(rec.visitaCliente!=='no') rec.actividades.push({tipo:'visit',fecha:rec.fechaVisitaCliente||rec.fecha,desc:'Visita cliente: '+rec.visitaCliente});
    if(rec.nuevoServicio==='si') rec.actividades.push({tipo:'service',fecha:rec.fecha,desc:'Nuevo servicio: '+(rec.servicioNuevo||'Sin especificar')});
    if(rec.valor>0) rec.actividades.push({tipo:'invoice',fecha:rec.fecha,desc:'Facturación: $'+Number(rec.valor).toLocaleString('es-CO')});
  }

  db.records.push(rec);
  if(rec.tipo==='cliente'){ mrGetData(rec.id); }
  save();
  clearForm();
  toast('✅','Registro guardado exitosamente','#00e676');
  setTimeout(()=>showPage('dashboard'),1200);
}