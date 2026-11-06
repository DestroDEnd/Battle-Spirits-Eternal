import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

const ROUTE_MAP = {
  '/': '/index.html',
  '/arena': '/arena.html',
  '/battle': '/arena.html',
  '/duel': '/arena.html',
  '/browse': '/browse.html',
  '/deck': '/deck.html',
  '/deck-view': '/deck_view.html',
  '/deck_view': '/deck_view.html',
  '/family': '/family.html',
  '/sets': '/sets.html',
  '/login': '/login.html',
  '/register': '/register.html'
};

const server = http.createServer((req, res) => {
  // CORS & caching headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Check route map
  if (ROUTE_MAP[pathname.toLowerCase()]) {
    pathname = ROUTE_MAP[pathname.toLowerCase()];
  }

  // Normalize path safely within root
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath);

  // Check if target is directory
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    }
  }

  // If file doesn't exist, check with .html extension
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Fallback to 404.html if still doesn't exist
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, '404.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n⚔️ Battle Spirits Eternal Local Server running at:`);
  console.log(`   ➜ Local:   http://${HOST}:${PORT}/`);
  console.log(`   ➜ Arena:   http://${HOST}:${PORT}/arena`);
  console.log(`   ➜ Browse:  http://${HOST}:${PORT}/browse`);
  console.log(`   ➜ Decks:   http://${HOST}:${PORT}/deck\n`);
});
