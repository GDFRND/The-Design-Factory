#!/bin/bash
# Double-click this file to start The Design Factory demo (Mac).
# It opens automatically in the folder it lives in.
cd "$(dirname "$0")" || exit 1

echo "============================================"
echo "  The Design Factory — starting the demo"
echo "============================================"
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed yet."
  echo "Please install it from https://nodejs.org (the green LTS button),"
  echo "then double-click this file again."
  echo
  read -r -p "Press Return to close this window."
  exit 1
fi

# Install packages the first time (skips quickly if already done).
if [ ! -d node_modules ]; then
  echo "First-time setup — installing (this takes a few minutes)…"
  npm install || { echo "Install failed."; read -r -p "Press Return to close."; exit 1; }
fi

npm run demo
read -r -p "The site has stopped. Press Return to close this window."
