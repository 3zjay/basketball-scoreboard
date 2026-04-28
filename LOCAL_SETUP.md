# 🏀 Running the Scoreboard Locally (Windows)

This guide walks you through setting up the Hoop Culture Scoreboard on a Windows PC so it runs entirely on your local network — no internet required during games.

---

## Prerequisites

Before starting, you'll need two things installed on your PC:

### 1. Node.js
The scoreboard server runs on Node.js.

- Go to **https://nodejs.org**
- Download the **LTS** version
- Run the installer — all default options are fine
- To verify it worked, open Command Prompt and type:
  ```
  node -v
  ```
  You should see a version number like `v20.x.x`

### 2. Git
Used to clone the repository to your PC.

- Go to **https://git-scm.com**
- Download and install — all default options are fine
- To verify it worked, open Command Prompt and type:
  ```
  git --version
  ```

> **No Git?** You can skip installing Git and instead go to the GitHub repo, click **Code → Download ZIP**, and extract the folder to `C:\basketball-scoreboard`.

---

## Installation

### Step 1 — Clone the Repository

Open **Command Prompt** (search `cmd` in the Start menu) and run:

```bash
git clone https://github.com/3zjay/basketball-scoreboard.git C:\basketball-scoreboard
```

This downloads all the scoreboard files into `C:\basketball-scoreboard`.

### Step 2 — Verify the Files

Open File Explorer and navigate to `C:\basketball-scoreboard`. You should see:

```
C:\basketball-scoreboard\
├── server.js
├── package.json
├── basketball-scoreboard.html
├── buzzer.mp3
├── start.bat
└── ... (other files)
```

> This project has **no external dependencies**, so there is no need to run `npm install`.

---

## Starting the Server

Double-click **`start.bat`** in the `C:\basketball-scoreboard` folder.

A terminal window will open and display something like this:

```
============================================
 HOOP CULTURE SCOREBOARD - Starting Server
============================================

 Your local IP addresses (for tablet access):
   http://192.168.1.45:3000

 Scoreboard Control  ->  http://localhost:3000
 Venue Display       ->  http://localhost:3000/display
 Shot Clock Display  ->  http://localhost:3000/shotclock-display
 OBS Overlay         ->  http://localhost:3000/overlay

 Press Ctrl+C to stop the server.
============================================
```

**Keep this window open** for as long as you need the scoreboard running. Closing it stops the server.

---

## Accessing the Scoreboard

Once the server is running, open these URLs in your browser:

| Page | URL | Device |
|---|---|---|
| Scoreboard Control | `http://localhost:3000` | Laptop |
| Venue Display | `http://localhost:3000/display` | Laptop (second window/screen) |
| Shot Clock | `http://localhost:3000/shotclock-display` | Laptop (third window/screen) |
| OBS Overlay | `http://localhost:3000/overlay` | OBS Browser Source |
| Tablet Control | `http://192.168.1.XX:3000` | Tablet (see note below) |

### Connecting Your Tablet

Your tablet must be on the **same WiFi network** as the laptop.

1. Look at the terminal window after starting the server — it will print your laptop's local IP address (e.g. `http://192.168.1.45:3000`)
2. Type that address into the browser on your tablet
3. You now have full scoreboard control from the tablet

> If you don't see the IP in the terminal, open Command Prompt and type `ipconfig`. Look for **IPv4 Address** under your WiFi adapter.

---

## OBS Setup

To use the scoreboard as a stream overlay in OBS:

1. In OBS, click the **+** button under **Sources**
2. Select **Browser**
3. Set the URL to `http://localhost:3000/overlay`
4. Set width and height to match your stream resolution (e.g. 1920 × 1080)
5. Click **OK**

### Recommended OBS Encoder Setting

The Dell Latitude 5440 (i5-1345U) supports **Intel Quick Sync (QSV)** hardware encoding. This offloads video encoding to the GPU and keeps CPU usage low, allowing OBS and the scoreboard to run comfortably side by side.

To enable it:

1. Go to **OBS → Settings → Output**
2. Set **Encoder** to `Intel QSV H.264`
3. Click **Apply**

> ⚠️ Avoid using `x264` (software encoding) — it will significantly increase CPU load during streaming.

---

## Stopping the Server

In the terminal window, press **Ctrl + C** to stop the server. You can then close the window.

---

## Troubleshooting

**The terminal says "Node.js is not installed"**
Node.js either isn't installed or wasn't added to PATH during installation. Reinstall it from https://nodejs.org and make sure to check the option to add Node to PATH during setup.

**The terminal says "server.js not found"**
The files aren't in `C:\basketball-scoreboard`. Make sure the clone or ZIP extraction landed in the right folder.

**The tablet can't connect**
- Make sure the tablet is on the same WiFi as the laptop
- Double-check the IP address shown in the terminal
- Make sure Windows Firewall isn't blocking port 3000. If it is, Windows will prompt you to allow access the first time — click **Allow**

**The buzzer sound is delayed**
This is a known issue with the hosted (Render.com) version. The local version eliminates most of this delay since everything runs on the same machine and network.

**The server stops when I close the laptop lid**
Go to **Control Panel → Power Options → Choose what closing the lid does** and set it to **Do nothing** when plugged in.

---

## Updating the Scoreboard

To pull the latest changes from GitHub:

1. Open Command Prompt
2. Navigate to the folder:
   ```
   cd C:\basketball-scoreboard
   ```
3. Pull the latest code:
   ```
   git pull
   ```
4. Restart the server by double-clicking `start.bat`

---

*Built for the Hoop Culture Network — Greater Toronto Area 🏀*
