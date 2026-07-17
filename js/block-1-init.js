  function syncCRMScroll(board){
    var track = document.getElementById('crm-board-scroll-track');
    if(track) track.scrollLeft = board.scrollLeft;
  }
  function initCRMScrollSync(){
    var board = document.getElementById('crm-board');
    var track = document.getElementById('crm-board-scroll-track');
    var inner = document.getElementById('crm-board-scroll-inner');
    var bar   = document.getElementById('crm-fixed-scroll');
    if(!board||!track||!inner||!bar) return;
    function updateWidth(){ inner.style.width = board.scrollWidth + 'px'; }
    updateWidth();
    track.addEventListener('scroll', function(){ board.scrollLeft = track.scrollLeft; });
    var ro = new ResizeObserver(updateWidth);
    ro.observe(board);
    bar.style.display = 'block';
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(initCRMScrollSync,100); });
