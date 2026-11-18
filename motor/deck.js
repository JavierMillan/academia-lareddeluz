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

  const scriptSrc = document.currentScript && document.currentScript.src;
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
    // un video que sigue sonando en otra slide distrae: se pausa al salir
    slides.forEach((s,k)=>{ if(k!==i) s.querySelectorAll('video').forEach(v=>v.pause()) });
    // deja la slide en la URL para poder compartir o recargar sin perder el sitio
    // (falla en contextos sin origen propio, p.ej. dentro de un iframe srcdoc)
    try{ history.replaceState(null,'','#'+(i+1)); }catch(e){}
    if(i===tot-1) avance.alTerminar();
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

  /* ---- videos: botón de pantalla completa siempre visible ----
     El de los controles nativos se esconde en el menú (⋮) cuando el video
     es angosto, y en iPhone solo existe webkitEnterFullscreen. */
  function pantallaCompleta(v){
    if(document.fullscreenElement===v) return document.exitFullscreen();
    if(v.requestFullscreen) v.requestFullscreen().catch(()=>{});
    else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();
  }
  document.querySelectorAll('.slide video').forEach(v=>{
    const caja = document.createElement('div');
    caja.className = 'media';
    v.parentNode.insertBefore(caja, v);
    caja.appendChild(v);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'media-fs';
    b.setAttribute('aria-label','Ver el video en pantalla completa');
    b.title = 'Pantalla completa (doble clic)';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    b.onclick = ()=>pantallaCompleta(v);
    caja.appendChild(b);
    v.addEventListener('dblclick', e=>{ e.preventDefault(); pantallaCompleta(v) });
  });

  document.addEventListener('keydown', e=>{
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    // con un video enfocado, espacio y F son del video, no del deck
    const v = e.target && e.target.closest && e.target.closest('.media') ? e.target.closest('.media').querySelector('video') : null;
    if(v && e.key===' '){ e.preventDefault(); v.paused ? v.play() : v.pause(); return }
    if(v && (e.key==='f'||e.key==='F')){ pantallaCompleta(v); return }
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
    // arrastrar la barra de un video no es cambiar de slide
    if(e.target.closest && e.target.closest('.media')) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx<0?1:-1);
  }, {passive:true});

  /* ---- avance del alumno ----
     El deck se reconoce solo: busca en clases.json del curso la clase cuyo
     "deck" es esta página. Al abrir queda "en curso"; al llegar a la última
     lámina queda "vista", con un aviso para deshacer. Si no hay
     almacenamiento o la página no está en clases.json, no hace nada. */
  const avance = (function(){
    let curso = null, clase = null, avisado = false;
    const listo = (function(){
      if(!scriptSrc || !window.fetch) return Promise.resolve();
      const raiz = new URL('../../', scriptSrc);
      const cargarProgreso = window.Progreso ? Promise.resolve() : new Promise(function(ok){
        const s = document.createElement('script');
        s.src = new URL('progreso.js', scriptSrc).href; s.onload = ok; s.onerror = ok;
        document.head.appendChild(s);
      });
      return Promise.all([
        fetch(new URL('constelacion.json', raiz)).then(r=>r.ok?r.json():null),
        fetch(new URL('clases.json', raiz)).then(r=>r.ok?r.json():null),
        cargarProgreso
      ]).then(function(res){
        const cfg = res[0], data = res[1];
        if(!cfg || !data || !window.Progreso || !Progreso.disponible()) return;
        const aqui = location.pathname.replace(/\/index\.html$/,'/');
        (data.filas||[]).forEach(f=>(f.clases||[]).forEach(c=>{
          if(c.deck && new URL(c.deck, raiz).pathname === aqui) clase = c;
        }));
        if(!clase) return;
        curso = cfg.id;
        return Progreso.visto(curso, clase.id).then(function(estado){
          if(estado !== Progreso.ESTADOS.VISTO) Progreso.marcar(curso, clase.id, Progreso.ESTADOS.CURSO);
          else avisado = true;   // ya estaba vista: no se vuelve a anunciar
        });
      }).catch(function(){});
    })();

    function aviso(){
      let t = document.getElementById('avance');
      if(!t){
        t = document.createElement('div');
        t.id = 'avance'; t.setAttribute('role','status');
        document.body.appendChild(t);
      }
      t.innerHTML = '<span>✓ Clase marcada como vista</span>'+
        '<button type="button" class="navbtn" id="avanceDeshacer">Deshacer</button>';
      t.classList.add('on');
      document.getElementById('avanceDeshacer').onclick = function(){
        Progreso.marcar(curso, clase.id, Progreso.ESTADOS.CURSO);
        t.innerHTML = '<span>Listo, la clase sigue en curso</span>';
        setTimeout(()=>t.classList.remove('on'), 1800);
      };
      clearTimeout(aviso.reloj);
      aviso.reloj = setTimeout(()=>t.classList.remove('on'), 6000);
    }

    return {
      alTerminar: function(){
        listo.then(function(){
          if(!clase || avisado) return;
          avisado = true;
          Progreso.marcar(curso, clase.id, Progreso.ESTADOS.VISTO).then(aviso);
        });
      }
    };
  })();

  /* ---- arranque: respeta #7 en la URL ---- */
  const desdeUrl = parseInt(location.hash.replace('#',''),10);
  show(Number.isFinite(desdeUrl) && desdeUrl>0 ? desdeUrl-1 : 0);
})();
