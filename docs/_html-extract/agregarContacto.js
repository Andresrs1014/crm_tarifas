function agregarContacto(){
  if(!window._contactosForm) window._contactosForm = [];
  window._contactosForm.push({nombre:'',cargo:'',telefono:'',email:'',cumpleanos:'',recibeRegalos:'',tipoContacto: window._contactosForm.length===0 ? 'principal' : ''});
  renderContactosList();
}