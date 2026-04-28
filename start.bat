@echo off
title 🏀 Hoop Culture Scoreboard
cd /d C:\basketball-scoreboard

echo.
echo  ============================================
echo   HOOP CULTURE SCOREBOARD - Starting Server
echo  ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed or not in PATH.
    echo  Download it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check if server.js exists
if not exist "C:\basketball-scoreboard\server.js" (
    echo  [ERROR] server.js not found in C:\basketball-scoreboard
    echo  Make sure the scoreboard files are in the correct folder.
    echo.
    pause
    exit /b 1
)

:: Get local IP address for tablet access
echo  Your local IP addresses (for tablet access):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%a
    setlocal enabledelayedexpansion
    set ip=!ip: =!
    echo    http://!ip!:3000
    endlocal
)

echo.
echo  Scoreboard Control  ->  http://localhost:3000
echo  Venue Display       ->  http://localhost:3000/display
echo  Shot Clock Display  ->  http://localhost:3000/shotclock-display
echo  OBS Overlay         ->  http://localhost:3000/overlay
echo.
echo  Press Ctrl+C to stop the server.
echo  ============================================
echo.

node server.js

echo.
echo  Server stopped.
pause
