Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing


# ── Logo ──────────────────────────────────────────────────────────────────────
$script:logoB64 = "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"
$script:logoImage = $null
try {
    $bytes = [Convert]::FromBase64String($script:logoB64)
    $ms    = New-Object System.IO.MemoryStream
    $ms.Write($bytes, 0, $bytes.Length)
    $ms.Seek(0, [System.IO.SeekOrigin]::Begin) | Out-Null
    $script:logoImage = [System.Drawing.Image]::FromStream($ms)
} catch {}

# ── Config ────────────────────────────────────────────────────────────────────
$REPO_PATH   = $PSScriptRoot
$SERVER_FILE = "server.js"
$PORT        = 3000

# ── Modern Color Palette ──────────────────────────────────────────────────────
$COLOR_BG          = [System.Drawing.Color]::FromArgb(10, 10, 14)      # Obsidian Black
$COLOR_SIDEBAR     = [System.Drawing.Color]::FromArgb(18, 18, 24)      # Slate Gray
$COLOR_CARD        = [System.Drawing.Color]::FromArgb(26, 26, 36)      # Lighter Card Slate
$COLOR_BORDER      = [System.Drawing.Color]::FromArgb(38, 38, 52)      # Thin Divider/Border
$COLOR_TEXT_MUTED  = [System.Drawing.Color]::FromArgb(156, 163, 175)  # Muted Gray
$COLOR_TEXT_LIGHT  = [System.Drawing.Color]::FromArgb(243, 244, 246)  # Primary Light Text
$COLOR_ACCENT      = [System.Drawing.Color]::FromArgb(255, 140, 0)     # Brand Orange Accent

$COLOR_EMERALD     = [System.Drawing.Color]::FromArgb(16, 185, 129)    # Emerald 500
$COLOR_EMERALD_HOV = [System.Drawing.Color]::FromArgb(5, 150, 105)     # Emerald 600
$COLOR_RED         = [System.Drawing.Color]::FromArgb(239, 68, 68)     # Red 500
$COLOR_RED_HOV     = [System.Drawing.Color]::FromArgb(220, 38, 38)     # Red 600
$COLOR_BLUE        = [System.Drawing.Color]::FromArgb(59, 130, 246)    # Blue 500
$COLOR_BLUE_HOV    = [System.Drawing.Color]::FromArgb(37, 99, 235)     # Blue 600
$COLOR_AMBER       = [System.Drawing.Color]::FromArgb(245, 158, 11)    # Amber 500
$COLOR_AMBER_HOV   = [System.Drawing.Color]::FromArgb(217, 119, 6)     # Amber 600

# ── State ─────────────────────────────────────────────────────────────────────
$script:nodeProcess = $null
$script:running     = $false
$script:hotspotOn   = $false

# Thread-safe queue for node output — avoids cross-thread deadlock on form.Invoke()
$script:logQueue = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()

# ── WinRT Hotspot Setup ───────────────────────────────────────────────────────
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]
$null = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]
$script:asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object {
        $_.Name -eq "AsTask" -and $_.GetParameters().Count -eq 1 -and
        $_.GetParameters()[0].ParameterType.Name -eq "IAsyncOperation``1"
    })[0]

function Invoke-WinRTAsync($task, $type) {
    $t = $script:asTaskGeneric.MakeGenericMethod($type)
    $n = $t.Invoke($null, @($task))
    
    $timeoutMs = 5000
    $elapsedMs = 0
    $intervalMs = 50
    
    while (-not $n.IsCompleted -and $elapsedMs -lt $timeoutMs) {
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds $intervalMs
        $elapsedMs += $intervalMs
    }
    
    if (-not $n.IsCompleted) {
        throw "WinRT operation timed out"
    }
    
    return $n.Result
}

