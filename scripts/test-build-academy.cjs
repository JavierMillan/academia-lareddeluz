const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildAcademy } = require('./build-academy.cjs');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-build-'));
const academyRoot = path.join(tempRoot, 'academy');
const sourceRoot = path.join(tempRoot, 'source');
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
  write('source/presentacion/index.html', '<html><head><title>DTMM</title></head><body><img src="../assets/imgs/reddeluz.png"></body></html>');
  write('source/presentacion/lesson.html', '<html><head><title>Lesson</title></head><body></body></html>');
  write('source/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('source/presentacion/assets/hub.css', 'body{}');
  write('source/ingles/index.html', '<html><head><title>English</title><link rel="stylesheet" href="../presentacion/assets/hub.css"></head><body></body></html>');
  write('source/assets/imgs/reddeluz.png', 'source-logo');
  write('academy/academy.sources.json', JSON.stringify({
    schemaVersion: 1,
    legacyHostname: 'detumentealmundo.lareddeluz.com',
    sharedPaths: ['assets'],
    hubs: [
      { id: 'dtmm', sourcePath: 'presentacion', publicPath: 'dtmm', canonicalBase: 'https://academia.lareddeluz.com/dtmm/' },
      { id: 'english', sourcePath: 'ingles', publicPath: 'ingles', canonicalBase: 'https://academia.lareddeluz.com/ingles/', rewrites: [{ from: '../presentacion/', to: '../dtmm/' }] }
    ]
  }));

  const result = buildAcademy({
    academyRoot,
    sourceRoot,
    outDir,
    manifestPath: path.join(academyRoot, 'academy.sources.json')
  });

  assert.equal(result.hubs, 2);
  assert.ok(fs.existsSync(path.join(outDir, 'dtmm', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'ingles', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'assets', 'imgs', 'reddeluz.png')));
  assert.match(fs.readFileSync(path.join(outDir, 'dtmm', 'index.html'), 'utf8'), /<link rel="canonical" href="https:\/\/academia\.lareddeluz\.com\/dtmm\/">/);
  assert.match(fs.readFileSync(path.join(outDir, 'ingles', 'index.html'), 'utf8'), /href="\.\.\/dtmm\/assets\/hub\.css"/);

  write('source/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'missing-deck.html' }] }] }));
  assert.throws(() => buildAcademy({ academyRoot, sourceRoot, outDir, manifestPath: path.join(academyRoot, 'academy.sources.json') }), /Missing local file referenced by .*clases\.json/);
  write('source/presentacion/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('source/ingles/broken.html', '<html><head></head><body><img src="missing.png"></body></html>');
  assert.throws(() => buildAcademy({ academyRoot, sourceRoot, outDir, manifestPath: path.join(academyRoot, 'academy.sources.json') }), /Missing local asset/);

  console.log('academy build: PASS');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
