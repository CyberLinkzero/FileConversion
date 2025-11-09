Write-Host "🔍 Checking Python..."
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Python not found. Installing via winget..."
  winget install -e --id Python.Python.3.11
}
python -m ensurepip

Write-Host "📦 Creating/activating venv..."
python -m venv venv
& .\venv\Scripts\Activate.ps1

Write-Host "📦 Installing dependencies..."
pip install --upgrade pip
pip install faster-whisper flask werkzeug

Write-Host "🚀 Launching server at http://127.0.0.1:8765 ..."
python local_lyrics_server.py