function Get-TetheringManager {
    $profiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
    foreach ($p in $profiles) {
        try { $m = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($p); if ($m) { return $m } } catch {}
    }
    try {
        $i = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
        if ($i) { return [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($i) }
    } catch {}
    return $null
}

function Enable-Hotspot {
    Append-Log "Enabling Mobile Hotspot..."
    try {
        $mgr = Get-TetheringManager
        if (-not $mgr) { throw "No tethering manager" }
        $rt = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult]
        Invoke-WinRTAsync ($mgr.StartTetheringAsync()) $rt | Out-Null
        $script:hotspotOn = $true
        Update-HotspotBtn
        Start-Sleep -Milliseconds 1500
        Refresh-IPs
        Append-Log "Hotspot enabled. Tablets can now connect."
    } catch {
        Append-Log "Auto-enable failed. Opening Windows Settings..."
        Start-Process "ms-settings:network-mobilehotspot"
        Append-Log "Toggle hotspot ON then click Refresh IPs."
    }
}

function Disable-Hotspot {
    Append-Log "Disabling Mobile Hotspot..."
    try {
        $mgr = Get-TetheringManager
        if (-not $mgr) { throw "No tethering manager" }
        $rt = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult]
        Invoke-WinRTAsync ($mgr.StopTetheringAsync()) $rt | Out-Null
        $script:hotspotOn = $false
        Update-HotspotBtn
        Refresh-IPs
        Append-Log "Hotspot disabled."
    } catch {
        Start-Process "ms-settings:network-mobilehotspot"
    }
}

function Update-HotspotBtn {
    if ($script:hotspotOn) {
        $btnHotspot.Text      = "Turn Off Hotspot"
        $script:hotspotNormal = $COLOR_AMBER
        $script:hotspotHover  = $COLOR_AMBER_HOV
    } else {
        $btnHotspot.Text      = "Enable Hotspot"
        $script:hotspotNormal = $COLOR_BLUE
        $script:hotspotHover  = $COLOR_BLUE_HOV
    }
    $btnHotspot.BackColor = $script:hotspotNormal
}

# ── Network Helpers ───────────────────────────────────────────────────────────
function Get-LocalIP {
    $a = Get-NetIPAddress -AddressFamily IPv4 |
         Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.PrefixOrigin -ne 'WellKnown' } |
         Sort-Object InterfaceAlias
    if ($a) { return $a[0].IPAddress } else { return "127.0.0.1" }
}

function Get-HotspotIP {
    $h = Get-NetIPAddress -AddressFamily IPv4 |
         Where-Object { $_.InterfaceAlias -match 'Local Area Connection\*|Microsoft Wi-Fi Direct' }
    if ($h) { return $h[0].IPAddress } else { return $null }
}

function Refresh-IPs {
    $ip   = Get-LocalIP
    $hsIP = Get-HotspotIP
    $lblLocalIP.Text = "Local       http://localhost:$PORT"
    $lblNetIP.Text   = "Network   http://${ip}:$PORT"
    if ($hsIP) {
        $lblHotspot.Text      = "Hotspot    http://${hsIP}:$PORT"
        $lblHotspot.ForeColor = [System.Drawing.Color]::FromArgb(255, 180, 0)
    } else {
        $lblHotspot.Text      = "Hotspot    (not active)"
        $lblHotspot.ForeColor = [System.Drawing.Color]::FromArgb(100, 100, 120)
    }
}

function Append-Log($msg) {
    $ts = (Get-Date).ToString("HH:mm:ss")
    # RichTextBox ignores ForeColor for appended text — must set SelectionColor explicitly
    $logBox.SelectionStart  = $logBox.TextLength
    $logBox.SelectionLength = 0
    $logBox.SelectionColor  = $logBox.ForeColor
    $logBox.AppendText("[$ts]  $msg`r`n")
    $logBox.ScrollToCaret()
    $logBox.Update()
}

