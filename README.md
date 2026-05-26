# 🏀 Hoop Culture Scoreboard & Live Stream System

Welcome to the **Hoop Culture Scoreboard**, a premium, production-grade scoreboard and broadcast graphics system designed for the Hoop Culture Network. 

Featuring a modern **Tri-Mode Architecture**, this system offers triple redundancy to adapt to any environment—from completely offline gymnasiums with poor cellular reception to fully connected internet broadcasts.

---

## 🚀 Key Features

* **Tri-Mode Redundancy (`v2.0.0`)**: 
  * 🔌 **Offline Local Mode**: Runs a local Node.js WebSocket server on any Windows laptop—perfect for zero-internet gym environments.
  * ⚡ **Vercel + Firebase Serverless Cloud**: Host statically on Vercel at zero cost, syncing scores and clocks in real time across the globe using **Firebase Realtime Database**.
  * ☁️ **OnRender Full-Stack Cloud**: Full Node.js deployment for permanent cloud environments with standard client-server syncing.
* **Desktop Launcher GUI (`ScoreboardLauncher.ps1`)**: A beautiful, dark-mode native Windows Forms app to launch servers, check logs, and control network interfaces.
* **Integrated Mobile Hotspot Controls**: One-click native control of your PC's Mobile Hotspot using Windows tethering APIs—perfect for setting up a court-side private tablet network instantly.
* **Authoritative Server / DB Clocks**: Game clock and shot clock calculations are synchronized server-side (or database-side in Firebase) to prevent clock drift between connected tablets, venue displays, and broadcast graphics.
* **Dominant Color Extraction**: Uploading a PNG/JPEG logo for either team automatically extracts and applies the team's dominant brand color across all scoreboards and overlays in real time.
* **OBS & Stream Ready**: Tailored HTML overlay pages designed specifically for OBS Studio integration with modern layouts and smooth CSS animations.
* **PWA & Mobile Ready**: Built-in Progressive Web App (PWA) configuration (`manifest.json` and service worker `sw.js`) allowing operators to install the controller as a fullscreen app on iOS or Android tablets.

---

## 🔌 Tri-Mode Architecture & Setup Guide

The system supports three different environments (ecosystems) for running and using the controlboard. To prevent overlapping control board actions from different users, all environments use the **`?user=YOUR_SESSION_NAME`** query parameter to create isolated sessions.

---

### 🔌 Mode 1: Offline Local Mode (No Internet Required)
Best for local gymnasiums with poor internet. The host laptop acts as the server and local network access point.
* **How to Launch**:
  1. Right-click **`ScoreboardLauncher.ps1`** and choose **Run with PowerShell** (or run `start.bat`).
  2. Click **`ENABLE HOTSPOT`** in the Launcher GUI to spin up a private court-side network.
  3. Click **`START SERVER`** to launch the local Node.js server.
* **Controlboard URL**:
  * Local host: `http://localhost:3000/?user=my_court_name`
  * Connected tablets: `http://[IP_OF_LAPTOP]:3000/?user=my_court_name` (e.g. `http://192.168.137.1:3000/?user=court_1`)
* **How it Syncs**: Clocks tick on the local Node.js server, which streams updates to overlay pages via low-latency Server-Sent Events (SSE). 

---

### ⚡ Mode 2: Vercel + Firebase Mode (Zero-Cost Serverless Cloud)
Best for cloud streaming setups or remote production workflows where no persistent Node.js cloud server is running.
* **How to Setup & Launch**:
  1. Open `firebase-config.js` and paste your Firebase Web App credentials and Realtime Database URL:
     ```javascript
     const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "your-app.firebaseapp.com",
       databaseURL: "https://your-app-rtdb.firebaseio.com",
       projectId: "your-app",
       storageBucket: "your-app.firebasestorage.app",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
     ```
  2. Connect your repository to Vercel and deploy.
* **Controlboard URL**:
  * `https://your-app.vercel.app/?user=my_session_name` (e.g. `https://hoop-culture.vercel.app/?user=court_3`)
  * *Note: Usernames or emails containing dots (e.g. `first.last@domain.com`) are automatically sanitized to `first_last` for Firebase paths.*
* **Google Sign-In & Operator Whitelist**:
  * Users authenticate by clicking **"Continue with Google"** on the login screen.
  * The system validates their account against an authorized operator whitelist stored in your Firebase Realtime Database.
  * The super-administrator account **`admin@hoopculture.ca`** has bypass access to log in and manage directory entries.
* **Accessing the Operator Directory Management Console**:
  * Access URL: `https://your-app.vercel.app/admin` (or click the orange **⚙️ Admin** button in the control panel header when logged in as `admin@hoopculture.ca`).
  * Super-admins can add new operator Google email addresses or remove existing operators instantly with a single click.
