const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state   = {};
let logos   = { home: null, away: null };
let clients = [];

const ROUTES = {
  '/':              'basketball-scoreboard.html',
  '/control':       'basketball-scoreboard.html',
  '/overlay':       'basketball-overlay.html',
  '/fullscreen':    'basketball-fullscreen.html',
  '/nbaoverlay':    'basketball-nbaoverlay.html',
  '/mobile-overlay':'mobile-overlay.html',
  '/display':       'scoreboard-display.html',
  '/manifest.json': 'manifest.json',
  '/sw.js':         'sw.js',
  '/icon-192.png':  'icon-192.png',
  '/icon-512.png':  'icon-512.png',
  '/buzzer.mp3':    'buzzer.mp3',
};

function pushToAll(payload) {
  const msg = 'data: ' + JSON.stringify(payload) + '\n\n';
  clients = clients.filter(res => {
    try { res.write(msg); return true; } catch(e) { return false; }
  });
}

function fullState() {
  return { ...state, homeLogo: logos.home, awayLogo: logos.away };
}

function readBody(req) {
  return new Promise(resolve => {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => resolve(b));
  });
}

http.createServer((req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /update — game state
  if (req.method === 'POST' && req.url === '/update') {
    readBody(req).then(b => {
      try { state = JSON.parse(b); } catch(e) {}
      pushToAll({ type: 'state', data: fullState() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /buzz — broadcast buzzer sound to all clients
  if (req.method === 'POST' && req.url === '/buzz') {
    readBody(req).then(b => {
      let kind = 'game';
      try { kind = JSON.parse(b).kind || 'game'; } catch(e) {}
      pushToAll({ type: 'buzz', kind });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /logo/home or /logo/away
  if (req.method === 'POST' && (req.url === '/logo/home' || req.url === '/logo/away')) {
    const side = req.url === '/logo/home' ? 'home' : 'away';
    readBody(req).then(b => {
      try { const d = JSON.parse(b); logos[side] = d.logo; } catch(e) {}
      pushToAll({ type: 'state', data: fullState() });
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
      res.write('data: ' + JSON.stringify({ type: 'state', data: fullState() }) + '\n\n');
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

  // GET /state — initial load
  if (req.url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fullState()));
    return;
  }

  // Serve static files
  const fileName = ROUTES[req.url];
  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(fileName);
      const types = { '.html':'text/html', '.json':'application/json', '.js':'application/javascript', '.png':'image/png', '.mp3':'audio/mpeg' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404); res.end('Not found');

}).listen(PORT, () => {
  console.log('Scoreboard server running on port ' + PORT);
});
