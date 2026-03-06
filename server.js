const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state  = {};
let clients = []; // SSE clients

const ROUTES = {
  '/':        'basketball-scoreboard.html',
  '/control': 'basketball-scoreboard.html',
  '/overlay': 'basketball-overlay.html',
  '/display': 'scoreboard-display.html',
};

function pushToAll(data) {
  const msg = 'data: ' + JSON.stringify(data) + '\n\n';
  clients = clients.filter(res => {
    try { res.write(msg); return true; } catch(e) { return false; }
  });
}

http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /update — control panel pushes new state, server pushes to all SSE clients instantly
  if (req.method === 'POST' && req.url === '/update') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        state = JSON.parse(body);
        pushToAll(state); // instant push to all connected clients
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // GET /events — SSE stream for overlay & display
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('\n'); // open the connection

    // Send current state immediately on connect
    if (Object.keys(state).length) {
      res.write('data: ' + JSON.stringify(state) + '\n\n');
    }

    // Keep-alive ping every 20s so Render doesn't close idle connections
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch(e) { clearInterval(ping); }
    }, 20000);

    clients.push(res);

    req.on('close', () => {
      clearInterval(ping);
      clients = clients.filter(c => c !== res);
    });
    return;
  }

  // GET /state — simple fallback poll (used on first load)
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
