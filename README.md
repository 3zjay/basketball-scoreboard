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

## 🔌 Tri-Mode Architecture & Setup

### 🔌 Mode 1: Offline Local (No Internet Required)
Designed for local venues and gymnasiums. The laptop acts as the "brain," hosting a Node.js WebSocket server.
1. Right-click **`ScoreboardLauncher.ps1`** and choose **Run with PowerShell**.
2. Click **`ENABLE HOTSPOT`** to spin up a private court-side Wi-Fi network.
3. Click the green **`START SERVER`** button to launch the local Node.js server.
4. Connect iPad/tablets to the hotspot, open the network URL shown in the log (e.g., `http://192.168.137.1:3000`), and start operating!

---

### ⚡ Mode 2: Vercel + Firebase (Zero-Cost Serverless Cloud)
Perfect for distributed production teams. Host the pages on Vercel (static) and sync state across the globe using Firebase's low-latency Realtime Database.
1. **Configure Firebase**: Open `firebase-config.js` in the project root and add your Firebase project web app configuration:
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
2. **Deploy to Vercel**: Connect your GitHub repository to Vercel. Vercel will host the HTML/CSS/JS files statically.
3. **Automatic Detection**: The app automatically detects if it is running on a Vercel domain (`*.vercel.app` or `*.vercel.sh`) and switches from WebSocket mode to **Firebase Realtime Database mode** instantly. Operators write state changes directly to the database, and display pages subscribe to those changes in real time.

---

### ☁️ Mode 3: OnRender Cloud (Full-Stack Cloud)
For standard internet-based operations backed by a persistent Node.js instance.
1. Connect your repository to **OnRender** (or any Node.js hosting provider).
2. Set the build command to `npm install` (none needed by default) and the start command to `node server.js`.
3. The display pages will automatically connect to the OnRender backend address using persistent, bidirectional WebSockets.

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
