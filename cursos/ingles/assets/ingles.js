/* ============================================================
   Hub de "¡Hablemos Inglés!" · se dibuja desde clases.json
   ------------------------------------------------------------
   Más simple que el hub.js de DTMM: no hay grupos ni destacado,
   solo filas de sesiones. Reutiliza hub.css de DTMM para el estilo
   de tarjetas/topbar, así que las clases CSS (.deck-card, .row-sec,
   etc.) son las mismas.

   Para agregar una sesión: un objeto en clases.json, fila "sesiones".
   ============================================================ */
(function(){
  'use strict';

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,c=>(
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function primeraDisponible(data){
    return data.filas.flatMap(fila=>fila.clases).find(clase=>clase.deck) || null;
  }

  function figuraGemini(){
    return '<svg viewBox="0 0 180 135" aria-hidden="true">'+
      '<path d="M42 19L60 43L66 73L54 108"/><path d="M66 73L34 88"/>'+
      '<path d="M60 43L102 48L116 79L123 111"/><path d="M116 79L146 93"/>'+
      '<path d="M102 48L127 29"/><path d="M102 48L87 20"/>'+
      '<circle class="core" cx="42" cy="19" r="3.7"/><circle cx="60" cy="43" r="2"/>'+
      '<circle cx="66" cy="73" r="1.8"/><circle cx="54" cy="108" r="1.5"/>'+
      '<circle cx="34" cy="88" r="1.2"/><circle class="core" cx="102" cy="48" r="3.3"/>'+
      '<circle cx="116" cy="79" r="1.8"/><circle cx="123" cy="111" r="1.5"/>'+
      '<circle cx="146" cy="93" r="1.2"/><circle cx="127" cy="29" r="1.5"/>'+
      '<circle cx="87" cy="20" r="1.3"/>'+
    '</svg>';
  }

  function destacado(data){
    const clase = primeraDisponible(data);
    if(!clase) return '';
    return '<section class="hub-hero" id="top">'+
      '<div class="constellation-motif motif-english" aria-hidden="true"></div>'+
      '<div class="hub-identity">'+
        '<div class="constellation-avatar">'+figuraGemini()+'</div>'+
        '<span class="constellation-name">Gemini · Dos voces</span>'+
        '<h1>¡Hablemos<br>Inglés!</h1>'+
        '<p>Práctica didáctica y conversación para ganar confianza hablando en comunidad.</p>'+
      '</div>'+
      '<a class="featured-class" href="'+esc(clase.deck)+'">'+
        '<span class="featured-label">Sesión destacada · Sesiones en comunidad</span>'+
        '<h2>'+esc(clase.titulo)+'</h2><p>'+esc(clase.resumen)+'</p>'+
        '<span class="featured-go">Abrir sesión →</span>'+
      '</a>'+
    '</section>';
  }

  function tarjeta(clase, etiqueta){
    const soon = !clase.deck;
    const tag = soon ? 'span' : 'a';
    const href = soon ? '' : ' href="'+esc(clase.deck)+'"';
    const cta = soon ? '<div class="go">Próximamente</div>'
      : '<div class="go">Abrir sesión <span class="arw">→</span></div>';

    return '<'+tag+' class="deck-card'+(soon?' soon':'')+'"'+href+'>'+
      '<span class="stripe"></span>'+
      '<div class="lvl"><span>'+esc(etiqueta)+'</span>'+
      '<span class="part">'+esc(clase.parte)+(soon?' · próximamente':'')+'</span></div>'+
      '<h4>'+esc(clase.titulo)+'</h4>'+
      '<p>'+esc(clase.resumen)+'</p>'+
      cta+
    '</'+tag+'>';
  }

  function fila(row){
    const cards = row.clases.map(c=>tarjeta(c,row.etiqueta||row.titulo)).join('');
    return '<section class="row-sec" id="'+esc(row.id)+'">'+
      '<div class="row-head">'+
        '<div class="rt"><h3>'+esc(row.titulo)+'</h3>'+
        '<span class="cnt">'+esc(row.subtitulo)+'</span></div>'+
      '</div>'+
      '<div class="rail-wrap">'+
        '<button class="side l" aria-label="Anterior"><span>‹</span></button>'+
        '<button class="side r" aria-label="Siguiente"><span>›</span></button>'+
        '<div class="rail">'+cards+'</div>'+
      '</div>'+
    '</section>';
  }

  function activarRieles(scope){
    scope.querySelectorAll('.rail-wrap').forEach(w=>{
      const rail = w.querySelector('.rail');
      const l = w.querySelector('.side.l'), r = w.querySelector('.side.r');
      const tarjetas = [...rail.querySelectorAll('.deck-card')];
      const step = ()=>Math.max(rail.clientWidth*0.78, 300);

      let dots = null;
      if(tarjetas.length > 1){
        dots = document.createElement('ul');
        dots.className = 'raildots';
        dots.setAttribute('aria-hidden','true');
        tarjetas.forEach(()=>dots.appendChild(document.createElement('li')));
        w.insertAdjacentElement('afterend', dots);
      }

      function update(){
        const max = rail.scrollWidth - rail.clientWidth;
        const has = rail.scrollWidth > rail.clientWidth + 8;
        const restante = max - rail.scrollLeft;
        const anchoTarjeta = tarjetas.length
          ? tarjetas[0].getBoundingClientRect().width : rail.clientWidth;
        const alFinal = restante <= anchoTarjeta * 0.35;
        l.disabled = !has || rail.scrollLeft <= 2;
        r.disabled = !has || alFinal;
        w.classList.toggle('scrollable', has);
        w.classList.toggle('has-more', has && !alFinal);
        if(dots && tarjetas.length){
          const paso = anchoTarjeta + parseFloat(getComputedStyle(rail).gap || 0);
          const activo = alFinal ? tarjetas.length-1
                                 : Math.min(tarjetas.length-1, Math.round(rail.scrollLeft / paso));
          [...dots.children].forEach((d,i)=>d.classList.toggle('on', i===activo));
        }
      }

      l.onclick = e=>{e.preventDefault();rail.scrollBy({left:-step(),behavior:'smooth'})};
      r.onclick = e=>{e.preventDefault();rail.scrollBy({left:step(),behavior:'smooth'})};
      rail.addEventListener('scroll',update,{passive:true});
      window.addEventListener('resize',update);
      update();
    });
  }

  function activarMenu(){
    const burger = document.getElementById('burger');
    const scrim  = document.getElementById('navScrim');
    const nav    = document.getElementById('navDrawer');
    if(!burger||!scrim||!nav) return;
    const foco = ()=>[...nav.querySelectorAll('a[href],button:not([disabled])')]
      .filter(el=>el.offsetParent!==null);
    function set(open){
      const estaba = document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open',open);
      burger.setAttribute('aria-expanded',open?'true':'false');
      burger.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
      nav.setAttribute('aria-hidden',open?'false':'true');
      if(open){ const f=foco(); if(f.length) f[0].focus(); }
      else if(estaba) burger.focus();
    }
    burger.addEventListener('click',()=>set(!document.body.classList.contains('menu-open')));
    scrim.addEventListener('click',()=>set(false));
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
    document.addEventListener('keydown',e=>{
      if(!document.body.classList.contains('menu-open')) return;
      if(e.key==='Escape'){ e.preventDefault(); set(false); return; }
      if(e.key!=='Tab') return;
      const f=foco(); if(!f.length) return;
      const primero=f[0], ultimo=f[f.length-1];
      if(e.shiftKey && document.activeElement===primero){ e.preventDefault(); ultimo.focus(); }
      else if(!e.shiftKey && document.activeElement===ultimo){ e.preventDefault(); primero.focus(); }
    });
  }

  function activarNavAjustable(){
    const header = document.getElementById('academyHeader');
    const nav = document.getElementById('navMain');
    if(!header || !nav) return;

    function medir(){
      document.body.classList.remove('nav-overflow');
      const headerStyle = getComputedStyle(header);
      const navStyle = getComputedStyle(nav);
      const fixed = [...header.children]
        .filter(element=>element!==nav && element.id!=='burger')
        .reduce((width,element)=>width+element.getBoundingClientRect().width,0);
      const navItems = [...nav.children];
      const navWidth = navItems.reduce((width,element)=>width+element.getBoundingClientRect().width,0) +
        Math.max(0,navItems.length-1)*parseFloat(navStyle.gap||0);
      const outerItems = navItems.length ? 5 : 4;
      const required = fixed + navWidth +
        (outerItems-1)*parseFloat(headerStyle.gap||0) +
        parseFloat(headerStyle.paddingLeft||0) + parseFloat(headerStyle.paddingRight||0);
      const overflow = required > header.clientWidth + 1;
      document.body.classList.toggle('nav-overflow', overflow || innerWidth <= 760);
    }

    const observer = new ResizeObserver(medir);
    observer.observe(header);
    observer.observe(nav);
    requestAnimationFrame(medir);
    window.addEventListener('load', medir, {once:true});
  }

  function error(msg){
    const rows = document.getElementById('rows');
    if(rows) rows.innerHTML = '<p class="loaderr">'+esc(msg)+'</p>';
  }

  fetch('clases.json')
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(data=>{
      const rows     = document.getElementById('rows');
      const heroSlot = document.getElementById('heroSlot');
      const navMain  = document.getElementById('navMain');
      const navDraw  = document.getElementById('navDrawer');

      if(heroSlot) heroSlot.innerHTML = destacado(data);
      if(rows) rows.innerHTML = data.filas.map(fila).join('');

      const navLinks = data.filas.map(r=>'<a href="#'+esc(r.id)+'" class="solo">'+esc(r.titulo)+'</a>').join('');
      if(navMain) navMain.insertAdjacentHTML('afterbegin', navLinks);
      if(navDraw) navDraw.insertAdjacentHTML('afterbegin', navLinks);

      activarRieles(document);
      activarNavAjustable();
      activarMenu();
    })
    .catch(e=>{
      error('No se pudieron cargar las sesiones. Si abriste el archivo directamente, '+
            'necesitas un servidor local para que el navegador permita leer clases.json.');
      console.error('[ingles]',e);
    });
})();
