const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const community = html.match(/<a\b[^>]*class="community"[^>]*>/)?.[0] || '';

assert.ok(community, 'Comunidad debe ser un enlace');
assert.match(community, /href="https:\/\/chat\.whatsapp\.com\/LQwZxtrJSmNECZEyIwO9az"/);
assert.match(community, /target="_blank"/);
assert.match(community, /rel="noopener"/);

console.log('academy community CTA: PASS');
