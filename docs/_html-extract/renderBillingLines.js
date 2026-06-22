function renderBillingLines(suffix, services){
  const container = document.getElementById(`f-billing-lines-${suffix}`);
  if(!container) return;
  if(!services||services.length===0){
    container.innerHTML='<div style="color:var(--text2);font-size:13px;grid-column:1/-1">Selecciona los servicios de interés primero.</div>';
    const te = document.getElementById(`f-total-${suffix}`);
    if(te) te.textContent='$0';
    return;
  }
  container.innerHTML = services.map(s=>`
    <div class="form-group">
      <label style="display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${SVC_COLORS[s]||'var(--accent)'}"></span>
        ${s}
      </label>
      <input type="number" id="bill-${suffix}-${s.replace(/\s+/g,'-').replace(/\//g,'-')}"
        placeholder="0" min="0"
        oninput="updateBillingTotal('${suffix}')"
        style="text-align:right">
    </div>`).join('');
  updateBillingTotal(suffix);
}