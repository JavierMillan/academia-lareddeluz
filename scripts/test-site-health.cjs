/* ============================================================
   test-site-health.cjs · chequeo de salud del sitio publicado
   ------------------------------------------------------------
   Arma el sitio real en una carpeta temporal y revisa lo que un
   visitante con datos móviles o un buscador notaría:
   - ningún archivo de imagen o código demasiado pesado
   - toda página con <title>, lang y viewport
   - toda imagen con alt
   - sin notas internas (.md) ni pruebas publicadas
   - sitemap y llms.txt presentes
   Videos (.mp4) y descargas (.zip) tienen su propio límite.
   ============================================================ */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildAcademy } = require('./build-academy.cjs');

const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-health-'));
const outDir = path.join(tmp, 'site');
const KB = 1024;
const LIMITE = { imagen: 600 * KB, codigo: 400 * KB, video: 6 * 1024 * KB, descarga: 10 * 1024 * KB };

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

try {
  buildAcademy({ academyRoot: root, outDir, manifestPath: path.join(root, 'academy.courses.json') });
  const files = walk(outDir);
  const rel = (f) => path.relative(outDir, f).split(path.sep).join('/');
  const problemas = [];

  for (const f of files) {
    const size = fs.statSync(f).size;
    const ext = path.extname(f).toLowerCase();
    const tipo = /\.(png|jpe?g|webp|gif|svg|avif)$/.test(ext) ? 'imagen'
      : /\.(js|css|json|html)$/.test(ext) ? 'codigo'
      : ext === '.mp4' ? 'video' : ext === '.zip' ? 'descarga' : null;
    if (tipo && size > LIMITE[tipo]) {
      problemas.push(`${rel(f)} pesa ${Math.round(size / KB)} KB (límite de ${tipo}: ${LIMITE[tipo] / KB} KB)`);
    }
    if (ext === '.md' || /(^|\/)scripts\//.test(rel(f))) problemas.push(`${rel(f)} es interno y no debe publicarse`);
  }

  for (const f of files.filter((x) => x.endsWith('.html'))) {
    const html = fs.readFileSync(f, 'utf8');
    if (!/<title>[^<]+<\/title>/.test(html)) problemas.push(`${rel(f)} no tiene <title>`);
    if (!/<html[^>]*\slang="/.test(html)) problemas.push(`${rel(f)} no declara lang`);
    if (!/name="viewport"/.test(html)) problemas.push(`${rel(f)} no tiene viewport`);
    for (const img of html.match(/<img\b[^>]*>/g) || []) {
      if (!/\salt="/.test(img)) problemas.push(`${rel(f)} tiene una imagen sin alt: ${img.slice(0, 80)}`);
    }
  }

  for (const required of ['sitemap.xml', 'llms.txt', 'robots.txt', '404.html', 'privacidad.html']) {
    if (!fs.existsSync(path.join(outDir, required))) problemas.push(`falta ${required}`);
  }

  assert.deepEqual(problemas, [], 'Salud del sitio:\n  ' + problemas.join('\n  '));
  console.log(`site health: PASS (${files.length} archivos)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
