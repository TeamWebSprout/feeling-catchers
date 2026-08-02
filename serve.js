#!/usr/bin/env node
/* Tiny static server for local testing.
 *   node serve.js            -> http://localhost:8080
 *   node serve.js 3000       -> http://localhost:3000
 *
 * Service workers require HTTPS *or* localhost. localhost counts as a
 * secure context, so everything (SW, wake lock, install) works here.
 * To test from a phone on the same wifi you need real HTTPS — use a
 * tunnel (cloudflared / ngrok) or just deploy; see README.
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8080;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.md':   'text/markdown; charset=utf-8'
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));

  if (!file.startsWith(ROOT)) { res.writeHead(403).end('Forbidden'); return; }

  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA-ish fallback so deep links still boot the shell
      fs.readFile(path.join(ROOT, 'index.html'), (e2, shell) => {
        if (e2) { res.writeHead(404).end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': TYPES['.html'] }).end(shell);
      });
      return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      // never cache the service worker or the shell during development
      'Cache-Control': /sw\.js$|index\.html$|\/$/.test(file) ? 'no-cache' : 'public, max-age=3600'
    }).end(data);
  });
}).listen(PORT, () => {
  console.log('Feeling Catchers serving at http://localhost:' + PORT);
});
