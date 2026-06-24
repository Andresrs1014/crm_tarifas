function renderBillingDashboard(recs){
  const totals = {};
  SERVICES.forEach(s=>totals[s]=0);
  recs.forEach(r=>{
    const lines = r.facturacionLineas||{};
    SERVICES.forEach(s=>{ if(lines[s]) totals[s]+=(Number(lines[s])||0); });
    if(!r.facturacionLineas){
      const val = Number(r.tipo==='prospecto'?r.valorP:r.valor)||0;
      if(val>0 && r.servicios?.length){
        const share = val/r.servicios.length;
        r.servicios.forEach(s=>{ if(totals[s]!==undefined) totals[s]+=share; });
      }
    }
  });

  const grandTotal = Object.values(totals).reduce((a,b)=>a+b,0);
  const maxVal = Math.max(...Object.values(totals),1);

  const list = document.getElementById('billing-lines-list');
  if(list){
    list.innerHTML = SERVICES.map(s=>{
      const val = totals[s]||0;
      const pct = grandTotal>0?Math.round(val/grandTotal*100):0;
      const color = SVC_COLORS[s]||'var(--accent)';
      return `
        <div style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
            <div style="display:flex;align-items:center;gap:7px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color}"></span>
              <span style="font-size:13px;font-weight:500">${s}</span>
            </div>
            <div style="text-align:right">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;color:${color}">$${Math.round(val).toLocaleString('es-CO')}</span>
              <span style="font-size:11px;color:var(--text2);margin-left:6px">${pct}%</span>
            </div>
          </div>
          <div style="background:var(--surface2);border-radius:4px;height:6px;overflow:hidden">
            <div style="height:100%;border-radius:4px;background:${color};width:${val>0?Math.max(val/maxVal*100,2):0}%;transition:width 0.5s"></div>
          </div>
        </div>`;
    }).join('');
  }

  const totalEl = document.getElementById('billing-total-dash');
  if(totalEl) totalEl.textContent = '$'+Math.round(grandTotal).toLocaleString('es-CO');

  destroyChart('billing');
  const nonZero = SERVICES.filter(s=>totals[s]>0);
  const billingCanvas = document.getElementById('chart-billing');
  if(!billingCanvas) return;
  if(nonZero.length===0){ billingCanvas.style.display='none'; return; }
  billingCanvas.style.display='';
  charts.billing = new Chart(billingCanvas,{
    type:'doughnut',
    data:{
      labels: nonZero,
      datasets:[{
        data: nonZero.map(s=>Math.round(totals[s])),
        backgroundColor: nonZero.map(s=>SVC_COLORS[s]||'var(--accent)'),
        borderColor: '#111827',
        borderWidth: 3
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{
          label: ctx=>`${ctx.label}: $${ctx.parsed.toLocaleString('es-CO')} (${grandTotal>0?Math.round(ctx.parsed/grandTotal*100):0}%)`
        }}
      }
    }
  });
}