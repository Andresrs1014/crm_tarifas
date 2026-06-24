function onFacturadoChange(val, suffix){
  const block = document.getElementById(`f-billing-block-${suffix}`);
  if(block) block.style.display = (val!=='no')?'block':'none';
}