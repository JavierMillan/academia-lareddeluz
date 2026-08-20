const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const community = html.match(/<a\b[^>]*class="community"[^>]*>/)?.[0] || '';
const favicon = html.match(/<link\b[^>]*rel="icon"[^>]*>/)?.[0] || '';

assert.ok(community, 'Comunidad debe ser un enlace');
assert.match(community, /href="https:\/\/chat\.whatsapp\.com\/LQwZxtrJSmNECZEyIwO9az"/);
assert.match(community, /target="_blank"/);
assert.match(community, /rel="noopener"/);
assert.ok(favicon, 'Academia debe declarar un favicon');
assert.match(favicon, /href="assets\/imgs\/reddeluz\.png"/);

console.log('academy community CTA: PASS');