# ── Server Control ────────────────────────────────────────────────────────────
function Start-Server {
    if ($script:running) { return }
    if (-not (Test-Path "$REPO_PATH\$SERVER_FILE")) {
        Append-Log "ERROR: $REPO_PATH\$SERVER_FILE not found!"
        return
    }
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Append-Log "ERROR: Node.js not found. Install from nodejs.org"
        return
    }
    Append-Log "Starting server..."
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName               = "node"
    $psi.Arguments              = $SERVER_FILE
    $psi.WorkingDirectory       = $REPO_PATH
    $psi.UseShellExecute        = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.CreateNoWindow         = $true
    $script:nodeProcess = New-Object System.Diagnostics.Process
    $script:nodeProcess.StartInfo = $psi
    # Enqueue output into a thread-safe queue — never call form.Invoke() from a background thread
    # (synchronous cross-thread Invoke causes deadlocks when node floods stdout on startup)
    $handler = { if ($Event.SourceEventArgs.Data) { $script:logQueue.Enqueue($Event.SourceEventArgs.Data) } }
    Register-ObjectEvent -InputObject $script:nodeProcess -EventName OutputDataReceived -Action $handler | Out-Null
    Register-ObjectEvent -InputObject $script:nodeProcess -EventName ErrorDataReceived  -Action $handler | Out-Null
    $script:nodeProcess.Start() | Out-Null
    $script:nodeProcess.BeginOutputReadLine()
    $script:nodeProcess.BeginErrorReadLine()
    $script:running = $true
    Update-UI
    Refresh-IPs
}

function Stop-Server {
    if (-not $script:running) { return }
    Append-Log "Stopping server..."
    try { if (-not $script:nodeProcess.HasExited) { $script:nodeProcess.Kill(); $script:nodeProcess.WaitForExit(3000) } } catch {}
    $script:nodeProcess = $null
    $script:running     = $false
    Update-UI
    Append-Log "Server stopped."
}

function Update-UI {
    if ($script:running) {
        $btnToggle.Text        = "Stop Server"
        $script:toggleNormal   = $COLOR_RED
        $script:toggleHover    = $COLOR_RED_HOV
        $statusDot.BackColor   = $COLOR_EMERALD
        $statusLabel.Text      = "SERVER RUNNING"
        $statusLabel.ForeColor = $COLOR_EMERALD
    } else {
        $btnToggle.Text        = "Start Server"
        $script:toggleNormal   = $COLOR_EMERALD
        $script:toggleHover    = $COLOR_EMERALD_HOV
        $statusDot.BackColor   = $COLOR_TEXT_MUTED
        $statusLabel.Text      = "SERVER STOPPED"
        $statusLabel.ForeColor = $COLOR_TEXT_MUTED
    }
    $btnToggle.BackColor = $script:toggleNormal
}

function Open-Page($path) { Start-Process "http://localhost:$PORT/$path" }




# ══════════════════════════════════════════════════════════════════════════════
# FORM
# ══════════════════════════════════════════════════════════════════════════════
$form                 = New-Object System.Windows.Forms.Form
$form.Text            = "Hoop Scoreboard Launcher"
$form.Size            = New-Object System.Drawing.Size(1080, 780)
$form.MinimumSize     = New-Object System.Drawing.Size(800, 600)
$form.StartPosition   = "CenterScreen"
$form.BackColor       = $COLOR_BG
$form.ForeColor       = $COLOR_TEXT_LIGHT
$form.FormBorderStyle = "Sizable"
$form.MaximizeBox     = $true
$form.Font            = New-Object System.Drawing.Font("Segoe UI", 9)

# ── HEADER ────────────────────────────────────────────────────────────────────
$header           = New-Object System.Windows.Forms.Panel
$header.Dock      = "Top"
$header.Height    = 82
$header.BackColor = $COLOR_SIDEBAR

$accentBar           = New-Object System.Windows.Forms.Panel
$accentBar.Dock      = "Bottom"
$accentBar.Height    = 3
$accentBar.BackColor = $COLOR_ACCENT
$header.Controls.Add($accentBar)

$logoPic           = New-Object System.Windows.Forms.PictureBox
$logoPic.Size      = New-Object System.Drawing.Size(64, 64)
$logoPic.Location  = New-Object System.Drawing.Point(12, 8)
$logoPic.SizeMode  = "Zoom"
$logoPic.BackColor = $COLOR_SIDEBAR
if ($script:logoImage) { $logoPic.Image = $script:logoImage }
$header.Controls.Add($logoPic)

