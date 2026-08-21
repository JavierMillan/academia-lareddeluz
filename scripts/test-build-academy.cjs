const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildAcademy } = require('./build-academy.cjs');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-build-'));
const academyRoot = path.join(tempRoot, 'academy');
const dtmmSourceRoot = path.join(tempRoot, 'source-dtmm');
const englishSourceRoot = path.join(tempRoot, 'source-english');
const outDir = path.join(tempRoot, 'site');

function write(relativePath, content) {
  const absolutePath = path.join(tempRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

try {
  write('academy/index.html', '<html><head></head><body><a class="portal dtmm" href="https://academia.lareddeluz.com/dtmm/">DTMM</a><a class="portal english" href="https://academia.lareddeluz.com/ingles/">English</a></body></html>');
  write('academy/CNAME', 'academia.lareddeluz.com\n');
  write('academy/assets/imgs/reddeluz.png', 'academy-logo');
  write('source-dtmm/presentacion/index.html', '<html><head><title>DTMM</title></head><body><img src="../assets/imgs/reddeluz.png"></body></html>');
  write('source-dtmm/presentacion/lesson.html', '<html><head><title>Lesson</title></head><body></body></html>');
  write('source-dtmm/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('source-dtmm/presentacion/assets/hub.css', 'body{}');
  write('source-dtmm/ingles/index.html', '<html><head><title>STALE TEMPORARY COPY</title></head><body></body></html>');
  write('source-dtmm/assets/imgs/reddeluz.png', 'source-logo');
  write('source-english/index.html', '<html><head><title>CANONICAL ENGLISH</title><link rel="stylesheet" href="assets/motor/hub.css"></head><body></body></html>');
  write('source-english/assets/motor/hub.css', 'body{}');
  write('source-english/recursos/index.html', '<html><head><title>Resources</title></head><body></body></html>');
  write('source-english/recursos/order-scenarios.json', JSON.stringify({ scenarios: [] }));
  write('academy/academy.sources.json', JSON.stringify({
    schemaVersion: 1,
    legacyHostname: 'detumentealmundo.lareddeluz.com',
    sources: {
      dtmm: { repository: 'example/dtmm', ref: 'main', sharedPaths: ['assets'] },
      english: { repository: 'example/english', ref: 'master' }
    },
    hubs: [
      { id: 'dtmm', sourceId: 'dtmm', sourcePath: 'presentacion', publicPath: 'dtmm', canonicalBase: 'https://academia.lareddeluz.com/dtmm/' },
      { id: 'english', sourceId: 'english', sourcePath: '.', publicPath: 'ingles', canonicalBase: 'https://academia.lareddeluz.com/ingles/', includePaths: ['index.html', 'assets', 'recursos'] }
    ]
  }));

  const result = buildAcademy({
    academyRoot,
    sourceRoots: { dtmm: dtmmSourceRoot, english: englishSourceRoot },
    outDir,
    manifestPath: path.join(academyRoot, 'academy.sources.json')
  });

  assert.equal(result.hubs, 2);
  assert.ok(fs.existsSync(path.join(outDir, 'dtmm', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'ingles', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'assets', 'imgs', 'reddeluz.png')));
  assert.match(fs.readFileSync(path.join(outDir, 'dtmm', 'index.html'), 'utf8'), /<link rel="canonical" href="https:\/\/academia\.lareddeluz\.com\/dtmm\/">/);
  assert.match(fs.readFileSync(path.join(outDir, 'ingles', 'index.html'), 'utf8'), /CANONICAL ENGLISH/);
  assert.doesNotMatch(fs.readFileSync(path.join(outDir, 'ingles', 'index.html'), 'utf8'), /STALE TEMPORARY COPY/);
  assert.ok(fs.existsSync(path.join(outDir, 'ingles', 'recursos', 'order-scenarios.json')));

  write('source-dtmm/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'missing-deck.html' }] }] }));
  assert.throws(() => buildAcademy({ academyRoot, sourceRoots: { dtmm: dtmmSourceRoot, english: englishSourceRoot }, outDir, manifestPath: path.join(academyRoot, 'academy.sources.json') }), /Missing local file referenced by .*clases\.json/);
  write('source-dtmm/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('source-english/recursos/index.html', '<html><head></head><body><img src="missing.png"></body></html>');
  assert.throws(() => buildAcademy({ academyRoot, sourceRoots: { dtmm: dtmmSourceRoot, english: englishSourceRoot }, outDir, manifestPath: path.join(academyRoot, 'academy.sources.json') }), /Missing local asset/);

  console.log('academy build: PASS');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
