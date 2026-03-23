const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
let state = {
  homeScore: 0, awayScore: 0,
  homeFouls: 0, awayFouls: 0,
  homeAbbr: 'HOME', awayAbbr: 'AWAY',
  homeRecord: '0-0', awayRecord: '0-0',
  homeColor: '#f5c842', awayColor: '#c8102e',
  homeLogo: null, awayLogo: null,
  quarter: 1,
  gameSeconds: 600,
  shotSeconds: 24,
  gameRunning: false,
  shotRunning: false,
  timerPresetSeconds: 600,
  rp1Title: 'BROADCAST', rp1Value: '',
  rp2Title: 'VENUE',     rp2Value: '',
  barColor: '#0d1117',
  possession: null,
};
let logos = { home: null, away: null };

function fullState() {
  return {
    ...state,
    homeLogo: logos.home !== null ? logos.home : (state.homeLogo || null),
    awayLogo: logos.away !== null ? logos.away : (state.awayLogo || null),
  };
}
let clients = [];

// ── SERVER-OWNED CLOCKS ────────────────────────────────────────────────────
// The server ticks both clocks and pushes SSE every second.
// The control panel sends commands (/cmd). All clients stay perfectly in sync.

let gameTimer = null;
let shotTimer = null;

function startGameClock() {
  if (gameTimer) return;
  if (!(state.gameSeconds > 0)) return;
  state.gameRunning = true;
  gameTimer = setInterval(() => {
    state.gameSeconds = Math.max(0, (state.gameSeconds || 0) - 1);
    if (state.gameSeconds <= 0) {
      state.gameSeconds = 0;
      stopGameClock();
      pushToAll({ type: 'state', data: fullState() });
      pushToAll({ type: 'buzz', kind: 'game' });
    } else {
      pushToAll({ type: 'state', data: fullState() });
    }
  }, 1000);
  pushToAll({ type: 'state', data: fullState() });
}

function stopGameClock() {
  if (gameTimer) { clearInterval(gameTimer); gameTimer = null; }
  state.gameRunning = false;
}

function startShotClock() {
  if (shotTimer) return;
  if (!(state.shotSeconds > 0)) return;
  state.shotRunning = true;
  shotTimer = setInterval(() => {
    state.shotSeconds = Math.max(0, (state.shotSeconds || 0) - 1);
    if (state.shotSeconds <= 0) {
      state.shotSeconds = 0;
      stopShotClock();
      pushToAll({ type: 'state', data: fullState() });
      pushToAll({ type: 'buzz', kind: 'shot' });
      // Auto-reset to 24 and restart
      setTimeout(() => {
        state.shotSeconds = 24;
        startShotClock();
      }, 500);
    } else {
      pushToAll({ type: 'state', data: fullState() });
    }
  }, 1000);
  pushToAll({ type: 'state', data: fullState() });
}

function stopShotClock() {
  if (shotTimer) { clearInterval(shotTimer); shotTimer = null; }
  state.shotRunning = false;
}
// ──────────────────────────────────────────────────────────────────────────

const ROUTES = {
  '/':                   'basketball-scoreboard.html',
  '/control':            'basketball-scoreboard.html',
  '/overlay':            'basketball-overlay.html',
  '/fullscreen':         'basketball-fullscreen.html',
  '/nbaoverlay':         'basketball-nbaoverlay.html',
  '/nbaoverlay2':        'basketball-nbaoverlay2.html',
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

  // POST /cmd — clock commands from the control panel
  if (req.method === 'POST' && req.url === '/cmd') {
    readBody(req).then(b => {
      try {
        const { cmd, seconds } = JSON.parse(b);

        if (cmd === 'game_start') {
          if (!state.gameRunning) startGameClock();

        } else if (cmd === 'game_stop') {
          if (state.gameRunning) {
            stopGameClock();
            pushToAll({ type: 'state', data: fullState() });
          }

        } else if (cmd === 'game_reset') {
          stopGameClock();
          state.gameSeconds = seconds || state.timerPresetSeconds || 600;
          pushToAll({ type: 'state', data: fullState() });

        } else if (cmd === 'game_set') {
          if (!state.gameRunning) {
            state.gameSeconds = seconds != null ? seconds : (state.gameSeconds || 600);
            pushToAll({ type: 'state', data: fullState() });
          }

        } else if (cmd === 'shot_start') {
          if (!state.shotRunning) startShotClock();

        } else if (cmd === 'shot_stop') {
          if (state.shotRunning) {
            stopShotClock();
            pushToAll({ type: 'state', data: fullState() });
          }

        } else if (cmd === 'shot_reset') {
          stopShotClock();
          state.shotSeconds = seconds || 24;
          // Always start shot clock on reset — pressing 24/14/8 = intent to run
          startShotClock();

        } else if (cmd === 'reset_all') {
          stopGameClock();
          stopShotClock();
          const preset = state.timerPresetSeconds || 600;
          state = {
            homeScore: 0, awayScore: 0,
            homeFouls: 0, awayFouls: 0,
            homeAbbr: state.homeAbbr || 'HOME',
            awayAbbr: state.awayAbbr || 'AWAY',
            homeRecord: state.homeRecord || '0-0',
            awayRecord: state.awayRecord || '0-0',
            homeColor: state.homeColor || '#f5c842',
            awayColor: state.awayColor || '#c8102e',
            quarter: 1,
            gameSeconds: preset,
            shotSeconds: 24,
            gameRunning: false,
            shotRunning: false,
            timerPresetSeconds: preset,
            rp1Title: state.rp1Title || 'BROADCAST',
            rp1Value: state.rp1Value || '',
            rp2Title: state.rp2Title || 'VENUE',
            rp2Value: state.rp2Value || '',
            barColor: state.barColor || '#0d1117',
            possession: null,
          };
          pushToAll({ type: 'state', data: fullState() });
        }
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /update — non-clock state (scores, names, colors, period, etc.)
  // Server owns clock fields — strips them from incoming data.
  if (req.method === 'POST' && req.url === '/update') {
    readBody(req).then(b => {
      try {
        const incoming = JSON.parse(b);
        delete incoming.gameRunning;
        delete incoming.shotRunning;
        delete incoming.gameSeconds;
        delete incoming.shotSeconds;
        state = { ...state, ...incoming };
      } catch(e) {}
      pushToAll({ type: 'state', data: fullState() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /buzz — broadcast buzzer sound
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

  // GET /events — SSE stream for all clients
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

  // GET /state — initial snapshot
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
