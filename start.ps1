# 🏀 Hoop Culture Scoreboard - PowerShell Startup Script
$ErrorActionPreference = "Stop"

# Set working directory to the folder where this script is located
Set-Location $PSScriptRoot

# Optional: Set your Windows Streamlabs Remote Control API Token here if it differs from Mac
# Find this in Streamlabs Desktop under Settings > Remote Control > Copy API Token.
# $env:STREAMLABS_TOKEN = "8183a35b168a986def8938bbfc456a988453c"

# Optional: Set your OBS WebSocket Port and Password for Windows
# Find these in OBS Studio under Tools > WebSocket Server Settings.
$env:OBS_PORT = "4455"
$env:OBS_PASSWORD = ""

Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🏀 HOOP CULTURE SCOREBOARD - Starting Local Server" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host

# 1. Check if Node.js is installed
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCheck) {
    Write-Host "[ERROR] Node.js is not installed or not in your system's PATH." -ForegroundColor Red
    Write-Host "Please download and install Node.js (LTS version) from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host
    Read-Host "Press Enter to exit..."
    Exit 1
}

# 2. Check if server.js exists in the current directory
if (-not (Test-Path "server.js")) {
    Write-Host "[ERROR] server.js not found in current directory ($PSScriptRoot)." -ForegroundColor Red
    Write-Host "Please ensure all scoreboard files are in the same folder as this script." -ForegroundColor Yellow
    Write-Host
    Read-Host "Press Enter to exit..."
    Exit 1
}

# 3. Retrieve local IPv4 addresses dynamically
Write-Host "Your local IP addresses (for tablet/mobile access):" -ForegroundColor White
$ipAddresses = Get-NetIPAddress -InterfaceAddressFamily IPv4 | 
               Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | 
               Select-Object -ExpandProperty IPAddress

if ($ipAddresses) {
    foreach ($ip in $ipAddresses) {
        Write-Host "  👉 http://$ip:3000" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️ No local network IP found. Connect to a WiFi/Ethernet network." -ForegroundColor Yellow
}
Write-Host

# 4. Display local access links
Write-Host "Local browser access links:" -ForegroundColor White
Write-Host "  Scoreboard Control  -> " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Venue Display       -> " -NoNewline; Write-Host "http://localhost:3000/display" -ForegroundColor Cyan
Write-Host "  Shot Clock Display  -> " -NoNewline; Write-Host "http://localhost:3000/shotclock-display" -ForegroundColor Cyan
Write-Host "  OBS Overlay         -> " -NoNewline; Write-Host "http://localhost:3000/fullscreen" -ForegroundColor Cyan
Write-Host

Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host

# 5. Execute server
node server.js
