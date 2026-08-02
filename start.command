#!/bin/bash
# Chirp — double-click launcher for macOS.
# First time only, run this in Terminal:   chmod +x start.command

cd "$(dirname "$0")" || exit 1
PORT=8080

# find a free port
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done

echo ""
echo "  🐣  Chirp is running at  http://localhost:$PORT"
echo "      The microphone works here because localhost counts as a secure origin."
echo "      Close this window (or press Ctrl+C) to stop."
echo ""

( sleep 1; open "http://localhost:$PORT" ) &

if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v npx >/dev/null 2>&1; then
  npx --yes serve -l "$PORT" .
else
  echo "Neither python3 nor npx was found. Install either one, or serve this folder yourself."
  read -r -p "Press return to close."
fi
