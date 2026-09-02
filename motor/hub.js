/* ============================================================
   hub.js · motor de constelaciones
   ------------------------------------------------------------
   Un solo motor para todas las constelaciones. Lo que cambia
   entre una y otra —identidad, figura, menú, capacidades— vive
   en constelacion.json; lo que cambia entre clases, en clases.json.

   Este archivo no conoce a DTMM ni a Inglés por nombre.

       constelacion.json ─┐
                          ├─→ hub.js ─→ DOM
             clases.json ─┘

   Para agregar una clase no se toca este archivo.
   ============================================================ */
(function () {
  'use strict';

  var HubModel = window.HubModel;
  if (!HubModel) throw new Error('Falta assets/motor/hub-model.js');

  var TEXTOS = {
    destacado: 'Clase destacada',
    comenzar: 'Comenzar',
    abrir: 'Abrir presentación',
    verClase: 'Ver la clase',
    continuar: 'Continuar aquí',
    repasar: 'Repasar',
    proximamente: 'Próximamente'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function txt(cfg, clave) {
    return (cfg.textos && cfg.textos[clave]) || TEXTOS[clave];
  }

  /* ---------- figura de la constelación ----------
     Sale de constelacion.json, no de una función por curso. */
  function figura(cfg) {
    var f = cfg.figura;
    if (!f) return '';
    var trazos = (f.trazos || []).map(function (d) {
      return '<path d="' + esc(d) + '"/>';
    }).join('');
    var nodos = (f.nodos || []).map(function (n) {
      return '<circle' + (n.core ? ' class="core"' : '') +
        ' cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '"/>';
    }).join('');
    return '<svg viewBox="' + esc(f.viewBox || '0 0 180 135') + '" aria-hidden="true">' +
      trazos + nodos + '</svg>';
  }

  /* ---------- índice curricular ---------- */
  function chipsMateriales(cfg, clase) {
    var iconos = { presentacion: '▤', grabacion: '▶', recursos: '⌘' };
    return HubModel.materialesDe(cfg, clase).map(function (material) {
      return '<span class="material ' + esc(material.tipo) + '"><span aria-hidden="true">' +
        iconos[material.tipo] + '</span> ' + esc(material.texto) + '</span>';
    }).join('');
  }

  function filaClase(cfg, clase, indice, progreso) {
    var url = HubModel.destino(cfg, clase);
    var estado = HubModel.estadoDe(progreso, clase.id);
    var soon = !url;
    var clases = ['lesson-row', estado];
    if (soon) clases.push('soon');
    var accion = soon ? txt(cfg, 'proximamente') : estado === 'visto' ? txt(cfg, 'repasar') :
      estado === 'curso' ? txt(cfg, 'continuar') : txt(cfg, 'abrir');
    var numero = String(indice + 1).padStart(2, '0');
    var estadoTexto = estado === 'visto' ? 'Vista' : estado === 'curso' ? 'En curso' : 'Sin comenzar';
    var apertura = soon ? '<div' : '<a href="' + esc(url) + '" data-clase="' + esc(clase.id) + '"';
    var cierre = soon ? '</div>' : '</a>';
    return apertura + ' class="' + clases.join(' ') + '">' +
      '<span class="lesson-status" aria-hidden="true">' + (estado === 'visto' ? '✓' : numero) + '</span>' +
      '<span class="sr-only">' + estadoTexto + '. </span>' +
      '<span class="lesson-copy"><span class="lesson-kicker">' +
        esc(clase.parte || 'Clase ' + numero) + '</span>' +
        '<strong>' + esc(clase.titulo) + '</strong><span class="lesson-summary">' +
        esc(clase.resumen || '') + '</span><span class="lesson-materials">' +
        chipsMateriales(cfg, clase) + '</span></span>' +
      '<span class="lesson-action">' + esc(accion) + (soon ? '' : ' →') + '</span>' + cierre;
  }

  function contenidoCategoria(cfg, row, progreso) {
    var clases = (row.clases || []).map(function (clase, indice) {
      return filaClase(cfg, clase, indice, progreso);
    }).join('');
    return clases || '<p class="curriculum-empty">Contenido próximamente</p>';
  }

  function panelCategoria(cfg, row, progreso) {
    if (!row) {
      return '<section class="active-category empty" aria-live="polite">' +
        '<p class="curriculum-empty">Contenido próximamente</p></section>';
    }
    var resumen = HubModel.resumenFila(cfg, row, progreso);
    return '<section class="active-category" aria-live="polite" data-active-category="' +
      esc(row.id) + '"><header class="active-category-header"><span>' +
        '<span class="category-meta">' + esc(row.subtitulo || '') + '</span>' +
        '<h2>' + esc(row.titulo) + '</h2></span>' +
        '<span class="category-progress">' + resumen.vistas + ' / ' + resumen.total +
        ' vistas</span></header><div class="lesson-list">' +
        contenidoCategoria(cfg, row, progreso) + '</div></section>';
  }

  function mapaCurso(cfg, data, progreso, activa) {
    var botones = (data.filas || []).map(function (row) {
      var resumen = HubModel.resumenFila(cfg, row, progreso);
      var actual = activa && row.id === activa.id;
      return '<button class="course-map-button" type="button" data-category-id="' +
        esc(row.id) + '" aria-pressed="' + (actual ? 'true' : 'false') + '">' +
        '<span>' + esc(row.titulo) + '</span><span>' + resumen.vistas + '/' +
        resumen.total + '</span></button>';
    }).join('');
    return '<div class="curriculum-workspace"><nav class="course-map" aria-label="Mapa del curso">' +
      '<span class="course-map-label">Mapa del curso</span>' + botones + '</nav>' +
      '<div class="active-category-slot">' + panelCategoria(cfg, activa, progreso) +
      '</div></div>';
  }

  function categoriaMovil(cfg, row, progreso, abierta) {
    var resumen = HubModel.resumenFila(cfg, row, progreso);
    var panelId = 'mobile-panel-' + row.id;
    return '<section class="mobile-category" id="' + esc(row.id) +
      '" data-mobile-category="' + esc(row.id) + '">' +
      '<button class="mobile-category-heading" type="button" aria-expanded="' +
        (abierta ? 'true' : 'false') + '" aria-controls="' + esc(panelId) + '">' +
        '<span class="mobile-category-copy"><strong>' + esc(row.titulo) + '</strong>' +
        '<small>' + esc(row.subtitulo || '') + '</small></span>' +
        '<span class="mobile-category-progress">' + resumen.vistas + '/' + resumen.total +
        ' <span aria-hidden="true">⌄</span></span></button>' +
      '<div class="mobile-category-panel" id="' + esc(panelId) + '"' +
        (abierta ? '' : ' hidden') + '><div class="lesson-list">' +
        contenidoCategoria(cfg, row, progreso) + '</div></div></section>';
  }

  function curriculoMovil(cfg, data, progreso, activa) {
    return '<div class="mobile-curriculum">' + (data.filas || []).map(function (row) {
      return categoriaMovil(cfg, row, progreso, activa && row.id === activa.id);
    }).join('') + '</div>';
  }

  function curriculoEnfocado(cfg, data, progreso) {
    var activa = HubModel.categoriaInicial(cfg, data, progreso);
    return '<div class="focused-curriculum" id="curriculum">' +
      mapaCurso(cfg, data, progreso, activa) + curriculoMovil(cfg, data, progreso, activa) +
      '</div>';
  }

  /* ---------- portada ---------- */
  function destacado(cfg, data, progreso) {
    var resumen = HubModel.resumenCurso(cfg, data, progreso || { clases: {}, ultima: null });
    var d = resumen.recomendada;
    var nombre = cfg.figura && cfg.figura.titulo ? cfg.figura.titulo : '';
    var estado = d ? HubModel.estadoDe(progreso, d.id) : 'nuevo';
    var accion = estado === 'curso' ? txt(cfg, 'continuar') :
      estado === 'visto' ? txt(cfg, 'repasar') : txt(cfg, 'comenzar');
    var progresoVisible = progreso ?
      '<div class="course-progress" aria-label="' + resumen.vistas + ' de ' + resumen.total +
        ' clases vistas"><span>' + resumen.vistas + ' de ' + resumen.total + ' vistas</span>' +
        '<div class="bar"><i style="width:' + resumen.porcentaje + '%"></i></div></div>' : '';
    var recomendacion = d ?
      '<a class="featured-class" href="' + esc(HubModel.destino(cfg, d)) +
        '" data-clase="' + esc(d.id) + '">' +
        '<span class="featured-label">Tu siguiente paso</span>' +
        '<h2>' + esc(d.titulo) + '</h2>' +
        '<p>' + esc(d.resumen || '') + '</p>' +
        '<span class="featured-go">' + esc(accion) + ' →</span></a>' :
      '<div class="featured-class empty"><span class="featured-label">Contenido</span>' +
        '<h2>Próximamente</h2></div>';

    return '<section class="hub-hero" id="top">' +
      '<div class="constellation-motif" aria-hidden="true"></div>' +
      '<div class="hub-identity">' +
        '<div class="constellation-avatar">' + figura(cfg) + '</div>' +
        (nombre ? '<span class="constellation-name">' + esc(nombre) + '</span>' : '') +
        '<h1>' + esc(cfg.nombre) + '</h1>' +
        (cfg.resumen ? '<p>' + esc(cfg.resumen) + '</p>' : '') + progresoVisible +
      '</div>' +
      recomendacion +
      '</section>';
  }

  function navegacionCurso(cfg) {
    return (cfg.menu || []).map(function (item) {
      var activo = item.despliega === 'filas' ? ' current' : '';
      return '<a class="course-tab' + activo + '" href="' + esc(item.href) + '"' +
        (activo ? ' aria-current="page"' : '') + '>' + esc(item.texto) + '</a>';
    }).join('');
  }

  /* ---------- navegación ----------
     El menú sale de constelacion.json. Un ítem con "despliega":"filas"
     se convierte en desplegable con las filas de clases.json dentro; el
     resto son enlaces sueltos. Así Inglés lleva Recursos y DTMM no, sin
     que el motor sepa de ninguno de los dos. */
  function cuentaClases(f) {
    return f.clases.filter(function (c) { return c.deck; }).length;
  }

  function agrupaFilas(data) {
    var porId = new Map(data.filas.map(function (f) { return [f.id, f]; }));
    var usadas = new Set();
    var grupos = (data.grupos || []).map(function (g) {
      var filas = (g.filas || []).map(function (id) { usadas.add(id); return porId.get(id); })
        .filter(Boolean);
      return { id: g.id, titulo: g.titulo, filas: filas };
    }).filter(function (g) { return g.filas.length; });
    var sueltas = data.filas.filter(function (f) { return !usadas.has(f.id); });
    if (sueltas.length) {
      grupos.push({ id: 'mas', titulo: grupos.length ? 'Más' : 'Clases', filas: sueltas });
    }
    return grupos;
  }

  function navEscritorio(cfg, data, grupos) {
    return (cfg.menu || []).map(function (item) {
      if (item.despliega !== 'filas') {
        return '<a class="solo" href="' + esc(item.href) + '">' + esc(item.texto) + '</a>';
      }
      return grupos.map(function (g) {
        var items = g.filas.map(function (f) {
          var n = cuentaClases(f);
          return '<a href="#' + esc(f.id) + '" data-fila="' + esc(f.id) + '">' +
            '<span class="mt">' + esc(f.titulo) + '</span>' +
            '<span class="md">' + esc(f.subtitulo) + '</span>' +
            '<span class="mn">' + n + ' clase' + (n === 1 ? '' : 's') + '</span></a>';
        }).join('');
        return '<div class="navgroup" data-grupo="' + esc(g.id) + '">' +
          '<button class="trigger" type="button" aria-expanded="false" aria-haspopup="true">' +
          esc(grupos.length === 1 ? item.texto : g.titulo) + ' <span class="chev">▼</span></button>' +
          '<div class="navmenu" role="menu">' + items + '</div></div>';
      }).join('');
    }).join('');
  }

  function navMovil(cfg, data, grupos) {
    return (cfg.menu || []).map(function (item) {
      if (item.despliega !== 'filas') {
        return '<a href="' + esc(item.href) + '">' + esc(item.texto) + '</a>';
      }
      return grupos.map(function (g) {
        var items = g.filas.map(function (f) {
          return '<a href="#' + esc(f.id) + '" data-fila="' + esc(f.id) + '">' + esc(f.titulo) +
            '<span class="mn">' + cuentaClases(f) + '</span></a>';
        }).join('');
        return '<div class="dgroup"><div class="dhead">' +
          esc(grupos.length === 1 ? item.texto : g.titulo) + '</div>' + items + '</div>';
      }).join('');
    }).join('');
  }

  /* ---------- desplegables ---------- */
  function activarDesplegables() {
    var nav = document.getElementById('navMain');
    if (!nav) return;
    var grupos = [].slice.call(nav.querySelectorAll('.navgroup'));
    if (!grupos.length) return;
    var finoPuntero = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

    function cerrarTodos(excepto) {
      grupos.forEach(function (g) {
        if (g === excepto) return;
        g.classList.remove('open');
        g.querySelector('.trigger').setAttribute('aria-expanded', 'false');
      });
    }
    function abrir(g, estado) {
      g.classList.toggle('open', estado);
      g.querySelector('.trigger').setAttribute('aria-expanded', estado ? 'true' : 'false');
      if (estado) cerrarTodos(g);
    }

    grupos.forEach(function (g) {
      var t = g.querySelector('.trigger');
      t.addEventListener('click', function (e) {
        e.preventDefault();
        abrir(g, !g.classList.contains('open'));
      });
      if (finoPuntero) {
        var cerrar;
        g.addEventListener('mouseenter', function () { clearTimeout(cerrar); abrir(g, true); });
        g.addEventListener('mouseleave', function () { cerrar = setTimeout(function () { abrir(g, false); }, 160); });
      }
      g.querySelectorAll('.navmenu a').forEach(function (a) {
        a.addEventListener('click', function () { abrir(g, false); });
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.navgroup')) cerrarTodos(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') cerrarTodos(null);
    });
  }

  /* ---------- resalta la fila que se está viendo ---------- */
  function activarFilaActiva() {
    var secciones = [].slice.call(document.querySelectorAll('.hub-hero[id], .row-sec[id]'));
    var nav = document.getElementById('navMain');
    if (!secciones.length || !nav || !('IntersectionObserver' in window)) return;

    var porFila = new Map();
    nav.querySelectorAll('[data-fila]').forEach(function (a) { porFila.set(a.dataset.fila, a); });
    var solo = nav.querySelector('a.solo');

    function marcar(id) {
      nav.querySelectorAll('.current').forEach(function (x) { x.classList.remove('current'); });
      if (id === 'top') { if (solo) solo.classList.add('current'); return; }
      var a = porFila.get(id);
      if (!a) return;
      a.classList.add('current');
      var grupo = a.closest('.navgroup');
      if (grupo) grupo.querySelector('.trigger').classList.add('current');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) marcar(e.target.id); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    secciones.forEach(function (s) { io.observe(s); });
  }

  /* ---------- la barra se pliega cuando no cabe ---------- */
  function activarNavAjustable() {
    var header = document.getElementById('academyHeader');
    var nav = document.getElementById('navMain');
    if (!header || !nav || !('ResizeObserver' in window)) return;

    function medir() {
      document.body.classList.remove('nav-overflow');
      var headerStyle = getComputedStyle(header);
      var navStyle = getComputedStyle(nav);
      var fixed = [].slice.call(header.children)
        .filter(function (el) { return el !== nav && el.id !== 'burger'; })
        .reduce(function (w, el) { return w + el.getBoundingClientRect().width; }, 0);
      var navItems = [].slice.call(nav.children);
      var navWidth = navItems.reduce(function (w, el) { return w + el.getBoundingClientRect().width; }, 0) +
        Math.max(0, navItems.length - 1) * parseFloat(navStyle.gap || 0);
      var outerItems = navItems.length ? 5 : 4;
      var required = fixed + navWidth +
        (outerItems - 1) * parseFloat(headerStyle.gap || 0) +
        parseFloat(headerStyle.paddingLeft || 0) + parseFloat(headerStyle.paddingRight || 0);
      document.body.classList.toggle('nav-overflow', required > header.clientWidth + 1 || innerWidth <= 760);
    }

    var observer = new ResizeObserver(medir);
    observer.observe(header);
    observer.observe(nav);
    requestAnimationFrame(medir);
    window.addEventListener('load', medir, { once: true });
  }

  /* ---------- cajón de navegación ----------
     Abierto atrapa el foco y Esc lo cierra devolviéndolo al botón. */
  function activarMenu() {
    var burger = document.getElementById('burger');
    var scrim = document.getElementById('navScrim');
    var nav = document.getElementById('navDrawer');
    if (!burger || !scrim || !nav) return;

    function foco() {
      return [].slice.call(nav.querySelectorAll('a[href],button:not([disabled])'))
        .filter(function (el) { return el.offsetParent !== null; });
    }
    function set(open) {
      var estaba = document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { var f = foco(); if (f.length) f[0].focus(); }
      else if (estaba) burger.focus();
    }

    burger.addEventListener('click', function () {
      set(!document.body.classList.contains('menu-open'));
    });
    scrim.addEventListener('click', function () { set(false); });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); set(false); return; }
      if (e.key !== 'Tab') return;
      var f = foco();
      if (!f.length) return;
      var primero = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
  }

  /* ---------- categorías curriculares ---------- */
  function activarCurriculo(cfg, data, progreso) {
    var slot = document.querySelector('.active-category-slot');

    function seleccionar(id) {
      var row = (data.filas || []).find(function (fila) { return fila.id === id; });
      if (!row) return;
      document.querySelectorAll('.course-map-button').forEach(function (button) {
        button.setAttribute('aria-pressed', button.dataset.categoryId === id ? 'true' : 'false');
      });
      if (slot) slot.innerHTML = panelCategoria(cfg, row, progreso);
    }

    function abrirMovil(button) {
      document.querySelectorAll('.mobile-category-heading').forEach(function (other) {
        var abierta = other === button;
        other.setAttribute('aria-expanded', abierta ? 'true' : 'false');
        document.getElementById(other.getAttribute('aria-controls')).hidden = !abierta;
      });
    }

    document.querySelectorAll('.course-map-button').forEach(function (button) {
      button.addEventListener('click', function () { seleccionar(button.dataset.categoryId); });
    });
    document.querySelectorAll('.mobile-category-heading').forEach(function (button) {
      button.addEventListener('click', function () { abrirMovil(button); });
    });

    document.querySelectorAll('[data-fila]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        seleccionar(link.dataset.fila);
        var mobileButton = document.querySelector('.mobile-category[data-mobile-category="' +
          CSS.escape(link.dataset.fila) + '"] .mobile-category-heading');
        if (mobileButton) abrirMovil(mobileButton);
        var curriculum = document.getElementById('curriculum');
        if (curriculum) curriculum.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- progreso ----------
     Se lee de la capa Progreso, que hoy guarda en el navegador y mañana
     en la cuenta de cada quien. Si no está disponible, el hub funciona
     igual: sin marcas de estado. */
  function leerProgreso(cfg) {
    if ((cfg.capacidades || {}).progreso === false) return Promise.resolve(null);
    if (typeof Progreso === 'undefined' || !Progreso.disponible()) return Promise.resolve(null);
    return Progreso.delCurso(cfg.id).catch(function () { return null; });
  }

  /* Marca una clase como empezada al abrirla. */
  function activarMarcado(cfg) {
    if ((cfg.capacidades || {}).progreso === false) return;
    if (typeof Progreso === 'undefined' || !Progreso.disponible()) return;
    document.addEventListener('click', function (e) {
      var lesson = e.target.closest('.lesson-row[href], .featured-class[data-clase]');
      if (!lesson) return;
      var id = lesson.dataset.clase;
      if (id) Progreso.marcar(cfg.id, id, Progreso.ESTADOS.CURSO);
    });
  }

  function error(msg) {
    var rows = document.getElementById('rows');
    if (rows) rows.innerHTML = '<p class="loaderr">' + esc(msg) + '</p>';
  }

  /* ---------- arranque ---------- */
  function json(ruta) {
    return fetch(ruta).then(function (r) {
      if (!r.ok) throw new Error(ruta + ': HTTP ' + r.status);
      return r.json();
    });
  }

  Promise.all([json('constelacion.json'), json('clases.json')])
    .then(function (res) {
      var cfg = res[0], data = res[1];
      return leerProgreso(cfg).then(function (progreso) {
        var heroSlot = document.getElementById('heroSlot');
        var rows = document.getElementById('rows');
        var navMain = document.getElementById('navMain');
        var navDraw = document.getElementById('navDrawer');
        var grupos = agrupaFilas(data);

        if (heroSlot) heroSlot.innerHTML = destacado(cfg, data, progreso);
        var courseTabs = document.getElementById('courseTabs');
        if (courseTabs) courseTabs.innerHTML = navegacionCurso(cfg);
        if (navMain) navMain.insertAdjacentHTML('afterbegin', navEscritorio(cfg, data, grupos));
        if (navDraw) navDraw.insertAdjacentHTML('afterbegin', navMovil(cfg, data, grupos));
        if (rows) rows.innerHTML = curriculoEnfocado(cfg, data, progreso);

        activarNavAjustable();
        activarMenu();
        activarDesplegables();
        activarCurriculo(cfg, data, progreso);
        activarMarcado(cfg);
      });
    })
    .catch(function (e) {
      error('No se pudieron cargar las clases. Si abriste el archivo directamente, ' +
        'necesitas un servidor local para que el navegador permita leer los datos.');
      console.error('[hub]', e);
    });
})();
