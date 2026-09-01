/* ============================================================
   progreso.js · avance del alumno
   ------------------------------------------------------------
   Este archivo es el ÚNICO que habla con el almacenamiento.
   El resto del motor llama a Progreso.visto(...) y no se entera
   de si detrás hay localStorage o una base de datos.

   Hoy: localStorage, por navegador.
   Mañana: una cuenta, con el progreso en el servidor.

   Los métodos son async aunque localStorage sea síncrono. Es
   deliberado: el día que la respuesta venga de la red, no hay
   que tocar ningún punto de llamada.
   ============================================================ */
(function (global) {
  'use strict';

  var LLAVE = 'lrdl.progreso';
  var ESQUEMA = 1;

  /* Los tres estados que puede tener una clase. 'curso' es la que
     se empezó y no se terminó: es la que el hub resalta. */
  var ESTADOS = { VISTO: 'visto', CURSO: 'curso', NUEVO: 'nuevo' };

  function ahora() {
    return new Date().toISOString();
  }

  /* Identifica este navegador. Sirve el día de la fusión: permite
     distinguir "esta laptop" de "ese celular" al subir los dos. */
  function nuevoDispositivoId() {
    if (global.crypto && global.crypto.randomUUID) {
      return global.crypto.randomUUID().slice(0, 8);
    }
    return Math.random().toString(16).slice(2, 10);
  }

  function vacio() {
    return { esquema: ESQUEMA, dispositivoId: nuevoDispositivoId(), cursos: {} };
  }

  /* localStorage lanza en incógnito y con cookies bloqueadas. Un
     progreso que no se puede guardar no debe tumbar el hub: se
     degrada a "sin progreso" y las clases se ven como siempre. */
  function leer() {
    try {
      var crudo = global.localStorage.getItem(LLAVE);
      if (!crudo) return vacio();
      var doc = JSON.parse(crudo);
      if (!doc || doc.esquema !== ESQUEMA) return migrar(doc);
      if (!doc.cursos) doc.cursos = {};
      return doc;
    } catch (e) {
      return vacio();
    }
  }

  function escribir(doc) {
    try {
      global.localStorage.setItem(LLAVE, JSON.stringify(doc));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* Punto de entrada para futuros cambios de formato. Mientras sólo
     exista el esquema 1, cualquier cosa que no lo sea se descarta. */
  function migrar(doc) {
    return vacio();
  }

  function delCurso(doc, cursoId) {
    if (!doc.cursos[cursoId]) doc.cursos[cursoId] = { clases: {}, ultima: null };
    return doc.cursos[cursoId];
  }

  var Progreso = {
    ESTADOS: ESTADOS,

    /* Estado de una clase. Devuelve 'nuevo' si nunca se abrió. */
    visto: function (cursoId, claseId) {
      var curso = leer().cursos[cursoId];
      var reg = curso && curso.clases ? curso.clases[claseId] : null;
      return Promise.resolve(reg ? reg.estado : ESTADOS.NUEVO);
    },

    /* Marca una clase. Guarda la fecha en cada registro: es lo que
       permite fusionar dos dispositivos sin perder nada, quedándose
       con el más reciente ante conflicto. */
    marcar: function (cursoId, claseId, estado) {
      var doc = leer();
      var curso = delCurso(doc, cursoId);
      curso.clases[claseId] = { estado: estado, ts: ahora() };
      if (estado === ESTADOS.CURSO) curso.ultima = claseId;
      escribir(doc);
      return Promise.resolve(estado);
    },

    /* Todo el progreso de un curso, para pintar el hub de un tirón
       sin una llamada por tarjeta. */
    delCurso: function (cursoId) {
      var curso = leer().cursos[cursoId];
      return Promise.resolve({
        clases: (curso && curso.clases) || {},
        ultima: (curso && curso.ultima) || null
      });
    },

    /* La clase donde retomar. */
    ultima: function (cursoId) {
      var curso = leer().cursos[cursoId];
      return Promise.resolve((curso && curso.ultima) || null);
    },

    /* Cuántas van de cuántas, para la barra del encabezado de fila. */
    resumen: function (cursoId, idsDeClases) {
      var ids = Array.isArray(idsDeClases) ? idsDeClases : [];
      return Progreso.delCurso(cursoId).then(function (curso) {
        var vistas = ids.filter(function (id) {
          var reg = curso.clases[id];
          return reg && reg.estado === ESTADOS.VISTO;
        }).length;
        return { vistas: vistas, total: ids.length };
      });
    },

    /* El documento completo, tal como se subiría el día del login.
       La rutina de fusión se escribe entonces; el formato se decide
       hoy para que esa migración no pierda nada. */
    exportar: function () {
      return Promise.resolve(leer());
    },

    borrar: function (cursoId) {
      var doc = leer();
      if (cursoId) delete doc.cursos[cursoId];
      else doc = vacio();
      escribir(doc);
      return Promise.resolve(true);
    },

    /* Si el navegador no deja guardar (incógnito, cookies bloqueadas)
       el hub debe saberlo para no ofrecer "continuar donde te quedaste". */
    disponible: function () {
      try {
        var prueba = LLAVE + '.prueba';
        global.localStorage.setItem(prueba, '1');
        global.localStorage.removeItem(prueba);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  global.Progreso = Progreso;
  if (typeof module !== 'undefined' && module.exports) module.exports = Progreso;
})(typeof window !== 'undefined' ? window : globalThis);
