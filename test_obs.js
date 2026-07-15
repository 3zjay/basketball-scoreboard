const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration from OBS Studio Settings
const OBS_PORT = 4455;
const OBS_PASSWORD = 'veCk9KOvB5MTV0aI';

console.log(`Connecting to OBS Studio WebSocket at ws://127.0.0.1:${OBS_PORT}...`);
const ws = new WebSocket(`ws://127.0.0.1:${OBS_PORT}`);

function generateAuthResponse(password, salt, challenge) {
  const sha256 = (data) => crypto.createHash('sha256').update(data).digest('base64');
  const secret = sha256(password + salt);
  return sha256(secret + challenge);
}

ws.on('open', () => {
  console.log('🔌 TCP Connection Established! Waiting for Hello message...');
});

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    const op = msg.op;

    if (op === 0) { // Hello
      console.log('👋 Received Hello from OBS Studio.');
      const handshake = {
        op: 1,
        d: {
          rpcVersion: 1,
          eventSubscriptions: 0
        }
      };

      const auth = msg.d.authentication;
      if (auth) {
        console.log('🔒 OBS WebSocket requires authentication.');
        if (OBS_PASSWORD) {
          handshake.d.authentication = generateAuthResponse(OBS_PASSWORD, auth.salt, auth.challenge);
          console.log('🔑 Generated authentication response using provided password.');
        } else {
          console.log('❌ ERROR: OBS requires a password, but OBS_PASSWORD is empty in the test script.');
          ws.close();
          return;
        }
      } else {
        console.log('🔓 OBS WebSocket does not require authentication.');
      }

      ws.send(JSON.stringify(handshake));
      console.log('📤 Sent Identify (handshake)...');
    } 
    
    else if (op === 2) { // Identified
      console.log('✅ Connected & Authenticated successfully!');
      console.log('📡 Sending SaveReplayBuffer request to OBS Studio...');
      ws.send(JSON.stringify({
        op: 6,
        d: {
          requestType: "SaveReplayBuffer",
          requestId: "test-save-replay"
        }
      }));
    } 
    
    else if (op === 7) { // RequestResponse
      console.log('📥 Received RequestResponse from OBS:');
      console.log(JSON.stringify(msg.d, null, 2));
      if (msg.d.requestStatus && msg.d.requestStatus.result) {
        console.log('🎉 SaveReplayBuffer was successful!');
      } else {
        console.log('❌ SaveReplayBuffer failed. Make sure Replay Buffer is active in OBS Studio (Output -> Replay Buffer -> Enable Replay Buffer, and start it!).');
      }
      ws.close();
    }
  } catch (e) {
    console.error('❌ Error parsing message:', e);
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed (Code: ${code}, Reason: ${reason || 'None'}).`);
});

ws.on('error', (err) => {
  console.error('❌ WebSocket Error:', err);
});
