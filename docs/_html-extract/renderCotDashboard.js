function renderCotDashboard(){
  const cots = db.cotizaciones||[];
  const total = cots.length;
  const aprobadas  = cots.filter(c=>c.estado==='aprobada').length;
  const borradores = cots.filter(c=>c.estado==='borrador'||!c.estado).length;
  const enviadas   = cots.filter(c=>c.estado==='enviada').length;
  const negociacion= cots.filter(c=>c.estado==='negociacion').length;
  const rechazadas = cots.filter(c=>c.estado==='rechazada').length;
  const enCurso    = borradores + enviadas + negociacion;
  const hoy = new Date();
  const vencidas = cots.filter(c=>{
    const venc = resolveVigencia(c);
    return venc < hoy && c.estado!=='aprobada' && c.estado!=='rechazada';
  }).length;

  const kpisEl = document.getElementById('dash-cot-kpis');
  if(kpisEl) kpisEl.innerHTML = `
    <div class="stat-card blue"><div class="stat-label">Total Cotizaciones</div><div class="stat-value">${total}</div><div class="stat-sub">Emitidas</div></div>
    <div class="stat-card green"><div class="stat-label">Aprobadas</div><div class="stat-value">${aprobadas}</div><div class="stat-sub">Confirmadas</div></div>
    <div class="stat-card gold"><div class="stat-label">En Curso</div><div class="stat-value">${enCurso}</div><div class="stat-sub">Borrador · Enviada · Neg.</div></div>
    <div class="stat-card red"><div class="stat-label">Vencidas</div><div class="stat-value">${vencidas}</div><div class="stat-sub">Sin respuesta</div></div>`;

  // Pipeline chart
  destroyChart('cot-estados');
  const cotCanvas = document.getElementById('chart-cot-estados');
  if(cotCanvas){
    if(total > 0){
      charts['cot-estados'] = new Chart(cotCanvas,{
        type:'doughnut',
        data:{
          labels:['Aprobada','Borrador','Enviada','Negociación','Rechazada','Vencida'],
          datasets:[{data:[aprobadas,borradores,enviadas,negociacion,rechazadas,vencidas],
            backgroundColor:['rgba(0,230,118,0.8)','rgba(136,153,180,0.5)','rgba(0,194,255,0.8)','rgba(245,166,35,0.8)','rgba(255,68,68,0.8)','rgba(200,50,50,0.6)'],
            borderWidth:2}]
        },
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:14,usePointStyle:true,font:{size:11}}}}}
      });
      cotCanvas.style.display = '';
      const parent = cotCanvas.parentElement;
      const empty = parent.querySelector('.cot-empty-estado');
      if(empty) empty.remove();
    } else {
      cotCanvas.style.display = 'none';
      const parent = cotCanvas.parentElement;
      if(!parent.querySelector('.cot-empty-estado')){
        const div = document.createElement('div');
        div.className = 'cot-empty-estado empty-state';
        div.style.cssText = 'padding:40px 0;text-align:center';
        div.innerHTML = '<div style="font-size:32px;margin-bottom:8px">📄</div><div style="color:var(--text2);font-size:13px">Sin cotizaciones aún</div>';
        parent.appendChild(div);
      }
    }
  }

  // Cotizaciones por línea
  destroyChart('cot-lineas');
  const cotLineasCanvas = document.getElementById('chart-cot-lineas');
  if(cotLineasCanvas){
    const lineasCount = {};
    SERVICES.forEach(s=>lineasCount[s]=0);
    cots.forEach(c=>{ (c.lineas||[]).forEach(s=>{ if(lineasCount[s]!==undefined) lineasCount[s]++; }); });
    const nonZeroL = SERVICES.filter(s=>lineasCount[s]>0);
    if(nonZeroL.length>0){
      cotLineasCanvas.style.display = '';
      const parent2 = cotLineasCanvas.parentElement;
      const empty2 = parent2.querySelector('.cot-empty-lineas');
      if(empty2) empty2.remove();
      charts['cot-lineas'] = new Chart(cotLineasCanvas,{
        type:'bar',
        data:{
          labels:nonZeroL,
          datasets:[{label:'Cotizaciones',data:nonZeroL.map(s=>lineasCount[s]),
            backgroundColor:nonZeroL.map(s=>SVC_COLORS[s]||'var(--accent)'),borderWidth:0,borderRadius:4}]
        },
        options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
      });
    } else {
      cotLineasCanvas.style.display = 'none';
      const parent2 = cotLineasCanvas.parentElement;
      if(!parent2.querySelector('.cot-empty-lineas')){
        const div2 = document.createElement('div');
        div2.className = 'cot-empty-lineas empty-state';
        div2.style.cssText = 'padding:40px 0;text-align:center';
        div2.innerHTML = '<div style="font-size:32px;margin-bottom:8px">📊</div><div style="color:var(--text2);font-size:13px">Sin líneas cotizadas aún</div>';
        parent2.appendChild(div2);
      }
    }
  }

  // Recent cotizaciones table
  const cotTableEl = document.getElementById('dash-cot-table');
  if(cotTableEl){
    const recent = [...cots].reverse().slice(0,6);
    cotTableEl.innerHTML = recent.map(c=>{
      const venc = resolveVigencia(c);
      const isVenc = venc < hoy && c.estado!=='aprobada' && c.estado!=='rechazada';
      const estBadge = c.estado==='aprobada'   ?'<span class="badge badge-green">✅ Aprobada</span>':
        c.estado==='rechazada'  ?'<span class="badge badge-red">❌ Rechazada</span>':
        isVenc                  ?'<span class="badge badge-red">⌛ Vencida</span>':
        c.estado==='negociacion'?'<span class="badge badge-gold">🤝 Negociación</span>':
        c.estado==='enviada'    ?'<span class="badge badge-cyan">📤 Enviada</span>':
        '<span class="badge badge-gray">📝 Borrador</span>';
      return `<tr>
        <td><strong>${c.numero||'—'}</strong></td>
        <td>${c.empresa||'—'}</td>
        <td><div class="service-tags">${(c.lineas||[]).map(s=>`<span class="stag">${s}</span>`).join('')}</div></td>
        <td>${estBadge}</td>
        <td style="font-size:12px;color:var(--text2)">${c.fecha||'—'}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="verCotizacion('${c.id}')">Ver</button></td>
      </tr>`;
    }).join('') || `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📄</div><div class="empty-title">Sin cotizaciones</div></div></td></tr>`;
  }
}