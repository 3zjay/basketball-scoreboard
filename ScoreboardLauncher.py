#!/usr/bin/env python3
import os
import sys
import socket
import subprocess
import threading
import webbrowser
import tkinter as tk
from tkinter import scrolledtext, messagebox

# ── Colors ──
COLOR_BG = "#0a0a0e"          # Obsidian Black
COLOR_SIDEBAR = "#121218"     # Slate Gray
COLOR_CARD = "#1a1a24"        # Lighter Card Slate
COLOR_BORDER = "#262634"      # Thin Border
COLOR_TEXT_MUTED = "#9ca3af"  # Muted Gray
COLOR_TEXT_LIGHT = "#f3f4f6"  # Primary Light Text
COLOR_ACCENT = "#ff8c00"      # Brand Orange Accent

COLOR_EMERALD = "#10b981"
COLOR_RED = "#ef4444"
COLOR_BLUE = "#3b82f6"

class ScoreboardLauncherApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hoop Scoreboard Launcher")
        self.root.geometry("1080x780")
        self.root.minsize(800, 600)
        self.root.configure(bg=COLOR_BG)

        self.server_process = None
        self.running = False

        self.setup_ui()
        self.refresh_ips()

        # Handle window closing cleanly
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)

    def setup_ui(self):
        # ── HEADER ──
        header = tk.Frame(self.root, bg=COLOR_SIDEBAR, height=82)
        header.pack(fill="x", side="top")
        header.pack_propagate(False)

        # Title Label
        title_lbl = tk.Label(header, text="HOOP SCOREBOARD", font=("Helvetica", 18, "bold"), fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR)
        title_lbl.pack(side="left", padx=20, pady=15)

        # Subtitle Status
        self.status_lbl = tk.Label(header, text="OFFLINE", font=("Helvetica", 10, "bold"), fg=COLOR_RED, bg=COLOR_SIDEBAR)
        self.status_lbl.pack(side="right", padx=20, pady=20)

        # Accent Line
        accent_bar = tk.Frame(header, bg=COLOR_ACCENT, height=3)
        accent_bar.pack(fill="x", side="bottom")

        # Main Workspace Splitter
        main_frame = tk.Frame(self.root, bg=COLOR_BG)
        main_frame.pack(fill="both", expand=True)

        # ── LEFT PANEL (Controls) ──
        left_panel = tk.Frame(main_frame, bg=COLOR_SIDEBAR, width=420)
        left_panel.pack(fill="y", side="left")
        left_panel.pack_propagate(False)

        # Divider line between left & right pane
        divider = tk.Frame(left_panel, bg=COLOR_BORDER, width=1)
        divider.pack(fill="y", side="right")

        # Content container inside left panel
        content_frame = tk.Frame(left_panel, bg=COLOR_SIDEBAR, padx=15, pady=15)
        content_frame.pack(fill="both", expand=True)

        # Toggle Button
        self.btn_toggle = tk.Button(content_frame, text="Start Server", font=("Helvetica", 12, "bold"),
                                    bg=COLOR_EMERALD, fg="white", activebackground="#059669", activeforeground="white",
                                    bd=0, cursor="hand2", height=2, command=self.toggle_server)
        self.btn_toggle.pack(fill="x", pady=(0, 15))

        # Network Info Card
        self.ip_box = tk.LabelFrame(content_frame, text=" NETWORK ADDRESSES ", font=("Helvetica", 9, "bold"),
                                    fg=COLOR_ACCENT, bg=COLOR_SIDEBAR, bd=1, relief="solid", highlightthickness=0)
        self.ip_box.configure(labelanchor="nw")
        self.ip_box.pack(fill="x", pady=(0, 10), ipady=8)

        self.lbl_local_ip = tk.Label(self.ip_box, text="Local Host: http://localhost:3000", font=("Courier", 10),
                                     fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_local_ip.pack(fill="x", padx=10, pady=2)

        self.lbl_net_ip = tk.Label(self.ip_box, text="Local Network: discovering...", font=("Courier", 10),
                                   fg=COLOR_TEXT_LIGHT, bg=COLOR_SIDEBAR, anchor="w")
        self.lbl_net_ip.pack(fill="x", padx=10, pady=2)

        # Refresh Addresses Button
        self.btn_refresh_ip = tk.Button(content_frame, text="Refresh Network Addresses", font=("Helvetica", 9, "bold"),
                                        bg=COLOR_CARD, fg=COLOR_TEXT_MUTED, activebackground=COLOR_BORDER, activeforeground=COLOR_TEXT_LIGHT,
                                        bd=1, relief="solid", cursor="hand2", command=self.refresh_ips)
        self.btn_refresh_ip.pack(fill="x", pady=(0, 20))

        # Quick Launch Section Header
        ql_lbl = tk.Label(content_frame, text="QUICK LAUNCH", font=("Helvetica", 9, "bold"), fg=COLOR_ACCENT, bg=COLOR_SIDEBAR, anchor="w")
        ql_lbl.pack(fill="x", pady=(0, 8))

        # Page Buttons Grid (2 per row)
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
            btn = tk.Button(grid_frame, text=label, font=("Helvetica", 9, "bold"),
                            bg=COLOR_CARD, fg="#c8c8d2", activebackground="#232330", activeforeground="white",
                            bd=1, relief="solid", cursor="hand2", padx=5, pady=8,
                            command=lambda p=path: self.open_browser(p))
            btn.grid(row=row, column=col, sticky="nsew", padx=3, pady=3)
            grid_frame.grid_columnconfigure(col, weight=1)

        # ── RIGHT PANEL (Console Log) ──
        right_panel = tk.Frame(main_frame, bg=COLOR_BG, padx=15, pady=15)
        right_panel.pack(fill="both", expand=True, side="right")

        log_lbl = tk.Label(right_panel, text="CONSOLE OUTPUT LOG", font=("Helvetica", 9, "bold"), fg=COLOR_ACCENT, bg=COLOR_BG, anchor="w")
        log_lbl.pack(fill="x", pady=(0, 8))

        # Scrollable console text area
        self.log_area = scrolledtext.ScrolledText(right_panel, font=("Courier", 10), bg=COLOR_BG, fg="#6ee7b7",
                                                  insertbackground="white", bd=0, highlightthickness=0)
        self.log_area.pack(fill="both", expand=True)
        self.log_area.insert("end", "=== Console ready. Click 'Start Server' to boot the backend. ===\n")
        self.log_area.configure(state="disabled")

    def toggle_server(self):
        if self.running:
            self.stop_server()
        else:
            self.start_server()

    def start_server(self):
        self.log_write("\n>>> Booting Scoreboard local Node.js server...\n")
        
        # Verify server.js exists in current dir
        if not os.path.exists("server.js"):
            self.log_write("❌ Error: server.js file not found in directory.\n")
            messagebox.showerror("Error", "server.js was not found in the current directory.")
            return

        try:
            # Spawn Node server process
            self.server_process = subprocess.Popen(
                ["node", "server.js"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            self.running = True
            self.btn_toggle.configure(text="Stop Server", bg=COLOR_RED)
            self.status_lbl.configure(text="ONLINE (HTTP: 3000)", fg=COLOR_EMERALD)

            # Start background thread to capture server output logs
            threading.Thread(target=self.read_server_output, daemon=True).start()
        except Exception as e:
            self.log_write(f"❌ Failed to run 'node server.js': {str(e)}\n")
            messagebox.showerror("Error", f"Could not start Node.js server.\nDetail: {str(e)}")

    def stop_server(self):
        if self.server_process:
            self.log_write("\n>>> Stopping Scoreboard local server...\n")
            self.server_process.terminate()
            self.server_process = None
        self.running = False
        self.btn_toggle.configure(text="Start Server", bg=COLOR_EMERALD)
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
        # Thread-safe log append to text area
        self.root.after(0, self._append_to_log, message)

    def _append_to_log(self, message):
        self.log_area.configure(state="normal")
        self.log_area.insert("end", message)
        self.log_area.see("end")
        self.log_area.configure(state="disabled")

    def refresh_ips(self):
        # Discover local adapter IP address
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            self.lbl_net_ip.configure(text=f"Local Network: http://{ip}:3000")
        except Exception:
            self.lbl_net_ip.configure(text="Local Network: No Network/Offline")

    def open_browser(self, path):
        url = f"http://localhost:3000/{path}"
        if path == "":
            url = "http://localhost:3000"
        
        # Verify server is actually running first
        if not self.running:
            if not messagebox.askyesno("Warning", "Server is not running. Would you like to open the page anyway?"):
                return
        
        webbrowser.open(url)

    def on_close(self):
        if self.running:
            self.stop_server()
        self.root.destroy()

if __name__ == "__main__":
    # Ensure current directory matches the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    root = tk.Tk()
    app = ScoreboardLauncherApp(root)
    root.mainloop()
