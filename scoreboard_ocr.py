#!/usr/bin/env python3
"""
🏀 Hoop Culture Custom Scoreboard OCR
A lightweight, interactive Python script using OpenCV and PyTesseract to capture camera feeds,
extract scoreboard values (clock, scores, period), and sync them with your Hoop Culture Scoreboard.

Requirements:
    pip install opencv-python pytesseract requests

Ensure you have Tesseract OCR installed on your system:
    - Windows: Install from https://github.com/UB-Mannheim/tesseract/wiki
    - Mac: brew install tesseract
"""

import os
import cv2
import json
import time
import requests
import pytesseract

# Config file path
CONFIG_FILE = "ocr_config.json"

# Default configuration template
config = {
    "server_url": "http://localhost:3000/api/ocr?user=default",
    "camera_source": 0,  # 0 for webcam, or "rtsp://..." for virtual phone cameras
    "tesseract_path": "", # e.g. "C:\\Program Files\\Tesseract-OCR\\tesseract.exe" on Windows
    "boxes": {
        "clock": None,
        "homeScore": None,
        "awayScore": None,
        "period": None
    }
}

# Mouse callback state
drawing = False
ix, iy = -1, -1
current_box = None

def load_config():
    global config
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
            print(f" Loaded configuration from {CONFIG_FILE}")
        except Exception as e:
            print(f"⚠️ Error loading config: {e}. Using defaults.")
    else:
        save_config()

def save_config():
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=4)
    print(f"💾 Saved configuration to {CONFIG_FILE}")

def draw_rect(event, x, y, flags, param):
    global ix, iy, drawing, current_box, config
    if event == cv2.EVENT_LBUTTONDOWN:
        drawing = True
        ix, iy = x, y
    elif event == cv2.EVENT_MOUSEMOVE:
        if drawing:
            current_box = [ix, iy, x, y]
    elif event == cv2.EVENT_LBUTTONUP:
        drawing = False
        current_box = [ix, iy, x, y]

