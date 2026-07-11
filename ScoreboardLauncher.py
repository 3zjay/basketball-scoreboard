#!/usr/bin/env python3
import os
import sys
import socket
import subprocess
import threading
import webbrowser
import tkinter as tk

# ── Clean System Colors for macOS Aqua ──
COLOR_BG = "#1e1e24"          # Deep Slate/Gray
COLOR_SIDEBAR = "#121216"     # Darker Charcoal
COLOR_ACCENT = "#ff8c00"      # Orange Accent
COLOR_TEXT = "#ffffff"        # White Text
COLOR_MUTED = "#aaaaaa"       # Light Gray Text
COLOR_GREEN = "#10b981"       # Emerald Status
COLOR_RED = "#ef4444"         # Red Status

class ScoreboardLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hoop Scoreboard Launcher")
        self.root.geometry("1000x700")
        self.root.minsize(800, 550)
        self.root.configure(bg=COLOR_BG)

        self.server_process = None
        self.running = False
        self.discovered_ip = None
        self.discovery_done = False

        self.setup_ui()
        self.root.after(100, self.trigger_refresh_ips)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def setup_ui(self):
        # ── HEADER ──
        header = tk.Frame(self.root, bg=COLOR_SIDEBAR, height=80)
        header.pack(fill="x", side="top")
        header.pack_propagate(False)

        # Title Text Layout
        title_frame = tk.Frame(header, bg=COLOR_SIDEBAR)
        title_frame.pack(side="left", padx=20, pady=10, fill="y")
        
        main_title = tk.Label(title_frame, text="🏀 HOOP SCOREBOARD", font=("Helvetica", 18, "bold"), fg=COLOR_ACCENT, bg=COLOR_SIDEBAR)
        main_title.pack(anchor="w")
        
        sub_title = tk.Label(title_frame, text="macOS Local Controller Dashboard", font=("Helvetica", 10), fg=COLOR_MUTED, bg=COLOR_SIDEBAR)
        sub_title.pack(anchor="w")

        # Status indicator
        status_frame = tk.Frame(header, bg=COLOR_SIDEBAR)
        status_frame.pack(side="right", padx=20, fill="y")
        
        self.status_lbl = tk.Label(status_frame, text="● OFFLINE", font=("Helvetica", 12, "bold"), fg=COLOR_RED, bg=COLOR_SIDEBAR)
        self.status_lbl.pack(side="right", pady=25)

        # Accent Line
        accent = tk.Frame(self.root, bg=COLOR_ACCENT, height=2)
        accent.pack(fill="x")

        # ── MAIN SPLIT CONTAINER ──
        main_container = tk.Frame(self.root, bg=COLOR_BG)
        main_container.pack(fill="both", expand=True)

        # Left Column (Controls)
        left_panel = tk.Frame(main_container, bg=COLOR_SIDEBAR, width=380, padx=15, pady=15)
        left_panel.pack(fill="y", side="left")
        left_panel.pack_propagate(False)

        # Right Column (Logs)
        right_panel = tk.Frame(main_container, bg=COLOR_BG, padx=15, pady=15)
        right_panel.pack(fill="both", expand=True, side="right")

        # ── LEFT COLUMN CONTENTS ──
        self.btn_toggle = tk.Button(left_panel, text="Start Server", font=("Helvetica", 12, "bold"), 
                                    fg="green", highlightbackground=COLOR_SIDEBAR, command=self.toggle_server, height=2)
        self.btn_toggle.pack(fill="x", pady=(0, 15))

        # IP Card Frame
        ip_card = tk.LabelFrame(left_panel, text=" Network Addresses ", font=("Helvetica", 9, "bold"), 
                                fg=COLOR_ACCENT, bg=COLOR_SIDEBAR, bd=1, labelanchor="nw", padx=10, pady=10)
        ip_card.pack(fill="x", pady=(0, 15))

        self.lbl_local_ip = tk.Label(ip_card, text="Local Host: http://localhost:3000", font=("Courier", 10),
                                     fg=COLOR_TEXT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_local_ip.pack(fill="x", pady=2)

        self.lbl_net_ip = tk.Label(ip_card, text="Local Network: discovering...", font=("Courier", 10),
                                   fg=COLOR_TEXT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_net_ip.pack(fill="x", pady=2)

        btn_refresh = tk.Button(ip_card, text="Refresh IPs", font=("Helvetica", 9), command=self.trigger_refresh_ips)
        btn_refresh.pack(pady=(8, 0))

        # Dashboard grid label
        grid_lbl = tk.Label(left_panel, text="DASHBOARD LINKS", font=("Helvetica", 9, "bold"), fg=COLOR_MUTED, bg=COLOR_SIDEBAR, anchor="w")
        grid_lbl.pack(fill="x", pady=(10, 5))

        grid_frame = tk.Frame(left_panel, bg=COLOR_SIDEBAR)
        grid_frame.pack(fill="both", expand=True)

        buttons = [
            ("Scoreboard Control", "basketball-scoreboard.html"),
            ("Fullscreen Overlay", "basketball-fullscreen.html"),
            ("NBC NBA Scoreboard", "basketball-nba-nbc.html"),
            ("ESPN NBA Style", "basketball-nbaoverlay.html"),
            ("Alternative NBA", "basketball-nbaoverlay2.html"),
            ("Shotclock Screen", "shotclock-display.html"),
            ("Shotclock Remote", "shotclock-control.html"),
            ("Camera Stream", "camera.html")
        ]

        for i, (name, path) in enumerate(buttons):
            row = i // 2
            col = i % 2
            # Use standard Native macOS Buttons for 100% crash-free rendering
            btn = tk.Button(grid_frame, text=name, font=("Helvetica", 9), highlightbackground=COLOR_SIDEBAR,
                            command=lambda p=path: self.open_browser(p))
            btn.grid(row=row, column=col, sticky="nsew", padx=2, pady=2)
            grid_frame.grid_columnconfigure(col, weight=1)
            grid_frame.grid_rowconfigure(row, weight=1)

        # ── RIGHT COLUMN CONTENTS ──
        log_title = tk.Label(right_panel, text="CONSOLE OUTPUT LOG", font=("Helvetica", 9, "bold"), fg=COLOR_ACCENT, bg=COLOR_BG, anchor="w")
        log_title.pack(fill="x", pady=(0, 5))

        # Scrolled Text Box Container
        text_container = tk.Frame(right_panel, bg="black", bd=1, relief="sunken")
        text_container.pack(fill="both", expand=True)

        # Text area
        self.log_area = tk.Text(text_container, font=("Courier", 10), bg="black", fg="#00ff00",
                                insertbackground="white", bd=0, highlightthickness=0)
        self.log_area.pack(fill="both", expand=True, side="left")

        # Scrollbar linked directly to text area
        scrollbar = tk.Scrollbar(text_container, command=self.log_area.yview)
        scrollbar.pack(fill="y", side="right")
        self.log_area.configure(yscrollcommand=scrollbar.set)

        self.log_write("=== Console ready. Click 'Start Server' to boot Node.js backend. ===\n")
        self.log_area.configure(state="disabled")

    def toggle_server(self):
        if self.running:
            self.stop_server()
        else:
            self.start_server()

    def start_server(self):
        self.log_write("\n>>> Booting Scoreboard local Node.js server...\n")
        
        if not os.path.exists("server.js"):
            self.log_write("❌ Error: server.js file not found in directory.\n")
            return

        try:
            self.server_process = subprocess.Popen(
                ["node", "server.js"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            self.running = True
            
            # Update Button to Red STOP State
            self.btn_toggle.configure(text="Stop Server", fg="red")
            
            # Update Header indicator to Online Green State
            self.status_lbl.configure(text="● ONLINE (PORT: 3000)", fg=COLOR_GREEN)

            threading.Thread(target=self.read_server_output, daemon=True).start()
        except Exception as e:
            self.log_write(f"❌ Failed to run 'node server.js': {str(e)}\n")

    def stop_server(self):
        if self.server_process:
            self.log_write("\n>>> Stopping Scoreboard local server...\n")
            self.server_process.terminate()
            self.server_process = None
        self.running = False
        
        # Reset Button to Green START State
        self.btn_toggle.configure(text="Start Server", fg="green")
        
        # Reset Header status to Offline Red State
        self.status_lbl.configure(text="● OFFLINE", fg=COLOR_RED)
        self.log_write("🔴 Server process stopped.\n")

    def read_server_output(self):
        while self.running and self.server_process:
            line = self.server_process.stdout.readline()
            if not line:
                break
            self.log_write(line)
        self.stop_server()

    def log_write(self, message):
        self.root.after(0, self._append_to_log, message)

    def _append_to_log(self, message):
        self.log_area.configure(state="normal")
        self.log_area.insert("end", message)
        self.log_area.see("end")
        self.log_area.configure(state="disabled")

    def trigger_refresh_ips(self):
        self.lbl_net_ip.configure(text="Local Network: discovering...")
        self.discovered_ip = None
        self.discovery_done = False
        threading.Thread(target=self._run_ip_discovery, daemon=True).start()
        self.root.after(100, self._check_discovery_result)

    def _run_ip_discovery(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.5)
            s.connect(("8.8.8.8", 80))
            self.discovered_ip = s.getsockname()[0]
            s.close()
        except Exception:
            self.discovered_ip = "offline"
        self.discovery_done = True

    def _check_discovery_result(self):
        if self.discovery_done:
            if self.discovered_ip and self.discovered_ip != "offline":
                self.lbl_net_ip.configure(text=f"Local Network: http://{self.discovered_ip}:3000")
            else:
                self.lbl_net_ip.configure(text="Local Network: No Network/Offline")
        else:
            self.root.after(100, self._check_discovery_result)

    def open_browser(self, path):
        url = f"http://localhost:3000/{path}"
        if path == "":
            url = "http://localhost:3000"
        webbrowser.open(url)

    def on_close(self):
        if self.running:
            self.stop_server()
        self.root.destroy()

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    root = tk.Tk()
    app = ScoreboardLauncherApp(root)
    root.mainloop()
