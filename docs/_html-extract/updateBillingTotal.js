function updateBillingTotal(suffix){
  const inputs = document.querySelectorAll(`[id^="bill-${suffix}-"]`);
  let total = 0;
  inputs.forEach(i=>total+=Number(i.value)||0);
  const el = document.getElementById(`f-total-${suffix}`);
  if(el) el.textContent = '$'+total.toLocaleString('es-CO');
}