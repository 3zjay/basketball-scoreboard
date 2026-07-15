const http = require('http');
const fs   = require('fs');
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');

// --- Streamlabs Replay Buffer Integration ---
const STREAMLABS_TOKEN = process.env.STREAMLABS_TOKEN || '8183a35b168a986def8938bbfc456a988453c';
let streamlabsSocket = null;
let streamlabsAuth = false;

function connectToStreamlabs() {
  if (STREAMLABS_TOKEN === 'YOUR_API_TOKEN_HERE' || !STREAMLABS_TOKEN) {
    console.log('⚠️ Streamlabs API Token is not set. Auto-save replays for Streamlabs will be disabled.');
    return;
  }
  
  streamlabsSocket = new WebSocket('ws://127.0.0.1:59650/api/websocket');

  streamlabsSocket.on('open', () => {
    streamlabsSocket.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "auth",
      params: {
        resource: "TcpServerService",
        args: [STREAMLABS_TOKEN]
      }
    }));
  });

  streamlabsSocket.on('message', (data) => {
    try {
      const res = JSON.parse(data);
      if (res.id === 1 && res.result === true) {
        streamlabsAuth = true;
        console.log('✅ Connected & Authenticated to Streamlabs Replay Buffer!');
      }
    } catch (e) {}
  });

  streamlabsSocket.on('close', () => {
    streamlabsAuth = false;
    setTimeout(connectToStreamlabs, 5000);
  });
  
  streamlabsSocket.on('error', () => {});
}

// --- OBS Studio Replay Buffer Integration (obs-websocket v5) ---
const OBS_PORT = process.env.OBS_PORT || 4455;
const OBS_PASSWORD = process.env.OBS_PASSWORD || '';
let obsSocket = null;
let obsAuth = false;

function generateAuthResponse(password, salt, challenge) {
  const sha256 = (data) => crypto.createHash('sha256').update(data).digest('base64');
  const secret = sha256(password + salt);
  return sha256(secret + challenge);
}

function connectToOBS() {
  obsSocket = new WebSocket(`ws://127.0.0.1:${OBS_PORT}`);

  obsSocket.on('open', () => {
    // Wait for the hello message op:0
  });

  obsSocket.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const op = msg.op;

      if (op === 0) { // Hello
        const handshake = {
          op: 1,
          d: {
            rpcVersion: 1,
            eventSubscriptions: 0
          }
        };

        const auth = msg.d.authentication;
        if (auth) {
          if (OBS_PASSWORD) {
            handshake.d.authentication = generateAuthResponse(OBS_PASSWORD, auth.salt, auth.challenge);
          } else {
            console.log('⚠️ OBS WebSocket requires a password, but OBS_PASSWORD is not set. Replay triggers via OBS will fail.');
            return;
          }
        }

        obsSocket.send(JSON.stringify(handshake));
      } else if (op === 2) { // Identified
        obsAuth = true;
        console.log('✅ Connected & Authenticated to OBS Studio Replay Buffer!');
      }
    } catch (e) {}
  });

  obsSocket.on('close', () => {
    obsAuth = false;
    setTimeout(connectToOBS, 5000);
  });

  obsSocket.on('error', () => {});
}

function triggerSaveReplay() {
  // 1. Trigger Streamlabs
  if (streamlabsSocket && streamlabsAuth) {
    streamlabsSocket.send(JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "saveReplay",
      params: {
        resource: "StreamingService"
      }
    }));
    console.log('📡 Sent Replay Buffer Save Request to Streamlabs!');
  }

  // 2. Trigger OBS Studio
  if (obsSocket && obsAuth) {
    obsSocket.send(JSON.stringify({
      op: 6,
      d: {
        requestType: "SaveReplayBuffer",
        requestId: "scoreboard-replay-trigger"
      }
    }));
    console.log('📡 Sent Replay Buffer Save Request to OBS Studio!');
  }
}

connectToStreamlabs();
connectToOBS();
// --------------------------------------------

let ngrok = null;
try {
  ngrok = require('@ngrok/ngrok');
} catch (e) {
  console.log('ngrok SDK is not installed or failed to load. Sharing will be disabled.');
}
let activeTunnel = null;
let activeTunnelUrl = '';

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
  '/launcher':           'launcher.html',
  '/control':            'basketball-scoreboard.html',
  '/landing':            'landing.html',
  '/login':              'login.html',
  '/admin':              'admin.html',
  '/overlay':            'basketball-fullscreen.html',
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
  '/tf.min.js':          'tf.min.js',
  '/clear-logos':        'clear-logos.html',
  '/clear-logos.html':   'clear-logos.html',
  '/quick_start_operator_guide.md': 'quick_start_operator_guide.md',
  '/clean_gym_operator_guide.jpg': 'clean_gym_operator_guide.jpg',
  '/docking_station_wifi_setup_diagram.jpg': 'docking_station_wifi_setup_diagram.jpg',
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

