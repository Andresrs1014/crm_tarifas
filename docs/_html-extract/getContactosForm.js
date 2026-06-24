function getContactosForm(){
  return (window._contactosForm||[]).filter(c=>c.nombre||c.email||c.telefono);
}