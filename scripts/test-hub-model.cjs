const assert = require('node:assert/strict');
const Model = require('../motor/hub-model.js');

const cfg = { capacidades: { grabaciones: true, recursos: true } };
const data = {
  filas: [
    { id: 'inicio', clases: [
      { id: 'uno', deck: 'uno.html', titulo: 'Uno' },
      { id: 'dos', deck: 'dos.html', titulo: 'Dos',
        grabaciones: [{ url: 'https://video.example/dos' }],
        recursos: [{ titulo: 'Guía', url: 'guia.html' }] }
    ]},
    { id: 'final', clases: [
      { id: 'tres', deck: 'tres.html', titulo: 'Tres' },
      { id: 'cuatro', titulo: 'Próximamente' }
    ]}
  ]
};

assert.deepEqual(Model.grabacionesDe(data.filas[0].clases[1]),
  [{ url: 'https://video.example/dos' }]);
assert.equal(Model.destino(cfg, data.filas[0].clases[1]), 'clase.html?id=dos');
assert.deepEqual(Model.materialesDe(cfg, data.filas[0].clases[1]), [
  { tipo: 'presentacion', texto: 'Presentación' },
  { tipo: 'grabacion', texto: 'Grabación' },
  { tipo: 'recursos', texto: '1 recurso' }
]);

const vacio = Model.resumenCurso(cfg, data, { clases: {}, ultima: null });
assert.deepEqual(
  { total: vacio.total, vistas: vacio.vistas, porcentaje: vacio.porcentaje,
    recomendada: vacio.recomendada.id },
  { total: 3, vistas: 0, porcentaje: 0, recomendada: 'uno' }
);

const progreso = { ultima: 'uno', clases: {
  uno: { estado: 'visto', ts: '2026-09-01T10:00:00Z' },
  dos: { estado: 'curso', ts: '2026-09-01T12:00:00Z' }
}};
const activo = Model.resumenCurso(cfg, data, progreso);
assert.equal(activo.recomendada.id, 'dos');
assert.equal(activo.vistas, 1);
assert.equal(activo.porcentaje, 33);
assert.deepEqual(Model.resumenFila(cfg, data.filas[0], progreso),
  { total: 2, vistas: 1, porcentaje: 50 });

const completo = { ultima: 'tres', clases: {
  uno: { estado: 'visto' }, dos: { estado: 'visto' }, tres: { estado: 'visto' }
}};
assert.equal(Model.resumenCurso(cfg, data, completo).recomendada.id, 'tres');
assert.equal(Model.estadoDe(null, 'uno'), 'nuevo');
assert.equal(Model.estadoDe(progreso, 'dos'), 'curso');
assert.deepEqual(Model.resumenCurso(cfg, { filas: [] }, { clases: {}, ultima: null }),
  { total: 0, vistas: 0, porcentaje: 0, recomendada: null });

console.log('hub curriculum model: PASS');