def preprocess_image(crop):
    """Binarize crop for accurate OCR."""
    if crop is None or crop.size == 0:
        return None
    # Resize up to make text readable
    crop = cv2.resize(crop, (0, 0), fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    # Apply Otsu's thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    return thresh

def perform_ocr(img, whitelist=""):
    """Run Tesseract OCR on preprocessed image crop."""
    if img is None:
        return ""
    cfg = "--psm 7"
    if whitelist:
        cfg += f" -c tessedit_char_whitelist={whitelist}"
    try:
        text = pytesseract.image_to_string(img, config=cfg)
        return text.strip()
    except Exception as e:
        print(f"⚠️ OCR Error: {e}")
        return ""

def configure_mode():
    global current_box
    print("\n" + "="*50)
    print("🎨 HOOP CULTURE OCR CONFIGURATION MODE")
    print("="*50)
    print("Press:")
    print("  'c' -> Draw CLOCK crop box")
    print("  'h' -> Draw HOME SCORE crop box")
    print("  'a' -> Draw AWAY SCORE crop box")
    print("  'p' -> Draw PERIOD crop box")
    print("  's' -> Save & Start Sync")
    print("  'q' -> Quit configuration")
    print("-"*50)

    # Configure Tesseract path if set
    if config.get("tesseract_path"):
        pytesseract.pytesseract.tesseract_cmd = config["tesseract_path"]

    cap = cv2.VideoCapture(config["camera_source"])
    if not cap.isOpened():
        print("⚠️ Could not open camera source.")
        return False

    cv2.namedWindow("Hoop Culture Setup")
    cv2.setMouseCallback("Hoop Culture Setup", draw_rect)

    selected_key = None

    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Failed to grab frame.")
            break

        # Draw existing boxes
        display_frame = frame.copy()
        for name, box in config["boxes"].items():
            if box:
                cv2.rectangle(display_frame, (box[0], box[1]), (box[2], box[3]), (0, 165, 255), 2)
                cv2.putText(display_frame, name, (box[0], box[1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)

        # Draw active box being dragged
        if current_box:
            cv2.rectangle(display_frame, (current_box[0], current_box[1]), (current_box[2], current_box[3]), (0, 255, 0), 2)

        # Overlay current selection helper
        if selected_key:
            cv2.putText(display_frame, f"SELECTING: {selected_key.upper()} (Drag rectangle, then press key again to assign)", (10, 25), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        cv2.imshow("Hoop Culture Setup", display_frame)

        key = cv2.waitKey(30) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('c'):
            if selected_key == 'clock' and current_box:
                config["boxes"]["clock"] = current_box
                current_box = None
                selected_key = None
                print("✓ Clock box set.")
            else:
                selected_key = 'clock'
        elif key == ord('h'):
            if selected_key == 'homeScore' and current_box:
                config["boxes"]["homeScore"] = current_box
                current_box = None
                selected_key = None
                print("✓ Home Score box set.")
            else:
                selected_key = 'homeScore'
        elif key == ord('a'):
            if selected_key == 'awayScore' and current_box:
                config["boxes"]["awayScore"] = current_box
                current_box = None
                selected_key = None
                print("✓ Away Score box set.")
            else:
                selected_key = 'awayScore'
        elif key == ord('p'):
            if selected_key == 'period' and current_box:
                config["boxes"]["period"] = current_box
                current_box = None
                selected_key = None
                print("✓ Period box set.")
            else:
                selected_key = 'period'
        elif key == ord('s'):
            save_config()
            break

    cap.release()
    cv2.destroyAllWindows()
    return True

def sync_mode():
    print("\n" + "="*50)
    print("⚡ HOOP CULTURE OCR SYNC MODE ACTIVE")
    print("="*50)
    print("Syncing live camera feed to:")
    print(f"URL: {config['server_url']}")
    print("Press 'q' in the window to stop syncing.")
    print("-"*50)

    if config.get("tesseract_path"):
        pytesseract.pytesseract.tesseract_cmd = config["tesseract_path"]

    cap = cv2.VideoCapture(config["camera_source"])
    if not cap.isOpened():
        print("⚠️ Could not open camera source.")
        return

    # Check that at least one box is configured
    if not any(config["boxes"].values()):
        print("⚠️ No crop boxes configured! Please run setup first.")
        cap.release()
        return

    cv2.namedWindow("Hoop Culture Sync Active")
    
    last_send_time = 0
    send_interval = 0.5  # Send update every 500ms

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        payload = {}
        display_frame = frame.copy()

        # Process each configured box
        for name, box in config["boxes"].items():
            if not box:
                continue

            # Ensure box coords inside frame bounds
            h, w, _ = frame.shape
            x1, y1 = max(0, min(box[0], box[2])), max(0, min(box[1], box[3]))
            x2, y2 = min(w, max(box[0], box[2])), min(h, max(box[1], box[3]))

            # Crop and process
            crop = frame[y1:y2, x1:x2]
            processed = preprocess_image(crop)
            
            # Run OCR
            whitelist = "0123456789:" if name == "clock" else "0123456789"
            txt_val = perform_ocr(processed, whitelist)

            if txt_val:
                payload[name] = txt_val

            # Draw visual highlight on display
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(display_frame, f"{name}: {txt_val}", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)

        # Transmit updates
        now = time.time()
        if payload and (now - last_send_time > send_interval):
            try:
                res = requests.post(config["server_url"], json=payload, timeout=1.5)
                last_send_time = now
                print(f"📡 Sent OCR Sync: {payload} -> Response: {res.status_code}")
            except Exception as e:
                print(f"⚠️ Connection error: {e}")

        cv2.imshow("Hoop Culture Sync Active", display_frame)
        if cv2.waitKey(30) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    load_config()
    
    # Run setup if no boxes configured yet
    if not any(config["boxes"].values()):
        success = configure_mode()
        if success:
            sync_mode()
    else:
        # Prompt user if they want to reconfigure
        print("Existing OCR config found.")
        choice = input("Start Syncing? (y = Start Sync, c = Run Setup Mode): ").strip().lower()
        if choice == 'c':
            if configure_mode():
                sync_mode()
        else:
            sync_mode()
