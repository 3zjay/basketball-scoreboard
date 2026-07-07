const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

let states = {}; // userEmail -> state
let logos = {}; // userEmail -> { home: null, away: null }
let sseClients = {}; // userEmail -> [res, res, ...]
let gameTimers = {}; // userEmail -> interval
let shotTimers = {}; // userEmail -> interval

function getOrCreateUser(user) {
  const u = user || 'default';
  if (!states[u]) {
    states[u] = {
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
      aiSyncEnabled: false,
    };
  }
  if (!logos[u]) {
    logos[u] = { home: null, away: null };
  }
  if (!sseClients[u]) {
    sseClients[u] = [];
  }
  return u;
}

function fullState(u) {
  const user = getOrCreateUser(u);
  return {
    ...states[user],
    homeLogo: logos[user].home !== null ? logos[user].home : (states[user].homeLogo || null),
    awayLogo: logos[user].away !== null ? logos[user].away : (states[user].awayLogo || null),
  };
}

// ── SERVER-OWNED CLOCKS (PARTITIONED) ──────────────────────────────────────
function startGameClock(u) {
  const user = getOrCreateUser(u);
  if (gameTimers[user]) return;
  if (!(states[user].gameSeconds > 0)) return;
  states[user].gameRunning = true;
  gameTimers[user] = setInterval(() => {
    states[user].gameSeconds = Math.max(0, (states[user].gameSeconds || 0) - 1);
    if (states[user].gameSeconds <= 0) {
      states[user].gameSeconds = 0;
      stopGameClock(user);
      pushToAll(user, { type: 'state', data: fullState(user) });
      pushToAll(user, { type: 'buzz', kind: 'game' });
    } else {
      pushToAll(user, { type: 'state', data: fullState(user) });
    }
  }, 1000);
  pushToAll(user, { type: 'state', data: fullState(user) });
}

function stopGameClock(u) {
  const user = getOrCreateUser(u);
  if (gameTimers[user]) { clearInterval(gameTimers[user]); gameTimers[user] = null; }
  states[user].gameRunning = false;
}

function startShotClock(u) {
  const user = getOrCreateUser(u);
  if (shotTimers[user]) return;
  if (!(states[user].shotSeconds > 0)) return;
  states[user].shotRunning = true;
  shotTimers[user] = setInterval(() => {
    states[user].shotSeconds = Math.max(0, (states[user].shotSeconds || 0) - 1);
    if (states[user].shotSeconds <= 0) {
      states[user].shotSeconds = 0;
      stopShotClock(user);
      pushToAll(user, { type: 'state', data: fullState(user) });
      pushToAll(user, { type: 'buzz', kind: 'shot' });
      // Auto-reset to 24 and restart
      setTimeout(() => {
        states[user].shotSeconds = 24;
        startShotClock(user);
      }, 500);
    } else {
      pushToAll(user, { type: 'state', data: fullState(user) });
    }
  }, 1000);
  pushToAll(user, { type: 'state', data: fullState(user) });
}

function stopShotClock(u) {
  const user = getOrCreateUser(u);
  if (shotTimers[user]) { clearInterval(shotTimers[user]); shotTimers[user] = null; }
  states[user].shotRunning = false;
}
// ──────────────────────────────────────────────────────────────────────────

const ROUTES = {
  '/':                   'landing.html',
  '/control':            'basketball-scoreboard.html',
  '/landing':            'landing.html',
  '/login':              'login.html',
  '/admin':              'admin.html',
  '/overlay':            'basketball-overlay.html',
  '/fullscreen':         'basketball-fullscreen.html',
  '/nbaoverlay':         'basketball-nbaoverlay.html',
  '/nbaoverlay2':        'basketball-nbaoverlay2.html',
  '/nbc':               'basketball-nba-nbc.html',
  '/mobile-overlay':     'mobile-overlay.html',
  '/display':            'scoreboard-display.html',
  '/camera':             'camera.html',
  '/display2':           'scoreboard-display2.html',
  '/shotclock':          'shotclock-control.html',
  '/shotclock-display':  'shotclock-display.html',
  '/manifest.json':      'manifest.json',
  '/sw.js':              'sw.js',
  '/icon-192.png':       'icon-192.png',
  '/icon-512.png':       'icon-512.png',
  '/buzzer.mp3':         'buzzer.mp3',
  '/hoop-culture-logo.png': 'hoop-culture-logo.png',
  '/hoop-culture-logo.jpg': 'hoop-culture-logo.jpg',
  '/marketing-workflow-dark.png': 'marketing-workflow-dark.png',
  '/marketing-workflow-mobile-ocr.jpg': 'marketing-workflow-mobile-ocr.jpg',
  '/firebase-config.js': 'firebase-config.js',
  '/LOCAL_SETUP.md': 'LOCAL_SETUP.md',
  '/AI_SCOREBOARD_GUIDE.md': 'AI_SCOREBOARD_GUIDE.md',
  '/README.md': 'README.md',
  '/LOCAL_SETUP.txt': 'LOCAL_SETUP.txt',
  '/AI_SCOREBOARD_GUIDE.txt': 'AI_SCOREBOARD_GUIDE.txt',
  '/README.txt': 'README.txt',
};

