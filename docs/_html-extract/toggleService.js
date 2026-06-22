function toggleService(el, s){
  const idx = selectedServices.indexOf(s);
  if(idx === -1){ selectedServices.push(s); el.classList.add('selected'); }
  else { selectedServices.splice(idx, 1); el.classList.remove('selected'); }

  // Refresh billing lines only if the billing block is currently visible
  const tipo = document.getElementById('tipo-registro').value;
  if(tipo === 'prospecto'){
    const block = document.getElementById('f-billing-block-p');
    if(block && block.style.display !== 'none') renderBillingLines('p', selectedServices);
  } else {
    const block = document.getElementById('f-billing-block-c');
    if(block && block.style.display !== 'none') renderBillingLines('c', selectedServices);
  }
}