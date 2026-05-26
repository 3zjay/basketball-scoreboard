# 🏀 Hoop Culture Scoreboard & Live Stream System

Welcome to the **Hoop Culture Scoreboard**, a premium local web server and broadcast graphics system designed for the Hoop Culture Network. This system runs completely locally on a Windows PC—**no internet connection required** during games. 

It provides real-time scoring, synchronized server-owned game and shot clocks, tablet-based remote controls, and professional stream graphics (lower-thirds and floating score bugs) for OBS Studio.

---

## 🚀 Key Features

* **Desktop Launcher GUI (`ScoreboardLauncher.ps1`)**: A beautiful, dark-mode desktop console app built on native Windows Forms.
* **Integrated Mobile Hotspot Controls**: One-click native control of your PC's Mobile Hotspot using Windows tethering APIs—perfect for setting up a court-side private tablet network instantly.
* **Authoritative Server Clocks**: The game clock and shot clock calculation are handled by the Node.js server to prevent clock drift between connected tablets, venue displays, and broadcast graphics.
* **Live SSE Log Panel**: Real-time console logs from the scoreboard server are captured and rendered directly inside the desktop app.
* **PWA & Mobile Ready**: Built-in Progressive Web App (PWA) configurations (`manifest.json` and service worker `sw.js`) so officials can install and control the scoreboard from iOS/Android tables as a fullscreen app.
* **Dominant Color Extraction**: Uploading a PNG/JPEG logo for either team automatically extracts and applies the team's dominant brand color across all scoreboards and overlays in real time.

---

## 📦 Startup & Installation

Before starting, ensure you have [Node.js (LTS Version)](https://nodejs.org) installed on your Windows PC. The project has **zero external package dependencies** (no `npm install` required).

### Option 1 — Scoreboard Desktop App (Recommended)
Launch the fully-featured desktop console GUI:
1. Right-click **`ScoreboardLauncher.ps1`** and choose **Run with PowerShell**.
2. Click the green **`START SERVER`** button.
3. Your server log will stream in real-time, and you can instantly launch any display page with the labeled buttons!

### Option 2 — Console Startup Scripts
If you prefer standard console windows:
* **PowerShell Console**: Right-click **`start.ps1`** and select **Run with PowerShell**.
* **Standard Batch**: Double-click **`start.bat`**.

> [!TIP]
> All startup scripts are fully portable! They use dynamic path resolutions (`$PSScriptRoot` and `%~dp0`) so you can run them from any folder where your project is stored without needing to modify path variables.

---

## 📶 Offline Mode & Tablet Setup

This system is built to run entirely offline on a dedicated local network. Your tablet operator must be connected to the **same network** as the laptop.

1. **Turn on Mobile Hotspot**: Click **`ENABLE HOTSPOT`** directly inside the **Scoreboard Launcher GUI** (or toggle it in Windows Network Settings).
2. **Connect Tablet**: Connect your iPad or tablet to the laptop's Wi-Fi hotspot network.
3. **Open Operator URL**: Look at the **Network Addresses** panel in the Launcher—it will print your local network URL (e.g. `http://192.168.137.1:3000`). Enter this address in your tablet browser.
4. **Install App (Optional)**: In Safari on iOS, tap **Share** (□↑) and select **Add to Home Screen** to install the scoreboard as a fullscreen app.

---

## 📺 Screens & Links

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
2. Set the **URL** to your local scoreboard link (e.g., `http://localhost:3000/overlay` or `http://localhost:3000/nbaoverlay`).
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
