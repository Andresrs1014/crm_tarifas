function initFichaScroll(){
  var wrap  = document.getElementById('ficha-scroll-wrap');
  var track = document.getElementById('ficha-scroll-track');
  var inner = document.getElementById('ficha-scroll-inner');
  var bar   = document.getElementById('ficha-fixed-scroll');
  if(!wrap||!track||!inner||!bar) return;
  inner.style.width = wrap.scrollWidth + 'px';
  track.addEventListener('scroll', function(){
    wrap.scrollLeft = track.scrollLeft;
  });
}
