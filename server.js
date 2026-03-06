const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;  // Glitch/cloud uses process.env.PORT
let state  = {};

const ROUTES = {
  '/':        'basketball-scoreboard.html',
  '/control': 'basketball-scoreboard.html',
  '/overlay': 'basketball-overlay.html',
  '/display': 'scoreboard-display.html',
};

http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /update — control panel pushes new state
  if (req.method === 'POST' && req.url === '/update') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try { state = JSON.parse(body); } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // GET /state — overlay & display poll for latest state
  if (req.url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
    return;
  }

  // Serve HTML files
  const fileName = ROUTES[req.url];
  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404); res.end('Not found');

}).listen(PORT, () => {
  console.log('Scoreboard server running on port ' + PORT);
});
