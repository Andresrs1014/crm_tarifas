var _fichaRecId = null;

function fichaBuscarIntermediario(q){
  var dd = document.getElementById('fc-ref-dropdown');
  if(!dd) return;
  if(!q || q.length < 2){ dd.style.display='none'; return; }
  var intermediarios = db.records.filter(function(r){
    return r.tipo==='cliente' || r.estadoProspecto==='facturado';
  }).filter(function(r){
    return (r.empresa||'').toLowerCase().indexOf(q.toLowerCase()) >= 0;
  }).slice(0,8);
  if(!intermediarios.length){ dd.style.display='none'; return; }
  dd.style.display='block';
  dd.onclick = function(e){
    var item = e.target.closest('.fc-ref-item');
    if(item) fichaSeleccionarIntermediario(item.dataset.recid);
  };
  dd.innerHTML = intermediarios.map(function(r){
    return '<div class="fc-ref-item" data-recid="'+r.id+'" style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);font-size:13px;color:var(--text)">'
      +'<div style="font-weight:700">'+r.empresa+'</div>'
      +'<div style="font-size:11px;color:var(--text2)">'+(r.nit?'NIT: '+r.nit+' · ':'')+( r.ciudad||'')+'</div>'
      +'</div>';
  }).join('');
}

function fichaSeleccionarIntermediario(recId){
  var rec = db.records.find(function(r){ return r.id===recId; });
  if(!rec) return;
  var dd = document.getElementById('fc-ref-dropdown');
  if(dd) dd.style.display='none';
  var emp = document.getElementById('fc-ref-empresa');
  if(emp) emp.value = rec.empresa||'';
  var nit = document.getElementById('fc-ref-nit');
  if(nit) nit.value = rec.nit||'';
  var dir = document.getElementById('fc-ref-dir');
  if(dir) dir.value = rec.direccion||rec.dir||'';
  var tel = document.getElementById('fc-ref-tel');
  if(tel) tel.value = rec.telefono||rec.tel||'';
  // Guardar el recId referente
  var input = document.getElementById('fc-ref-empresa');
  if(input) input.dataset.recid = recId;
}

function fichaPopularFacturacion(recId){
  var rec = recId ? db.records.find(function(r){ return r.id===recId; }) : null;
  if(!rec) return;

  // Construir opciones con teléfono asociado
  var tel = rec.telefono || rec.tel || '';
  var opciones = [{val: rec.empresa, label: rec.empresa+' (cliente)', tel: tel}];

  // Buscar referido/intermediario desde la ficha guardada
  var data = getFichaData(recId);
  var refEmp = data.ref_empresa || '';
  var refNit = data.ref_nit || '';
  var refTel = data.ref_tel || '';
  if(refEmp && refEmp !== rec.empresa){
    // Buscar teléfono del referente en db.records
    var refRec = db.records.find(function(r){ return r.empresa===refEmp; });
    if(refRec && !refTel) refTel = refRec.telefono || refRec.tel || '';
    opciones.push({val: refEmp, label: refEmp+' (referente/intermediario)', tel: refTel});
  }

  opciones.push({val: '__otro__', label: '— Otro (ingresar manualmente) —', tel: ''});

  // Guardar mapa tel en el select para usarlo en onchange
  ['fc-facturar-a-sel','fc-pago-por-sel'].forEach(function(selId){
    var sel = document.getElementById(selId);
    if(!sel) return;
    var current = sel.dataset.current || '';
    sel.innerHTML = '<option value="">— Seleccionar —</option>'
      + opciones.map(function(o){
          return '<option value="'+o.val+'" data-tel="'+(o.tel||'')+'"'+(current===o.val?' selected':'')+'>'+o.label+'</option>';
        }).join('');
    sel._opcionesTel = {};
    opciones.forEach(function(o){ sel._opcionesTel[o.val] = o.tel||''; });
  });
}

function fichaOnFacturarAChange(val){
  var input = document.getElementById('fc-facturar-a');
  if(!input) return;
  if(val==='__otro__'){
    input.style.display='block';
    input.value='';
    input.focus();
  } else {
    input.style.display='none';
    input.value=val;
  }
  fichaCalcPct();
}

function fichaOnPagoPorChange(val){
  var input = document.getElementById('fc-pago-por');
  if(!input) return;
  if(val==='__otro__'){
    input.style.display='block';
    input.value='';
    input.focus();
  } else {
    input.style.display='none';
    input.value=val;
    // Auto-llenar teléfono de contacto
    var sel = document.getElementById('fc-pago-por-sel');
    var telEl = document.getElementById('fc-tel-contacto');
    if(sel && telEl && sel._opcionesTel && sel._opcionesTel[val] !== undefined){
      telEl.value = sel._opcionesTel[val] || '';
    }
  }
  fichaCalcPct();
}

function fichaOnTipoChange(tipo){
  var refSec = document.getElementById('fc-refiere-section');
  if(refSec) refSec.style.display = tipo==='Referido' ? 'block' : 'none';
}

function fichaPopularPropuestas(recId){
  var lista = document.getElementById('fc-propuesta-lista');
  if(!lista) return;
  var rec = recId ? db.records.find(function(r){ return r.id===recId; }) : null;
  var cots = (db.cotizaciones||[]).filter(function(c){
    if(!rec) return true;
    return (c.empresa||'').toLowerCase().indexOf((rec.empresa||'').toLowerCase()) >= 0 ||
           (rec.empresa||'').toLowerCase().indexOf((c.empresa||'').toLowerCase()) >= 0;
  });

  // Obtener propuestas ya seleccionadas
  var data = recId ? getFichaData(recId) : {};
  var activas = data.propuestas_ids || [];

  if(!cots.length){
    lista.innerHTML = '<div style="font-size:12px;color:var(--text2);padding:8px">No hay propuestas creadas para este cliente</div>';
    return;
  }

  // Separar activas y no activas
  var cotsActivas = cots.filter(function(c){ return activas.includes(c.id); });
  var cotsInactivas = cots.filter(function(c){ return !activas.includes(c.id); });
  var ordenadas = cotsActivas.concat(cotsInactivas);

  lista.innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr style="background:var(--surface2)">'
    +'<th style="width:32px;padding:7px 10px;border-bottom:1px solid var(--border)"></th>'
    +'<th style="padding:7px 10px;text-align:left;color:var(--text2);font-weight:700;border-bottom:1px solid var(--border);letter-spacing:0.8px;text-transform:uppercase;font-size:10px">N° Cotización</th>'
    +'<th style="padding:7px 10px;text-align:left;color:var(--text2);font-weight:700;border-bottom:1px solid var(--border);letter-spacing:0.8px;text-transform:uppercase;font-size:10px">Servicios</th>'
    +'<th style="padding:7px 10px;text-align:left;color:var(--text2);font-weight:700;border-bottom:1px solid var(--border);letter-spacing:0.8px;text-transform:uppercase;font-size:10px">Fecha</th>'
    +'<th style="padding:7px 10px;text-align:center;color:var(--text2);font-weight:700;border-bottom:1px solid var(--border);letter-spacing:0.8px;text-transform:uppercase;font-size:10px">Estado</th>'
    +'<th style="width:50px;padding:7px 10px;border-bottom:1px solid var(--border)"></th>'
    +'</tr></thead>'
    +'<tbody>'
    + ordenadas.map(function(c, i){
        var activo = activas.includes(c.id);
        var lineas = (c.lineas||[]).join(', ')||'—';
        var bgRow = activo ? 'rgba(0,194,255,0.05)' : 'transparent';
        var border = i < ordenadas.length-1 ? 'border-bottom:1px solid var(--border)' : '';
        return '<tr style="background:'+bgRow+';'+border+'">'
          +'<td style="padding:8px 10px;text-align:center">'
          +'<input type="checkbox" data-cotid="'+c.id+'" '+(activo?'checked':'')+' onchange="fichaTogglePropuesta(this)">'
          +'</td>'
          +'<td style="padding:8px 10px;font-size:14px;font-weight:800;color:'+(activo?'var(--accent)':'var(--text)')+'">'+( c.numero||'BORRADOR')+'</td>'
          +'<td style="padding:8px 10px;color:var(--text2);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+lineas+'</td>'
          +'<td style="padding:8px 10px;color:var(--text2);white-space:nowrap">'+(c.fecha||'—')+'</td>'
          +'<td style="padding:8px 10px;text-align:center">'
          +(activo
            ? '<span style="background:rgba(0,194,255,0.12);color:var(--accent);border:1px solid rgba(0,194,255,0.3);border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700">✓ Activa</span>'
            : '<span style="background:var(--surface2);color:var(--text2);border:1px solid var(--border);border-radius:12px;padding:2px 10px;font-size:10px">Inactiva</span>'
          )+'</td>'
          +'<td style="padding:8px 10px;text-align:center">'
          +'<button class="ficha-ver-cot" data-vcid="'+c.id+'" style="background:none;border:1px solid var(--border);color:var(--text2);border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer">👁</button>'
          +'</td>'
          +'</tr>';
      }).join('')
    +'</tbody></table>';

  lista.addEventListener('click', function(e){
    var btn = e.target.closest('.ficha-ver-cot');
    if(btn){ e.preventDefault(); e.stopPropagation(); fichaVerCotizacionId(btn.dataset.vcid); }
  });
  fichaRenderEnlaces(recId);
}

