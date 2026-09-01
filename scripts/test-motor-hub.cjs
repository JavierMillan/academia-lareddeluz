const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const hubCss = fs.readFileSync(path.join(root, 'motor', 'hub.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'academy.courses.json'), 'utf8'));

/* ------------------------------------------------------------------
   El cajón de navegación se abre por dos caminos: el @media de ancho
   y body.nav-overflow, que salta en cualquier ancho cuando la nav no
   cabe. Si el estilo de sus enlaces vive dentro del @media, al abrirse
   por el segundo camino salen sin estilo — azules y subrayados.
   ------------------------------------------------------------------ */
/* Los comentarios se quitan primero: un "@media" mencionado dentro de
   uno no abre ningún bloque, pero sí confundiría al lector de llaves.
   Se sustituyen por espacios para no mover ninguna posición. */
function sinComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (bloque) => ' '.repeat(bloque.length));
}

function rangosDeMedia(css) {
  const rangos = [];
  let desde = 0;
  for (;;) {
    const inicio = css.indexOf('@media', desde);
    if (inicio === -1) break;
    const abre = css.indexOf('{', inicio);
    if (abre === -1) break;
    let i = abre + 1;
    let nivel = 1;
    while (i < css.length && nivel > 0) {
      if (css[i] === '{') nivel++;
      else if (css[i] === '}') nivel--;
      i++;
    }
    rangos.push([inicio, i]);
    desde = i;
  }
  return rangos;
}

const rangos = rangosDeMedia(sinComentarios(hubCss));
const dentroDeMedia = rangos.map(([a, b]) => hubCss.slice(a, b)).join('\n');
const fueraDeMedia = (() => {
  let salida = '';
  let cursor = 0;
  for (const [a, b] of rangos) {
    salida += hubCss.slice(cursor, a);
    cursor = b;
  }
  return salida + hubCss.slice(cursor);
})();

