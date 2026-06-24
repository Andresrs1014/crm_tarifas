function renderDashboard(){
  const filterCom = document.getElementById('dash-filter-comercial')?.value||'';
  const filterMes = document.getElementById('dash-filter-mes')?.value||'';
  const filterTipo = document.getElementById('dash-filter-tipo')?.value||'';

  let recs = db.records;
  if(filterCom)  recs = recs.filter(r=>r.comercialId===filterCom);
  if(filterMes)  recs = recs.filter(r=>(r.fecha||'').startsWith(filterMes));
  if(filterTipo) recs = recs.filter(r=>r.tipo===filterTipo);

  // Banner filtros activos
  const banner = document.getElementById('dash-comercial-banner');
  const parts = [];
  if(filterCom){ const c=db.comerciales.find(x=>x.id===filterCom); parts.push(`👤 <strong>${c?.nombre||'—'}</strong>`); }
  if(filterMes){ const [y,mo]=filterMes.split('-'); const lbl=new Date(+y,+mo-1,1).toLocaleDateString('es-CO',{month:'long',year:'numeric'}); parts.push(`📅 <strong>${lbl.charAt(0).toUpperCase()+lbl.slice(1)}</strong>`); }
  if(filterTipo) parts.push(filterTipo==='prospecto'?'🎯 <strong>Solo Prospectos</strong>':'🏢 <strong>Solo Clientes</strong>');
  if(parts.length){ banner.style.display='block'; banner.innerHTML='Filtros activos: '+parts.join(' &nbsp;·&nbsp; ')+` &nbsp;<span style="color:var(--text2);font-weight:400;font-size:12px">(${recs.length} registros)</span>`; }
  else banner.style.display='none';

  const total = recs.length;
  const prospectos = recs.filter(r=>r.tipo==='prospecto').length;
  const clientes = recs.filter(r=>r.tipo==='cliente').length;
  const visitas = recs.filter(r=>(r.visita&&r.visita!=='no')||(r.visitaCliente&&r.visitaCliente!=='no')).length;
  // Pipeline activo: estados antes de cierre
  const ESTADOS_ACTIVOS = ['prospecto','reconocimiento','propuesta','aceptacion_propuesta','creacion_sop'];
  const enPipeline = recs.filter(r=>r.tipo==='prospecto'&&ESTADOS_ACTIVOS.includes(r.estadoProspecto||'prospecto')).length;
  const facturados = recs.filter(r=>r.tipo==='prospecto'&&r.estadoProspecto==='facturado').length;
  const perdidos   = recs.filter(r=>r.tipo==='prospecto'&&(r.estadoProspecto==='perdido'||r.estadoProspecto==='frio')).length;

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Total Registros</div><div class="stat-value">${total}</div><div class="stat-sub">Empresas en sistema</div></div>
    <div class="stat-card cyan"><div class="stat-label">Prospectos</div><div class="stat-value">${prospectos}</div><div class="stat-sub">En pipeline</div></div>
    <div class="stat-card green"><div class="stat-label">Clientes</div><div class="stat-value">${clientes}</div><div class="stat-sub">Bajo gestión</div></div>
    <div class="stat-card gold"><div class="stat-label">Facturados</div><div class="stat-value">${facturados}</div><div class="stat-sub">Prospectos facturados</div></div>
    <div class="stat-card purple"><div class="stat-label">En Gestión</div><div class="stat-value">${enPipeline}</div><div class="stat-sub">Prospectos activos</div></div>
    <div class="stat-card red"><div class="stat-label">Visitas / Contactos</div><div class="stat-value">${visitas}</div><div class="stat-sub">Total realizados</div></div>`;

  // Recent table
  const recent = [...recs].reverse().slice(0,8);
  const recentTbl = document.getElementById('recent-table');
  if(recentTbl) recentTbl.innerHTML = recent.map(r=>`<tr>
    <td><strong>${r.empresa}</strong></td>
    <td>${r.tipo==='prospecto'?'<span class="badge badge-blue">Prospecto</span>':'<span class="badge badge-green">Cliente</span>'}</td>
    <td style="font-size:12px">${r.comercialNombre}</td>
    <td><div class="service-tags">${(r.servicios||[]).slice(0,3).map(s=>`<span class="stag">${s}</span>`).join('')}${r.servicios?.length>3?`<span class="stag">+${r.servicios.length-3}</span>`:''}</div></td>
    <td>${estadoBadge(r)}</td>
    <td style="font-size:12px;color:var(--text2)">${r.fecha||'—'}</td>
  </tr>`).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Sin registros</div></div></td></tr>`;

  // Use rAF to ensure canvases have dimensions before drawing
  requestAnimationFrame(()=>{
    drawCharts(recs, filterCom);
    renderBillingDashboard(recs);
    renderCotDashboard();
  });
}