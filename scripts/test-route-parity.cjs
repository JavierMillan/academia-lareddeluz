const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const siteRoot = path.resolve(root, process.argv[2] || path.join('.artifacts', 'site'));
const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'academy-live-routes.json'), 'utf8'));

function htmlRoutes(directory) {
  const routes = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) routes.push(...htmlRoutes(absolutePath));
    else if (path.extname(entry.name).toLowerCase() === '.html') {
      routes.push(path.relative(siteRoot, absolutePath).split(path.sep).join('/'));
    }
  }
  return routes;
}

assert.deepEqual(htmlRoutes(siteRoot).sort(), expected);
console.log('academy route parity: PASS');
