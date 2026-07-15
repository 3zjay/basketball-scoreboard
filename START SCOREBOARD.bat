@echo off

:: Optional: Set your OBS WebSocket Port and Password for Windows
:: Find these in OBS Studio under Tools > WebSocket Server Settings.
set OBS_PORT=4455
set OBS_PASSWORD=

echo Starting Scoreboard Launcher...
echo.

:: Check if PowerShell exists
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell not found.
    pause
    exit /b
)

:: Check if the PS1 file exists next to this bat file
if not exist "%~dp0ScoreboardLauncher.ps1" (
    echo ERROR: ScoreboardLauncher.ps1 not found.
    echo Make sure both files are in the same folder.
    echo Current folder: %~dp0
    pause
    exit /b
)

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Download it from https://nodejs.org and install, then try again.
    pause
    exit /b
)

:: Check if server.js exists next to this bat file
if not exist "%~dp0server.js" (
    echo ERROR: server.js not found in %~dp0
    echo Make sure all scoreboard files are in the same folder.
    pause
    exit /b
)

echo All checks passed. Launching GUI...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0ScoreboardLauncher.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: PowerShell script failed with code %errorlevel%
    pause
)