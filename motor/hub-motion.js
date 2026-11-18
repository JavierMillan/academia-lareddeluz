/* Movimiento del hub — piezas que CSS no puede crear solo.
   Agrega una "señal" junto al nombre de la figura (el tema decide si se ve)
   y marca las estrellas principales para que el tema las anime.
   No conoce a ninguna constelación por nombre. */
(function () {
  'use strict';
  var slot = document.getElementById('heroSlot');
  if (!slot || !('MutationObserver' in window)) return;

  function preparar() {
    var nombre = slot.querySelector('.constellation-name');
    if (nombre && !nombre.querySelector('.hm-signal')) {
      var senal = document.createElement('span');
      senal.className = 'hm-signal';
      senal.setAttribute('aria-hidden', 'true');
      senal.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
      nombre.appendChild(senal);
    }
    var cores = slot.querySelectorAll('.constellation-avatar circle.core');
    for (var i = 0; i < cores.length; i++) cores[i].setAttribute('data-voz', String(i % 2));
  }

  preparar();
  new MutationObserver(preparar).observe(slot, { childList: true });
})();