function fichaRenderEnlaces(recId){
  var el = document.getElementById('fc-enlaces-lista');
  if(!el) return;
  var data = recId ? getFichaData(recId) : {};
  var activas = data.propuestas_ids || [];
  if(!activas.length){
    el.innerHTML = '<div style="font-size:11px;color:var(--text2);font-style:italic">Los enlaces se generan automáticamente al seleccionar propuestas activas</div>';
    return;
  }
  el.innerHTML = activas.map(function(cotId){
    var cot = (db.cotizaciones||[]).find(function(c){ return c.id===cotId; });
    if(!cot) return '';
    var base = window.location.href.split('?')[0];
    var link = base + '?ZYMO=' + (cot.numero||cot.id).replace(/-/g,'');
    return '<div style="display:flex;align-items:center;gap:8px;background:var(--surface2);border:1px solid var(--border);border-radius:7px;padding:8px 12px">'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:11px;font-weight:700;color:var(--accent);margin-bottom:2px">'+(cot.numero||'BORRADOR')+'</div>'
      +'<div style="font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+link+'</div>'
      +'</div>'
      +'<button class="fc-copy-link" data-link="'+link+'" style="background:rgba(0,194,255,0.1);border:1px solid rgba(0,194,255,0.3);color:var(--accent);border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0">📋 Copiar</button>'
      +'</div>';
  }).filter(Boolean).join('');
  el.addEventListener('click', function(e){
    var btn = e.target.closest('.fc-copy-link');
    if(btn && btn.dataset.link){
      navigator.clipboard.writeText(btn.dataset.link).then(function(){ toast('✅','Link copiado','#00e676'); });
    }
  }, {once:true});
}

function fichaTogglePropuesta(chk){
  // Re-renderizar para mantener orden (activas primero)
  // Guardar estado actual de todos los checks
  var lista = document.getElementById('fc-propuesta-lista');
  var checks = lista ? lista.querySelectorAll('input[type=checkbox]') : [];
  var activas = [];
  checks.forEach(function(cb){ if(cb.checked) activas.push(cb.dataset.cotid); });
  // Actualizar la fila visualmente sin re-renderizar completo
  var row = chk.closest('tr');
  if(!row) return;
  if(chk.checked){
    row.style.background = 'rgba(0,194,255,0.05)';
    var numCell = row.cells[1]; if(numCell) numCell.style.color='var(--accent)';
    var badge = row.cells[4]; if(badge) badge.innerHTML='<span style="background:rgba(0,194,255,0.12);color:var(--accent);border:1px solid rgba(0,194,255,0.3);border-radius:12px;padding:2px 10px;font-size:10px;font-weight:700">✓ Activa</span>';
  } else {
    row.style.background = 'transparent';
    var numCell = row.cells[1]; if(numCell) numCell.style.color='var(--text)';
    var badge = row.cells[4]; if(badge) badge.innerHTML='<span style="background:var(--surface2);color:var(--text2);border:1px solid var(--border);border-radius:12px;padding:2px 10px;font-size:10px">Inactiva</span>';
  }
  fichaRenderEnlaces(_fichaRecId);
}

function fichaGetPropuestasActivas(){
  var lista = document.getElementById('fc-propuesta-lista');
  if(!lista) return [];
  return Array.from(lista.querySelectorAll('input[type=checkbox]:checked')).map(function(cb){ return cb.dataset.cotid; });
}

function fichaVerCotizacionId(cotId){
  showPage('cotizaciones');
  setTimeout(function(){ if(typeof verCotizacion==='function') verCotizacion(cotId); }, 300);
}

function fichaOnPropuestaChange(cotId){
  fichaCalcPct();
  var preview = document.getElementById('fc-propuesta-preview');
  var enlaceEl = document.getElementById('fc-enlace');
  if(!cotId){ if(preview) preview.style.display='none'; return; }
  var cot = (db.cotizaciones||[]).find(function(c){ return c.id===cotId; });
  if(!cot){ if(preview) preview.style.display='none'; return; }
  if(preview) preview.style.display='block';
  var num = document.getElementById('fc-propuesta-num');
  var info = document.getElementById('fc-propuesta-info');
  if(num) num.textContent = cot.numero || 'BORRADOR';
  if(info){
    var lineas = (cot.lineas||[]).join(', ') || '—';
    var fecha = cot.fecha ? ' · '+cot.fecha : '';
    info.textContent = lineas + fecha;
  }
  // Auto-llenar enlace
  if(enlaceEl) enlaceEl.value = '#cot-'+cotId;
}

function fichaVerCotizacion(){
  var cotId = document.getElementById('fc-propuesta').value;
  if(!cotId) return;
  // Navegar a cotizaciones y abrir la cotización
  showPage('cotizaciones');
  setTimeout(function(){ verCotizacion(cotId); }, 300);
}

