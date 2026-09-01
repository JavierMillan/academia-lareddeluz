const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const resourceDir = path.join(__dirname, '..', 'recursos');
const read = (name) => fs.readFileSync(path.join(resourceDir, name), 'utf8');
const html = read('grammar-grill.html');
const css = read('grammar-grill.css');
const js = read('grammar-grill.js');
const scenarios = JSON.parse(read('order-scenarios.json'));

assert.doesNotThrow(() => new Function(js), 'grammar-grill.js must compile');
assert.match(html, /<html lang="en">/);
assert.match(html, /grammar-grill-model\.js/);
assert.match(html, /Pick a place\. Say it\. Serve it\./);
assert.match(css, /\.scenario-banner\{/);
assert.match(css, /prefers-reduced-motion:reduce/);
assert.match(js, /data-scenario=/);
assert.match(js, /state\.role === 'delivery' \? 'employee' : 'customer'/);
assert.match(js, /order-scenarios\.json/);
assert.doesNotMatch(js, /state\.(?:mode|mission)/);
assert.doesNotMatch(js, /const sizes =/);
assert.ok(scenarios.scenarios.some((scenario) => scenario.id === 'mcdonalds'));
assert.ok(scenarios.scenarios.some((scenario) => scenario.id === 'cafe'));

console.log('grammar-grill UI contract: PASS');
