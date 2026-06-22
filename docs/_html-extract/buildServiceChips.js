function buildServiceChips(){
  const c = document.getElementById('services-chips');
  c.innerHTML = SERVICES.map(s=>{
    const key = s.replace(/\s+/g,'-').replace(/\//g,'-');
    return `<div class="service-chip" id="chip-${key}" data-service="${s}" onclick="toggleService(this,'${s}')">${s}</div>`;
  }).join('');
}