$titleLabel           = New-Object System.Windows.Forms.Label
$titleLabel.Text      = "HOOP SCOREBOARD"
$titleLabel.Font      = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
$titleLabel.ForeColor = $COLOR_TEXT_LIGHT
$titleLabel.Location  = New-Object System.Drawing.Point(86, 10)
$titleLabel.AutoSize  = $true
$header.Controls.Add($titleLabel)

$subLabel           = New-Object System.Windows.Forms.Label
$subLabel.Text      = "Local Server  |  Hotspot Control  |  Quick Launch"
$subLabel.Font      = New-Object System.Drawing.Font("Segoe UI", 9)
$subLabel.ForeColor = $COLOR_TEXT_MUTED
$subLabel.Location  = New-Object System.Drawing.Point(88, 50)
$subLabel.AutoSize  = $true
$header.Controls.Add($subLabel)

$statusContainer = New-Object System.Windows.Forms.Panel
$statusContainer.Width = 160
$statusContainer.Dock = "Right"
$statusContainer.BackColor = [System.Drawing.Color]::Transparent

$statusBadge = New-Object System.Windows.Forms.Panel
$statusBadge.Size = New-Object System.Drawing.Size(135, 26)
$statusBadge.Location = New-Object System.Drawing.Point(12, 28)
$statusBadge.BackColor = $COLOR_CARD
$statusBadge.add_Paint({
    $pen = New-Object System.Drawing.Pen($COLOR_BORDER, 1)
    $this.CreateGraphics().DrawRectangle($pen, 0, 0, $this.Width - 1, $this.Height - 1)
    $pen.Dispose()
})

$statusDot = New-Object System.Windows.Forms.Panel
$statusDot.Size = New-Object System.Drawing.Size(8, 8)
$statusDot.Location = New-Object System.Drawing.Point(12, 9)
$statusDot.BackColor = [System.Drawing.Color]::FromArgb(120, 120, 140)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "SERVER STOPPED"
$statusLabel.Font = New-Object System.Drawing.Font("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(120, 120, 140)
$statusLabel.Location = New-Object System.Drawing.Point(26, 6)
$statusLabel.AutoSize = $true
$statusLabel.BackColor = [System.Drawing.Color]::Transparent

$statusBadge.Controls.Add($statusDot)
$statusBadge.Controls.Add($statusLabel)
$statusContainer.Controls.Add($statusBadge)
$header.Controls.Add($statusContainer)

# ── RIGHT LOG PANEL ──────────────────────────────────────────────────────────
$right           = New-Object System.Windows.Forms.Panel
$right.Dock      = "Fill"
$right.BackColor = $COLOR_BG
$right.Padding   = New-Object System.Windows.Forms.Padding(0)

# TableLayoutPanel gives guaranteed pixel-exact row heights
$rightTable                 = New-Object System.Windows.Forms.TableLayoutPanel
$rightTable.Dock            = "Fill"
$rightTable.ColumnCount     = 1
$rightTable.RowCount        = 2
$rightTable.BackColor       = $COLOR_BG
$rightTable.CellBorderStyle = "None"
$rightTable.Padding         = New-Object System.Windows.Forms.Padding(0)
$rightTable.Margin          = New-Object System.Windows.Forms.Padding(0)
$rightTable.ColumnStyles.Add((New-Object System.Windows.Forms.ColumnStyle([System.Windows.Forms.SizeType]::Percent, 100))) | Out-Null
$rightTable.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Absolute, 32)))        | Out-Null
$rightTable.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Percent, 100)))        | Out-Null

# Row 0 — SERVER LOG header bar
$logHeader           = New-Object System.Windows.Forms.Panel
$logHeader.Dock      = "Fill"
$logHeader.BackColor = $COLOR_SIDEBAR
$logHeader.Margin    = New-Object System.Windows.Forms.Padding(0)

