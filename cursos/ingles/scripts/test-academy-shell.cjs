const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const index = read('index.html');
const hubCss = read('assets/motor/hub.css');
const englishCss = read('assets/ingles.css');
const englishJs = read('assets/ingles.js');

assert.match(index, /<body class="theme-english">/, 'English must use its Academy theme');
assert.match(index, /class="topbar academy-shell"/, 'English must use the shared Academy shell');
assert.match(index, /class="academy-brand"/, 'English must show the Academy brand');
assert.match(index, /class="all-constellations"/, 'English must link to all constellations');
assert.match(index, /<div id="heroSlot"><\/div>/, 'English hero must use the compact Academy slot');
assert.doesNotMatch(index, /class="constelacion-bg"/, 'The retired standalone hero must not return');
assert.doesNotMatch(index, /\.\.\/presentacion|\.\.\/assets/, 'Canonical English assets must be self-contained');

assert.match(hubCss, /\.academy-shell\b/, 'Shared styles must include the Academy header');
assert.match(hubCss, /\.hub-hero\b/, 'Shared styles must include the compact hub hero');
assert.match(englishCss, /\.theme-english\b/, 'English styles must provide its constellation theme');
assert.match(englishJs, /function destacado\(/, 'English must render its Academy hero from class data');
assert.match(englishJs, /activarNavAjustable\(\)/, 'English must keep the Academy header responsive');

for (const match of index.matchAll(/(?:href|src)="([^"]+)"/g)) {
  const target = match[1];
  if (/^(?:https?:|#)/.test(target)) continue;
  assert.equal(fs.existsSync(path.join(root, target)), true, `Missing local asset: ${target}`);
}

console.log('English Academy shell: PASS');
