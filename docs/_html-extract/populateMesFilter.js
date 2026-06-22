function populateMesFilter(){
  const el = document.getElementById('dash-filter-mes');
  if(!el) return;
  // Collect all unique year-month values from records
  const meses = [...new Set(db.records.map(r=>(r.fecha||'').slice(0,7)).filter(m=>m))].sort().reverse();
  el.innerHTML = '<option value="">📅 Todos los meses</option>' +
    meses.map(m=>{
      const [y,mo] = m.split('-');
      const label = new Date(+y, +mo-1, 1).toLocaleDateString('es-CO',{month:'long',year:'numeric'});
      return `<option value="${m}">${label.charAt(0).toUpperCase()+label.slice(1)}</option>`;
    }).join('');
}