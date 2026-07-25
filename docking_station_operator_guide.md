# 🏀 Stadium Scoreboard Setup Guide: Dual-Monitor & Docking Station

This guide walks you through setting up the HoopCulture Scoreboard using a **USB-C Docking Station** to control two separate display monitors (Venue Display + Shot Clock), while streaming the match via **OBS Studio** on your MacBook and controlling everything from a **Tablet** on the court.

---

## 1. System Architecture Diagram

![Docking Station System Architecture](/docking_station_wifi_setup_diagram.jpg)

---

## 2. Hardware Connections

Follow these steps to connect your hardware before turning on the software:

1. **Connect the Docking Station:** Plug the main **USB-C Cable** from the **Docking Station** into your MacBook.
2. **Connect Monitor 1 (Venue Scoreboard):** Plug an HDMI cable from the **Docking Station** into the main **Venue Scoreboard Display**.
3. **Connect Monitor 2 (Player Shot Clock):** Plug a second HDMI/DisplayPort cable from the **Docking Station** into the **Player Shot Clock Screen**.
4. **Connect Internet:** Ensure the Docking Station has an Ethernet connection, or the MacBook is connected to the gym's Wi-Fi network.

---

## 3. Step-by-Step Software Configuration

### Step 1: Arrange your macOS Displays
For this setup to work, your MacBook must treat the external screens as separate displays:
1. On your Mac, go to **System Settings > Displays**.
2. Click **Arrange...** and ensure the two external monitors are configured as **Extended Displays** (not mirrored).
3. Position them side-by-side or stacked according to how they are physically placed in the gym.

### Step 2: Open and Position the Scoreboard Windows
1. Double-click the orange **`HoopCulture Scoreboard`** app icon on your Mac to boot the server.
2. The launcher dashboard will open in your browser. Open the following overlays:
   * **Venue Scoreboard Overlay:** Open [http://localhost:3000/fullscreen](http://localhost:3000/fullscreen). Drag this window to **Monitor 1** and make it fullscreen (`Ctrl + Cmd + F`).
   * **Shot Clock Overlay:** Open [http://localhost:3000/shotclock-display](http://localhost:3000/shotclock-display). Drag this window to **Monitor 2** and make it fullscreen (`Ctrl + Cmd + F`).

### Step 3: Configure OBS Studio (For streaming to YouTube/Twitch)
1. Launch **OBS Studio** on your MacBook screen.
2. Add a new **Browser Source** in OBS:
   * Set the URL to your local scoreboard overlay or bug (e.g., [http://localhost:3000/nbaoverlay](http://localhost:3000/nbaoverlay) for the ESPN-style score bug).
   * Set the width to `1920` and height to `1080` (or matching your stream canvas).
3. Connect your video capture device (HDMI camera capture card) to your Docking Station.
4. Position your camera source underneath the scoreboard overlay, and click **Start Streaming** in OBS!

### Step 4: Share and Control from the Tablet
1. On the MacBook launcher dashboard, scroll to **Internet Sharing (ngrok)**, enter your authtoken/custom domain, and click **Start Tunnel**.
2. Grab your **Galaxy Tab S4** (or iPad) and open the browser.
3. Enter your ngrok link:
   * **`https://[your-static-domain].ngrok-free.dev/?user=default`**
4. You can now walk around the court and update the scores, start/stop the period clock, and manage the shot clock instantly from the tablet!
