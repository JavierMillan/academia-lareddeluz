const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildAcademy } = require('./build-academy.cjs');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-build-'));
const academyRoot = path.join(tempRoot, 'academy');
const outDir = path.join(tempRoot, 'site');
const manifestPath = path.join(academyRoot, 'academy.courses.json');

function write(relativePath, content) {
  const absolutePath = path.join(tempRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

try {
  write('academy/index.html', '<html><head></head><body><a class="portal dtmm" href="https://academia.lareddeluz.com/dtmm/">DTMM</a><a class="portal english" href="https://academia.lareddeluz.com/ingles/">English</a></body></html>');
  write('academy/CNAME', 'academia.lareddeluz.com\n');
  write('academy/assets/imgs/reddeluz.png', 'academy-logo');
  write('academy/cursos/dtmm/index.html', '<html><head><title>DTMM</title></head><body><img src="../assets/imgs/reddeluz.png"></body></html>');
  write('academy/cursos/dtmm/lesson.html', '<html><head><title>Lesson</title></head><body></body></html>');
  write('academy/cursos/dtmm/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('academy/cursos/dtmm/shared/assets/imgs/reddeluz.png', 'source-logo');
  write('academy/cursos/ingles/index.html', '<html><head><title>CANONICAL ENGLISH</title><link rel="stylesheet" href="assets/motor/hub.css"></head><body></body></html>');
  write('academy/cursos/ingles/assets/motor/hub.css', 'body{}');
  write('academy/cursos/ingles/recursos/index.html', '<html><head><title>Resources</title></head><body></body></html>');
  write('academy/cursos/ingles/recursos/order-scenarios.json', JSON.stringify({ scenarios: [] }));
  write('academy/academy.courses.json', JSON.stringify({
    schemaVersion: 1,
    legacyHostname: 'detumentealmundo.lareddeluz.com',
    courses: {
      dtmm: { sourcePath: 'cursos/dtmm', publicPath: 'dtmm', canonicalBase: 'https://academia.lareddeluz.com/dtmm/', sharedPublishes: [{ sourcePath: 'shared/assets', publicPath: 'assets' }] },
      english: { sourcePath: 'cursos/ingles', publicPath: 'ingles', canonicalBase: 'https://academia.lareddeluz.com/ingles/' }
    }
  }));

  const result = buildAcademy({ academyRoot, outDir, manifestPath });

  assert.equal(result.hubs, 2);
  assert.ok(fs.existsSync(path.join(outDir, 'dtmm', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'ingles', 'index.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'assets', 'imgs', 'reddeluz.png')));
  assert.equal(fs.existsSync(path.join(outDir, 'dtmm', 'shared')), false);
  assert.match(fs.readFileSync(path.join(outDir, 'dtmm', 'index.html'), 'utf8'), /<link rel="canonical" href="https:\/\/academia\.lareddeluz\.com\/dtmm\/">/);
  assert.match(fs.readFileSync(path.join(outDir, 'ingles', 'index.html'), 'utf8'), /CANONICAL ENGLISH/);
  assert.ok(fs.existsSync(path.join(outDir, 'ingles', 'recursos', 'order-scenarios.json')));

  write('academy/cursos/dtmm/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'missing-deck.html' }] }] }));
  assert.throws(() => buildAcademy({ academyRoot, outDir, manifestPath }), /Missing local file referenced by .*clases\.json/);
  write('academy/cursos/dtmm/clases.json', JSON.stringify({ filas: [{ clases: [{ deck: 'lesson.html' }] }] }));
  write('academy/cursos/ingles/recursos/index.html', '<html><head></head><body><img src="missing.png"></body></html>');
  assert.throws(() => buildAcademy({ academyRoot, outDir, manifestPath }), /Missing local asset/);

  const unmarkedOutDir = path.join(tempRoot, 'unmarked-site');
  fs.mkdirSync(unmarkedOutDir);
  assert.throws(() => buildAcademy({ academyRoot, outDir: unmarkedOutDir, manifestPath }), /Refusing to replace unmarked output directory/);

  console.log('academy build: PASS');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
