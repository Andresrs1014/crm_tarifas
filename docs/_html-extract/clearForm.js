function clearForm(){
  ['f-empresa','f-nit','f-ciudad',
   'f-obs-prospecto','f-obs-cliente','f-fecha-visita','f-proximo-seguimiento','f-fecha-visita-cliente'
  ].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });

  document.getElementById('f-fecha').value = today();
  document.getElementById('f-comercial').value = '';

  // Reset tipo cliente
  const ftc = document.getElementById('f-tipo-cliente');
  if(ftc){ ftc.value='directo'; onTipoClienteChange('directo'); }
  const fci = document.getElementById('f-comision'); if(fci) fci.value='';

  // Reset contactos
  window._contactosForm = [{nombre:'',cargo:'',telefono:'',email:'',cumpleanos:'',recibeRegalos:''}];
  const fcat = document.getElementById('f-categoria'); if(fcat) fcat.value='';
  const fdir = document.getElementById('f-direccion'); if(fdir) fdir.value='';
  renderContactosList();

  // Reset billing selectors
  const fpP = document.getElementById('f-facturado-p');
  if(fpP) fpP.value = 'no';
  const fpC = document.getElementById('f-facturado');
  if(fpC) fpC.value = 'no';

  // Hide billing blocks
  const bkP = document.getElementById('f-billing-block-p');
  if(bkP) bkP.style.display = 'none';
  const bkC = document.getElementById('f-billing-block-c');
  if(bkC) bkC.style.display = 'none';

  // Reset totals
  const tp = document.getElementById('f-total-p'); if(tp) tp.textContent='$0';
  const tc = document.getElementById('f-total-c'); if(tc) tc.textContent='$0';

  selectedServices = [];
  buildServiceChips();
  setTipo('prospecto');
}