const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state   = {};
let logos   = { home: null, away: null }; // stored separately
let clients = [];

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

function fullState() {
  return { ...state, homeLogo: logos.home, awayLogo: logos.away };
}

http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const body = () => new Promise(resolve => {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => resolve(b));
  });

  // POST /update — game state (no logos)
  if (req.method === 'POST' && req.url === '/update') {
    body().then(b => {
      try { state = JSON.parse(b); } catch(e) {}
      pushToAll(fullState());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /logo/home or /logo/away — logos uploaded separately
  if (req.method === 'POST' && (req.url === '/logo/home' || req.url === '/logo/away')) {
    const side = req.url === '/logo/home' ? 'home' : 'away';
    body().then(b => {
      try { const d = JSON.parse(b); logos[side] = d.logo; } catch(e) {}
      pushToAll(fullState());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // GET /events — SSE stream
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('\n');
    if (Object.keys(state).length) {
      res.write('data: ' + JSON.stringify(fullState()) + '\n\n');
    }
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

  // GET /state — initial load fallback
  if (req.url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fullState()));
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
