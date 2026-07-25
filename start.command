#!/bin/zsh

# Hoop Culture Scoreboard macOS GUI Launcher

# 1. Discover script directory and navigate to it
cd "$(dirname "$0")"

# 2. Run the native python GUI using the built-in macOS python3 framework
/usr/bin/python3 ScoreboardLauncher.py
