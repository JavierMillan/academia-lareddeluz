const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

const dtmmRoot = path.join(root, 'cursos', 'dtmm');
const englishRoot = path.join(root, 'cursos', 'ingles');
const dtmmHtml = fs.readFileSync(path.join(dtmmRoot, 'index.html'), 'utf8');
// hub.css es del motor compartido, no de un curso: vive una sola vez en motor/
// y el build lo publica dentro de cada curso como assets/motor/hub.css.
const dtmmCss = fs.readFileSync(path.join(root, 'motor', 'hub.css'), 'utf8');
// El motor del hub también es compartido: un solo archivo para todas las
// constelaciones, que lee su identidad de constelacion.json.
const motorJs = fs.readFileSync(path.join(root, 'motor', 'hub.js'), 'utf8');
const englishHtml = fs.readFileSync(path.join(englishRoot, 'index.html'), 'utf8');
// Los tokens de cada constelación viven en su tema, no en el curso.
const englishCss = fs.readFileSync(path.join(root, 'motor', 'temas', 'ingles.css'), 'utf8');

for (const [name, html] of [['DTMM', dtmmHtml], ['Inglés', englishHtml]]) {
  assert.match(html, /class="topbar academy-shell"/, `${name} must use the shared shell`);
  assert.match(html, /LA RED DE LUZ · ACADEMIA/i, `${name} must name Academia`);
  assert.match(html, /id="heroSlot"/, `${name} hero must be data-driven`);
  assert.match(html, /id="navMain"/);
  assert.match(html, /id="navDrawer"/);
  assert.match(html, /id="burger"/);
}

assert.match(dtmmHtml, /theme-dtmm/);
assert.match(englishHtml, /theme-ingles/);
assert.doesNotMatch(englishHtml, /live-badge/);
assert.doesNotMatch(englishHtml, />En vivo</i);

assert.match(dtmmCss, /--academy-void:\s*#0d0b16/i);
assert.match(dtmmCss, /\.hub-hero/);
assert.match(dtmmCss, /backdrop-filter:\s*blur\(/);
assert.match(dtmmCss, /body\.nav-overflow/);
assert.match(dtmmCss, /\.constellation-avatar/);

assert.match(englishCss, /--accent-text:\s*#ea4a63/i);
assert.match(englishCss, /--accent-surface:\s*#c8102e/i);
assert.match(englishCss, /Archivo Black/);

assert.match(motorJs, /activarNavAjustable/,
  'El motor debe plegar la nav según el ancho disponible');

// El motor no puede conocer a ninguna constelación por su nombre: si aparece
// uno, la identidad volvió al código en vez de vivir en su configuración.
for (const nombre of [/theme-dtmm/, /motif-english/, /figuraLyra/, /figuraGemini/,
  /De tu Mente al Mundo/, /Hablemos Inglés/]) {
  assert.doesNotMatch(motorJs, nombre,
    `El motor no debe nombrar constelaciones: ${nombre}`);
}

// El progreso pasa por la capa, nunca por localStorage directo: es lo que
// permite cambiar a base de datos sin tocar el resto.
assert.match(motorJs, /Progreso\.(delCurso|marcar)/, 'El motor lee el progreso por la capa');
assert.doesNotMatch(motorJs, /localStorage/, 'Sólo progreso.js habla con el almacenamiento');
assert.equal(fs.existsSync(path.join(englishRoot, 'CNAME')), false);
assert.equal(fs.existsSync(path.join(dtmmRoot, 'shared', 'assets', 'imgs', 'reddeluz.png')), true);
console.log('academy hubs source contract: PASS');
