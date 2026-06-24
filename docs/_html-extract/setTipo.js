function setTipo(t){
  currentTipo = t;
  document.getElementById('tipo-registro').value = t;
  const bp  = document.getElementById('btn-prospecto');
  const bc  = document.getElementById('btn-cliente');
  const sp  = document.getElementById('section-prospecto');
  const sc  = document.getElementById('section-cliente');
  const stc = document.getElementById('section-tipo-cliente');
  if(t==='prospecto'){
    bp.className='type-btn active-prospecto';
    bc.className='type-btn';
    sp.style.display='block';
    sc.style.display='none';
    if(stc) stc.style.display='none';
  } else {
    bc.className='type-btn active-cliente';
    bp.className='type-btn';
    sc.style.display='block';
    sp.style.display='none';
    if(stc) stc.style.display='block';
    // Reset tipo cliente selector and sub-fields
    const ftc = document.getElementById('f-tipo-cliente');
    if(ftc) onTipoClienteChange(ftc.value);
  }
}