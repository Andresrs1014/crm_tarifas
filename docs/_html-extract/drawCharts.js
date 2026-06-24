function drawCharts(recs, filterCom){
  if(!recs) recs = db.records;
  if(!filterCom) filterCom = '';
  const C = Chart.defaults;
  C.color = '#8899b4';
  C.font.family = 'Barlow, sans-serif';

  // 1. Tipo doughnut
  destroyChart('tipo');
  const p = recs.filter(r=>r.tipo==='prospecto').length;
  const c = recs.filter(r=>r.tipo==='cliente').length;
  const tipoCanvas = document.getElementById('chart-tipo');
  if(tipoCanvas) charts.tipo = new Chart(tipoCanvas,{
    type:'doughnut',
    data:{labels:['Prospectos','Clientes'],datasets:[{data:[p,c],backgroundColor:['rgba(0,194,255,0.8)','rgba(0,230,118,0.8)'],borderColor:['#00c2ff','#00e676'],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{padding:16,usePointStyle:true}}}}
  });

  // 2. Estado pipeline — embudo completo
  destroyChart('estado');
  const estados = ['prospecto','reconocimiento','propuesta','aceptacion_propuesta','creacion_sop','facturado','frio','perdido'];
  const stateLabels = ['Prospecto','Visita','Propuesta Comercial','Acept. Propuesta Comercial','Creación Ficha Cliente','Facturado','Frío','Perdido'];
  const stateCounts = estados.map(s=>recs.filter(r=>r.estadoProspecto===s).length);
  const stateColors = ['rgba(0,194,255,0.8)','rgba(0,194,255,0.6)','rgba(168,85,247,0.8)','rgba(168,85,247,0.6)','rgba(245,166,35,0.8)','rgba(245,166,35,0.6)','rgba(0,230,118,0.8)','rgba(0,230,118,0.6)','rgba(0,230,118,1)','rgba(136,153,180,0.6)','rgba(255,68,68,0.8)'];
  const estadoCanvas = document.getElementById('chart-estado');
  if(estadoCanvas) charts.estado = new Chart(estadoCanvas,{
    type:'bar',
    data:{labels:stateLabels,datasets:[{data:stateCounts,backgroundColor:stateColors,borderRadius:4,borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}}}}
  });

  // 3. Servicios bar
  destroyChart('servicios');
  const svcCount = {};
  SERVICES.forEach(s=>svcCount[s]=0);
  recs.forEach(r=>(r.servicios||[]).forEach(s=>{ if(svcCount[s]!==undefined) svcCount[s]++; }));
  const svcCanvas = document.getElementById('chart-servicios');
  if(svcCanvas) charts.servicios = new Chart(svcCanvas,{
    type:'bar',
    data:{
      labels: SERVICES,
      datasets:[{label:'Empresas',data:SERVICES.map(s=>svcCount[s]),
        backgroundColor:SERVICES.map(s=>SVC_COLORS[s]||'var(--accent)'),
        borderWidth:0, borderRadius:6}]
    },
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true,ticks:{stepSize:1}},x:{ticks:{font:{size:10}}}}}
  });

  // 4. Comercial bar
  destroyChart('comercial');
  const comCanvas = document.getElementById('chart-comercial');
  if(comCanvas){
    const coms = filterCom ? db.comerciales.filter(x=>x.id===filterCom) : db.comerciales;
    charts.comercial = new Chart(comCanvas,{
      type:'bar',
      data:{
        labels: coms.map(x=>x.nombre.split(' ')[0]),
        datasets:[
          {label:'Prospectos',data:coms.map(x=>recs.filter(r=>r.comercialId===x.id&&r.tipo==='prospecto').length),backgroundColor:'rgba(0,194,255,0.7)',borderWidth:0,borderRadius:4},
          {label:'Clientes',data:coms.map(x=>recs.filter(r=>r.comercialId===x.id&&r.tipo==='cliente').length),backgroundColor:'rgba(0,230,118,0.7)',borderWidth:0,borderRadius:4}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}
    });
  }

  // 5. Registros por Mes (timeline line chart)
  destroyChart('timeline');
  const tlCanvas = document.getElementById('chart-timeline');
  if(tlCanvas){
    // Build month buckets from last 12 months
    const now = new Date();
    const monthBuckets = [];
    for(let m = 11; m >= 0; m--){
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const key = d.toISOString().slice(0,7);
      const label = d.toLocaleDateString('es-CO',{month:'short', year:'2-digit'});
      monthBuckets.push({ key, label, prospectos:0, clientes:0 });
    }
    recs.forEach(r=>{
      const mes = (r.fecha||'').slice(0,7);
      const bucket = monthBuckets.find(b=>b.key===mes);
      if(bucket){
        if(r.tipo==='prospecto') bucket.prospectos++;
        else bucket.clientes++;
      }
    });
    // Only render months that have at least one record, or keep all 12
    charts.timeline = new Chart(tlCanvas,{
      type:'line',
      data:{
        labels: monthBuckets.map(b=>b.label),
        datasets:[
          {
            label:'Prospectos',
            data: monthBuckets.map(b=>b.prospectos),
            borderColor:'#00c2ff', backgroundColor:'rgba(0,194,255,0.08)',
            borderWidth:2, pointRadius:4, pointBackgroundColor:'#00c2ff',
            tension:0.35, fill:true
          },
          {
            label:'Clientes',
            data: monthBuckets.map(b=>b.clientes),
            borderColor:'#00e676', backgroundColor:'rgba(0,230,118,0.08)',
            borderWidth:2, pointRadius:4, pointBackgroundColor:'#00e676',
            tension:0.35, fill:true
          }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{
          legend:{ position:'bottom', labels:{ padding:16, usePointStyle:true } },
          tooltip:{ callbacks:{ title: ctx => ctx[0].label } }
        },
        scales:{
          y:{ beginAtZero:true, ticks:{ stepSize:1 }, grid:{ color:'rgba(136,153,180,0.1)' } },
          x:{ ticks:{ font:{ size:10 } }, grid:{ display:false } }
        }
      }
    });
  }

  // 6. Gestión Clientes (horizontal bar)
  destroyChart('gestion');
  const gestCanvas = document.getElementById('chart-gestion');
  if(gestCanvas){
    const clientes = recs.filter(r=>r.tipo==='cliente');
    const activos   = clientes.filter(r=>r.estadoCliente==='activo').length;
    const enRiesgo  = clientes.filter(r=>r.estadoCliente==='en-riesgo').length;
    const inactivos = clientes.filter(r=>r.estadoCliente==='inactivo').length;
    const conVisita = clientes.filter(r=>r.visitaCliente&&r.visitaCliente!=='no').length;
    const conNuevoSvc = clientes.filter(r=>r.nuevoServicio==='si').length;
    const facturados  = clientes.filter(r=>r.facturado&&r.facturado!=='no').length;

    if(clientes.length === 0){
      gestCanvas.style.display = 'none';
      const parent = gestCanvas.parentElement;
      if(!parent.querySelector('.gest-empty')){
        const div = document.createElement('div');
        div.className = 'gest-empty empty-state';
        div.style.cssText = 'padding:40px 0;text-align:center';
        div.innerHTML = '<div style="font-size:32px;margin-bottom:8px">🏢</div><div style="color:var(--text2);font-size:13px">Sin clientes registrados</div>';
        parent.appendChild(div);
      }
    } else {
      gestCanvas.style.display = '';
      const parent = gestCanvas.parentElement;
      const empty = parent.querySelector('.gest-empty');
      if(empty) empty.remove();
      charts.gestion = new Chart(gestCanvas,{
        type:'bar',
        data:{
          labels:['Activos','En Riesgo','Inactivos','Con Visita','Nuevo Svc','Facturados'],
          datasets:[{
            label:'Clientes',
            data:[activos, enRiesgo, inactivos, conVisita, conNuevoSvc, facturados],
            backgroundColor:[
              'rgba(0,230,118,0.75)',
              'rgba(245,166,35,0.75)',
              'rgba(136,153,180,0.5)',
              'rgba(0,194,255,0.75)',
              'rgba(168,85,247,0.75)',
              'rgba(245,166,35,0.75)'
            ],
            borderWidth:0, borderRadius:6
          }]
        },
        options:{
          indexAxis:'y',
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false } },
          scales:{
            x:{ beginAtZero:true, ticks:{ stepSize:1 }, grid:{ color:'rgba(136,153,180,0.1)' } },
            y:{ ticks:{ font:{ size:11 } }, grid:{ display:false } }
          }
        }
      });
    }
  }
}