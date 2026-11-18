/* =========================================================
   Academia · La Red de Luz — interacciones compartidas
   - Tarjetas con profundidad (tilt + foco de luz) en index y hubs
   - Transición "entrar a la constelación" desde el index
   - Cambio de vista animado (View Transitions) en el index
   - Tarjetas de los hubs que aparecen al hacer scroll
   Todo se apaga con prefers-reduced-motion y en pantallas táctiles
   sólo queda lo que no depende del cursor.
   ========================================================= */
(function () {
  var d = document, root = d.documentElement;
  var mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  function reduce() { return mqReduce.matches; }

  try { sessionStorage.removeItem('am-enter'); } catch (e) {}

  function accentOf(el) {
    var c = getComputedStyle(el).getPropertyValue('--accent').trim() ||
            getComputedStyle(el).getPropertyValue('--sesame').trim();
    return c || null;
  }
  // los tokens con var() no sirven para Three: resolvemos a un color real
  function solidAccent(el) {
    var probe = d.createElement('span');
    probe.style.cssText = 'position:absolute;visibility:hidden;color:var(--accent,var(--sesame))';
    el.appendChild(probe);
    var rgb = getComputedStyle(probe).color; probe.remove();
    var m = rgb.match(/\d+/g);
    if (!m) return null;
    return '#' + m.slice(0, 3).map(function (n) { return (+n).toString(16).padStart(2, '0'); }).join('');
  }
  function sky() { return window.academiaSky; }

  /* ---------- 1 · tarjetas con profundidad ---------- */
  function addDepth(card, opts) {
    if (card.__amDepth) return;
    card.__amDepth = true;
    var spot = d.createElement('span');
    spot.className = 'am-spot'; spot.setAttribute('aria-hidden', 'true');
    card.appendChild(spot);
    var tintHex = null, raf = 0, ev = null;

    function apply() {
      raf = 0;
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      card.style.setProperty('--px', (x - 0.5).toFixed(3));
      card.style.setProperty('--py', (y - 0.5).toFixed(3));
      if (opts.tilt && !reduce()) {
        card.style.transform = 'perspective(1200px) rotateX(' + ((0.5 - y) * opts.tilt).toFixed(2) +
          'deg) rotateY(' + ((x - 0.5) * opts.tilt).toFixed(2) + 'deg) translate3d(0,' + opts.lift + 'px,0)';
      }
    }
    card.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !mqFine.matches) return;
      card.classList.add('is-hot');
      if (opts.tint && sky()) { tintHex = tintHex || solidAccent(card); sky().setTint(tintHex); }
    });
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !mqFine.matches) return;
      ev = e; if (!raf) raf = requestAnimationFrame(apply);
    });
    card.addEventListener('pointerleave', function () {
      card.classList.remove('is-hot');
      card.style.transform = '';
      card.style.setProperty('--px', 0); card.style.setProperty('--py', 0);
      if (opts.tint && sky()) sky().setTint(null);
    });
  }

  /* ---------- 2 · entrar a una constelación ---------- */
  function bindEnter(link) {
    link.addEventListener('click', function (e) {
      if (reduce() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var href = link.getAttribute('href');
      if (!href || link.target === '_blank') return;
      e.preventDefault();
      var veil = d.querySelector('.am-veil') || d.body.appendChild(Object.assign(d.createElement('div'), { className: 'am-veil' }));
      veil.setAttribute('aria-hidden', 'true');
      var fig = link.querySelector('.figure-slot') || link;
      var fr = fig.getBoundingClientRect();
      veil.style.setProperty('--vx', ((fr.left + fr.width / 2) / innerWidth * 100).toFixed(1) + '%');
      veil.style.setProperty('--vy', ((fr.top + fr.height / 2) / innerHeight * 100).toFixed(1) + '%');
      veil.style.setProperty('--am-accent', accentOf(link) || '#e4cd85');
      link.classList.add('is-entering');
      if (sky()) { sky().setTint(solidAccent(link)); sky().warp(); }
      void veil.offsetWidth;
      root.classList.add('am-leaving');
      try { sessionStorage.setItem('am-enter', '1'); } catch (err) {}
      setTimeout(function () { location.href = href; }, 640);
    });
  }
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    root.classList.remove('am-leaving');
    var en = d.querySelectorAll('.is-entering');
    for (var i = 0; i < en.length; i++) en[i].classList.remove('is-entering');
  });

  /* ---------- 3 · index ---------- */
  var portals = d.querySelectorAll('.portal');
  if (portals.length) {
    for (var i = 0; i < portals.length; i++) {
      var p = portals[i];
      addDepth(p, { tilt: p.hasAttribute('href') ? 7 : 3, lift: -4, tint: p.hasAttribute('href') });
      if (p.hasAttribute('href')) bindEnter(p);
    }

    // cambio rail ⇄ grid: las tarjetas se desvanecen y vuelven a entrar escalonadas
    if (typeof window.setView === 'function') {
      var baseSetView = window.setView, swapping = false;
      window.setView = function (v) {
        var railEl = d.getElementById('portals');
        var same = railEl && railEl.classList.contains('grid-view') === (v === 'grid');
        if (reduce() || !railEl || !railEl.animate || same || swapping) return baseSetView(v);
        swapping = true;
        var ease = 'cubic-bezier(.22,1,.36,1)', done = false;
        var out = railEl.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 170, easing: 'ease-in' });
        // si la pestaña está en segundo plano la animación no avanza: igual cambiamos de vista
        var guard = setTimeout(function () { if (!done) { out.cancel(); } }, 400);
        out.finished.catch(function () {}).then(function () {
            if (done) return; done = true; clearTimeout(guard);
            baseSetView(v);
            var cards = railEl.querySelectorAll('.portal');
            for (var c = 0; c < cards.length; c++) {
              cards[c].animate([{ opacity: 0, translate: '0 16px', scale: '.985' }, { opacity: 1, translate: '0 0', scale: '1' }],
                { duration: 620, delay: c * 70, easing: ease, fill: 'backwards' });
            }
            swapping = false;
          });
      };
    }

    // en el carrusel (móvil) la constelación centrada se enciende
    var rail = d.getElementById('portals');
    if (rail && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle('is-focus', en.intersectionRatio > 0.66); });
      }, { root: rail, threshold: [0, 0.66, 1] });
      for (var j = 0; j < portals.length; j++) io.observe(portals[j]);
    }
  }

  /* ---------- 4 · hubs: tarjetas de clase ---------- */
  var seen = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var cards = en.target.querySelectorAll('.am-pending');
      for (var k = 0; k < cards.length; k++) reveal(cards[k], k);
      seen.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  function reveal(card, k) {
    card.style.setProperty('--am-delay', Math.min(k, 6) * 70 + 'ms');
    requestAnimationFrame(function () {
      card.classList.add('am-shown'); card.classList.remove('am-pending');
      setTimeout(function () { card.classList.remove('am-shown'); card.style.removeProperty('--am-delay'); }, 1400);
    });
  }

  function enhanceHub(scope) {
    var cards = scope.querySelectorAll ? scope.querySelectorAll('.deck-card:not(.soon)') : [];
    for (var i = 0; i < cards.length; i++) addDepth(cards[i], { tilt: 0, lift: 0, tint: false });
    var rows = scope.querySelectorAll ? scope.querySelectorAll('.row-sec') : [];
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (row.__amSeen || !seen || reduce()) continue;
      row.__amSeen = true;
      var b = row.getBoundingClientRect();
      if (b.top < innerHeight * 0.92) continue; // lo visible al cargar no se esconde
      var all = row.querySelectorAll('.deck-card');
      for (var c = 0; c < all.length; c++) all[c].classList.add('am-pending');
      seen.observe(row);
    }
  }
  var rowsHost = d.getElementById('rows');
  if (rowsHost) {
    enhanceHub(d);
    new MutationObserver(function () { enhanceHub(rowsHost); }).observe(rowsHost, { childList: true, subtree: true });
  }
})();
