const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const index = read('index.html');
// El motor vive en la raíz de la academia; el build lo publica dentro del curso.
const hubCss = fs.readFileSync(path.join(root, '..', '..', 'motor', 'hub.css'), 'utf8');
const englishCss = read('assets/ingles.css');
// La identidad vive en el tema y el comportamiento en el motor; el curso
// sólo conserva sus propios overrides.
const temaCss = fs.readFileSync(path.join(root, '..', '..', 'motor', 'temas', 'ingles.css'), 'utf8');
const motorJs = fs.readFileSync(path.join(root, '..', '..', 'motor', 'hub.js'), 'utf8');
const constelacion = JSON.parse(read('constelacion.json'));

assert.match(index, /<body class="theme-english">/, 'English must use its Academy theme');
assert.match(index, /class="topbar academy-shell"/, 'English must use the shared Academy shell');
assert.match(index, /class="academy-brand"/, 'English must show the Academy brand');
assert.match(index, /class="all-constellations"/, 'English must link to all constellations');
assert.match(index, /<div id="heroSlot"><\/div>/, 'English hero must use the compact Academy slot');
assert.doesNotMatch(index, /class="constelacion-bg"/, 'The retired standalone hero must not return');
assert.doesNotMatch(index, /\.\.\/presentacion|\.\.\/assets/, 'Canonical English assets must be self-contained');

assert.match(hubCss, /\.academy-shell\b/, 'Shared styles must include the Academy header');
assert.match(hubCss, /\.hub-hero\b/, 'Shared styles must include the compact hub hero');
assert.match(temaCss, /\.theme-ingles|\.theme-english/, 'El tema debe declarar la constelación');
assert.match(temaCss, /Archivo Black/, 'El tema define la tipografía de titulares');
assert.match(motorJs, /function destacado\(/, 'El motor arma la portada desde los datos');
assert.match(motorJs, /activarNavAjustable\(\)/, 'El motor mantiene la barra adaptable');

// Los recursos de Inglés son abiertos, por eso su menú los lleva y el de
// DTMM no. Esa diferencia es configuración, no código.
assert.ok(constelacion.menu.some((i) => /recursos/i.test(i.href)),
  'El menú de Inglés debe llevar Recursos');

const engineRoot = path.join(root, '..', '..', 'motor');

for (const match of index.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  // assets/motor/ se arma en el build a partir de dos orígenes: el motor
  // compartido de la raíz y lo que el curso guarda ahí (sus imgs). Vale con que
  // el archivo exista en cualquiera de los dos.
  const candidates = [path.join(root, target)];
  if (target.startsWith('assets/motor/')) {
    candidates.push(path.join(engineRoot, target.slice('assets/motor/'.length)));
  }
  assert.ok(candidates.some((candidate) => fs.existsSync(candidate)), `Missing local asset: ${target}`);
}

console.log('English Academy shell: PASS');
