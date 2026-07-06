# 🏀 Hoop Culture AI Scoreboard Sync Guide

Welcome to the **AI Scoreboard Sync** feature guide. This document explains how to set up a camera (smartphone or webcam) to automatically read a physical gymnasium scoreboard using OCR (Optical Character Recognition) and sync the values in real time with your Hoop Culture digital overlays and displays.

---

## 📷 Supported Camera Feeds

You do not need specialized CCTV or security cameras. The system is designed to consume simple, easily accessible feeds:

1. **Smartphone Camera (Recommended for Cloud):** 
   - Position your iPhone or Android phone on a tripod facing the gym scoreboard.
   - Use a free app to stream the video over Wi-Fi/LTE (e.g. *Larix Broadcaster* or *IP Webcam*) or turn it into a wireless webcam (e.g. *Iriun Webcam* or *DroidCam*).
2. **USB Webcam / Camcorder:**
   - Plug any standard webcam or professional camcorder (via an HDMI-to-USB capture card) directly into the venue laptop.

---

## 💻 Step-by-Step Setup Guide

We recommend using the free, open-source computer vision software **ScoreSight** to process the camera feed and extract the scoreboard digits.

### Step 1: Install & Set Up ScoreSight
1. Download ScoreSight for Windows, Mac, or Linux from the [ScoreSight GitHub Releases](https://github.com/royshil/scoresight).
2. Open ScoreSight and select your camera source (USB Webcam, Virtual Phone Webcam, or RTSP stream URL).
3. Draw crop boxes around the physical scoreboard's digits and name them exactly:
   - `clock` (the game clock digits)
   - `homeScore` (home team score)
   - `awayScore` (away/guest team score)
   - `period` (the period or quarter digit)
   - `shotClock` (optional, if shot clock is visible in feed)

### Step 2: Configure the API/Webhook Output
Navigate to the **API** tab in the bottom-left corner of ScoreSight and check **"Send out API requests to external services"**:

* **Encoding Format:** Select `JSON (Full)`
* **HTTP Method:** Select `POST`
* **URL:** Choose the URL matching your deployment:
  - **Offline Local Mode:** `http://localhost:3000/api/ocr?user=your_session`
  - **Vercel + Firebase Mode:** Use the Firebase REST URL: `https://hoop-culture-scoreboard-default-rtdb.firebaseio.com/ocr/your_session.json` *(using HTTP method `PUT`)*
  - **OnRender Cloud Mode:** `https://your-scoreboard-app.onrender.com/api/ocr?user=your_session`

### Step 3: Enable the Sync on the Scoreboard Control Panel
1. Open the **Scoreboard Control Panel** page.
2. In the header menu next to the clock controls, toggle **AI Sync** to **ON**.
3. The scoreboard will instantly connect to the camera feed. The digits on the operator's control panel will update dynamically to match the gym's physical scoreboard.

---

## ⚡ Sync Latency & Redundancy

* **Offline Local Mode:** Under **0.25 seconds** (virtually instantaneous).
* **Cloud Modes (Firebase / Render):** Under **0.7 seconds** over standard mobile internet.
* **Manual Override Redundancy:** If the camera feed gets blocked or misreads a digit, the operator can flip the **AI Sync** toggle **OFF** at any time to instantly resume manual scoreboard control.

---

## 🛠️ Troubleshooting & Tips

* **Warping/Perspective Correction:** If the camera is at an angle, use ScoreSight's perspective tool to drag the corners of the crop box to align flat with the scoreboard.
* **Binarization:** Use ScoreSight's binarize slider to make the digits look solid white against a solid black background. If the background is too bright, increase the threshold.
* **Digit Flickering:** Enable smoothing/filtering inside ScoreSight or configure the validation buffer to discard impossible readings (e.g. scores going down).
