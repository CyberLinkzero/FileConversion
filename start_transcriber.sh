#!/usr/bin/env bash
set -e
echo "🔍 Checking Python..."
if ! command -v python3 >/dev/null 2>&1; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Installing Homebrew + Python…"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    brew install python
  else
    echo "Installing Python via apt…"
    sudo apt update && sudo apt install -y python3 python3-venv python3-pip
  fi
fi

echo "📦 Creating/activating venv..."
python3 -m venv venv
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install faster-whisper flask werkzeug

echo "🚀 Launching server at http://127.0.0.1:8765 ..."
python3 local_lyrics_server.py
