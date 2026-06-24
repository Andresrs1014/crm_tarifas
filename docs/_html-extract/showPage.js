function showPage(id){
  // Mostrar/ocultar barras de scroll fijas según la página activa
  var crmBar = document.getElementById('crm-fixed-scroll');
  var gdBar  = document.getElementById('gd-fixed-scroll');
  if(crmBar) crmBar.style.display = (id==='crm') ? 'block' : 'none';
  if(gdBar)  gdBar.style.display  = (id==='gestion-documental') ? 'block' : 'none';
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  window.scrollTo({top:0, behavior:'instant'});
  const tabs = document.querySelectorAll('.nav-tab');
  const map = {dashboard:0,registro:1,prospectos:2,clientes:3,equipo:4,cotizaciones:5,crm:6,cotizador:7,preliquidador:8,calendario:9,biblioteca:10,'gestion-documental':11,sac:12,'matriz-riesgos':13,'ficha-cliente':14,'ficha-detalle':14};
  if(map[id]!==undefined && tabs[map[id]]) tabs[map[id]].classList.add('active');  if(id==='dashboard') renderDashboard();
  if(id==='prospectos') renderProspectos();
  if(id==='crm'){ renderCRM(); setTimeout(initCRMScrollSync,50); }
  if(id==='crm-detalle'){} // rendered by crmAbrirModal
  if(id==='clientes') renderClientes();
  if(id==='equipo') renderEquipo();
  if(id==='cotizaciones') renderCotizaciones();
  if(id==='biblioteca') renderBiblioteca();
  if(id==='gestion-documental'){ renderGestionDocumental(); setTimeout(initGDScrollSync,50); setTimeout(gdAutoToastAlertas, 600); }
  if(id==='calendario') renderCalendario();
  if(id==='matriz-riesgos'){ renderMatrizRiesgos(); var mrB=document.getElementById('mr-fixed-scroll'); if(mrB) mrB.style.display='block'; setTimeout(initMRScrollSync,50); }
  var crmBar=document.getElementById('crm-fixed-scroll'); var gdBar=document.getElementById('gd-fixed-scroll'); var mrBar2=document.getElementById('mr-fixed-scroll');
  if(crmBar) crmBar.style.display=(id==='crm')?'block':'none';
  if(gdBar)  gdBar.style.display=(id==='gestion-documental')?'block':'none';
  if(mrBar2) mrBar2.style.display=(id==='matriz-riesgos')?'block':'none';
  var fichaBar=document.getElementById('ficha-fixed-scroll'); if(fichaBar) fichaBar.style.display=(id==='ficha-detalle')?'block':'none';
  if(id==='sac'){ sacInitMes(); renderSAC(); }
  if(id==='cotizador') cotizadorInit();
  if(id==='preliquidador') preliqInit();
  if(id==='actualizar-tarifas') initActualizacionTarifas();
  if(id==='ficha-cliente'){ renderFichas(); var fb=document.getElementById('ficha-fixed-scroll'); if(fb) fb.style.display='none'; }
  if(id==='ficha-detalle'){ var fb=document.getElementById('ficha-fixed-scroll'); if(fb) fb.style.display='block'; setTimeout(initFichaScroll,50); }
}