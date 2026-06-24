function eliminarContacto(idx){
  if(!window._contactosForm || idx===0) return;
  window._contactosForm.splice(idx,1);
  renderContactosList();
}