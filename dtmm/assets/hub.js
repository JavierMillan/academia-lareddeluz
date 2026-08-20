/* ============================================================
   Hub de clases · se dibuja desde clases.json
   ------------------------------------------------------------
   Para agregar una clase NO se toca este archivo:
   se agrega un objeto a clases.json y aparece sola.
   ============================================================ */
(function(){
  'use strict';

  /* Grabaciones publicadas: las entradas sin url son huecos preparados. */
  function grabacionesDe(clase){
    const lista = (clase.grabaciones && clase.grabaciones.length)
      ? clase.grabaciones
      : (clase.grabacion ? [{url:clase.grabacion}] : []);
    return lista.filter(g => g && g.url);
  }

  /* Una clase con grabación o recursos merece vista de detalle.
     Si solo tiene deck, la tarjeta va directo a la presentación
     — así nunca se crean páginas intermedias vacías.
     Sin deck pero con material (p.ej. una clase abierta grabada), también
     va al detalle: lo que decide es si hay algo que ver, no si hay deck. */
  function tieneExtras(clase){
    return !!(grabacionesDe(clase).length || (clase.recursos && clase.recursos.length));
  }
  function destino(clase){
    if(tieneExtras(clase)) return 'clase.html?id='+encodeURIComponent(clase.id);
    return clase.deck || null;                         // sin nada: próximamente
  }
  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g,c=>(
      {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function tarjeta(clase, etiqueta){
    const url = destino(clase);
    const soon = !url;
    const tag = soon ? 'span' : 'a';
    const href = soon ? '' : ' href="'+esc(url)+'"';

    let extras = '';
    if(!soon && tieneExtras(clase)){
      const chips = [];
      const g = grabacionesDe(clase).length;
      if(g) chips.push('<span class="tag">▶ '+(g>1?g+' grabaciones':'Grabación')+'</span>');
      const n = clase.recursos ? clase.recursos.length : 0;
      if(n) chips.push('<span class="tag">⌘ '+n+' recurso'+(n>1?'s':'')+'</span>');
      extras = '<div class="extras">'+chips.join('')+'</div>';
    }

    const cta = soon
      ? '<div class="go">Próximamente</div>'
      : '<div class="go">'+(tieneExtras(clase)?'Ver la clase':'Abrir presentación')+
        ' <span class="arw">→</span></div>';

    return '<'+tag+' class="deck-card'+(soon?' soon':'')+'"'+href+'>'+
      '<span class="stripe"></span>'+
      '<div class="lvl"><span>'+esc(etiqueta)+'</span>'+
      '<span class="part">'+esc(clase.parte)+(soon?' · próximamente':'')+'</span></div>'+
      '<h4>'+esc(clase.titulo)+'</h4>'+
      '<p>'+esc(clase.resumen)+'</p>'+
      extras+cta+
      '<div class="prog"><i style="--p:'+(clase.progreso||0)+'%"></i></div>'+
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

  function destacado(d){
    if(!d) return '';
    return '<section class="hero" id="top">'+
      '<div class="halo"></div>'+
      '<div class="hero-in">'+
        '<div class="tagline"><span class="badge">'+esc(d.etiqueta)+'</span>'+
        '<span>'+esc(d.estado)+'</span></div>'+
        '<h1>'+d.titulo+'</h1>'+
        '<p>'+esc(d.resumen)+'</p>'+
        '<a class="cta" href="'+esc(d.deck)+'">Abrir presentación <span class="arw">→</span></a>'+
      '</div>'+
    '</section>';
  }

  /* ---- navegación ----
     Las filas se agrupan según data.grupos; cada grupo es un desplegable.
     Una fila sin grupo declarado cae en un grupo "Más" automático, así que
     agregar filas nunca deja huecos ni alarga la barra. */
  function agrupaFilas(data){
    const porId = new Map(data.filas.map(f=>[f.id,f]));
    const usadas = new Set();
    const grupos = (data.grupos||[]).map(g=>{
      const filas = (g.filas||[]).map(id=>{usadas.add(id);return porId.get(id)}).filter(Boolean);
      return {...g, filasResueltas:filas};
    }).filter(g=>g.filasResueltas.length);
    const sueltas = data.filas.filter(f=>!usadas.has(f.id));
    if(sueltas.length){
      grupos.push({id:'mas',titulo:'Más',descripcion:'',filasResueltas:sueltas});
    }
    return grupos;
  }

  function cuentaClases(fila){
    return fila.clases.filter(c=>c.deck).length;
  }

  function navEscritorio(data, grupos){
    let html = '';
    if(data.destacado){
      html += '<a class="solo" href="#top">'+esc(data.destacado.etiqueta)+'</a>';
    }
    grupos.forEach(g=>{
      const items = g.filasResueltas.map(f=>
        '<a href="#'+esc(f.id)+'" data-fila="'+esc(f.id)+'">'+
          '<span class="mt">'+esc(f.titulo)+'</span>'+
          '<span class="md">'+esc(f.subtitulo)+'</span>'+
          '<span class="mn">'+cuentaClases(f)+' clase'+(cuentaClases(f)===1?'':'s')+'</span>'+
        '</a>').join('');
      html += '<div class="navgroup" data-grupo="'+esc(g.id)+'">'+
        '<button class="trigger" type="button" aria-expanded="false" aria-haspopup="true">'+
          esc(g.titulo)+' <span class="chev">▼</span></button>'+
        '<div class="navmenu" role="menu">'+items+'</div>'+
      '</div>';
    });
    return html;
  }

  function navMovil(data, grupos){
    let html = '';
    if(data.destacado){
      html += '<a href="#top">'+esc(data.destacado.etiqueta)+'</a>';
    }
    grupos.forEach(g=>{
      const items = g.filasResueltas.map(f=>
        '<a href="#'+esc(f.id)+'" data-fila="'+esc(f.id)+'">'+esc(f.titulo)+
        '<span class="mn">'+cuentaClases(f)+'</span></a>').join('');
      html += '<div class="dgroup"><div class="dhead">'+esc(g.titulo)+'</div>'+items+'</div>';
    });
    return html;
  }

  /* ---- desplegables: hover en escritorio, clic siempre, Esc para cerrar ---- */
  function activarDesplegables(){
    const nav = document.getElementById('navMain');
    if(!nav) return;
    const grupos = [...nav.querySelectorAll('.navgroup')];
    const finoPuntero = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    function cerrarTodos(excepto){
      grupos.forEach(g=>{
        if(g===excepto) return;
        g.classList.remove('open');
        g.querySelector('.trigger').setAttribute('aria-expanded','false');
      });
    }
    function abrir(g,estado){
      g.classList.toggle('open',estado);
      g.querySelector('.trigger').setAttribute('aria-expanded',estado?'true':'false');
      if(estado) cerrarTodos(g);
    }

    grupos.forEach(g=>{
      const t = g.querySelector('.trigger');
      t.addEventListener('click',e=>{
        e.preventDefault();
        abrir(g,!g.classList.contains('open'));
      });
      if(finoPuntero){
        let cerrar;
        g.addEventListener('mouseenter',()=>{clearTimeout(cerrar);abrir(g,true)});
        g.addEventListener('mouseleave',()=>{cerrar=setTimeout(()=>abrir(g,false),160)});
      }
      g.querySelectorAll('.navmenu a').forEach(a=>
        a.addEventListener('click',()=>abrir(g,false)));
    });

    document.addEventListener('click',e=>{if(!e.target.closest('.navgroup'))cerrarTodos(null)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarTodos(null)});
  }

  /* ---- carrusel: flechas (escritorio) + puntos y degradado (táctil) ----
     En móvil no hay flechas, así que la fila necesita decir por sí sola
     que continúa: degradado al borde, puntos de posición y un empujón
     inicial que insinúa el arrastre. */
  function activarRieles(scope){
    scope.querySelectorAll('.rail-wrap').forEach(w=>{
      const rail = w.querySelector('.rail');
      const l = w.querySelector('.side.l'), r = w.querySelector('.side.r');
      const tarjetas = [...rail.querySelectorAll('.deck-card')];
      const step = ()=>Math.max(rail.clientWidth*0.78, 300);

      // puntos: uno por tarjeta, solo si la fila realmente se desplaza
      let dots = null;
      if(tarjetas.length > 1){
        dots = document.createElement('ul');
        dots.className = 'raildots';
        dots.setAttribute('aria-hidden','true');   // decorativo: el riel ya es navegable
        tarjetas.forEach(()=>dots.appendChild(document.createElement('li')));
        w.insertAdjacentElement('afterend', dots);
      }

      function update(){
        const max = rail.scrollWidth - rail.clientWidth;
        const has = rail.scrollWidth > rail.clientWidth + 8;  // margen: ignora el padding
        // scroll-snap + scroll-padding impiden alcanzar el máximo exacto:
        // se considera "al final" cuando ya no cabe otra tarjeta por mostrar.
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
          // al final del riel siempre se muestra la última tarjeta
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

      // la pista de arrastre se muestra una vez, al asomar la fila
      if(window.matchMedia('(hover:none)').matches && 'IntersectionObserver' in window){
        const io = new IntersectionObserver((ents,obs)=>{
          ents.forEach(e=>{
            if(!e.isIntersecting || !w.classList.contains('has-more')) return;
            w.classList.add('hint');
            setTimeout(()=>w.classList.remove('hint'),1600);
            obs.unobserve(w);
          });
        },{threshold:.5});
        io.observe(w);
      }
    });
  }

  /* ---- resalta el grupo cuya fila se está viendo ---- */
  function activarFilaActiva(){
    const secciones = [...document.querySelectorAll('.hero[id], .row-sec[id]')];
    const nav = document.getElementById('navMain');
    if(!secciones.length || !nav) return;

    const porFila = new Map();
    nav.querySelectorAll('[data-fila]').forEach(a=>porFila.set(a.dataset.fila,a));
    const solo = nav.querySelector('a.solo');

    function marcar(id){
      nav.querySelectorAll('.current').forEach(x=>x.classList.remove('current'));
      if(id==='top'){ if(solo) solo.classList.add('current'); return; }
      const a = porFila.get(id);
      if(!a) return;
      a.classList.add('current');
      const grupo = a.closest('.navgroup');
      if(grupo) grupo.querySelector('.trigger').classList.add('current');
    }

    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting) marcar(e.target.id); });
    },{rootMargin:'-45% 0px -45% 0px'});
    secciones.forEach(s=>io.observe(s));
  }

  /* ---- menú móvil ----
     Abierto: el foco queda dentro del panel y Esc lo cierra devolviendo
     el foco al botón, como se espera de un diálogo. */
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
      else if(estaba) burger.focus();   // solo al cerrar de verdad
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

  function error(msg){
    const rows = document.getElementById('rows');
    if(rows) rows.innerHTML = '<p class="loaderr">'+esc(msg)+'</p>';
  }

  fetch('clases.json')
    .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(data=>{
      const heroSlot = document.getElementById('heroSlot');
      const rows     = document.getElementById('rows');
      if(heroSlot) heroSlot.innerHTML = destacado(data.destacado);
      if(rows)     rows.innerHTML     = data.filas.map(fila).join('');
      const grupos  = agrupaFilas(data);
      const navMain = document.getElementById('navMain');
      const navDraw = document.getElementById('navDrawer');
      if(navMain) navMain.insertAdjacentHTML('afterbegin',navEscritorio(data,grupos));
      if(navDraw) navDraw.insertAdjacentHTML('afterbegin',navMovil(data,grupos));
      activarRieles(document);
      activarMenu();
      activarDesplegables();
      activarFilaActiva();
    })
    .catch(e=>{
      error('No se pudieron cargar las clases. Si abriste el archivo directamente, '+
            'necesitas un servidor local para que el navegador permita leer clases.json.');
      console.error('[hub]',e);
    });
})();
