#!/usr/bin/env python3
"""
HoopCulture Scoreboard Launcher — macOS
Starts the Node.js server and opens the web-based launcher dashboard.
No Tkinter dependency — the GUI is a web page served by the server itself.
"""
import os
import sys
import subprocess
import time
import webbrowser
import signal
import urllib.request

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Ensure Homebrew paths are visible
    env = os.environ.copy()
    for p in ["/opt/homebrew/bin", "/usr/local/bin"]:
        if p not in env.get("PATH", ""):
            env["PATH"] = p + ":" + env.get("PATH", "")

    # Set default OBS Studio WebSocket connection details
    if "OBS_PORT" not in env:
        env["OBS_PORT"] = "4455"
    if "OBS_PASSWORD" not in env:
        env["OBS_PASSWORD"] = "veCk9KOvB5MTV0aI"

    # Check for node
    try:
        subprocess.run(["node", "--version"], capture_output=True, check=True, env=env)
    except (FileNotFoundError, subprocess.CalledProcessError):
        print("ERROR: Node.js not found. Install from https://nodejs.org")
        sys.exit(1)

    # Check for server.js
    if not os.path.exists("server.js"):
        print(f"ERROR: server.js not found in {script_dir}")
        sys.exit(1)

    # Start the Node.js server
    print("Starting Node.js server...")
    proc = subprocess.Popen(
        ["node", "server.js"],
        stdout=sys.stdout,
        stderr=sys.stderr,
        env=env
    )

    # Wait for the server to be ready (up to 8 seconds)
    url = "http://localhost:3000/api/ip"
    ready = False
    for i in range(16):
        time.sleep(0.5)
        if proc.poll() is not None:
            print("ERROR: Server process exited unexpectedly.")
            sys.exit(1)
        try:
            urllib.request.urlopen(url, timeout=1)
            ready = True
            break
        except Exception:
            pass

    if ready:
        print("Server is running. Opening launcher dashboard...")
        webbrowser.open("http://localhost:3000/launcher")
    else:
        print("WARNING: Server may not be ready yet. Opening anyway...")
        webbrowser.open("http://localhost:3000/launcher")

    # Keep running until the server process ends or user presses Ctrl+C
    def handle_signal(sig, frame):
        print("\nShutting down server...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        proc.wait()
    except KeyboardInterrupt:
        handle_signal(None, None)

if __name__ == "__main__":
    main()
