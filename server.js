const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state   = {};
let logos   = { home: null, away: null };
let clients = [];

let scCmdClients = []; // listeners for shot clock commands (main scorekeeper browser)

// ── SHOT CLOCK (independent system) ──────────────────────────
let scState    = { seconds: 24, running: false };
let scClients  = [];
let scInterval = null;

function scPush(payload) {
  const msg = 'data: ' + JSON.stringify(payload) + '\n\n';
  scClients = scClients.filter(res => {
    try { res.write(msg); return true; } catch(e) { return false; }
  });
}

function scTick() {
  if (!scState.running) return;
  if (scState.seconds > 0) {
    scState.seconds--;
    scPush({ type: 'sc', data: scState });
  }
  if (scState.seconds === 0) {
    scState.running = false;
    clearInterval(scInterval);
    scInterval = null;
    scPush({ type: 'sc_buzz', data: scState });
  }
}

function scStart() {
  if (scState.running || scState.seconds === 0) return;
  scState.running = true;
  if (scInterval) clearInterval(scInterval);
  scInterval = setInterval(scTick, 1000);
  scPush({ type: 'sc', data: scState });
}

function scStop() {
  scState.running = false;
  if (scInterval) { clearInterval(scInterval); scInterval = null; }
  scPush({ type: 'sc', data: scState });
}

function scReset(n) {
  scStop();
  scState.seconds = n;
  scPush({ type: 'sc', data: scState });
}
// ─────────────────────────────────────────────────────────────

const ROUTES = {
  '/':                   'basketball-scoreboard.html',
  '/control':            'basketball-scoreboard.html',
  '/overlay':            'basketball-overlay.html',
  '/fullscreen':         'basketball-fullscreen.html',
  '/nbaoverlay':         'basketball-nbaoverlay.html',
  '/mobile-overlay':     'mobile-overlay.html',
  '/display':            'scoreboard-display.html',
  '/display2':           'scoreboard-display2.html',
  '/shotclock':          'shotclock-control.html',
  '/shotclock-display':  'shotclock-display.html',
  '/manifest.json':      'manifest.json',
  '/sw.js':              'sw.js',
  '/icon-192.png':       'icon-192.png',
  '/icon-512.png':       'icon-512.png',
  '/buzzer.mp3':         'buzzer.mp3',
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

  // ── SHOT CLOCK COMMAND CHANNEL ──────────────────────────────
  // Dedicated shot clock controller sends commands here.
  // Main scorekeeper's browser receives them via SSE and executes.

  // POST /sc-cmd  body: { cmd: 'start'|'stop'|'reset', seconds?: 24|14 }
  if (req.method === 'POST' && req.url === '/sc-cmd') {
    readBody(req).then(b => {
      let cmd = {};
      try { cmd = JSON.parse(b); } catch(e) {}
      // Push command to all scorekeeper listeners
      const msg = 'data: ' + JSON.stringify({ type: 'sc_cmd', cmd }) + '\n\n';
      scCmdClients = scCmdClients.filter(r => {
        try { r.write(msg); return true; } catch(e) { return false; }
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // GET /sc-cmd-events — SSE for the main scorekeeper to receive commands
  if (req.url === '/sc-cmd-events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('\n');
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch(e) { clearInterval(ping); }
    }, 20000);
    scCmdClients.push(res);
    req.on('close', () => {
      clearInterval(ping);
      scCmdClients = scCmdClients.filter(c => c !== res);
    });
    return;
  }
  // ─────────────────────────────────────────────────────────────

  // ── SHOT CLOCK API ──────────────────────────────────────────
  // GET /sc/state
  if (req.url === '/sc/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scState));
    return;
  }

  // GET /sc/events — SSE for shot clock clients
  if (req.url === '/sc/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('\n');
    res.write('data: ' + JSON.stringify({ type: 'sc', data: scState }) + '\n\n');
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch(e) { clearInterval(ping); }
    }, 20000);
    scClients.push(res);
    req.on('close', () => {
      clearInterval(ping);
      scClients = scClients.filter(c => c !== res);
    });
    return;
  }

  // POST /sc/start
  if (req.method === 'POST' && req.url === '/sc/start') {
    scStart();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scState));
    return;
  }

  // POST /sc/stop
  if (req.method === 'POST' && req.url === '/sc/stop') {
    scStop();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scState));
    return;
  }

  // POST /sc/reset  body: { seconds: 24 | 14 }
  if (req.method === 'POST' && req.url === '/sc/reset') {
    readBody(req).then(b => {
      let n = 24;
      try { n = JSON.parse(b).seconds || 24; } catch(e) {}
      scReset(n);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scState));
    });
    return;
  }
  // ────────────────────────────────────────────────────────────

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
