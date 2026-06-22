function onTipoClienteChange(val){
  const grpInd = document.getElementById('grupo-cliente-indirecto');

  if(val === 'referido'){
    grpInd.style.display = 'block';

    const sel = document.getElementById('f-cliente-indirecto');
    const indirectos = db.records.filter(r=>r.tipoCliente==='indirecto');
    sel.innerHTML = '<option value="">— Seleccionar aliado —</option>' +
      indirectos.map(r=>`<option value="${r.id}">${r.empresa} (${r.tipo==='prospecto'?'Prospecto':'Cliente'})</option>`).join('');
  } else if(val === 'indirecto'){
    grpInd.style.display = 'none';

  } else {
    grpInd.style.display = 'none';

  }
}