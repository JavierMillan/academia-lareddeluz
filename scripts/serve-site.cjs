// Servidor local para revisar el sitio construido (_site). Solo para desarrollo.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '_site');
const port = Number(process.env.PORT) || 4173;
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  const clean = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let target = path.join(root, clean);
  if (!target.startsWith(root)) { res.writeHead(403).end('Forbidden'); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) { res.writeHead(404, {'Content-Type':'text/plain'}).end(`404 ${clean}`); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(target).pipe(res);
}).listen(port, () => console.log(`Academia en http://localhost:${port}`));
