function destroyChart(key){
  if(charts[key]){ try{ charts[key].destroy(); }catch(e){} delete charts[key]; }
}