const requestHandler = (req, res) => {
  const reqUrl = new URL(req.url, 'http://localhost');
  const pathname = reqUrl.pathname;
  const user = getOrCreateUser(reqUrl.searchParams.get('user') || 'default');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /api/tunnel/status
  if (req.method === 'GET' && pathname === '/api/tunnel/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      active: !!activeTunnel,
      url: activeTunnelUrl
    }));
    return;
  }

  // POST /api/tunnel/start
  if (req.method === 'POST' && pathname === '/api/tunnel/start') {
    readBody(req).then(async (body) => {
      try {
        const { authtoken, domain } = JSON.parse(body);
        if (!ngrok) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ngrok library is not loaded on this server.' }));
          return;
        }

        if (activeTunnel) {
          try {
            await activeTunnel.close();
          } catch(e) {}
          activeTunnel = null;
          activeTunnelUrl = '';
        }

        if (!authtoken || authtoken.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Authtoken is required to start ngrok.' }));
          return;
        }

        // Configure authtoken
        try {
          await ngrok.authtoken(authtoken.trim());
        } catch(e) {
          // ignore or handle if already configured
        }

        // Start tunnel options
        const opts = {
          addr: PORT,
          authtoken: authtoken.trim()
        };
        if (domain && domain.trim() !== '') {
          opts.domain = domain.trim();
        }

        activeTunnel = await ngrok.forward(opts);
        activeTunnelUrl = activeTunnel.url();

        console.log(`[ngrok] Secure tunnel started successfully: ${activeTunnelUrl}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: activeTunnelUrl }));
      } catch (err) {
        console.error('[ngrok] Failed to start tunnel:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /api/tunnel/stop
  if (req.method === 'POST' && pathname === '/api/tunnel/stop') {
    if (activeTunnel) {
      activeTunnel.close().then(() => {
        console.log('[ngrok] Secure tunnel stopped.');
        activeTunnel = null;
        activeTunnelUrl = '';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      }).catch(err => {
        console.error('[ngrok] Error stopping tunnel:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'No active tunnel running.' }));
    }
    return;
  }

  // POST /cmd — clock commands from the control panel
  if (req.method === 'POST' && pathname === '/cmd') {
    readBody(req).then(b => {
      try {
        const { cmd, seconds } = JSON.parse(b);
        states[user].lastManualTime = Date.now();

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
        
        // Guard manual actions from being overwritten by delayed OCR updates
        if (states[user].lastManualTime && (Date.now() - states[user].lastManualTime) < 5000) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ignored: true }));
          return;
        }
        let updated = {};

        // 1. Parse Clock (e.g., "10:00", "09:58", "58.4", or colon-less "0831" / "831")
        if (incoming.clock != null) {
          const clockStr = String(incoming.clock).replace(/\s/g, '').trim(); // Remove all spaces
          let incomingSeconds = null;
          if (clockStr.includes(':')) {
            const parts = clockStr.split(':');
            const mins = parseInt(parts[0], 10) || 0;
            const secs = parseInt(parts[1], 10) || 0;
            incomingSeconds = mins * 60 + secs;
          } else if (clockStr.length === 3) {
            // e.g. "831" -> 8 mins, 31 secs
            const mins = parseInt(clockStr.substring(0, 1), 10) || 0;
            const secs = parseInt(clockStr.substring(1), 10) || 0;
            incomingSeconds = mins * 60 + secs;
          } else if (clockStr.length === 4) {
            // e.g. "0831" -> 8 mins, 31 secs
            const mins = parseInt(clockStr.substring(0, 2), 10) || 0;
            const secs = parseInt(clockStr.substring(2), 10) || 0;
            incomingSeconds = mins * 60 + secs;
          } else {
            const parsedVal = parseFloat(clockStr) || 0;
            incomingSeconds = Math.round(parsedVal);
          }

          if (incomingSeconds !== null) {
            // Detect clock state updates: Running or Paused
            const lastSecs = states[user].gameSeconds;
            let isRunning = states[user].gameRunning;
            if (lastSecs !== undefined && lastSecs !== null) {
              if (incomingSeconds < lastSecs) {
                isRunning = true;
              } else {
                isRunning = false;
              }
            }
            updated.gameRunning = isRunning;

            // Lag compensation (processing roundtrip lag offset)
            const compensatedSeconds = isRunning ? Math.max(0, incomingSeconds - 1) : incomingSeconds;
            const drift = Math.abs((states[user].gameSeconds || 0) - compensatedSeconds);

            // Only snap clock if drift is significant (> 3s) or running state changed
            if (drift > 3 || states[user].gameRunning !== isRunning) {
              updated.gameSeconds = compensatedSeconds;
            }
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
          const incomingShotSeconds = parseInt(scStr, 10) || 24;
          
          const lastShotSecs = states[user].shotSeconds;
          let isShotRunning = states[user].shotRunning;
          if (lastShotSecs !== undefined && lastShotSecs !== null) {
            if (incomingShotSeconds < lastShotSecs) {
              isShotRunning = true;
            } else {
              isShotRunning = false;
            }
          }
          updated.shotRunning = isShotRunning;

          // Lag compensation (offsetting cloud sync latency)
          const compensatedShotSeconds = isShotRunning ? Math.max(0, incomingShotSeconds - 1) : incomingShotSeconds;
          const shotDrift = Math.abs((states[user].shotSeconds || 0) - compensatedShotSeconds);

          // Only snap local shot clock if drift is significant (> 2s) or if running state changed
          if (shotDrift > 2 || states[user].shotRunning !== isShotRunning) {
            updated.shotSeconds = compensatedShotSeconds;
          }
        }

        // Since camera is running the clock, make sure local server ticker doesn't overlap
        if (states[user].gameRunning) {
          stopGameClock(user);
        }
        if (states[user].shotRunning) {
          stopShotClock(user);
        }

        // Store old scores for replay comparison
        const prevHomeScore = states[user].homeScore || 0;
        const prevAwayScore = states[user].awayScore || 0;

        states[user] = { ...states[user], ...updated };

        // Check if score went up
        try {
          const newHomeScore = states[user].homeScore || 0;
          const newAwayScore = states[user].awayScore || 0;
          if (newHomeScore > prevHomeScore || newAwayScore > prevAwayScore) {
            triggerSaveReplay();
          }
        } catch (err) {
          console.error("⚠️ Replay trigger check failed:", err);
        }

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

        // Store old scores for replay comparison
        const prevHomeScore = states[user].homeScore || 0;
        const prevAwayScore = states[user].awayScore || 0;

        states[user] = { ...states[user], ...incoming };

        // Check if score went up
        try {
          const newHomeScore = states[user].homeScore || 0;
          const newAwayScore = states[user].awayScore || 0;
          if (newHomeScore > prevHomeScore || newAwayScore > prevAwayScore) {
            triggerSaveReplay();
          }
        } catch (err) {
          console.error("⚠️ Replay trigger check failed:", err);
        }
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

  // DELETE /logo — wipe ALL logo data from server memory for a user
  if (req.method === 'DELETE' && pathname === '/logo') {
    if (logos[user]) { logos[user].home = null; logos[user].away = null; }
    if (states[user]) { states[user].homeLogo = null; states[user].awayLogo = null; states[user].homeLogoThumb = null; states[user].awayLogoThumb = null; }
    pushToAll(user, { type: 'state', data: fullState(user) });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
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

  // GET /api/ip — returns server local network IP for phone camera QR code matching
  if (pathname === '/api/ip') {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    let ip = '127.0.0.1';
    
    // Look for active WiFi, Ethernet, or Hotspot network interfaces
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          // Prioritize standard local subnet ranges (192.168.x.x, 10.x.x.x, 172.x.x.x)
          if (net.address.startsWith('192.168.') || net.address.startsWith('10.') || net.address.startsWith('172.')) {
            ip = net.address;
          }
        }
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ip }));
    return;
  }

  // POST /api/server/stop — shuts down the server process
  if (pathname === '/api/server/stop' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Server is shutting down...' }));
    console.log('Shutdown request received. Exiting server process...');
    setTimeout(() => {
      process.exit(0);
    }, 1000);
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
      const types = { '.html':'text/html', '.json':'application/json', '.js':'application/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.mp3':'audio/mpeg', '.md':'text/markdown' };
      res.writeHead(200, { 
        'Content-Type': types[ext] || 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      });
      res.end(fs.readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404); res.end('Not found');
};

// HTTP and HTTPS Dual Server Boot
const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');

// Automatically generate self-signed certificates on macOS/Linux if missing
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  try {
    const { execSync } = require('child_process');
    console.log('Generating self-signed SSL certificates for local offline camera scanner...');
    execSync('openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"', { stdio: 'ignore' });
    console.log('SSL certificates generated successfully!');
  } catch (err) {
    console.warn('Auto-generation of self-signed certs failed. Offline camera scanner may not be available on port 3001:', err.message);
  }
}

const https = require('https');

// 1. Always boot the HTTP server on PORT (3000) so local Control Panel and OBS don't break with SSL issues
http.createServer(requestHandler).listen(PORT, () => {
  console.log('Scoreboard HTTP server running on http://localhost:' + PORT);
});

// 2. If SSL certs are present, also boot the HTTPS server on PORT + 1 (3001) for the Phone Camera Scanner
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  const PORT_HTTPS = parseInt(PORT, 10) + 1;
  https.createServer(options, requestHandler).listen(PORT_HTTPS, () => {
    console.log('Secure HTTPS server (for phone camera) running on https://localhost:' + PORT_HTTPS);
    console.log('Phone camera URL: https://[your-laptop-ip]:' + PORT_HTTPS + '/camera');
  });
} else {
  console.log('\nTo run securely over local IP (allowing phone camera access offline):');
  console.log('1. Run this command on your laptop to generate self-signed SSL certs:');
  console.log('   openssl req -nodes -new -x509 -keyout key.pem -out cert.pem -days 365 -subj "/CN=localhost"');
  console.log('2. Restart this server (npm run dev). It will open a secure port 3001 for your phone camera.');
}