$logAccent           = New-Object System.Windows.Forms.Panel
$logAccent.Dock      = "Bottom"
$logAccent.Height    = 1
$logAccent.BackColor = $COLOR_BORDER
$logHeader.Controls.Add($logAccent)

$logTitle            = New-Object System.Windows.Forms.Label
$logTitle.Text       = "SERVER LOG"
$logTitle.Font       = New-Object System.Drawing.Font("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
$logTitle.ForeColor  = $COLOR_ACCENT
$logTitle.AutoSize   = $false
$logTitle.Dock       = "Fill"
$logTitle.TextAlign  = "MiddleLeft"
$logTitle.Padding    = New-Object System.Windows.Forms.Padding(12, 0, 0, 0)
$logHeader.Controls.Add($logTitle)

$rightTable.Controls.Add($logHeader, 0, 0)

# Row 1 — log body container
$logContainer           = New-Object System.Windows.Forms.Panel
$logContainer.Dock      = "Fill"
$logContainer.BackColor = $COLOR_BG
$logContainer.Padding   = New-Object System.Windows.Forms.Padding(12)
$logContainer.Margin    = New-Object System.Windows.Forms.Padding(0)

$logBox             = New-Object System.Windows.Forms.RichTextBox
$logBox.Dock        = "Fill"
$logBox.BackColor   = $COLOR_BG
$logBox.ForeColor   = [System.Drawing.Color]::FromArgb(110, 231, 183) # soft green
$logBox.Font        = New-Object System.Drawing.Font("Consolas", 9.5)
$logBox.ReadOnly    = $true
$logBox.BorderStyle = "None"
$logBox.ScrollBars  = "Vertical"
$logBox.Margin      = New-Object System.Windows.Forms.Padding(0)

$logContainer.Controls.Add($logBox)
$rightTable.Controls.Add($logContainer, 0, 1)

$right.Controls.Add($rightTable)

# ── LEFT PANEL (Dock=Left, fixed width) ───────────────────────────────────────
$LEFT_W = 460

$left               = New-Object System.Windows.Forms.Panel
$left.Width         = $LEFT_W
$left.Dock          = "Left"
$left.BackColor     = $COLOR_SIDEBAR
$left.AutoScroll    = $true

$divider            = New-Object System.Windows.Forms.Panel
$divider.Width      = 1
$divider.Dock       = "Right"
$divider.BackColor  = $COLOR_BORDER
$left.Controls.Add($divider)

# ── LEFT CONTROLS — absolute Y positions ──────────────────────────────────────
$PAD  = 12   # left/right padding inside left panel
$CTW  = $LEFT_W - ($PAD * 2) - 4  # control width
$y    = 10

# START SERVER
$btnToggle           = New-Object System.Windows.Forms.Button
$btnToggle.Text      = "Start Server"
$btnToggle.Size      = New-Object System.Drawing.Size($CTW, 52)
$btnToggle.Location  = New-Object System.Drawing.Point($PAD, $y)
$btnToggle.BackColor = $COLOR_EMERALD
$btnToggle.ForeColor = [System.Drawing.Color]::White
$btnToggle.FlatStyle = "Flat"
$btnToggle.Font      = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
$btnToggle.FlatAppearance.BorderSize = 0
$btnToggle.Cursor    = [System.Windows.Forms.Cursors]::Hand
$btnToggle.Add_Click({ if ($script:running) { Stop-Server } else { Start-Server } })
$btnToggle.Add_MouseEnter({ $this.BackColor = $script:toggleHover })
$btnToggle.Add_MouseLeave({ $this.BackColor = $script:toggleNormal })
$left.Controls.Add($btnToggle)
$y += 58

# ENABLE HOTSPOT
$btnHotspot           = New-Object System.Windows.Forms.Button
$btnHotspot.Text      = "Enable Hotspot"
$btnHotspot.Size      = New-Object System.Drawing.Size($CTW, 40)
$btnHotspot.Location  = New-Object System.Drawing.Point($PAD, $y)
$btnHotspot.BackColor = $COLOR_BLUE
$btnHotspot.ForeColor = [System.Drawing.Color]::White
$btnHotspot.FlatStyle = "Flat"
$btnHotspot.Font      = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$btnHotspot.FlatAppearance.BorderSize = 0
$btnHotspot.Cursor    = [System.Windows.Forms.Cursors]::Hand
$btnHotspot.Add_Click({ if ($script:hotspotOn) { Disable-Hotspot } else { Enable-Hotspot } })
$btnHotspot.Add_MouseEnter({ $this.BackColor = $script:hotspotHover })
$btnHotspot.Add_MouseLeave({ $this.BackColor = $script:hotspotNormal })
$left.Controls.Add($btnHotspot)
$y += 46

# NETWORK ADDRESSES
$ipBox           = New-Object System.Windows.Forms.Panel
$ipBox.Size      = New-Object System.Drawing.Size($CTW, 100)
$ipBox.Location  = New-Object System.Drawing.Point($PAD, $y)
$ipBox.BackColor = $COLOR_CARD
$ipBox.add_Paint({
    $pen = New-Object System.Drawing.Pen($COLOR_BORDER, 1)
    $this.CreateGraphics().DrawRectangle($pen, 0, 0, $this.Width - 1, $this.Height - 1)
    $pen.Dispose()
})

$ipTitle           = New-Object System.Windows.Forms.Label
$ipTitle.Text      = "NETWORK ADDRESSES"
$ipTitle.Font      = New-Object System.Drawing.Font("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
$ipTitle.ForeColor = $COLOR_ACCENT
$ipTitle.Location  = New-Object System.Drawing.Point(14, 10)
$ipTitle.AutoSize  = $true
$ipBox.Controls.Add($ipTitle)

$lblLocalIP           = New-Object System.Windows.Forms.Label
$lblLocalIP.Font      = New-Object System.Drawing.Font("Consolas", 9)
$lblLocalIP.ForeColor = [System.Drawing.Color]::FromArgb(190, 190, 210)
$lblLocalIP.Location  = New-Object System.Drawing.Point(14, 30)
$lblLocalIP.Size      = New-Object System.Drawing.Size(420, 18)
$ipBox.Controls.Add($lblLocalIP)

$lblNetIP           = New-Object System.Windows.Forms.Label
$lblNetIP.Font      = New-Object System.Drawing.Font("Consolas", 9)
$lblNetIP.ForeColor = [System.Drawing.Color]::FromArgb(190, 190, 210)
$lblNetIP.Location  = New-Object System.Drawing.Point(14, 52)
$lblNetIP.Size      = New-Object System.Drawing.Size(420, 18)
$ipBox.Controls.Add($lblNetIP)

$lblHotspot           = New-Object System.Windows.Forms.Label
$lblHotspot.Font      = New-Object System.Drawing.Font("Consolas", 9)
$lblHotspot.ForeColor = $COLOR_TEXT_MUTED
$lblHotspot.Location  = New-Object System.Drawing.Point(14, 74)
$lblHotspot.Size      = New-Object System.Drawing.Size(420, 18)
$ipBox.Controls.Add($lblHotspot)

$left.Controls.Add($ipBox)
$y += 106

# REFRESH IPs
$btnRefresh           = New-Object System.Windows.Forms.Button
$btnRefresh.Text      = "↻  Refresh Network Addresses"
$btnRefresh.Size      = New-Object System.Drawing.Size($CTW, 30)
$btnRefresh.Location  = New-Object System.Drawing.Point($PAD, $y)
$btnRefresh.BackColor = $COLOR_SIDEBAR
$btnRefresh.ForeColor = $COLOR_TEXT_MUTED
$btnRefresh.FlatStyle = "Flat"
$btnRefresh.FlatAppearance.BorderSize = 1
$btnRefresh.FlatAppearance.BorderColor = $COLOR_BORDER
$btnRefresh.Font      = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
$btnRefresh.Cursor    = [System.Windows.Forms.Cursors]::Hand
$btnRefresh.Add_MouseEnter({
    $this.BackColor = $COLOR_CARD
    $this.ForeColor = $COLOR_TEXT_LIGHT
})
$btnRefresh.Add_MouseLeave({
    $this.BackColor = $COLOR_SIDEBAR
    $this.ForeColor = $COLOR_TEXT_MUTED
})
$btnRefresh.Add_Click({ Refresh-IPs })
$left.Controls.Add($btnRefresh)
$y += 36

# QUICK LAUNCH label
$pgLabel           = New-Object System.Windows.Forms.Label
$pgLabel.Text      = "QUICK LAUNCH"
$pgLabel.Font      = New-Object System.Drawing.Font("Segoe UI", 7.5, [System.Drawing.FontStyle]::Bold)
$pgLabel.ForeColor = $COLOR_ACCENT
$pgLabel.Location  = New-Object System.Drawing.Point($PAD, $y)
$pgLabel.Size      = New-Object System.Drawing.Size($CTW, 18)
$left.Controls.Add($pgLabel)
$y += 22

# PAGE BUTTONS — 2 per row
$pages = @(
    @{ Label="🎛️ Control Board";     Path="";               HoverColor=[System.Drawing.Color]::FromArgb(255, 140, 0) }, # orange
    @{ Label="🖥️ Venue Display";      Path="display";        HoverColor=[System.Drawing.Color]::FromArgb(245, 158, 11) }, # amber
    @{ Label="🖥️ Venue Display 2";    Path="display2";       HoverColor=[System.Drawing.Color]::FromArgb(245, 158, 11) },
    @{ Label="⏱️ Shot Clock Display"; Path="shotclock-display"; HoverColor=[System.Drawing.Color]::FromArgb(59, 130, 246) }, # blue
    @{ Label="🕹️ Shot Clock Ctrl";    Path="shotclock";      HoverColor=[System.Drawing.Color]::FromArgb(59, 130, 246) },
    @{ Label="🎥 OBS Bar Overlay";    Path="overlay";        HoverColor=[System.Drawing.Color]::FromArgb(139, 92, 246) }, # purple
    @{ Label="🎥 OBS Fullscreen";     Path="fullscreen";     HoverColor=[System.Drawing.Color]::FromArgb(139, 92, 246) },
    @{ Label="🏀 NBA Scorebug";       Path="nbaoverlay";     HoverColor=[System.Drawing.Color]::FromArgb(139, 92, 246) },
    @{ Label="🏀 NBA Scorebug 2";     Path="nbaoverlay2";    HoverColor=[System.Drawing.Color]::FromArgb(139, 92, 246) },
    @{ Label="NBA - NBC Overlay";     Path="nbc";            HoverColor=[System.Drawing.Color]::FromArgb(139, 92, 246) }
)

$BH  = 44   # button height
$GAP = 6    # gap between buttons
$BW  = [int](($CTW - $GAP) / 2)

for ($i = 0; $i -lt $pages.Count; $i += 2) {
    $p1 = $pages[$i]
    $b1 = New-Object System.Windows.Forms.Button
    $b1.Text      = $p1.Label
    $b1.Size      = New-Object System.Drawing.Size($BW, $BH)
    $b1.Location  = New-Object System.Drawing.Point($PAD, $y)
    $b1.BackColor = $COLOR_CARD
    $b1.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 210)
    $b1.FlatStyle = "Flat"
    $b1.FlatAppearance.BorderSize = 1
    $b1.FlatAppearance.BorderColor = $COLOR_BORDER
    $b1.Font      = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
    $b1.Cursor    = [System.Windows.Forms.Cursors]::Hand
    
    $hoverColor = $p1.HoverColor
    $b1.Add_MouseEnter([scriptblock]::Create("
        `$this.BackColor = [System.Drawing.Color]::FromArgb(35, 35, 48)
        `$this.ForeColor = [System.Drawing.Color]::White
        `$this.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb($($hoverColor.R), $($hoverColor.G), $($hoverColor.B))
    "))
    $b1.Add_MouseLeave([scriptblock]::Create("
        `$this.BackColor = [System.Drawing.Color]::FromArgb($($COLOR_CARD.R), $($COLOR_CARD.G), $($COLOR_CARD.B))
        `$this.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 210)
        `$this.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb($($COLOR_BORDER.R), $($COLOR_BORDER.G), $($COLOR_BORDER.B))
    "))
    $b1.Add_Click([scriptblock]::Create("Open-Page '$($p1.Path)'"))
    $left.Controls.Add($b1)

    if ($i + 1 -lt $pages.Count) {
        $p2 = $pages[$i + 1]
        $b2 = New-Object System.Windows.Forms.Button
        $b2.Text      = $p2.Label
        $b2.Size      = New-Object System.Drawing.Size($BW, $BH)
        $b2.Location  = New-Object System.Drawing.Point(($PAD + $BW + $GAP), $y)
        $b2.BackColor = $COLOR_CARD
        $b2.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 210)
        $b2.FlatStyle = "Flat"
        $b2.FlatAppearance.BorderSize = 1
        $b2.FlatAppearance.BorderColor = $COLOR_BORDER
        $b2.Font      = New-Object System.Drawing.Font("Segoe UI", 8.5, [System.Drawing.FontStyle]::Bold)
        $b2.Cursor    = [System.Windows.Forms.Cursors]::Hand
        
        $hoverColor2 = $p2.HoverColor
        $b2.Add_MouseEnter([scriptblock]::Create("
            `$this.BackColor = [System.Drawing.Color]::FromArgb(35, 35, 48)
            `$this.ForeColor = [System.Drawing.Color]::White
            `$this.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb($($hoverColor2.R), $($hoverColor2.G), $($hoverColor2.B))
        "))
        $b2.Add_MouseLeave([scriptblock]::Create("
            `$this.BackColor = [System.Drawing.Color]::FromArgb($($COLOR_CARD.R), $($COLOR_CARD.G), $($COLOR_CARD.B))
            `$this.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 210)
            `$this.FlatAppearance.BorderColor = [System.Drawing.Color]::FromArgb($($COLOR_BORDER.R), $($COLOR_BORDER.G), $($COLOR_BORDER.B))
        "))
        $b2.Add_Click([scriptblock]::Create("Open-Page '$($p2.Path)'"))
        $left.Controls.Add($b2)
    }
    $y += ($BH + $GAP)
}

# Add controls in Z-order for correct docking layout:
$form.Controls.Add($right)
$form.Controls.Add($header)
$form.Controls.Add($left)

# ── INIT ──────────────────────────────────────────────────────────────────────
$form.Add_FormClosing({ if ($script:running) { Stop-Server } })

# Startup messages go in Form.Shown — RichTextBox requires a window handle before
# AppendText works. Calling it before ShowDialog() silently drops every message.
$form.Add_Shown({
    $form.PerformLayout()
    $rightTable.PerformLayout()
    # Set up initial state-aware variables
    Update-UI
    Update-HotspotBtn
    Refresh-IPs
    Append-Log "Launcher ready.  Repo : $REPO_PATH"
    Append-Log "Server file      : $REPO_PATH\$SERVER_FILE"
    Append-Log "Local URL        : http://localhost:$PORT"
    Append-Log "-----------------------------------------"
    Append-Log "Click START SERVER to launch the scoreboard."
    # Reset log scroll so the first lines are fully visible on startup
    $logBox.SelectionStart = 0
    $logBox.SelectionLength = 0
    $logBox.ScrollToCaret()
    $logBox.SelectionStart = $logBox.TextLength
})

$form.Add_Resize({
    $form.PerformLayout()
    $rightTable.PerformLayout()
})

# Drain the thread-safe log queue on the UI thread every 100ms — safe, no cross-thread deadlock
$logTimer          = New-Object System.Windows.Forms.Timer
$logTimer.Interval = 100
$logTimer.Add_Tick({
    $msg = $null
    while ($script:logQueue.TryDequeue([ref]$msg)) {
        Append-Log $msg
    }
})
$logTimer.Start()

[void]$form.ShowDialog()
$logTimer.Stop()
