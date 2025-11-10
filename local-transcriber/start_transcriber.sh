#!/usr/bin/env bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

have_python() { command -v python3 >/dev/null 2>&1; }

if ! have_python; then
  echo "Python3 not found. Please install Python 3.10+ (brew install python, apt install python3) and re-run."
  exit 1
fi

if [ ! -d "venv" ]; then
  echo "Creating venv..."
  python3 -m venv venv
fi

# shellcheck source=/dev/null
source "venv/bin/activate"
python -m pip install --upgrade pip

echo "Installing dependencies..."
pip install flask openai-whisper

# Optional accelerators (ignore failures)
pip install torch --index-url https://download.pytorch.org/whl/cpu || true

if [ ! -f "server.py" ]; then
  echo "server.py not found in $HERE"
  exit 1
fi

echo
echo "Starting server on http://127.0.0.1:8765"
python server.py
