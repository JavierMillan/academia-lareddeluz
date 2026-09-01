/* ============================================================
   hub-model.js · cálculos puros del explorador curricular
   ------------------------------------------------------------
   No toca DOM ni almacenamiento. El renderer y las pruebas usan
   el mismo contrato para destinos, materiales y progreso.
   ============================================================ */
(function (global) {
  'use strict';

  function grabacionesDe(clase) {
    var lista = clase.grabaciones && clase.grabaciones.length
      ? clase.grabaciones : (clase.grabacion ? [{ url: clase.grabacion }] : []);
    return lista.filter(function (grabacion) { return grabacion && grabacion.url; });
  }

  function tieneExtras(cfg, clase) {
    var capacidades = cfg.capacidades || {};
    var grabaciones = capacidades.grabaciones !== false && grabacionesDe(clase).length;
    var recursos = capacidades.recursos !== false && clase.recursos && clase.recursos.length;
    return Boolean(grabaciones || recursos);
  }

  function destino(cfg, clase) {
    if (tieneExtras(cfg, clase)) return 'clase.html?id=' + encodeURIComponent(clase.id);
    return clase.deck || null;
  }

  function materialesDe(cfg, clase) {
    var capacidades = cfg.capacidades || {};
    var materiales = [];
    if (clase.deck) materiales.push({ tipo: 'presentacion', texto: 'Presentación' });
    if (capacidades.grabaciones !== false) {
      var grabaciones = grabacionesDe(clase).length;
      if (grabaciones) materiales.push({
        tipo: 'grabacion',
        texto: grabaciones === 1 ? 'Grabación' : grabaciones + ' grabaciones'
      });
    }
    if (capacidades.recursos !== false && clase.recursos && clase.recursos.length) {
      materiales.push({
        tipo: 'recursos',
        texto: clase.recursos.length + ' recurso' + (clase.recursos.length === 1 ? '' : 's')
      });
    }
    return materiales;
  }

  function estadoDe(progreso, id) {
    var registro = progreso && progreso.clases ? progreso.clases[id] : null;
    return registro && registro.estado ? registro.estado : 'nuevo';
  }

  function clasesPublicadas(cfg, data) {
    var salida = [];
    (data.filas || []).forEach(function (fila) {
      (fila.clases || []).forEach(function (clase) {
        if (destino(cfg, clase)) salida.push(clase);
      });
    });
    return salida;
  }

  function contar(cfg, clases, progreso) {
    var publicadas = clases.filter(function (clase) { return destino(cfg, clase); });
    var vistas = publicadas.filter(function (clase) {
      return estadoDe(progreso, clase.id) === 'visto';
    }).length;
    return {
      total: publicadas.length,
      vistas: vistas,
      porcentaje: publicadas.length ? Math.round(vistas / publicadas.length * 100) : 0
    };
  }

  function resumenFila(cfg, fila, progreso) {
    return contar(cfg, fila.clases || [], progreso);
  }

  function resumenCurso(cfg, data, progreso) {
    var avance = progreso || { clases: {}, ultima: null };
    var clases = clasesPublicadas(cfg, data);
    var resumen = contar(cfg, clases, avance);
    var enCurso = clases.filter(function (clase) {
      return estadoDe(avance, clase.id) === 'curso';
    }).sort(function (a, b) {
      var ar = avance.clases[a.id] || {}, br = avance.clases[b.id] || {};
      return String(br.ts || '').localeCompare(String(ar.ts || ''));
    });
    var ultima = clases.find(function (clase) { return clase.id === avance.ultima; });
    var pendiente = clases.find(function (clase) { return estadoDe(avance, clase.id) !== 'visto'; });
    resumen.recomendada = enCurso[0] || ultima || pendiente || clases[0] || null;
    return resumen;
  }

  var HubModel = {
    grabacionesDe: grabacionesDe,
    tieneExtras: tieneExtras,
    destino: destino,
    materialesDe: materialesDe,
    estadoDe: estadoDe,
    resumenFila: resumenFila,
    resumenCurso: resumenCurso
  };

  global.HubModel = HubModel;
  if (typeof module !== 'undefined' && module.exports) module.exports = HubModel;
})(typeof window !== 'undefined' ? window : globalThis);
