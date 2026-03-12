const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state  = {};
let logos  = { home: null, away: null };
let clients = [];

// ── SERVER-OWNED SHOT CLOCK ───────────────────────────────────
// Server is the single source of truth for shot clock.
// No browser timer touches shotSeconds/shotRunning.
let scInterval = null;

function scPush() {
  pushToAll({ type: 'state', data: fullState() });
}

function scTick() {
  if (!state.shotRunning) { scStop(); return; }
  if (state.shotSeconds > 1) {
    state.shotSeconds--;
    scPush();
  } else {
    state.shotSeconds = 0;
    state.shotRunning = false;
    scStop();
    scPush();
    pushToAll({ type: 'buzz', kind: 'shot' });
    // Auto-reset to 24, restart if game still running
    setTimeout(() => {
      state.shotSeconds = 24;
      state.shotRunning = !!state.gameRunning;
      scPush();
      if (state.shotRunning) scStart();
    }, 400);
  }
}

function scStart() {
  if (state.shotRunning) return;
  if (!state.shotSeconds || state.shotSeconds <= 0) return;
  state.shotRunning = true;
  if (scInterval) clearInterval(scInterval);
  scInterval = setInterval(scTick, 1000);
  scPush();
}

function scStop() {
  state.shotRunning = false;
  if (scInterval) { clearInterval(scInterval); scInterval = null; }
}

function scReset(n) {
  scStop();
  state.shotSeconds = n || 24;
  state.shotRunning = !!state.gameRunning;
  if (state.shotRunning) scStart();
  scPush();
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

  // POST /update — game state from control board (scores, game clock, etc.)
  // Server ignores incoming shotSeconds/shotRunning — it owns those.
  if (req.method === 'POST' && req.url === '/update') {
    readBody(req).then(b => {
      try {
        const incoming = JSON.parse(b);
        const prevGameRunning = state.gameRunning;
        const shotSeconds = state.shotSeconds;
        const shotRunning = state.shotRunning;
        state = incoming;
        // Restore server-owned shot clock values
        state.shotSeconds = shotSeconds != null ? shotSeconds : 24;
        state.shotRunning = shotRunning || false;
        // If game clock just stopped, stop shot clock too
        if (prevGameRunning && !state.gameRunning) {
          scStop();
          state.shotRunning = false;
        }
      } catch(e) {}
      pushToAll({ type: 'state', data: fullState() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /buzz
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

  // GET /events — main SSE stream for all displays
  if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    });
    res.write('\n');
    res.write('data: ' + JSON.stringify({ type: 'state', data: fullState() }) + '\n\n');
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

  // GET /state — initial snapshot
  if (req.url === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fullState()));
    return;
  }

  // POST /sc-cmd — shot clock commands from operator phone OR control board
  // body: { cmd: 'start'|'stop'|'reset'|'game-start'|'game-stop', seconds?: 24|14 }
  if (req.method === 'POST' && req.url === '/sc-cmd') {
    readBody(req).then(b => {
      let cmd = {};
      try { cmd = JSON.parse(b); } catch(e) {}

      if (cmd.cmd === 'start') {
        scStart();
      } else if (cmd.cmd === 'stop') {
        scStop();
        state.gameRunning = false;
        scPush();
      } else if (cmd.cmd === 'game-start') {
        if (!state.shotRunning && state.shotSeconds > 0) scStart();
      } else if (cmd.cmd === 'game-stop') {
        scStop();
        scPush();
      } else if (cmd.cmd === 'reset') {
        scReset(cmd.seconds || 24);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
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