function fichaPopularAnalistas(){
  var sel = document.getElementById('fc-analista');
  if(!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="">— Seleccionar analista —</option>';
  (db.analistas||[]).forEach(function(a){
    var opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.nombre;
    sel.appendChild(opt);
  });
  if(current) sel.value = current;
}

function fichaOnAnalistaChange(analistaId){
  var infoDiv = document.getElementById('fc-analista-info');
  var emailEl = document.getElementById('fc-analista-email');
  var telEl   = document.getElementById('fc-analista-tel');
  if(!analistaId){ if(infoDiv) infoDiv.style.display='none'; return; }
  var a = (db.analistas||[]).find(function(x){ return x.id===analistaId; });
  if(!a){ if(infoDiv) infoDiv.style.display='none'; return; }
  if(infoDiv) infoDiv.style.display='block';
  if(emailEl) emailEl.textContent = a.email||'';
  if(telEl)   telEl.textContent   = a.tel||'';
}



function fichaAbrirNuevoAnalista(){
  var form = document.getElementById('fc-analista-form');
  if(!form) return;
  form.style.display = (form.style.display==='none'||form.style.display==='') ? 'flex' : 'none';
  if(form.style.display==='flex'){
    document.getElementById('fc-an-nombre').value='';
    document.getElementById('fc-an-email').value='';
    document.getElementById('fc-an-tel').value='';
    setTimeout(function(){ document.getElementById('fc-an-nombre').focus(); },50);
  }
}

function fichaGuardarNuevoAnalista(){
  var nombre = document.getElementById('fc-an-nombre').value.trim();
  if(!nombre){ toast('⚠️','Ingresa el nombre del analista','#f5a623'); return; }
  var email = document.getElementById('fc-an-email').value.trim();
  var tel   = document.getElementById('fc-an-tel').value.trim();
  if(!db.analistas) db.analistas = [];
  var nuevo = {id:'a'+Date.now(), nombre:nombre, email:email, tel:tel};
  db.analistas.push(nuevo);
  save();
  document.getElementById('fc-analista-form').style.display='none';
  fichaPopularAnalistas();
  document.getElementById('fc-analista').value = nuevo.id;
  fichaOnAnalistaChange(nuevo.id);
  toast('✅','Analista agregado','#00e676');
}

function fichaEliminarAnalista(){
  var sel = document.getElementById('fc-analista');
  var id = sel ? sel.value : '';
  if(!id){ toast('⚠️','Selecciona un analista para eliminar','#f5a623'); return; }
  var a = (db.analistas||[]).find(function(x){ return x.id===id; });
  if(!a) return;
  if(!confirm('¿Eliminar al analista "'+a.nombre+'"?')) return;
  db.analistas = db.analistas.filter(function(x){ return x.id!==id; });
  save();
  fichaPopularAnalistas();
  fichaOnAnalistaChange('');
  toast('✅','Analista eliminado','#00e676');
}

function fichaTab(btn, tabId){
  document.querySelectorAll('.ficha-tab-btn').forEach(function(b){
    b.style.borderBottomColor='transparent'; b.style.color='var(--text2)';
  });
  document.querySelectorAll('.ficha-tab-content').forEach(function(t){ t.style.display='none'; });
  btn.style.borderBottomColor='var(--accent)'; btn.style.color='var(--text)';
  document.getElementById(tabId).style.display='';
}

function getFichaData(recId){
  // Primero buscar en db.records (estrategia nueva)
  var rec = db.records.find(function(r){ return r.id===recId; });
  if(rec && rec.fichaData) return rec.fichaData;
  // Migrar desde localStorage si existe
  try {
    var raw = localStorage.getItem('ficha-'+recId);
    if(raw){
      var migrated = JSON.parse(raw);
      if(rec){ rec.fichaData = migrated; save(); }
      try { localStorage.removeItem('ficha-'+recId); } catch(e){}
      return migrated;
    }
  } catch(e){}
  return {
    tipo:'', manejo:'', sector:'', canal:'', propuesta:'', enlace:'',
    lb:{deposito:null, zf:null, tlocal:null, cedi:null},
    fecha_proceso:'', analista_id:'', analista:'', obs_general:'',
    contactos:[],
    ref_empresa:'', ref_nit:'', ref_dir:'', ref_tel:'',
    propuestas_ids:[],
    forma_pago:'', fecha_cierre:'', facturar_a:'', buzon:'', pago_por:'',
    tipo_tarifa:'', comision:'', seguro:'',
    alm:{lg_p1:'', lg_p2:'', ic_p1:'', ic_p2:'', id_p1:'', id_p2:''},
    fact_lg:'', pallet:'', rotacion:'', contacto_pago:'',
    tipo_producto:'', textil:'', reempaque:'', embalaje:'', control_inv:'',
    nacionaliza:'', proceso_esp:'', proceso_desc:'', manipulacion:'',
    despachos:'', salidas_parciales:'', rotacion_merc:'', agencia:'', coord_aduana:'',
    entrega_tipo:'', horarios:'', escolta:'', vehiculo:'', citas:'', cargue:'', obs_transporte:'',
    asistentes:[],
    obs_kickoff:'', estado:'pendiente',
    fecha_creacion: new Date().toISOString().slice(0,10)
  };
}

function saveFichaData(recId, data){
  var rec = db.records.find(function(r){ return r.id===recId; });
  if(rec){ rec.fichaData = data; save(); }
}

function fichaCalcPct(){
  var campos = [
    'fc-tipo','fc-manejo','fc-sector','fc-canal','fc-propuesta',
    'fc-forma-pago','fc-facturar-a','fc-buzon','fc-tipo-tarifa',
    'fc-tipo-producto','fc-embalaje','fc-control-inv','fc-agencia','fc-analista'
  ];
  var filled = campos.filter(function(id){
    if(id==='fc-manejo'){
      var cbs = document.querySelectorAll('.fc-manejo-cb:checked');
      return cbs.length > 0;
    }
    var el = document.getElementById(id);
    return el && el.value && el.value.trim() !== '';
  }).length;
  var pct = Math.round((filled / campos.length) * 100);
  var bar = document.getElementById('ficha-progress-bar');
  var lbl = document.getElementById('ficha-pct-label');
  // Si estado = completada → forzar 100%
  var estadoEl = document.getElementById('fc-estado');
  if(estadoEl && estadoEl.value === 'completada') pct = 100;
  if(bar) bar.style.width = pct+'%';
  if(bar) bar.style.background = pct === 100 ? '#00e676' : pct >= 50 ? '#facc15' : 'var(--accent)';
  if(lbl) lbl.textContent = pct+'%';
  if(lbl) lbl.style.color = pct === 100 ? '#00e676' : pct >= 50 ? '#facc15' : 'var(--accent)';
}

function fichaAddContacto(){
  var body = document.getElementById('ficha-contactos-body');
  var idx = body.querySelectorAll('tr').length;
  var tr = document.createElement('tr');
  tr.style.borderBottom = '1px solid var(--border)';
  tr.innerHTML = '<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Cargo..."></td>'
    +'<td style="padding:4px 6px"><select class="ficha-input" style="padding:5px 7px"><option value="">Tipo...</option><option value="principal">⭐ Principal</option><option value="comercial">💼 Comercial</option><option value="gestion-documental">📁 Gest. Documental</option><option value="financiero">💰 Financiero</option><option value="operativo">⚙️ Operativo</option></select></td>'
    +'<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Nombre..."></td>'
    +'<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" type="email" placeholder="Email..."></td>'
    +'<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Tel..."></td>'
    +'<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Cel..."></td>'
    +'<td style="padding:4px 6px;text-align:center"><select class="ficha-input" style="padding:5px 7px"><option>Si</option><option>No</option></select></td>'
    +'<td style="padding:4px 6px"><button onclick="this.parentNode.parentNode.remove()" style="background:rgba(255,68,68,0.12);border:1px solid rgba(255,68,68,0.3);color:#ff4444;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:11px">✕</button></td>';
  body.appendChild(tr);
}

function fichaAddAsistente(){
  var body = document.getElementById('ficha-asistentes-body');
  var tr = document.createElement('tr');
  tr.style.borderBottom = '1px solid var(--border)';
  tr.innerHTML = '<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Cargo..."></td>'
    +'<td style="padding:4px 6px"><input class="ficha-input" style="padding:5px 7px" placeholder="Nombre..."></td>'
    +'<td style="padding:4px 6px"><button onclick="this.parentNode.parentNode.remove()" style="background:rgba(255,68,68,0.12);border:1px solid rgba(255,68,68,0.3);color:#ff4444;border-radius:5px;padding:3px 8px;cursor:pointer;font-size:11px">✕</button></td>';
  body.appendChild(tr);
}

function abrirFicha(recId){
  _fichaRecId = recId;
  var rec = db.records.find(function(r){ return r.id===recId; });
  if(!rec) return;
  var data = getFichaData(recId);

  // Título
  document.getElementById('modal-ficha-titulo').textContent = '📋 Ficha: '+rec.empresa;
  document.getElementById('modal-ficha-sub').textContent = (rec.nit?'NIT: '+rec.nit+' · ':'')+( rec.ciudad||'');

  // Pre-llenar datos del CRM
  // Auto-llenar tipo desde el registro (rec.tipoCliente = 'directo'|'indirecto'|'referido')
  var tipoVal = data.tipo || '';
  if(!tipoVal){
    var tipoMap = {directo:'Directo', indirecto:'Intermediario', intermediario:'Intermediario', referido:'Referido'};
    var rawTipo = (rec.tipoCliente||'').toLowerCase();
    tipoVal = tipoMap[rawTipo] || '';
  }
  document.getElementById('fc-tipo').value = tipoVal;
  fichaOnTipoChange(tipoVal);
  // Restaurar manejo (puede ser string o array)
  var manejoArr = Array.isArray(data.manejo) ? data.manejo : (data.manejo ? data.manejo.split(',').map(function(s){return s.trim();}) : []);
  document.querySelectorAll('.fc-manejo-cb').forEach(function(cb){ cb.checked = manejoArr.includes(cb.value); });
  document.getElementById('fc-manejo').value = manejoArr.join(', ');
  document.getElementById('fc-sector').value = data.sector || rec.sector || '';
  document.getElementById('fc-canal').value = data.canal || '';
  // propuesta handled by fichaPopularPropuestas
  document.getElementById('fc-enlace').value = data.enlace || '';
  var svcs = rec.servicios||[];
  var lbDep = (data.lb&&data.lb.deposito!==null) ? data.lb.deposito : svcs.includes('Depósito Aduanero');
  var lbZf  = (data.lb&&data.lb.zf!==null)       ? data.lb.zf       : svcs.includes('Zona Franca');
  var lbTl  = (data.lb&&data.lb.tlocal!==null)   ? data.lb.tlocal   : (svcs.includes('Transporte')||svcs.includes('Paqueteo'));
  var lbCe  = (data.lb&&data.lb.cedi!==null)     ? data.lb.cedi     : svcs.includes('CEDI');
  // Hidden checkboxes (para guardar)
  document.getElementById('fc-lb-deposito').checked = lbDep;
  document.getElementById('fc-lb-zf').checked       = lbZf;
  document.getElementById('fc-lb-tlocal').checked   = lbTl;
  document.getElementById('fc-lb-cedi').checked     = lbCe;
  // Badges estáticos
  document.getElementById('fc-lb-deposito-badge').style.display = lbDep ? 'inline-flex' : 'none';
  document.getElementById('fc-lb-zf-badge').style.display       = lbZf  ? 'inline-flex' : 'none';
  document.getElementById('fc-lb-tlocal-badge').style.display   = lbTl  ? 'inline-flex' : 'none';
  document.getElementById('fc-lb-cedi-badge').style.display     = lbCe  ? 'inline-flex' : 'none';
  document.getElementById('fc-lb-empty').style.display = (lbDep||lbZf||lbTl||lbCe) ? 'none' : 'inline';
  document.getElementById('fc-fecha-proceso').value = data.fecha_proceso || '';
  document.getElementById('fc-analista').value = data.analista || '';
  document.getElementById('fc-obs-general').value = data.obs_general || '';

  // Contactos - limpiar y repoblar
  var cbody = document.getElementById('ficha-contactos-body');
  cbody.innerHTML = '';
  (data.contactos||[]).forEach(function(c){
    fichaAddContacto();
    var last = cbody.lastElementChild;
    var inputs = last.querySelectorAll('input,select');
    if(inputs[0]) inputs[0].value = c.cargo||'';
    if(inputs[1]) inputs[1].value = c.tipoContacto||'';
    if(inputs[2]) inputs[2].value = c.nombre||'';
    if(inputs[3]) inputs[3].value = c.email||'';
    if(inputs[4]) inputs[4].value = c.tel||'';
    if(inputs[5]) inputs[5].value = c.cel||'';
    if(inputs[6]) inputs[6].value = c.aviso||'Si';
  });
  // Si no hay contactos guardados, pre-llenar desde el registro
  if((data.contactos||[]).length === 0){
    // Obtener todos los contactos del registro
    var contactosRec = rec.contactos || [];
    if(contactosRec.length > 0){
      contactosRec.forEach(function(ct){
        fichaAddContacto();
        var last = cbody.lastElementChild;
        var inputs = last.querySelectorAll('input,select');
        if(inputs[0]) inputs[0].value = ct.cargo||'';
        if(inputs[1]) inputs[1].value = ct.tipoContacto||'principal';
        if(inputs[2]) inputs[2].value = ct.nombre||ct.contacto||'';
        if(inputs[3]) inputs[3].value = ct.email||'';
        if(inputs[4]) inputs[4].value = '';
        if(inputs[5]) inputs[5].value = ct.celular||ct.cel||ct.telefono||ct.tel||'';
        if(inputs[6]) inputs[6].value = ct.avisoLlegada||'Si';
      });
    } else if(rec.contacto){
      // Fallback: contacto único del CRM
      fichaAddContacto();
      var last = cbody.lastElementChild;
      var inputs = last.querySelectorAll('input,select');
      if(inputs[1]) inputs[1].value = 'principal';
      if(inputs[2]) inputs[2].value = rec.contacto||'';
      if(inputs[3]) inputs[3].value = rec.email||'';
      if(inputs[4]) inputs[4].value = '';
      if(inputs[5]) inputs[5].value = rec.telefono||rec.tel||'';
    }
  }

  var refEmpEl = document.getElementById('fc-ref-empresa');
  if(refEmpEl) refEmpEl.value = data.ref_empresa||'';
  document.getElementById('fc-ref-nit').value = data.ref_nit||'';
  document.getElementById('fc-ref-dir').value = data.ref_dir||'';
  document.getElementById('fc-ref-tel').value = data.ref_tel||'';

  // Facturación
  document.getElementById('fc-forma-pago').value = data.forma_pago || 'Contado';
  document.getElementById('fc-fecha-cierre').value = data.fecha_cierre||'';
  var factSel = document.getElementById('fc-facturar-a-sel');
  if(factSel){ factSel.dataset.current = data.facturar_a||rec.empresa||''; }
  document.getElementById('fc-facturar-a').value = data.facturar_a||rec.empresa||'';
  if(data.facturar_a && !['',rec.empresa].includes(data.facturar_a)){
    var faSel = document.getElementById('fc-facturar-a-sel');
    if(faSel && faSel.querySelector('option[value="__otro__"]')){
      faSel.value='__otro__';
      var faInp=document.getElementById('fc-facturar-a');
      if(faInp) faInp.style.display='block';
    }
  }
  document.getElementById('fc-buzon').value = data.buzon||rec.email||'';
  var tcEl = document.getElementById('fc-tel-contacto'); if(tcEl) tcEl.value = data.tel_contacto||'';
  document.getElementById('fc-pago-por').value = data.pago_por||'';
  document.getElementById('fc-tipo-tarifa').value = data.tipo_tarifa||'';
  document.getElementById('fc-comision').value = data.comision||'';
  document.getElementById('fc-seguro').value = data.seguro||'';
  var alm = data.alm||{};
  document.getElementById('fc-alm-lg-p1').value = alm.lg_p1 || 'Ad valorem / Valor CIF de la mercancía';
  document.getElementById('fc-alm-lg-p2').value = alm.lg_p2 || 'Posición Pallet';
  document.getElementById('fc-alm-ic-p1').value = alm.ic_p1 || 'Posición Pallet';
  document.getElementById('fc-alm-ic-p2').value = alm.ic_p2 || 'Posición Pallet';
  document.getElementById('fc-alm-id-p1').value = alm.id_p1 || 'Ad valorem / Valor CIF de la mercancía';
  document.getElementById('fc-alm-id-p2').value = alm.id_p2 || 'Posición Pallet';
  var fic = document.getElementById('fc-fact-ic'); if(fic) fic.value = data.fact_ic||'Anticipada';
  var fid = document.getElementById('fc-fact-id'); if(fid) fid.value = data.fact_id||'Anticipada';
  var pic = document.getElementById('fc-pallet-ic'); if(pic) pic.value = data.pallet_ic||'No aplica';
  var fflg = document.getElementById('fc-forma-fact-lg'); if(fflg) fflg.value = data.forma_fact_lg||'Por documento de transporte';
  var cflg = document.getElementById('fc-cant-fact-lg');  if(cflg) cflg.value = data.cant_fact_lg||'Factura por documento de transporte';
  var ffic = document.getElementById('fc-forma-fact-ic'); if(ffic) ffic.value = data.forma_fact_ic||'Por documento de transporte';
  var cfic = document.getElementById('fc-cant-fact-ic');  if(cfic) cfic.value = data.cant_fact_ic||'Factura por ingreso';
  var ffid = document.getElementById('fc-forma-fact-id'); if(ffid) ffid.value = data.forma_fact_id||'Por documento de transporte';
  var cfid = document.getElementById('fc-cant-fact-id');  if(cfid) cfid.value = data.cant_fact_id||'Factura por documento de transporte';
  document.getElementById('fc-fact-lg').value = data.fact_lg || 'Anticipada';
  document.getElementById('fc-pallet').value = data.pallet||'No aplica';
  document.getElementById('fc-rotacion').value = data.rotacion||'Mensual';
  document.getElementById('fc-contacto-pago').value = data.contacto_pago||'';

  // Operación
  document.getElementById('fc-tipo-producto').value = data.tipo_producto||'';
  document.getElementById('fc-textil').value = data.textil||'';
  document.getElementById('fc-reempaque').value = data.reempaque||'';
  document.getElementById('fc-embalaje').value = data.embalaje||'';
  document.getElementById('fc-control-inv').value = data.control_inv||'';
  document.getElementById('fc-nacionaliza').value = data.nacionaliza||'';
  document.getElementById('fc-proceso-esp').value = data.proceso_esp||'';
  document.getElementById('fc-proceso-desc').value = data.proceso_desc||'';
  document.getElementById('fc-manipulacion').value = data.manipulacion||'';
  document.getElementById('fc-despachos').value = data.despachos||'';
  document.getElementById('fc-salidas-parciales').value = data.salidas_parciales||'';
  document.getElementById('fc-rotacion-merc').value = data.rotacion_merc||'';
  document.getElementById('fc-agencia').value = data.agencia||'';
  document.getElementById('fc-coord-aduana').value = data.coord_aduana||'';
  document.getElementById('fc-entrega-tipo').value = data.entrega_tipo||'';
  document.getElementById('fc-horarios').value = data.horarios||'';
  document.getElementById('fc-escolta').value = data.escolta||'';
  document.getElementById('fc-vehiculo').value = data.vehiculo||'';
  document.getElementById('fc-citas').value = data.citas||'';
  document.getElementById('fc-cargue').value = data.cargue||'';
  document.getElementById('fc-obs-transporte').value = data.obs_transporte||'';

  // Kick off
  var abody = document.getElementById('ficha-asistentes-body');
  abody.innerHTML = '';
  (data.asistentes||[]).forEach(function(a){
    fichaAddAsistente();
    var last = abody.lastElementChild;
    var inputs = last.querySelectorAll('input');
    if(inputs[0]) inputs[0].value = a.cargo||'';
    if(inputs[1]) inputs[1].value = a.contacto||'';
  });

  document.getElementById('fc-obs-kickoff').value = data.obs_kickoff||'';
  document.getElementById('fc-estado').value = data.estado||'pendiente';
  var btnPdf = document.getElementById('btn-pdf-ficha');
  if(btnPdf){ var esCompl=(data.estado||'pendiente')==='completada'; btnPdf.style.opacity=esCompl?'1':'0.3'; btnPdf.style.pointerEvents=esCompl?'auto':'none'; btnPdf.title=esCompl?'Descargar PDF':'La ficha debe estar Completada para descargar PDF'; }

  // Reset to first tab
  document.querySelectorAll('.ficha-tab-btn').forEach(function(b,i){
    b.style.borderBottomColor= i===0 ? 'var(--accent)':'transparent';
    b.style.color = i===0 ? 'var(--text)':'var(--text2)';
  });
  document.querySelectorAll('.ficha-tab-content').forEach(function(t,i){ t.style.display = i===0 ? '':'none'; });
  fichaPopularAnalistas();
  fichaPopularPropuestas(_fichaRecId);
  fichaPopularFacturacion(_fichaRecId);
  // Restaurar analista seleccionado
  if(data.analista_id){
    document.getElementById('fc-analista').value = data.analista_id;
    fichaOnAnalistaChange(data.analista_id);
  }
  // Mostrar/ocultar cliente que refiere según tipo
  fichaOnTipoChange(data.tipo||'');
  // Mostrar refiere si tiene datos guardados
  if(data.ref_nit||data.ref_dir||data.ref_tel){
    var rs=document.getElementById('fc-refiere-section');
    if(rs) rs.style.display='block';
  }
  fichaCalcPct();
  showPage('ficha-detalle');
}

function descargarFichaPDF(recIdParam){
  try{
    var activeId=recIdParam||_fichaRecId;
    if(!activeId){toast("⚠️","Selecciona una ficha primero","#f87171");return;}
    var rec=db.records.find(function(r){return r.id===activeId;});
    if(!rec){toast("⚠️","No se encontró el registro","#f87171");return;}
    var data=getFichaData(activeId);
    if((data.estado||"pendiente")!=="completada"){toast("⚠️","Solo se puede descargar PDF de fichas completadas","#f87171");return;}
    var comercialNombre="";
    if(rec.comercialId){var com=(db.comerciales||[]).find(function(c){return c.id===rec.comercialId;});if(com)comercialNombre=com.nombre;}
    var fechaDoc=data.fecha_proceso||new Date().toLocaleDateString("es-CO");
    var manejoArr=Array.isArray(data.manejo)?data.manejo:(data.manejo||"").split(",").map(function(s){return s.trim();}).filter(Boolean);
    var lineas=[];
    if(rec.servicios){var sv=rec.servicios;
      if(sv.indexOf("Depósito Aduanero")>=0||sv.indexOf("Deposito Aduanero")>=0)lineas.push("Depósito Aduanero");
      if(sv.indexOf("Zona Franca")>=0)lineas.push("Zona Franca");
      if(sv.indexOf("Transporte")>=0)lineas.push("Transporte Local");
      if(sv.indexOf("CEDI")>=0||sv.indexOf("Paqueteo")>=0)lineas.push("CEDI IMC");
    }
    var LG="data:image/png;base64,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";
    var IMCC="data:image/png;base64,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";
    var IMCD="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAc0AAAHNCAMAAAE8nOC5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACTUExURf////+3AO+tBXNcL1NIOiUqShUgT+CjC7GFGjQ0RIJmKqF7IEQ+P8GPFZJxJWNSNdCZEPCuBcSRFKd+HoprKF1PN09FOzEyReKkCph1IyMpStObD7aIGUA8QHtiLWxYMjI8ZU9YeyQuWnuCnLa5yPDx9P7+/tPV3pmdsqerveLj6V5mhm10kUFKcMTH04qPpwAAAB0bHgMAAAAxdFJOU////////////////////////////////////////////////////////////////wAfmk4hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAA5jUlEQVR4Xu2dDXebONOGbSfHaRu3zUn9No03Z9M0Tdpun7T//9+983ELBOgLJDB2fG03BiFpZjSSEELAIsCSwGY6nMgGwVEQfbnc4FfAwRCIuV4v16vlerk8py0FEXwgFqVbrviPJjOpEcmJRFjvlusNRV5vkOZsebtcXssxxOsiR1lWpSTgXQ1CzBZyiNnh12Z9hQ1EbsDhtbANSTZIAP3dyhaiW+hxjXghKWxwkH86afXYGf+sNHYLPkLwL5IYJNRk7uSD1pHzdlpOE05JVHHstLLPfEIsN4hkJ0VALKUrLfaD2iqIV6XFXkLKOm0rKY4GQVSkxXZa0qZYbKelXN8htp20W/vcIDqnxZYldPH8/B2bDhDdk3SxeMamC8Svk1qtjKT+wKYLJKiTIjwBJKC02EA4Q1IXrPX6ebF4ki3a5nClLmNsSCKFkj6v6X/hifc4LwmWLaRwlFKd9KdmwH9ZBflLBYgUoaRUVr95U0LkfwUpQkl5mzTWEBNAIEU8Kf9YAQRShIqJtxtJdxwyIOkTldLihd2EFOlJ+Q9RJeiTFGl/IEGd1E4bBvGpXmErOak5mXGdxCaOREF0O2lqWsQekBSRJeXiGTtpaRFXk1Zib3E0BKIuyb9MD7GIaITWYqNpV4hnhFpiI2kvEasWaokNpv2COHbKtLSIQFTqMrXK3sQ4yiARsNPeIbINDglIUmGnbUtuDt+QwKKZtpaN3QpEb9BO6waRWySkbZRtg1hif8pI2lBCxpuYO8MYz67UCekU6jORhKE9hCfDybCZjgiz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";
    function e(v){return(v||"—").toString().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
    function sec(t){return'<div style="display:flex;align-items:center;gap:8px;margin:12px 0 6px"><span style="font-size:10px;font-weight:800;color:#002366;text-transform:uppercase;letter-spacing:0.8px;background:#dbe8ff;padding:3px 12px;border-radius:10px;white-space:nowrap">'+e(t)+'</span><div style="flex:1;height:1px;background:#c8d8f0"></div></div>';}
    function row(a,b,c,d){
      return '<tr><td style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.3px;padding:3px 6px;width:15%;white-space:nowrap;vertical-align:top">'+e(a)+'</td><td style="font-size:12px;color:#1a1a2e;border-bottom:1px solid #edf2fb;padding:3px 6px;width:32%">'+e(b)+'</td>'
        +(c!==undefined?'<td style="width:6px"></td><td style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.3px;padding:3px 6px;width:15%;white-space:nowrap;vertical-align:top">'+e(c)+'</td><td style="font-size:12px;color:#1a1a2e;border-bottom:1px solid #edf2fb;padding:3px 6px">'+e(d)+'</td>':"")
        +'</tr>';
    }
    function crd(logo,rows){
      return '<div style="border:1px solid #c0d0f0;border-radius:6px;overflow:hidden;flex:1">'
        +'<div style="background:#002366;padding:10px;display:flex;align-items:center;justify-content:center;height:54px">'
        +'<img src="'+logo+'" style="max-height:40px;max-width:140px;object-fit:contain">'
        +'</div><div style="padding:7px 10px"><table style="width:100%;border-collapse:collapse">'+rows+'</table></div></div>';
    }
    function crow(a,b){return'<tr><td style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.3px;padding:2px 4px;width:50%;white-space:nowrap;vertical-align:top">'+e(a)+'</td><td style="font-size:11px;color:#1a1a2e;border-bottom:1px solid #edf2fb;padding:2px 4px">'+e(b)+'</td></tr>';}
    var alm=data.alm||{};
    var propuestaStr=(function(){
      var ids=data.propuestas_ids||[];
      if(!ids.length)return data.propuesta||"—";
      var cots=(db.cotizaciones||[]).filter(function(c){return ids.indexOf(c.id)>=0;});
      return cots.length?cots.map(function(c){return"N° "+(c.numero||c.id);}).join(", "):data.propuesta||"—";
    })();
    var contactosRows=(data.contactos||[]).map(function(c){
      return'<tr><td>'+e(c.cargo)+'</td><td>'+e(c.tipoContacto)+'</td><td>'+e(c.nombre)+'</td><td>'+e(c.email)+'</td><td>'+e(c.cel||c.tel)+'</td><td>'+e(c.aviso)+'</td></tr>';
    }).join("");
    var asisRows=(data.asistentes||[]).map(function(a){return'<tr><td>'+e(a.cargo)+'</td><td>'+e(a.contacto)+'</td></tr>';}).join("");

    var body=
      // ── HEADER ──
      '<div style="background:#002366;padding:16px 24px;display:flex;align-items:center;justify-content:space-between">'
      +'<div style="background:#fff;border-radius:10px;padding:8px 20px;display:flex;align-items:center;gap:24px">'
      +'<img src="'+LG+'" style="height:52px;object-fit:contain;max-width:150px" alt="Logimat">'
      +'<div style="width:1px;height:40px;background:#e0e0e0"></div>'
      +'<img src="'+IMCC+'" style="height:52px;object-fit:contain;max-width:70px" alt="IMC Cargo">'
      +'<img src="'+IMCD+'" style="height:52px;object-fit:contain;max-width:70px" alt="IMC Depósito">'
      +'</div>'
      +'<div style="text-align:right">'
      +'<div style="color:#fff;font-size:15px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase">Ficha de Información del Cliente</div>'
      +'<div style="color:rgba(255,255,255,0.7);font-size:10px;margin-top:4px">Gestión Comercial · Grupo ZYMO</div>'
      +'</div></div>'
      // ── BANNER CLIENTE ──
      +'<div style="background:#eef4ff;border-left:6px solid #002366;padding:14px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c8d8f0">'
      +'<div><div style="font-size:22px;font-weight:900;color:#002366;letter-spacing:-0.5px">'+e(rec.empresa)+'</div>'
      +(rec.nit?'<div style="font-size:10px;color:#666;margin-top:2px">NIT: '+e(rec.nit)+'</div>':"")
      +'</div><div style="display:flex;gap:24px">'
      +'<div style="text-align:right"><div style="font-size:9px;color:#777;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Comercial a cargo</div><div style="font-size:15px;font-weight:700;color:#002366;margin-top:2px">'+e(comercialNombre||"—")+'</div></div>'
      +'<div style="text-align:right"><div style="font-size:9px;color:#777;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Fecha</div><div style="font-size:15px;font-weight:700;color:#002366;margin-top:2px">'+e(fechaDoc)+'</div></div>'
      +'<div style="text-align:right"><div style="font-size:9px;color:#777;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">Estado ficha</div><div style="font-size:15px;font-weight:700;color:#002366;margin-top:2px">'+e(data.estado||"Pendiente")+'</div></div>'
      +'</div></div>'
      // ── BODY ──
      +'<div style="padding:12px 24px">'
      +sec("Información General")
      +'<table style="width:100%;border-collapse:collapse">'
      +row("Tipo de cliente",data.tipo,"Canal de comunicación",data.canal)
      +row("Sector / Mercancía",data.sector,"Analista de operaciones",data.analista)
      +row("Fecha 1er proceso",data.fecha_proceso,"Propuesta comercial",propuestaStr)
      +'</table>'
      +'<div style="display:flex;gap:24px;margin-top:6px">'
      +'<div><div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase">Manejo</div><div style="font-size:12px;color:#1a1a2e">'+e(manejoArr.join(", "))+'</div></div>'
      +(lineas.length?'<div><div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase">Líneas de negocio</div><div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:2px">'+lineas.map(function(l){return'<span style="background:#dbe8ff;border:1px solid #002366;border-radius:8px;padding:1px 8px;font-size:9px;color:#002366;font-weight:600">'+e(l)+'</span>';}).join("")+'</div></div>':"")
      +'</div>'
      +sec("Contactos")
      +'<table style="width:100%;border-collapse:collapse"><thead><tr>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Cargo</th>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Tipo</th>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Nombre</th>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Email</th>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Celular</th>'
      +'<th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Aviso</th>'
      +'</tr></thead><tbody style="font-size:11px">'+contactosRows+'</tbody></table>'
      +sec("Facturación")
      +'<table style="width:100%;border-collapse:collapse">'
      +row("Forma de pago",data.forma_pago,"Fecha cierre",data.fecha_cierre)
      +row("Facturar a",data.facturar_a,"Buzón electrónico",data.buzon)
      +row("Pago realizado por",data.pago_por,"Teléfono contacto",data.tel_contacto)
      +row("Tipo de tarifa",data.tipo_tarifa,"Aplica comisión",data.comision)
      +row("Aplica seguro",data.seguro,"Contacto pago proveedores",data.contacto_pago)
      +'</table>'
      +'<div style="display:flex;gap:10px;margin:10px 0">'
      +crd(LG,  crow("Primer mes",alm.lg_p1)+crow("2do mes",alm.lg_p2)+crow("Tipo facturación",data.fact_lg)+crow("Conteo pallet",data.pallet)+crow("Forma",data.forma_fact_lg)+crow("Cant. facturas",data.cant_fact_lg))
      +crd(IMCC,crow("Primer mes",alm.ic_p1)+crow("2do mes",alm.ic_p2)+crow("Tipo facturación",data.fact_ic)+crow("Conteo pallet",data.pallet_ic)+crow("Forma",data.forma_fact_ic)+crow("Cant. facturas",data.cant_fact_ic))
      +crd(IMCD,crow("Primer mes",alm.id_p1)+crow("2do mes",alm.id_p2)+crow("Tipo facturación",data.fact_id)+crow("Forma",data.forma_fact_id)+crow("Cant. facturas",data.cant_fact_id))
      +'</div>'
      +row("Rotación",data.rotacion,"","")
      +sec("Operación")
      +'<table style="width:100%;border-collapse:collapse">'
      +row("Tipo de producto",data.tipo_producto,"Embalaje",data.embalaje)
      +row("Control inventario",data.control_inv,"Nacionaliza",data.nacionaliza)
      +row("Aplica textil",data.textil,"Reempaque pallets",data.reempaque)
      +row("Rotación mercancía",data.rotacion_merc,"Agencia de Aduanas",data.agencia)
      +row("Coordinador Aduana",data.coord_aduana,"Salidas parciales",data.salidas_parciales)
      +row("Manipulación especial",data.manipulacion,"Detalle despachos",data.despachos)
      +'</table>'
      +sec("Transporte")
      +'<table style="width:100%;border-collapse:collapse">'
      +row("Tipo de entrega",data.entrega_tipo,"Horarios",data.horarios)
      +row("Requiere escolta",data.escolta,"Tipología vehículo",data.vehiculo)
      +row("Citas para entrega",data.citas,"Cargue/descargue",data.cargue)
      +'</table>'
      +(asisRows?sec("Kick Off")+'<table style="width:100%;border-collapse:collapse"><thead><tr><th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Cargo</th><th style="background:#002366;color:#fff;padding:4px 8px;font-size:10px;text-align:left">Contacto</th></tr></thead><tbody style="font-size:11px">'+asisRows+'</tbody></table>':"")
      +(data.obs_kickoff?'<div style="font-size:9px;font-weight:700;color:#666;text-transform:uppercase;margin-top:6px">Observaciones Kick Off</div><div style="font-size:12px;color:#1a1a2e">'+e(data.obs_kickoff)+'</div>':"")
      +'</div>'
      +'<div style="padding:8px 24px 12px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #d0daf5">'
      +'<div style="font-size:9px;color:#999">Logimat · IMC Cargo International · IMC Depósito · Grupo ZYMO</div>'
      +'<div style="font-size:9px;color:#bbb">Generado: '+new Date().toLocaleDateString("es-CO")+' · Confidencial</div>'
      +'</div>';

    var printBtn='<div style="position:fixed;top:12px;right:12px;z-index:9999;display:flex;gap:8px">'
      +'<button onclick="window.print()" style="background:#002366;color:#fff;border:none;border-radius:6px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(0,35,102,0.4)">🖨 Guardar como PDF</button>'
      +'</div>';

    var printCSS='<style>@media print{@page{margin:8mm;size:A4}.no-print{display:none}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style>';
    var fullHtml='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Ficha '+e(rec.empresa)+'</title>'+printCSS+'</head><body style="margin:0;background:#fff;font-family:Segoe UI,Arial,sans-serif">'+body+'<div class="no-print">'+printBtn+'</div></body></html>';

    // Blob → link con download
    var blob=new Blob([fullHtml],{type:"text/html;charset=utf-8"});
    var url=URL.createObjectURL(blob);
    // Intentar abrir nueva pestaña
    var win=window.open(url,"_blank");
    if(win){
      toast("📄","Se abre la ficha — usa el botón \"Guardar como PDF\" o Ctrl+P","#00c2ff");
    } else {
      // Fallback: descarga directa
      var a=document.createElement("a");
      a.href=url;
      a.download="Ficha_"+rec.empresa.replace(/[^a-zA-Z0-9]/g,"_")+".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast("📄","Archivo descargado — ábrelo e imprime como PDF (Ctrl+P)","#00c2ff");
    }
    setTimeout(function(){URL.revokeObjectURL(url);},60000);
  }catch(e2){
    alert("Error: "+e2.message);
  }
}


// ── Matriz de Riesgos: auto-llenar con valores por defecto inteligentes ──
function mrAutoFillDesdeHistorial(recId, mercancia){
  if(!db.matrizRiesgos) db.matrizRiesgos = {};
  var m = mrGetData(recId);

  // 1. Tipo mercancía desde la ficha
  if(mercancia && MR_MERCANCIAS[mercancia]) m.mercancia = mercancia;

  // 2. Buscar historial de clientes similares (mismo tipo de mercancía)
  var similares = (db.records||[]).filter(function(r){
    if(r.id === recId || r.tipo !== 'cliente') return false;
    var dm = db.matrizRiesgos && db.matrizRiesgos[r.id];
    return dm && dm.mercancia === m.mercancia && dm.tipoPersona;
  });

  if(similares.length > 0){
    // Usar moda de cada campo basado en clientes similares
    function moda(arr){ var freq={}; arr.forEach(function(v){ if(v) freq[v]=(freq[v]||0)+1; }); return Object.keys(freq).sort(function(a,b){return freq[b]-freq[a];})[0]||''; }
    var sim_data = similares.map(function(r){ return db.matrizRiesgos[r.id]; });
    if(!m.tipoPersona) m.tipoPersona = moda(sim_data.map(function(d){ return d.tipoPersona; })) || 'Jurídica';
    if(!m.tiempo)      m.tiempo      = moda(sim_data.map(function(d){ return d.tiempo; }))      || '< 1 año';
    if(!m.capital)     m.capital     = moda(sim_data.map(function(d){ return d.capital; }))     || '1 M - 50M';
    if(!m.frecuencia)  m.frecuencia  = moda(sim_data.map(function(d){ return d.frecuencia; }))  || 'Medio';
    if(!m.facturacion) m.facturacion = moda(sim_data.map(function(d){ return d.facturacion; })) || 'Medio';
    if(!m.cert)        m.cert        = moda(sim_data.map(function(d){ return d.cert; }))        || 'No';
    if(!m.anFin)       m.anFin       = moda(sim_data.map(function(d){ return d.anFin; }))       || 'No disponible';
  } else {
    // Defaults conservadores para clientes nuevos sin historial
    if(!m.tipoPersona) m.tipoPersona = 'Jurídica';
    if(!m.tiempo)      m.tiempo      = '< 1 año';
    if(!m.capital)     m.capital     = '1 M - 50M';
    if(!m.frecuencia)  m.frecuencia  = 'Bajo';
    if(!m.facturacion) m.facturacion = 'Bajo';
    if(!m.cert)        m.cert        = 'No';
    if(!m.anFin)       m.anFin       = 'No disponible';
  }

  // 3. Calcular puntaje y riesgo
  m.puntaje = mrCalcPuntaje(m);
  m.riesgo  = mrCalcRiesgo(m.puntaje);

  // 4. Asignar controles automáticos
  var auto = mrAutoControl(m.riesgo);
  if(!m._controlManual){
    m.control     = auto.control;
    m.frecControl = auto.frecControl;
  }

  db.matrizRiesgos[recId] = m;
}


function guardarFicha(){
  try {
  if(!_fichaRecId){ alert('Error: no hay ficha activa. Cierra y vuelve a abrir el cliente.'); return; }
  var contactos = [];
  document.querySelectorAll('#ficha-contactos-body tr').forEach(function(tr){
    var inp = tr.querySelectorAll('input,select');
    contactos.push({
      cargo: inp[0]?inp[0].value:'',
      tipoContacto: inp[1]?inp[1].value:'',
      nombre: inp[2]?inp[2].value:'',
      email: inp[3]?inp[3].value:'',
      tel: inp[4]?inp[4].value:'',
      cel: inp[5]?inp[5].value:'',
      aviso: inp[6]?inp[6].value:'Si'
    });
  });
  var asistentes = [];
  document.querySelectorAll('#ficha-asistentes-body tr').forEach(function(tr){
    var inp = tr.querySelectorAll('input');
    asistentes.push({ cargo: inp[0]?inp[0].value:'', contacto: inp[1]?inp[1].value:'' });
  });

  var data = {
    tipo: document.getElementById('fc-tipo').value,
    manejo: Array.from(document.querySelectorAll('.fc-manejo-cb:checked')).map(function(cb){return cb.value;}).join(', '),
    sector: document.getElementById('fc-sector').value,
    canal: document.getElementById('fc-canal').value,
    propuestas_ids: fichaGetPropuestasActivas(),
    enlace: document.getElementById('fc-enlace').value,
    lb:{
      deposito: document.getElementById('fc-lb-deposito').checked,
      zf: document.getElementById('fc-lb-zf').checked,
      tlocal: document.getElementById('fc-lb-tlocal').checked,
      cedi: document.getElementById('fc-lb-cedi').checked
    },
    fecha_proceso: document.getElementById('fc-fecha-proceso').value,
    analista_id: document.getElementById('fc-analista').value,
    analista: (function(){ var a=(db.analistas||[]).find(function(x){return x.id===document.getElementById('fc-analista').value;}); return a?a.nombre:''; })(),
    obs_general: document.getElementById('fc-obs-general').value,
    contactos: contactos,
    ref_empresa: (document.getElementById('fc-ref-empresa')||{}).value||'',
    ref_nit: document.getElementById('fc-ref-nit').value,
    ref_dir: document.getElementById('fc-ref-dir').value,
    ref_tel: document.getElementById('fc-ref-tel').value,
    forma_pago: document.getElementById('fc-forma-pago').value,
    fecha_cierre: document.getElementById('fc-fecha-cierre').value,
    facturar_a: document.getElementById('fc-facturar-a').value,
    buzon: document.getElementById('fc-buzon').value,
    tel_contacto: (document.getElementById('fc-tel-contacto')||{}).value||'',
    pago_por: document.getElementById('fc-pago-por').value,
    tipo_tarifa: document.getElementById('fc-tipo-tarifa').value,
    comision: document.getElementById('fc-comision').value,
    seguro: document.getElementById('fc-seguro').value,
    alm:{
      lg_p1: document.getElementById('fc-alm-lg-p1').value,
      lg_p2: document.getElementById('fc-alm-lg-p2').value,
      ic_p1: document.getElementById('fc-alm-ic-p1').value,
      ic_p2: document.getElementById('fc-alm-ic-p2').value,
      id_p1: document.getElementById('fc-alm-id-p1').value,
      id_p2: document.getElementById('fc-alm-id-p2').value
    },
    fact_lg: document.getElementById('fc-fact-lg').value,
    fact_ic: (document.getElementById('fc-fact-ic')||{}).value||'',
    fact_id: (document.getElementById('fc-fact-id')||{}).value||'',
    pallet: document.getElementById('fc-pallet').value,
    pallet_ic: (document.getElementById('fc-pallet-ic')||{}).value||'',
    rotacion: document.getElementById('fc-rotacion').value,
    forma_fact_lg: (document.getElementById('fc-forma-fact-lg')||{}).value||'',
    cant_fact_lg:  (document.getElementById('fc-cant-fact-lg')||{}).value||'',
    forma_fact_ic: (document.getElementById('fc-forma-fact-ic')||{}).value||'',
    cant_fact_ic:  (document.getElementById('fc-cant-fact-ic')||{}).value||'',
    forma_fact_id: (document.getElementById('fc-forma-fact-id')||{}).value||'',
    cant_fact_id:  (document.getElementById('fc-cant-fact-id')||{}).value||'',
    contacto_pago: document.getElementById('fc-contacto-pago').value,
    tipo_producto: document.getElementById('fc-tipo-producto').value,
    textil: document.getElementById('fc-textil').value,
    reempaque: document.getElementById('fc-reempaque').value,
    embalaje: document.getElementById('fc-embalaje').value,
    control_inv: document.getElementById('fc-control-inv').value,
    nacionaliza: document.getElementById('fc-nacionaliza').value,
    proceso_esp: document.getElementById('fc-proceso-esp').value,
    proceso_desc: document.getElementById('fc-proceso-desc').value,
    manipulacion: document.getElementById('fc-manipulacion').value,
    despachos: document.getElementById('fc-despachos').value,
    salidas_parciales: document.getElementById('fc-salidas-parciales').value,
    rotacion_merc: document.getElementById('fc-rotacion-merc').value,
    agencia: document.getElementById('fc-agencia').value,
    coord_aduana: document.getElementById('fc-coord-aduana').value,
    entrega_tipo: document.getElementById('fc-entrega_tipo') ? document.getElementById('fc-entrega_tipo').value : document.getElementById('fc-entrega-tipo') ? document.getElementById('fc-entrega-tipo').value : '',
    horarios: document.getElementById('fc-horarios').value,
    escolta: document.getElementById('fc-escolta').value,
    vehiculo: document.getElementById('fc-vehiculo').value,
    citas: document.getElementById('fc-citas').value,
    cargue: document.getElementById('fc-cargue').value,
    obs_transporte: document.getElementById('fc-obs-transporte').value,
    asistentes: asistentes,
    obs_kickoff: document.getElementById('fc-obs-kickoff').value,
    estado: document.getElementById('fc-estado').value,
    fecha_guardado: new Date().toISOString().slice(0,10)
  };

  // Actualizar sector en Matriz de Riesgos del registro
  var fichaRec = db.records.find(function(r){ return r.id===_fichaRecId; });
  if(fichaRec && data.sector){
    fichaRec.sector = data.sector;
    // Actualizar también en mrData si existe
    if(!db.mrData) db.mrData = {};
    if(!db.mrData[_fichaRecId]) db.mrData[_fichaRecId] = {};
    db.mrData[_fichaRecId].tipoMercancia = data.sector;
  }
  var existing = getFichaData(_fichaRecId);
  data.fecha_creacion = existing.fecha_creacion || data.fecha_guardado;

  saveFichaData(_fichaRecId, data);

  // Feedback visual en el botón
  var btnG = document.querySelector('[onclick="guardarFicha()"]');
  if(btnG){
    btnG.innerHTML = '✅ Guardada';
    btnG.disabled = true;
    btnG.style.background = '#00e676';
    btnG.style.color = '#000';
    setTimeout(function(){
      btnG.innerHTML = '💾 Guardar Ficha';
      btnG.disabled = false;
      btnG.style.background = '';
      btnG.style.color = '';
    }, 1500);
  }
  // Auto-crear/actualizar Matriz de Riesgos
  try {
    var mrMercancia = data.sector || '';
    mrAutoFillDesdeHistorial(_fichaRecId, mrMercancia);
    save();
  } catch(mrErr){ console.warn('MR auto-fill error:', mrErr); }

  toast('✅','Ficha guardada y Matriz de Riesgos actualizada','#00e676');
  setTimeout(function(){ showPage('ficha-cliente'); }, 1500);
  } catch(e){ alert('Error al guardar: '+e.message); }
}

function renderFichas(){
  var filtEstado  = (document.getElementById('ficha-filter-estado')||{}).value||'';
  var filtCom     = (document.getElementById('ficha-filter-comercial')||{}).value||'';

  // Poblar comerciales
  var selCom = document.getElementById('ficha-filter-comercial');
  if(selCom && selCom.options.length===1){
    db.comerciales.forEach(function(c){
      var o=document.createElement('option'); o.value=c.id; o.textContent='👤 '+c.nombre; selCom.appendChild(o);
    });
  }

  // Ficha: solo clientes activos
  var candidatos = db.records.filter(function(r){
    if(filtCom && r.comercialId !== filtCom) return false;
    return r.tipo === 'cliente';
  });

  // KPIs
  var total = candidatos.length;
  var completadas = candidatos.filter(function(r){ return (getFichaData(r.id).estado||'pendiente')==='completada'; }).length;
  var enProceso   = candidatos.filter(function(r){ return (getFichaData(r.id).estado||'pendiente')==='en_proceso'; }).length;
  var pendientes  = candidatos.filter(function(r){ return (getFichaData(r.id).estado||'pendiente')==='pendiente'; }).length;

  var kpiEl = document.getElementById('ficha-kpis');
  if(kpiEl) kpiEl.innerHTML = [
    {label:'Total fichas',  val:total,      col:'#00c2ff'},
    {label:'Completadas',   val:completadas,col:'#00e676'},
    {label:'En Proceso',    val:enProceso,  col:'#facc15'},
    {label:'Pendientes',    val:pendientes, col:'#f87171'},
  ].map(function(k){
    return '<div style="background:var(--surface);border:1px solid var(--border);border-top:3px solid '+k.col+';border-radius:10px;padding:12px 14px">'
      +'<div style="font-size:10px;color:var(--text2);letter-spacing:1.2px;text-transform:uppercase;font-weight:700;margin-bottom:6px">'+k.label+'</div>'
      +'<div style="font-family:\'Barlow Condensed\',sans-serif;font-size:28px;font-weight:800;color:'+k.col+'">'+k.val+'</div>'
      +'</div>';
  }).join('');

  // Filtrar por estado si aplica
  if(filtEstado){
    candidatos = candidatos.filter(function(r){
      return (getFichaData(r.id).estado||'pendiente') === filtEstado;
    });
  }

  var listaEl = document.getElementById('ficha-lista');
  if(!listaEl) return;

  if(candidatos.length === 0){
    listaEl.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text2)">'
      +'<div style="font-size:48px;margin-bottom:12px">📋</div>'
      +'<div style="font-size:16px;font-weight:600;margin-bottom:8px">Sin registros que mostrar</div>'
      +'<div style="font-size:13px">Registra prospectos o clientes para gestionar sus fichas de información</div>'
      +'</div>';
    return;
  }

  listaEl.innerHTML = '<div style="display:grid;gap:10px">'
    + candidatos.map(function(r){
        var data = getFichaData(r.id);
        var est = data.estado||'pendiente';
        var estColor = est==='completada'?'#00e676':est==='en_proceso'?'#facc15':'#f87171';
        var estLabel = est==='completada'?'✅ Completada':est==='en_proceso'?'🔄 En Proceso':'⏳ Pendiente';
        var campos = ['fc-tipo','fc-manejo','fc-sector','fc-canal','fc-propuesta','fc-forma-pago','fc-facturar-a','fc-buzon','fc-tipo-tarifa','fc-tipo-producto','fc-embalaje','fc-control-inv','fc-agencia','fc-analista'];
        var filled = ['tipo','manejo','sector','canal','propuesta','forma_pago','facturar_a','buzon','tipo_tarifa','tipo_producto','embalaje','control_inv','agencia','analista'].filter(function(k){ return data[k] && data[k].trim()!==''; }).length;
        var pct = Math.round((filled/campos.length)*100);
        var pctColor = pct>=80?'#00e676':pct>=50?'#facc15':'var(--accent)';
        return '<div class="ficha-card-row" style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
          +'<div style="flex:1;min-width:200px">'
          +'<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:3px">'+r.empresa+'</div>'
          +'<div style="font-size:12px;color:var(--text2)">'+(r.nit?'NIT: '+r.nit+' · ':'')+r.ciudad+'</div>'
          +'<div style="font-size:11px;color:var(--text2);margin-top:2px">Comercial: '+(r.comercialNombre||'—')+'</div>'
          +'</div>'
          +'<div style="display:flex;align-items:center;gap:10px">'
          +'<div style="min-width:100px">'
          +'<div style="font-size:10px;color:var(--text2);margin-bottom:4px">Completitud</div>'
          +'<div style="background:var(--border);border-radius:4px;height:5px;width:100px">'
          +'<div style="height:5px;border-radius:4px;background:'+pctColor+';width:'+pct+'%"></div></div>'
          +'<div style="font-size:11px;font-weight:700;color:'+pctColor+';margin-top:2px">'+pct+'%</div>'
          +'</div>'
          +'<span style="background:'+estColor+'18;color:'+estColor+';border:1px solid '+estColor+'44;border-radius:12px;padding:4px 12px;font-size:11px;font-weight:700;white-space:nowrap">'+estLabel+'</span>'
          +'<button data-fid="'+r.id+'" onclick="abrirFicha(this.dataset.fid)" class="btn btn-primary btn-sm">📋 Abrir Ficha</button>'
          +'<button data-fid="'+r.id+'" onclick="descargarFichaPDF(this.dataset.fid)" style="background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,0.35);color:#f87171;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap' + (est!=='completada'?';opacity:0.3;pointer-events:none':'')+'">📄 PDF</button>'
          +'</div>'
          +'</div>';
      }).join('')
    +'</div>';
}

function exportarFichasExcel(){
  toast('ℹ️','Funcionalidad de exportación próximamente','#00c2ff');
}
