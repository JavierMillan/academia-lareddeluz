/* ============================================================
   deck.js · motor de presentaciones DTMM
   ------------------------------------------------------------
   Un deck solo necesita:
     <link rel="stylesheet" href="../assets/deck.css">
     <script src="../assets/deck.js" defer></script>
   y una serie de <section class="slide">.

   El HUD, la barra de progreso y el panel de notas se generan
   solos: no hace falta copiarlos en cada archivo.

   Notas del ponente: data-notes="..." en cualquier slide.
   Se abren con la tecla N (solo aparece el botón si hay notas).

   Atajos: ← → · espacio · Inicio/Fin · N notas · F pantalla completa
   ============================================================ */
(function(){
  'use strict';

  const slides = [...document.querySelectorAll('.slide')];
  if(!slides.length) return;

  const tot = slides.length;
  const hayNotas = slides.some(s => s.dataset.notes);
  let i = 0;

  /* ---- estructura del chrome (antes copiada en cada deck) ---- */
  const deck = document.getElementById('deck') || document.body;
  const volver = deck.dataset.volver || document.body.dataset.volver || '../index.html';
  const etiquetaVolver = deck.dataset.volverTexto || document.body.dataset.volverTexto || '‹ Hub';

  function crear(html, donde){
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    const nodo = t.content.firstElementChild;
    (donde || document.body).appendChild(nodo);
    return nodo;
  }

  if(!document.getElementById('bar')){
    const b = document.createElement('div'); b.id = 'bar';
    document.body.insertBefore(b, document.body.firstChild);
  }

  if(hayNotas && !document.getElementById('notes')){
    // botón de cierre propio: en mobile el panel puede tapar el HUD de
    // abajo (mismo botón "N" que lo abrió), dejando sin forma obvia de
    // cerrarlo — Escape tampoco existe en touch. Este botón siempre
    // vive dentro del panel mismo, nunca queda tapado por él.
    crear('<div id="notes" aria-live="polite">'+
      '<div class="nlabel">Notas del ponente'+
        '<button class="notes-close" id="notesClose" type="button" aria-label="Cerrar notas">✕ Cerrar</button>'+
      '</div>'+
      '<div class="ntext" id="ntext"></div></div>');
  }

  if(!document.getElementById('hint')){
    crear('<div id="hint">← → · espacio'+(hayNotas?' · N notas':'')+' · F pantalla completa</div>');
  }

  if(!document.getElementById('hud')){
    crear('<div id="hud">'+
      '<a class="navbtn hub-btn" href="'+volver+'" aria-label="Volver">'+etiquetaVolver+'</a>'+
      (hayNotas?'<button class="navbtn" id="notesBtn" type="button" aria-label="Notas del ponente" title="Notas (N)" aria-pressed="false">N</button>':'')+
      '<button class="navbtn" id="prev" type="button" aria-label="Anterior">‹</button>'+
      '<span class="cnt"><span id="cur">01</span> / <span id="tot">'+String(tot).padStart(2,'0')+'</span></span>'+
      '<button class="navbtn" id="next" type="button" aria-label="Siguiente">›</button>'+
    '</div>');
  }

  const cur        = document.getElementById('cur');
  const bar        = document.getElementById('bar');
  const totEl      = document.getElementById('tot');
  const ntext      = document.getElementById('ntext');
  const notesBtn   = document.getElementById('notesBtn');
  const notesClose = document.getElementById('notesClose');
  if(totEl) totEl.textContent = String(tot).padStart(2,'0');

  /* ---- navegación ---- */
  function pintarNotas(){
    if(!ntext) return;
    const nota = slides[i].dataset.notes;
    ntext.innerHTML = nota || '<span class="sin-notas">Esta slide no tiene notas.</span>';
    // el botón se atenúa en las slides sin nota: sigue ahí (el deck sí tiene
    // notas) pero deja claro que aquí no hay nada que leer
    if(notesBtn) notesBtn.classList.toggle('vacio', !nota);
  }

  function show(n){
    i = Math.max(0, Math.min(tot-1, n));
    slides.forEach((s,k)=>s.classList.toggle('active', k===i));
    document.body.classList.toggle('on-paper', slides[i].classList.contains('paper'));
    if(cur) cur.textContent = String(i+1).padStart(2,'0');
    if(bar) bar.style.width = ((i+1)/tot*100)+'%';
    pintarNotas();
    // deja la slide en la URL para poder compartir o recargar sin perder el sitio
    // (falla en contextos sin origen propio, p.ej. dentro de un iframe srcdoc)
    try{ history.replaceState(null,'','#'+(i+1)); }catch(e){}
  }
  function go(d){ show(i+d) }

  function toggleNotas(forzar){
    if(!hayNotas) return;
    const on = document.body.classList.toggle('notes-on', forzar);
    if(notesBtn){
      notesBtn.classList.toggle('on', on);
      notesBtn.setAttribute('aria-pressed', on?'true':'false');
    }
  }

  const next = document.getElementById('next');
  const prev = document.getElementById('prev');
  if(next) next.onclick = ()=>go(1);
  if(prev) prev.onclick = ()=>go(-1);
  if(notesBtn) notesBtn.onclick = ()=>toggleNotas();
  if(notesClose) notesClose.onclick = ()=>toggleNotas(false);

  document.addEventListener('keydown', e=>{
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    if(['ArrowRight','ArrowDown',' ','PageDown'].includes(e.key)){ e.preventDefault(); go(1) }
    else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); go(-1) }
    else if(e.key==='Home'){ e.preventDefault(); show(0) }
    else if(e.key==='End'){ e.preventDefault(); show(tot-1) }
    else if(e.key==='n'||e.key==='N'){ toggleNotas() }
    else if(e.key==='Escape'){ toggleNotas(false) }
    else if(e.key==='f'||e.key==='F'){
      if(!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  /* ---- deslizar en táctil ----
     Solo cuenta como gesto horizontal: si el dedo va más en vertical,
     es scroll dentro de la slide y no debe cambiar de página. */
  let sx=0, sy=0;
  document.addEventListener('touchstart', e=>{
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', e=>{
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx<0?1:-1);
  }, {passive:true});

  /* ---- arranque: respeta #7 en la URL ---- */
  const desdeUrl = parseInt(location.hash.replace('#',''),10);
  show(Number.isFinite(desdeUrl) && desdeUrl>0 ? desdeUrl-1 : 0);
})();
