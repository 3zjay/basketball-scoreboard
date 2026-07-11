#!/bin/zsh

# Hoop Culture Scoreboard macOS Local Launcher

# 1. Discover script directory and navigate to it
cd "$(dirname "$0")"

clear
printf "\033[1;36m==========================================================\033[0m\n"
printf "\033[1;33m       🏀 Hoop Culture Scoreboard Local Launcher 🏀       \033[0m\n"
printf "\033[1;36m==========================================================\033[0m\n"
printf "\n"

# 2. Check if Node.js is installed
if ! command -v node &> /dev/null; then
    printf "\033[1;31m❌ Error: Node.js is not installed on this Mac.\033[0m\n"
    printf "Please download and install Node.js from https://nodejs.org/\n"
    printf "\n"
    printf "Press [Enter] to exit..."
    read
    exit 1
fi

# 3. Print access links in colored text
printf "\033[1;32mLocal access links (once server starts):\033[0m\n"
printf "  Scoreboard Control  -> \033[1;35mhttp://localhost:3000\033[0m\n"
printf "  Venue Display       -> \033[1;35mhttp://localhost:3000/display\033[0m\n"
printf "  Shot Clock Display  -> \033[1;35mhttp://localhost:3000/shotclock-display\033[0m\n"
printf "  OBS Overlay         -> \033[1;35mhttp://localhost:3000/fullscreen\033[0m\n"
printf "\n"
printf "Press \033[1;31mCtrl+C\033[0m inside this window to stop the server.\n"
printf "\033[1;36m==========================================================\033[0m\n"
printf "\n"

# 4. Start local Node.js server
node server.js
