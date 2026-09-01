const assert = require('node:assert/strict');
const path = require('node:path');

/* localStorage de mentira, para poder probar en Node. */
function almacenFalso(opciones) {
  const datos = new Map();
  return {
    getItem: (k) => (datos.has(k) ? datos.get(k) : null),
    setItem: (k, v) => {
      if (opciones && opciones.bloqueado) throw new Error('QuotaExceededError');
      datos.set(k, String(v));
    },
    removeItem: (k) => datos.delete(k),
    _datos: datos
  };
}

function cargar(opciones) {
  delete require.cache[require.resolve('../motor/progreso.js')];
  global.localStorage = almacenFalso(opciones);
  global.window = global;
  return require('../motor/progreso.js');
}

(async () => {
  /* --- una clase sin tocar es 'nuevo' --- */
  let P = cargar();
  assert.equal(await P.visto('dtmm', 'redes-desde-cero-1'), 'nuevo');

  /* --- marcar y leer --- */
  await P.marcar('dtmm', 'redes-desde-cero-1', P.ESTADOS.VISTO);
  assert.equal(await P.visto('dtmm', 'redes-desde-cero-1'), 'visto');

  /* --- 'curso' fija dónde retomar --- */
  await P.marcar('dtmm', 'avatar-cliente-2', P.ESTADOS.CURSO);
  assert.equal(await P.ultima('dtmm'), 'avatar-cliente-2');

  /* --- los cursos no se pisan entre sí --- */
  await P.marcar('ingles', 'sesion-1', P.ESTADOS.VISTO);
  assert.equal(await P.visto('dtmm', 'sesion-1'), 'nuevo');
  assert.equal(await P.visto('ingles', 'sesion-1'), 'visto');

  /* --- resumen para la barra de la fila --- */
  const r = await P.resumen('dtmm', ['redes-desde-cero-1', 'avatar-cliente-2', 'otra']);
  assert.deepEqual(r, { vistas: 1, total: 3 });

  /* --- el formato es el que se subirá el día del login --- */
  const doc = await P.exportar();
  assert.equal(doc.esquema, 1, 'debe declarar su esquema para poder migrar');
  assert.ok(doc.dispositivoId, 'debe identificar el dispositivo para fusionar');
  const reg = doc.cursos.dtmm.clases['redes-desde-cero-1'];
  assert.ok(reg.ts, 'cada clase lleva fecha: sin ella la fusión pierde datos');
  assert.doesNotThrow(() => new Date(reg.ts).toISOString());

  /* --- la fecha permite resolver conflictos entre dispositivos --- */
  const antes = doc.cursos.dtmm.clases['redes-desde-cero-1'].ts;
  await new Promise((r) => setTimeout(r, 5));
  await P.marcar('dtmm', 'redes-desde-cero-1', P.ESTADOS.CURSO);
  const despues = (await P.exportar()).cursos.dtmm.clases['redes-desde-cero-1'].ts;
  assert.ok(despues >= antes, 'volver a marcar debe actualizar la fecha');

  /* --- borrar un curso deja el otro intacto --- */
  await P.borrar('dtmm');
  assert.equal(await P.visto('dtmm', 'avatar-cliente-2'), 'nuevo');
  assert.equal(await P.visto('ingles', 'sesion-1'), 'visto');

  /* --- sin almacenamiento (incógnito) el hub no debe romperse --- */
  P = cargar({ bloqueado: true });
  assert.equal(P.disponible(), false);
  assert.equal(await P.visto('dtmm', 'x'), 'nuevo');
  await assert.doesNotReject(P.marcar('dtmm', 'x', 'visto'));
  assert.equal(await P.ultima('dtmm'), null);

  /* --- un documento corrupto no tumba nada --- */
  P = cargar();
  global.localStorage.setItem('lrdl.progreso', '{no es json');
  assert.equal(await P.visto('dtmm', 'x'), 'nuevo');

  /* --- un esquema desconocido se descarta en vez de romper --- */
  global.localStorage.setItem('lrdl.progreso', JSON.stringify({ esquema: 99, cursos: {} }));
  assert.equal(await P.visto('dtmm', 'x'), 'nuevo');

  /* --- la API es async: el día de la base de datos no se toca nada --- */
  for (const metodo of ['visto', 'marcar', 'delCurso', 'ultima', 'resumen', 'exportar', 'borrar']) {
    const salida = P[metodo]('dtmm', 'x', 'visto');
    assert.ok(salida instanceof Promise, `Progreso.${metodo} debe devolver Promise`);
    await salida;
  }

  console.log('progreso: PASS');
})();
