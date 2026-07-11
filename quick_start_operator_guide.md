# 🏀 Gym Operator's Quick Start Guide (Dual-Monitor Setup)

Welcome to the HoopCulture Scoreboard! This guide is designed for scoreboard operators, referees, and coaches to set up the dual-monitor docking station and get the game running in less than 2 minutes.

---

## 1. Quick Start Visual Infographic

![Operator Setup Guide](/clean_gym_operator_guide.jpg)

---

## 2. Step-by-Step Operator Instructions

### 🔌 Step 1: Connect the Docking Station
1. Connect the **Docking Station** to your MacBook using the main USB-C cable.
2. The docking station automatically connects to:
   * **Monitor 1 (Venue Scoreboard):** The big screen facing the spectators.
   * **Monitor 2 (Player Shot Clock):** The screen showing the shot timers.

### 💻 Step 2: Open the Scoreboard & OBS
1. Double-click the orange **`HoopCulture Scoreboard`** app icon on your Mac to start the server.
2. Open the displays in your browser:
   * **Venue Scoreboard:** Open [http://localhost:3000/fullscreen](http://localhost:3000/fullscreen), drag it to **Monitor 1**, and make it fullscreen (`Ctrl + Cmd + F`).
   * **Shot Clock:** Open [http://localhost:3000/shotclock-display](http://localhost:3000/shotclock-display), drag it to **Monitor 2**, and make it fullscreen (`Ctrl + Cmd + F`).
3. Open **OBS Studio** on your MacBook screen to start the live stream.

### 📱 Step 3: Connect your Tablet (via Wi-Fi or Hotspot)
1. Ensure your MacBook and tablet are both connected to the **Gym Wi-Fi** or your **Phone Hotspot**.
2. Scroll to the ngrok section on the Mac launcher and click **Start Tunnel**.
3. Open the browser on your tablet and type in your unique ngrok link:
   * **`https://[your-static-domain].ngrok-free.dev/?user=default`**
   * *Tip: Bookmark this link on your tablet for instant access!*

### 🎮 Step 4: Control the Game!
You are now ready to control everything wirelessly from the court!
* **Update Scores:** Tap the `Score +` and `-` buttons to adjust points.
* **Game Clock:** Tap the green `Start` / red `Stop` buttons to manage the period time.
* **Shot Clock:** Tap the dedicated controls to manage or reset the 24/14 second clocks.