function pushToAll(u, payload) {
  const user = getOrCreateUser(u);
  const msg = 'data: ' + JSON.stringify(payload) + '\n\n';
  sseClients[user] = sseClients[user].filter(res => {
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
  const reqUrl = new URL(req.url, 'http://localhost');
  const pathname = reqUrl.pathname;
  const user = getOrCreateUser(reqUrl.searchParams.get('user') || 'default');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /cmd — clock commands from the control panel
  if (req.method === 'POST' && pathname === '/cmd') {
    readBody(req).then(b => {
      try {
        const { cmd, seconds } = JSON.parse(b);

        if (cmd === 'game_start') {
          if (!states[user].gameRunning) startGameClock(user);

        } else if (cmd === 'game_stop') {
          if (states[user].gameRunning) {
            stopGameClock(user);
            pushToAll(user, { type: 'state', data: fullState(user) });
          }

        } else if (cmd === 'game_reset') {
          stopGameClock(user);
          states[user].gameSeconds = seconds || states[user].timerPresetSeconds || 600;
          pushToAll(user, { type: 'state', data: fullState(user) });

        } else if (cmd === 'game_set') {
          if (!states[user].gameRunning) {
            states[user].gameSeconds = seconds != null ? seconds : (states[user].gameSeconds || 600);
            pushToAll(user, { type: 'state', data: fullState(user) });
          }

        } else if (cmd === 'shot_start') {
          if (!states[user].shotRunning) startShotClock(user);

        } else if (cmd === 'shot_stop') {
          if (states[user].shotRunning) {
            stopShotClock(user);
            pushToAll(user, { type: 'state', data: fullState(user) });
          }

        } else if (cmd === 'shot_reset') {
          stopShotClock(user);
          states[user].shotSeconds = seconds || 24;
          startShotClock(user);

        } else if (cmd === 'reset_all') {
          stopGameClock(user);
          stopShotClock(user);
          const preset = states[user].timerPresetSeconds || 600;
          states[user] = {
            homeScore: 0, awayScore: 0,
            homeFouls: 0, awayFouls: 0,
            homeAbbr: states[user].homeAbbr || 'HOME',
            awayAbbr: states[user].awayAbbr || 'AWAY',
            homeRecord: states[user].homeRecord || '0-0',
            awayRecord: states[user].awayRecord || '0-0',
            homeColor: states[user].homeColor || '#f5c842',
            awayColor: states[user].awayColor || '#c8102e',
            quarter: 1,
            gameSeconds: preset,
            shotSeconds: 24,
            gameRunning: false,
            shotRunning: false,
            timerPresetSeconds: preset,
            rp1Title: states[user].rp1Title || 'BROADCAST',
            rp1Value: states[user].rp1Value || '',
            rp2Title: states[user].rp2Title || 'VENUE',
            rp2Value: states[user].rp2Value || '',
            barColor: states[user].barColor || '#0d1117',
            possession: null,
          };
          pushToAll(user, { type: 'state', data: fullState(user) });
        }
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /api/ocr — camera sync feed endpoint (from ScoreSight)
  if (req.method === 'POST' && pathname === '/api/ocr') {
    readBody(req).then(b => {
      try {
        // Ensure the session state is initialized on the server
        getOrCreateUser(user);
        
        // Auto-enable AI Sync on the server if we receive an OCR payload
        states[user].aiSyncEnabled = true;
          
        const incoming = JSON.parse(b);
        let updated = {};

        // 1. Parse Clock (e.g., "10:00", "09:58", "58.4", or colon-less "0831" / "831")
        if (incoming.clock != null) {
          const clockStr = String(incoming.clock).replace(/\s/g, '').trim(); // Remove all spaces
          if (clockStr.includes(':')) {
            const parts = clockStr.split(':');
            const mins = parseInt(parts[0], 10) || 0;
            const secs = parseInt(parts[1], 10) || 0;
            updated.gameSeconds = mins * 60 + secs;
          } else if (clockStr.length === 3) {
            // e.g. "831" -> 8 mins, 31 secs
            const mins = parseInt(clockStr.substring(0, 1), 10) || 0;
            const secs = parseInt(clockStr.substring(1), 10) || 0;
            updated.gameSeconds = mins * 60 + secs;
          } else if (clockStr.length === 4) {
            // e.g. "0831" -> 8 mins, 31 secs
            const mins = parseInt(clockStr.substring(0, 2), 10) || 0;
            const secs = parseInt(clockStr.substring(2), 10) || 0;
            updated.gameSeconds = mins * 60 + secs;
          } else {
            const parsedVal = parseFloat(clockStr) || 0;
            updated.gameSeconds = Math.round(parsedVal);
          }
        }

        // 2. Parse Scores (Accept both homeScore/awayScore and raw home/away keys)
        const hScore = incoming.homeScore !== undefined ? incoming.homeScore : incoming.home;
        if (hScore != null) {
          updated.homeScore = parseInt(hScore, 10) || 0;
        }
        const aScore = incoming.awayScore !== undefined ? incoming.awayScore : incoming.away;
        if (aScore != null) {
          updated.awayScore = parseInt(aScore, 10) || 0;
        }

        // 3. Parse Period/Quarter
        if (incoming.period != null) {
          updated.quarter = parseInt(incoming.period, 10) || 1;
        }

        // 4. Parse Shot Clock (if present)
        if (incoming.shotClock != null) {
          const scStr = String(incoming.shotClock).trim();
          updated.shotSeconds = parseInt(scStr, 10) || 24;
        }

        // Since camera is running the clock, make sure local server ticker doesn't overlap
        if (states[user].gameRunning) {
          stopGameClock(user);
        }
        if (states[user].shotRunning) {
          stopShotClock(user);
        }

        states[user] = { ...states[user], ...updated };
        pushToAll(user, { type: 'state', data: fullState(user) });
      } catch(e) {}
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /update — non-clock state (scores, names, colors, period, etc.)
  if (req.method === 'POST' && pathname === '/update') {
    readBody(req).then(b => {
      try {
        const incoming = JSON.parse(b);
        delete incoming.gameRunning;
        delete incoming.shotRunning;
        delete incoming.gameSeconds;
        delete incoming.shotSeconds;
        states[user] = { ...states[user], ...incoming };
      } catch(e) {}
      pushToAll(user, { type: 'state', data: fullState(user) });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /buzz — broadcast buzzer sound
  if (req.method === 'POST' && pathname === '/buzz') {
    readBody(req).then(b => {
      let kind = 'game';
      try { kind = JSON.parse(b).kind || 'game'; } catch(e) {}
      pushToAll(user, { type: 'buzz', kind });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // POST /logo/home or /logo/away
  if (req.method === 'POST' && (pathname === '/logo/home' || pathname === '/logo/away')) {
    const side = pathname === '/logo/home' ? 'home' : 'away';
    readBody(req).then(b => {
      try { const d = JSON.parse(b); logos[user][side] = d.logo; } catch(e) {}
      pushToAll(user, { type: 'state', data: fullState(user) });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  // GET /events — SSE stream for all clients
  if (pathname === '/events') {
    res.writeHead(200, {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('\n');
    const uState = fullState(user);
    if (Object.keys(uState).length) {
      res.write('data: ' + JSON.stringify({ type: 'state', data: uState }) + '\n\n');
    }
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch(e) { clearInterval(ping); }
    }, 20000);
    sseClients[user].push(res);
    req.on('close', () => {
      clearInterval(ping);
      sseClients[user] = sseClients[user].filter(c => c !== res);
    });
    return;
  }

  // GET /state — initial snapshot
  if (pathname === '/state') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fullState(user)));
    return;
  }

  // Serve static files — match on pathname only, so ?user= query params don't break routing
  const fileName = ROUTES[pathname];
  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(fileName);
      const types = { '.html':'text/html', '.json':'application/json', '.js':'application/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.mp3':'audio/mpeg' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404); res.end('Not found');

}).listen(PORT, () => {
  console.log('Scoreboard server running on port ' + PORT);
});