* **How it Syncs**: 
  * **Remote spectator tabs**: Sync via WebSockets directly to the Firebase Realtime Database.
  * **Same-device overlay tabs (OBS & display tabs on the operator's PC)**: Sync instantly in **0–1ms** via the built-in browser **`BroadcastChannel` API**, bypassing internet routing entirely.
  * Clocks tick locally in the operator's browser and push delta updates to Firebase Realtime Database, which streams them to connected display clients.

---

### ☁️ Mode 3: OnRender Cloud Mode (Full-Stack Cloud)
Best for permanent cloud deployments with a dedicated server backend.
* **How to Launch**:
  1. Link your repository to OnRender (or any Node.js hosting platform).
  2. Set the build command to `npm install` and the start command to `node server.js`.
* **Controlboard URL**:
  * `https://your-app.onrender.com/?user=my_session_name` (e.g., `https://hoop-culture-api.onrender.com/?user=tournament_1`)
* **How it Syncs**: Clocks tick on the remote Node.js cloud server. The controlboard posts changes via HTTP endpoints, and the server broadcasts state updates to connected clients using persistent Server-Sent Events (SSE).

---


## 📺 Screens & Links

The ecosystem contains **9 fully-functional web pages** communicating in real time:

| Page | URL Path | Recommended Device / Usage |
| :--- | :--- | :--- |
| **Scoreboard Control** | `/` or `/control` | Laptop or Tablet Operator Console |
| **Venue Display** | `/display` | Secondary Monitor / Gym Projector (Primary Theme) |
| **Venue Display 2** | `/display2` | Secondary Monitor / Gym Projector (Alternate Theme) |
| **Shot Clock Display** | `/shotclock-display` | Primary court-side Shot Clock display monitor |
| **Shot Clock Control** | `/shotclock` | Dedicated tablet or phone for the shot clock operator |
| **OBS Bar Overlay** | `/overlay` | Lower-third scoreboard overlay for OBS Studio (1920 × 160) |
| **OBS Fullscreen** | `/fullscreen` | Full-screen broadcast scoreboard graphic |
| **NBA Scorebug** | `/nbaoverlay` | ESPN/NBA floating scoreboard bug (Bottom-right) |
| **NBA Scorebug 2** | `/nbaoverlay2` | Alternate ESPN/NBA style floating scoreboard bug |

---

## 📺 OBS Studio Integration

To use the live scoreboard graphics on your stream:
1. In OBS under **Sources**, click **`+`** and choose **`Browser`**.
2. Set the **URL** to your deployment link (e.g. `http://localhost:3000/overlay` for local, or `https://your-app.vercel.app/overlay` for Vercel mode).
3. Set the **Width** to `1920` and **Height** to `1080` (or matching your canvas resolution).
4. Click **OK**.

> [!IMPORTANT]
> **Recommended Hardware Encoder Settings**: 
> Go to **OBS Settings → Output** and set the **Video Encoder** to **`Intel QSV H.264`** (Quick Sync Video). This offloads video encoding to your Intel GPU, keeping your CPU load extremely low so the Node.js server and OBS can comfortably run side-by-side.

---

## ⌨️ Operator Keyboard Shortcuts

For fast, mouse-free tabletop operations, you can use the following keyboard keys (deactivated when typing inside text boxes):

| Key | Left Side (Home) | Right Side (Away) |
| :--- | :--- | :--- |
| **Score +1** | <kbd>Q</kbd> | <kbd>U</kbd> |
| **Score +2** | <kbd>W</kbd> | <kbd>I</kbd> |
| **Score +3** | <kbd>E</kbd> | <kbd>O</kbd> |
| **Score -1** | <kbd>A</kbd> | <kbd>J</kbd> |
| **Score -2** | <kbd>S</kbd> | <kbd>K</kbd> |
| **Buzzer** | <kbd>B</kbd> *(Manual Trigger)* | — |

| Clock Controls | Action |
| :--- | :--- |
| <kbd>Spacebar</kbd> | Start / Pause Game Clock |
| <kbd>Enter</kbd> | Start / Pause Shot Clock |
| <kbd>R</kbd> | Reset Shot Clock to **24** Seconds |
| <kbd>T</kbd> | Reset Shot Clock to **14** Seconds |

---

## 🛠️ Troubleshooting & Tips

* **Delay in Buzzer Sound**: The local version minimizes browser audio latency. For the absolute lowest audio lag, ensure the operator and OBS laptops are connected directly or run on the same device.
* **Firewall Blocks Connection**: The first time you start the server on a network, Windows might ask for Firewall permissions. Click **Allow Access** for private networks so your tablets can connect.
* **Prevent Laptop Sleeping**: Go to **Windows Control Panel → Power Options → Choose what closing the lid does** and select **Do nothing** when plugged in. This ensures your server stays running even if you close the laptop lid on the table.

---

*Built with passion for the Hoop Culture Network — Greater Toronto Area 🏀*
