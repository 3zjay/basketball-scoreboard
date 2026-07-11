#!/usr/bin/env python3
import os
import sys
import socket
import subprocess
import threading
import webbrowser
import tkinter as tk

# ── Brand Colors ──
COLOR_BG = "#0a0a0e"          # Obsidian Black
COLOR_SIDEBAR = "#121218"     # Slate Gray
COLOR_CARD = "#1a1a24"        # Lighter Card Slate
COLOR_BORDER = "#262634"      # Thin Border/Divider
COLOR_TEXT_MUTED = "#9ca3af"  # Muted Gray
COLOR_TEXT_LIGHT = "#f3f4f6"  # Primary Light Text
COLOR_ACCENT = "#ff8c00"      # Brand Orange Accent

COLOR_EMERALD = "#10b981"
COLOR_RED = "#ef4444"
COLOR_BLUE = "#3b82f6"

class FlatButton(tk.Label):
    """Custom macOS-friendly flat button using Tkinter Label to bypass standard button coloring limits."""
    def __init__(self, parent, text, bg, fg, hover_bg, font, command, height=2, border_color=None, border_width=1, width=None):
        self.normal_bg = bg
        self.hover_bg = hover_bg
        self.command = command
        self.enabled = True
        
        super().__init__(
            parent, text=text, bg=bg, fg=fg, font=font, cursor="hand2",
            height=height, width=width, relief="flat", 
            highlightthickness=border_width if border_color else 0,
            highlightbackground=border_color or bg
        )
        self.bind("<Button-1>", self.on_click)
        self.bind("<Enter>", self.on_enter)
        self.bind("<Leave>", self.on_leave)

    def on_click(self, event):
        if self.enabled and self.command:
            self.command()

    def on_enter(self, event):
        if self.enabled:
            self.configure(bg=self.hover_bg)

    def on_leave(self, event):
        if self.enabled:
            self.configure(bg=self.normal_bg)
        
    def configure_colors(self, bg, hover_bg, fg=None):
        self.normal_bg = bg
        self.hover_bg = hover_bg
        self.configure(bg=bg)
        if fg:
            self.configure(fg=fg)

class ScoreboardLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hoop Scoreboard Launcher")
        self.root.geometry("1080x780")
        self.root.minsize(900, 650)
        self.root.configure(bg=COLOR_BG)

        self.server_process = None
        self.running = False

        self.setup_ui()
        self.root.after(100, self.trigger_refresh_ips)
        
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def setup_ui(self):
        # ── HEADER ──
        header = tk.Frame(self.root, bg=COLOR_SIDEBAR, height=82)
        header.pack(fill="x", side="top")
        header.pack_propagate(False)

        # Load Logo Icon
        self.logo_photo = None
        try:
            if os.path.exists("icon-192.gif"):
                full_img = tk.PhotoImage(file="icon-192.gif")
                self.logo_photo = full_img.subsample(3, 3)
            elif os.path.exists("icon-192.png"):
                full_img = tk.PhotoImage(file="icon-192.png")
                self.logo_photo = full_img.subsample(3, 3)
        except Exception as e:
            pass

        if self.logo_photo:
            logo_lbl = tk.Label(header, image=self.logo_photo, bg=COLOR_SIDEBAR)
            logo_lbl.pack(side="left", padx=(15, 5), pady=8)

        # Title Text Layout
        title_frame = tk.Frame(header, bg=COLOR_SIDEBAR)
        title_frame.pack(side="left", padx=10, pady=12, fill="y")
        
        main_title = tk.Label(title_frame, text="HOOP SCOREBOARD", font=("Helvetica", 18, "bold"), fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR)
        main_title.pack(anchor="w")
        
        sub_title = tk.Label(title_frame, text="macOS Local Controller Dashboard", font=("Helvetica", 10), fg=COLOR_TEXT_MUTED, bg=COLOR_SIDEBAR)
        sub_title.pack(anchor="w")

        # Right-side status panel inside Header
        status_frame = tk.Frame(header, bg=COLOR_SIDEBAR)
        status_frame.pack(side="right", padx=20, fill="y")
        
        self.status_indicator = tk.Frame(status_frame, bg=COLOR_RED, width=12, height=12)
        self.status_indicator.pack(side="left", padx=(0, 8), pady=35)
        
        self.status_lbl = tk.Label(status_frame, text="OFFLINE", font=("Helvetica", 11, "bold"), fg=COLOR_RED, bg=COLOR_SIDEBAR)
        self.status_lbl.pack(side="left", pady=30)

        # Header bottom orange accent line
        accent_bar = tk.Frame(header, bg=COLOR_ACCENT, height=3)
        accent_bar.pack(fill="x", side="bottom")

        # Split Workspace Frame
        main_frame = tk.Frame(self.root, bg=COLOR_BG)
        main_frame.pack(fill="both", expand=True)

        # ── LEFT PANEL (Controls Sidebar) ──
        left_panel = tk.Frame(main_frame, bg=COLOR_SIDEBAR, width=460)
        left_panel.pack(fill="y", side="left")
        left_panel.pack_propagate(False)

        # Right border separating sidebar and logs
        divider = tk.Frame(left_panel, bg=COLOR_BORDER, width=1)
        divider.pack(fill="y", side="right")

        # Sidebar Inner Padding Area
        content_frame = tk.Frame(left_panel, bg=COLOR_SIDEBAR, padx=20, pady=20)
        content_frame.pack(fill="both", expand=True)

        # Toggle Button (Flat style)
        self.btn_toggle = FlatButton(
            content_frame, text="Start Server", bg=COLOR_EMERALD, fg="white", hover_bg="#059669",
            font=("Helvetica", 12, "bold"), command=self.toggle_server, height=2
        )
        self.btn_toggle.pack(fill="x", pady=(0, 15))

        # Network Info Card (Custom Border & Background)
        ip_card = tk.Frame(content_frame, bg=COLOR_SIDEBAR, highlightthickness=1, highlightbackground=COLOR_BORDER)
        ip_card.pack(fill="x", pady=(0, 10))

        ip_title = tk.Label(ip_card, text="NETWORK ADDRESSES", font=("Helvetica", 8, "bold"), fg=COLOR_ACCENT, bg=COLOR_SIDEBAR)
        ip_title.pack(anchor="w", padx=15, pady=(12, 4))

        self.lbl_local_ip = tk.Label(ip_card, text="Local Host: http://localhost:3000", font=("Courier", 10),
                                     fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_local_ip.pack(fill="x", padx=15, pady=2)

        self.lbl_net_ip = tk.Label(ip_card, text="Local Network: discovering...", font=("Courier", 10),
                                   fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_net_ip.pack(fill="x", padx=15, pady=(2, 12))

        # Refresh Addresses Button
        self.btn_refresh_ip = FlatButton(
            content_frame, text="Refresh Network Addresses", bg=COLOR_CARD, fg=COLOR_TEXT_MUTED, hover_bg=COLOR_BORDER,
            font=("Helvetica", 9, "bold"), command=self.trigger_refresh_ips, height=1, border_color=COLOR_BORDER
        )
        self.btn_refresh_ip.pack(fill="x", pady=(0, 20))

        # Quick Launch Header
        ql_lbl = tk.Label(content_frame, text="QUICK LAUNCH", font=("Helvetica", 8, "bold"), fg=COLOR_ACCENT, bg=COLOR_SIDEBAR, anchor="w")
        ql_lbl.pack(fill="x", pady=(0, 8))

        # Page Button Grid Setup
        grid_frame = tk.Frame(content_frame, bg=COLOR_SIDEBAR)
        grid_frame.pack(fill="both", expand=True)

        pages = [
            ("Control Board", ""),
            ("Venue Display", "display"),
            ("Venue Display 2", "display2"),
            ("Shot Clock Display", "shotclock-display"),
            ("Shot Clock Ctrl", "shotclock"),
            ("OBS Fullscreen", "fullscreen"),
            ("NBA Scorebug", "nbaoverlay"),
            ("NBA Scorebug 2", "nbaoverlay2"),
            ("NBA - NBC Overlay", "nbc"),
        ]

        for i, (label, path) in enumerate(pages):
            row = i // 2
            col = i % 2
            btn = FlatButton(
                grid_frame, text=label, bg=COLOR_CARD, fg="#c8c8d2", hover_bg="#232330",
                font=("Helvetica", 9, "bold"), command=lambda p=path: self.open_browser(p),
                height=2, border_color=COLOR_BORDER
            )
            btn.grid(row=row, column=col, sticky="nsew", padx=3, pady=3)
            grid_frame.grid_columnconfigure(col, weight=1)

        # ── RIGHT PANEL (Console Output logs) ──
        right_panel = tk.Frame(main_frame, bg=COLOR_BG, padx=20, pady=20)
        right_panel.pack(fill="both", expand=True, side="right")

        log_lbl = tk.Label(right_panel, text="CONSOLE OUTPUT LOG", font=("Helvetica", 8, "bold"), fg=COLOR_ACCENT, bg=COLOR_BG, anchor="w")
        log_lbl.pack(fill="x", pady=(0, 8))

        # Scrolled Text Box Container Frame (for flat borders)
        text_container = tk.Frame(right_panel, bg=COLOR_BG, highlightthickness=1, highlightbackground=COLOR_BORDER)
        text_container.pack(fill="both", expand=True)

        # Text area
        self.log_area = tk.Text(text_container, font=("Courier", 11), bg="#050508", fg="#6ee7b7",
                                insertbackground="white", bd=0, highlightthickness=0, selectbackground="#232330")
        self.log_area.pack(fill="both", expand=True, side="left")

        # Scrollbar linked directly to text area
        scrollbar = tk.Scrollbar(text_container, command=self.log_area.yview, bg=COLOR_BG, troughcolor="#050508", bd=0)
        scrollbar.pack(fill="y", side="right")
        self.log_area.configure(yscrollcommand=scrollbar.set)

        self.log_write("=== Console ready. Click 'Start Server' to boot the backend. ===\n")
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
            self.btn_toggle.configure_colors(bg=COLOR_RED, hover_bg="#d32f2f")
            self.btn_toggle.configure(text="Stop Server")
            
            # Update Header indicator to Online Green State
            self.status_indicator.configure(bg=COLOR_EMERALD)
            self.status_lbl.configure(text="ONLINE (PORT: 3000)", fg=COLOR_EMERALD)

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
        self.btn_toggle.configure_colors(bg=COLOR_EMERALD, hover_bg="#059669")
        self.btn_toggle.configure(text="Start Server")
        
        # Reset Header status to Offline Red State
        self.status_indicator.configure(bg=COLOR_RED)
        self.status_lbl.configure(text="OFFLINE", fg=COLOR_RED)
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
