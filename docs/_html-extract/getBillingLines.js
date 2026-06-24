function getBillingLines(suffix){
  const inputs = document.querySelectorAll(`[id^="bill-${suffix}-"]`);
  const result = {};
  inputs.forEach(i=>{
    const val = Number(i.value)||0;
    if(val>0){
      const match = SERVICES.find(s=>s.replace(/\s+/g,'-').replace(/\//g,'-')===i.id.replace(`bill-${suffix}-`,''));
      if(match) result[match] = val;
    }
  });
  return result;
}