#!/usr/bin/env python3
"""
HoopCulture Scoreboard Launcher — macOS Native GUI
Uses ttk themed widgets for proper dark-mode rendering on macOS Tcl/Tk 8.5+
"""
import os
import sys
import socket
import subprocess
import threading
import webbrowser
import datetime
import tkinter as tk
from tkinter import ttk, scrolledtext


class ScoreboardLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hoop Scoreboard Launcher")
        self.root.geometry("1080x720")
        self.root.minsize(900, 600)

        self.server_process = None
        self.running = False
        self.discovered_ip = None
        self.discovery_done = False

        self._configure_styles()
        self.setup_ui()
        self.root.after(200, self.trigger_refresh_ips)
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        self.root.after(400, self._startup_log)

    # ── Theme & Styles ──

    def _configure_styles(self):
        style = ttk.Style()
        # Use 'clam' theme — it respects our custom colors on all platforms
        style.theme_use("clam")

        BG       = "#1a1a2e"
        SIDEBAR  = "#16213e"
        CARD     = "#0f3460"
        ACCENT   = "#e94560"
        TEXT     = "#eaeaea"
        MUTED    = "#a0a0b0"
        GREEN    = "#00d87d"
        BORDER   = "#2a2a4a"

        self._colors = {
            "bg": BG, "sidebar": SIDEBAR, "card": CARD,
            "accent": ACCENT, "text": TEXT, "muted": MUTED,
            "green": GREEN, "border": BORDER,
        }

        # Root and Frame backgrounds
        self.root.configure(bg=BG)
        style.configure(".", background=BG, foreground=TEXT, font=("Helvetica", 10))

        # Frames
        style.configure("Sidebar.TFrame", background=SIDEBAR)
        style.configure("Card.TFrame", background=CARD)
        style.configure("BG.TFrame", background=BG)
        style.configure("Accent.TFrame", background=ACCENT)
        style.configure("Border.TFrame", background=BORDER)

        # Labels
        style.configure("Title.TLabel", background=SIDEBAR, foreground=TEXT,
                         font=("Helvetica", 17, "bold"))
        style.configure("Subtitle.TLabel", background=SIDEBAR, foreground=MUTED,
                         font=("Helvetica", 10))
        style.configure("Sidebar.TLabel", background=SIDEBAR, foreground=TEXT,
                         font=("Helvetica", 10))
        style.configure("SidebarMuted.TLabel", background=SIDEBAR, foreground=MUTED,
                         font=("Helvetica", 9))
        style.configure("Accent.TLabel", background=SIDEBAR, foreground=ACCENT,
                         font=("Helvetica", 9, "bold"))
        style.configure("AccentBG.TLabel", background=BG, foreground=ACCENT,
                         font=("Helvetica", 10, "bold"))
        style.configure("StatusOff.TLabel", background=SIDEBAR, foreground="#ef4444",
                         font=("Helvetica", 10, "bold"))
        style.configure("StatusOn.TLabel", background=SIDEBAR, foreground=GREEN,
                         font=("Helvetica", 10, "bold"))
        style.configure("IP.TLabel", background=CARD, foreground=TEXT,
                         font=("Courier", 10))
        style.configure("IPTitle.TLabel", background=CARD, foreground=ACCENT,
                         font=("Helvetica", 9, "bold"))
        style.configure("BG.TLabel", background=BG, foreground=TEXT,
                         font=("Helvetica", 10))

        # LabelFrame
        style.configure("Card.TLabelframe", background=CARD, foreground=ACCENT,
                         bordercolor=BORDER)
        style.configure("Card.TLabelframe.Label", background=CARD, foreground=ACCENT,
                         font=("Helvetica", 9, "bold"))

        # Buttons
        style.configure("Launch.TButton", background=CARD, foreground=TEXT,
                         font=("Helvetica", 9, "bold"), bordercolor=BORDER, padding=8)
        style.map("Launch.TButton",
                   background=[("active", "#1a5276")],
                   foreground=[("active", "#ffffff")])

        style.configure("Start.TButton", background=GREEN, foreground="#000000",
                         font=("Helvetica", 12, "bold"), padding=12)
        style.map("Start.TButton",
                   background=[("active", "#00b368")])

        style.configure("Stop.TButton", background="#ef4444", foreground="#ffffff",
                         font=("Helvetica", 12, "bold"), padding=12)
        style.map("Stop.TButton",
                   background=[("active", "#dc2626")])

        style.configure("Outline.TButton", background=SIDEBAR, foreground=MUTED,
                         font=("Helvetica", 9), bordercolor=BORDER, padding=4)
        style.map("Outline.TButton",
                   background=[("active", CARD)],
                   foreground=[("active", TEXT)])

        # Separator
        style.configure("Accent.TSeparator", background=ACCENT)

    def setup_ui(self):
        C = self._colors

        # ═══════ HEADER ═══════
        header = ttk.Frame(self.root, style="Sidebar.TFrame", height=75)
        header.pack(fill="x", side="top")
        header.pack_propagate(False)

        title_box = ttk.Frame(header, style="Sidebar.TFrame")
        title_box.pack(side="left", padx=16, pady=10)

        ttk.Label(title_box, text="🏀 HOOP SCOREBOARD",
                  style="Title.TLabel").pack(anchor="w")
        ttk.Label(title_box, text="Local Server  •  Network Control  •  Quick Launch",
                  style="Subtitle.TLabel").pack(anchor="w")

        status_box = ttk.Frame(header, style="Sidebar.TFrame")
        status_box.pack(side="right", padx=16)
        self.status_lbl = ttk.Label(status_box, text="● SERVER STOPPED",
                                     style="StatusOff.TLabel")
        self.status_lbl.pack(pady=25)

        # Accent bar
        ttk.Frame(self.root, style="Accent.TFrame", height=3).pack(fill="x")

        # ═══════ MAIN SPLIT ═══════
        main_pw = tk.PanedWindow(self.root, orient=tk.HORIZONTAL, sashwidth=3,
                                  bg=C["border"], bd=0)
        main_pw.pack(fill="both", expand=True)

        # ── LEFT PANEL ──
        left = ttk.Frame(main_pw, style="Sidebar.TFrame")
        main_pw.add(left, minsize=350, width=420)

        left_inner = ttk.Frame(left, style="Sidebar.TFrame")
        left_inner.pack(fill="both", expand=True, padx=14, pady=10)

        # Start/Stop Button
        self.btn_toggle = ttk.Button(left_inner, text="▶  Start Server",
                                      style="Start.TButton", command=self.toggle_server)
        self.btn_toggle.pack(fill="x", pady=(0, 10))

        # Network Addresses Card
        ip_card = ttk.LabelFrame(left_inner, text="  NETWORK ADDRESSES  ",
                                  style="Card.TLabelframe", padding=10)
        ip_card.pack(fill="x", pady=(0, 8))

        self.lbl_local_ip = ttk.Label(ip_card, text="Local:     http://localhost:3000",
                                       style="IP.TLabel")
        self.lbl_local_ip.pack(fill="x", pady=2)

        self.lbl_net_ip = ttk.Label(ip_card, text="Network:   discovering...",
                                     style="IP.TLabel")
        self.lbl_net_ip.pack(fill="x", pady=2)

        ttk.Button(ip_card, text="↻ Refresh Network Addresses",
                    style="Outline.TButton",
                    command=self.trigger_refresh_ips).pack(fill="x", pady=(6, 0))

        # Quick Launch Section
        ttk.Label(left_inner, text="QUICK LAUNCH",
                  style="Accent.TLabel").pack(anchor="w", pady=(8, 4))

        grid = ttk.Frame(left_inner, style="Sidebar.TFrame")
        grid.pack(fill="both", expand=True)

        # Buttons match the server.js routes exactly
        buttons = [
            ("Control Board",       "control"),
            ("Venue Display",       "display"),
            ("Venue Display 2",     "display2"),
            ("OBS Fullscreen",      "fullscreen"),
            ("NBC NBA Overlay",     "nbc"),
            ("NBA Scorebug",        "nbaoverlay"),
            ("NBA Scorebug 2",      "nbaoverlay2"),
            ("Shot Clock Display",  "shotclock-display"),
            ("Shot Clock Control",  "shotclock"),
            ("Camera Stream",       "camera"),
        ]

        for i, (name, path) in enumerate(buttons):
            row = i // 2
            col = i % 2
            btn = ttk.Button(grid, text=name, style="Launch.TButton",
                              command=lambda p=path: self.open_browser(p))
            btn.grid(row=row, column=col, sticky="nsew", padx=2, pady=2)
            grid.grid_columnconfigure(col, weight=1)
            grid.grid_rowconfigure(row, weight=1)

        # ── RIGHT PANEL (LOG) ──
        right = ttk.Frame(main_pw, style="BG.TFrame")
        main_pw.add(right, minsize=300)

        right_inner = ttk.Frame(right, style="BG.TFrame")
        right_inner.pack(fill="both", expand=True, padx=10, pady=10)

        ttk.Label(right_inner, text="SERVER LOG",
                  style="AccentBG.TLabel").pack(anchor="w", pady=(0, 4))

        ttk.Frame(right_inner, style="Border.TFrame", height=1).pack(fill="x", pady=(0, 6))

        self.log_area = scrolledtext.ScrolledText(
            right_inner, font=("Courier", 10),
            bg="#0d1117", fg="#6ee7b7",
            insertbackground="#6ee7b7",
            bd=0, relief="flat", wrap="word",
            highlightthickness=1, highlightbackground=C["border"]
        )
        self.log_area.pack(fill="both", expand=True)
        self.log_area.configure(state="disabled")

    # ── Startup Log ──

    def _startup_log(self):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        self.log_write("Launcher ready.")
        self.log_write(f"Repo:        {script_dir}")
        self.log_write(f"Server file: server.js")
        self.log_write(f"Local URL:   http://localhost:3000")
        self.log_write("-" * 48)
        self.log_write("Click 'Start Server' to launch the scoreboard.")

    # ── Server Control ──

    def toggle_server(self):
        if self.running:
            self.stop_server()
        else:
            self.start_server()

    def start_server(self):
        self.log_write("")
        self.log_write(">>> Starting Node.js server...")

        if not os.path.exists("server.js"):
            self.log_write("ERROR: server.js not found in directory!")
            return

        try:
            env = os.environ.copy()
            # Ensure Homebrew paths are visible to child processes
            for p in ["/opt/homebrew/bin", "/usr/local/bin"]:
                if p not in env.get("PATH", ""):
                    env["PATH"] = p + ":" + env.get("PATH", "")

            self.server_process = subprocess.Popen(
                ["node", "server.js"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                env=env
            )
            self.running = True
            self.btn_toggle.configure(text="■  Stop Server", style="Stop.TButton")
            self.status_lbl.configure(text="● SERVER RUNNING", style="StatusOn.TLabel")
            threading.Thread(target=self._read_output, daemon=True).start()
        except FileNotFoundError:
            self.log_write("ERROR: 'node' not found. Install Node.js from nodejs.org")
        except Exception as e:
            self.log_write(f"ERROR: {e}")

    def stop_server(self):
        if self.server_process:
            self.log_write(">>> Stopping server...")
            try:
                self.server_process.terminate()
                self.server_process.wait(timeout=3)
            except Exception:
                self.server_process.kill()
            self.server_process = None
        self.running = False
        self.btn_toggle.configure(text="▶  Start Server", style="Start.TButton")
        self.status_lbl.configure(text="● SERVER STOPPED", style="StatusOff.TLabel")
        self.log_write("Server stopped.")

    def _read_output(self):
        proc = self.server_process
        while self.running and proc and proc.poll() is None:
            line = proc.stdout.readline()
            if line:
                self.log_write(line.rstrip())
        # Process ended unexpectedly
        if self.running:
            self.root.after(0, self.stop_server)

    # ── Logging ──

    def log_write(self, message):
        self.root.after(0, self._append, message)

    def _append(self, message):
        ts = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_area.configure(state="normal")
        self.log_area.insert("end", f"[{ts}]  {message}\n")
        self.log_area.see("end")
        self.log_area.configure(state="disabled")

    # ── Network Discovery ──

    def trigger_refresh_ips(self):
        self.lbl_net_ip.configure(text="Network:   discovering...")
        self.discovered_ip = None
        self.discovery_done = False
        threading.Thread(target=self._discover, daemon=True).start()
        self.root.after(150, self._poll_discovery)

    def _discover(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.5)
            s.connect(("8.8.8.8", 80))
            self.discovered_ip = s.getsockname()[0]
            s.close()
        except Exception:
            self.discovered_ip = None
        self.discovery_done = True

    def _poll_discovery(self):
        if self.discovery_done:
            if self.discovered_ip:
                self.lbl_net_ip.configure(
                    text=f"Network:   http://{self.discovered_ip}:3000")
            else:
                self.lbl_net_ip.configure(text="Network:   (no network)")
        else:
            self.root.after(150, self._poll_discovery)

    # ── Utilities ──

    def open_browser(self, path):
        webbrowser.open(f"http://localhost:3000/{path}")

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