assert.match(
  fueraDeMedia,
  /\.nav-drawer a\s*\{/,
  'El estilo de los enlaces del cajón debe vivir fuera del @media: si no, se ven ' +
    'azules y subrayados cuando el cajón se abre por body.nav-overflow'
);
assert.doesNotMatch(
  dentroDeMedia,
  /\.nav-drawer a\s*\{[^}]*font-family/,
  'La tipografía de los enlaces del cajón no puede depender del @media'
);

/* El camino alternativo tiene que seguir existiendo — si desaparece,
   esta prueba dejaría de proteger nada. */
assert.match(hubCss, /body\.nav-overflow\s+\.nav-drawer/, 'Debe existir la apertura por desbordamiento');

/* Foco visible: se navega el cajón con teclado. */
assert.match(fueraDeMedia, /\.nav-drawer a:focus-visible/, 'Los enlaces del cajón necesitan foco visible');

/* ------------------------------------------------------------------
   En los decks, .brandmark (contenido de la slide) y #hint (chrome del
   motor) comparten la esquina inferior izquierda. El hint mide ~19rem
   y arranca a 1.2rem del borde, así que moverlos en horizontal no
   alcanza: la firma tiene que sentarse encima, y soltar esa reserva
   allí donde el hint no se muestra.
   ------------------------------------------------------------------ */
const deckCss = fs.readFileSync(path.join(root, 'motor', 'deck.css'), 'utf8');

assert.match(
  deckCss,
  /\.brandmark\{[\s\S]*?bottom:calc\([\s\S]*?var\(--reserva-hint/,
  'La firma debe reservar el espacio del hint, si no se solapan'
);

/* Donde el hint se oculta, la reserva debe soltarse — si no, la firma
   queda flotando con un hueco vacío debajo. */
for (const contexto of ['body.notes-on']) {
  assert.match(
    deckCss,
    new RegExp(contexto.replace('.', '\\.') + '\\s+\\.brandmark\\{[^}]*--reserva-hint:0'),
    `Con ${contexto} el hint se oculta: la firma debe recuperar la esquina`
  );
}

const ocultanHint = (deckCss.match(/#hint\{display:none\}/g) || []).length;
const sueltanReserva = (deckCss.match(/--reserva-hint:\s*0/g) || []).length;
assert.ok(
  sueltanReserva >= ocultanHint,
  `Hay ${ocultanHint} sitios donde se oculta #hint pero sólo ${sueltanReserva} sueltan la reserva`
);

/* ------------------------------------------------------------------
   Cada constelación declara su identidad como configuración.
   ------------------------------------------------------------------ */
for (const [cursoId, curso] of Object.entries(manifest.courses)) {
  const ruta = path.join(root, curso.sourcePath, 'constelacion.json');
  assert.ok(fs.existsSync(ruta), `Falta constelacion.json en ${cursoId}`);
  const c = JSON.parse(fs.readFileSync(ruta, 'utf8'));

  assert.equal(c.esquema, 1, `${cursoId}: debe declarar esquema`);
  for (const campo of ['id', 'nombre', 'tema', 'figura', 'menu', 'capacidades']) {
    assert.ok(c[campo], `${cursoId}: falta "${campo}"`);
  }

  assert.ok(Array.isArray(c.menu) && c.menu.length, `${cursoId}: el menú no puede ir vacío`);
  for (const item of c.menu) {
    assert.ok(item.texto && item.href, `${cursoId}: cada ítem de menú necesita texto y href`);
  }

  /* La figura es data, no una función incrustada en el JS del curso. */
  assert.ok(Array.isArray(c.figura.trazos) && c.figura.trazos.length, `${cursoId}: la figura necesita trazos`);
  assert.ok(Array.isArray(c.figura.nodos) && c.figura.nodos.length, `${cursoId}: la figura necesita nodos`);
  assert.ok(
    c.figura.nodos.some((n) => n.core),
    `${cursoId}: la figura necesita al menos una estrella principal`
  );
  for (const n of c.figura.nodos) {
    assert.ok(
      typeof n.x === 'number' && typeof n.y === 'number' && typeof n.r === 'number',
      `${cursoId}: cada nodo necesita x, y, r numéricos`
    );
  }
}

/* Inglés publica sus recursos y DTMM no: esa diferencia real es
   configuración, y debe seguir viéndose en los archivos. */
const ingles = JSON.parse(fs.readFileSync(path.join(root, 'cursos/ingles/constelacion.json'), 'utf8'));
const dtmm = JSON.parse(fs.readFileSync(path.join(root, 'cursos/dtmm/constelacion.json'), 'utf8'));
assert.ok(
  ingles.menu.some((i) => /recursos/i.test(i.href)),
  'El menú de Inglés debe llevar Recursos: son abiertos a cualquiera'
);
assert.ok(!dtmm.menu.some((i) => /recursos\.html/i.test(i.href)), 'DTMM no publica recursos abiertos');
assert.notEqual(dtmm.tema, ingles.tema, 'Cada constelación tiene su propio tema');

/* ------------------------------------------------------------------
   Un solo motor de hub. Los dos que había —hub.js e ingles.js— tenían
   once funciones con el mismo nombre y ninguna idéntica: cada mejora
   había que hacerla dos veces y se desincronizaban solas.
   ------------------------------------------------------------------ */
assert.ok(fs.existsSync(path.join(root, 'motor', 'hub.js')), 'Falta el motor del hub');
for (const curso of Object.values(manifest.courses)) {
  for (const viejo of ['hub.js', 'ingles.js']) {
    const copia = path.join(root, curso.sourcePath, 'assets', viejo);
    assert.equal(fs.existsSync(copia), false, `Motor de hub duplicado en el curso: ${copia}`);
  }
  /* Cada hub carga el motor y su tema, nunca un motor propio. */
  const html = fs.readFileSync(path.join(root, curso.sourcePath, 'index.html'), 'utf8');
  assert.match(html, /assets\/motor\/hub\.js/, `${curso.sourcePath} debe cargar el motor compartido`);
  assert.match(html, /assets\/motor\/temas\/\w+\.css/, `${curso.sourcePath} debe cargar su tema`);
}

/* La rejilla sustituyó al riel: el carrusel cortaba la última tarjeta y
   metía un scroll dentro del scroll de la página. */
assert.match(hubCss, /\.deck-grid\{[\s\S]*?grid-template-columns/, 'Las clases van en rejilla');
assert.doesNotMatch(hubCss, /\.rail-wrap/, 'El riel horizontal no debe volver');

console.log('motor hub: PASS');
