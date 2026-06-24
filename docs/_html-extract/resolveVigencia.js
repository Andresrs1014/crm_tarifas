function resolveVigencia(cot){
  if(cot.vigencia && /^\d{4}-\d{2}-\d{2}$/.test(cot.vigencia)) return new Date(cot.vigencia+'T12:00');
  const d = new Date((cot.fecha||'')+'T12:00');
  d.setDate(d.getDate()+(+cot.vigencia||30));
  return d;
}