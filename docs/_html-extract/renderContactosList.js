function renderContactosList(){
  const cont = document.getElementById('f-contactos-list');
  if(!cont) return;
  const contactos = window._contactosForm || [];
  if(contactos.length === 0){
    agregarContacto(); // always start with at least one
    return;
  }
  cont.innerHTML = contactos.map((c,i)=>`
    <div class="contact-card" id="ccard-${i}">
      <div class="contact-card-header">
        <span class="contact-card-label">
          ${i===0?'<span class="contact-principal-badge">⭐ Principal</span>':'Contacto '+(i+1)}
        </span>
        ${i>0?`<button type="button" onclick="eliminarContacto(${i})" style="background:none;border:none;cursor:pointer;color:var(--text2);font-size:18px;line-height:1" title="Eliminar contacto">✕</button>`:''}
      </div>
      <div class="form-grid" style="margin-bottom:0">
        <div class="form-group" style="margin-bottom:0">
          <label>Nombre</label>
          <input type="text" placeholder="Nombre del contacto" value="${escHtml(c.nombre||'')}"
            oninput="updateContacto(${i},'nombre',this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Cargo</label>
          <input type="text" placeholder="Ej: Gerente Logístico" value="${escHtml(c.cargo||'')}"
            oninput="updateContacto(${i},'cargo',this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Teléfono</label>
          <input type="text" placeholder="+57 300 000 0000" value="${escHtml(c.telefono||'')}"
            oninput="updateContacto(${i},'telefono',this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Email</label>
          <input type="email" placeholder="correo@empresa.com" value="${escHtml(c.email||'')}"
            oninput="updateContacto(${i},'email',this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>🎂 Fecha de Cumpleaños</label>
          <input type="date" value="${escHtml(c.cumpleanos||'')}"
            oninput="updateContacto(${i},'cumpleanos',this.value)">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>🎁 ¿Puede recibir regalos?</label>
          <select onchange="updateContacto(${i},'recibeRegalos',this.value)">
            <option value="" ${!c.recibeRegalos?'selected':''}>— Sin definir —</option>
            <option value="si" ${c.recibeRegalos==='si'?'selected':''}>✅ Sí</option>
            <option value="no" ${c.recibeRegalos==='no'?'selected':''}>❌ No</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>🏷️ Tipo de Contacto</label>
          <select onchange="updateContacto(${i},'tipoContacto',this.value)">
            <option value="" ${!c.tipoContacto?'selected':''}>— Sin definir —</option>
            <option value="principal" ${c.tipoContacto==='principal'?'selected':''}>⭐ Principal</option>
            <option value="comercial" ${c.tipoContacto==='comercial'?'selected':''}>💼 Comercial</option>
            <option value="gestion-documental" ${c.tipoContacto==='gestion-documental'?'selected':''}>📁 Gestión Documental</option>
            <option value="financiero" ${c.tipoContacto==='financiero'?'selected':''}>💰 Financiero</option>
            <option value="operativo" ${c.tipoContacto==='operativo'?'selected':''}>⚙️ Operativo</option>
          </select>
        </div>
      </div>
    </div>`).join('');
}