const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'academy.courses.json'), 'utf8'));
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'deploy-pages.yml'), 'utf8');

assert.equal(fs.existsSync(path.join(root, 'academy.sources.json')), false);
assert.deepEqual(Object.keys(manifest.courses).sort(), ['dtmm', 'english']);
assert.equal(manifest.courses.dtmm.sourcePath, 'cursos/dtmm');
assert.equal(manifest.courses.dtmm.publicPath, 'dtmm');
assert.equal(manifest.courses.english.sourcePath, 'cursos/ingles');
assert.equal(manifest.courses.english.publicPath, 'ingles');
assert.doesNotMatch(JSON.stringify(manifest), /JavierMillan\/(?:De-tu-mente-al-mundo|hablemos-ingles)/);
assert.doesNotMatch(workflow, /Checkout constellation sources|Checkout English constellation/);
assert.doesNotMatch(workflow, /repository:\s*JavierMillan\/(?:De-tu-mente-al-mundo|hablemos-ingles)/);

console.log('academy monorepo boundaries: PASS');
