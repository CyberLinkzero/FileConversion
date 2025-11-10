start_transcriber.ps1$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

function Ensure-Python {
  if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Please install Python 3.10+ from https://www.python.org/downloads/ and re-run." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
  }
}

Ensure-Python

if (-not (Test-Path "venv")) {
  Write-Host "Creating venv..."
  python -m venv venv
}

& "$here\venv\Scripts\Activate.ps1"

Write-Host "Upgrading pip..."
python -m pip install --upgrade pip

Write-Host "Installing dependencies..."
pip install flask openai-whisper

try { pip install torch --index-url https://download.pytorch.org/whl/cu121 | Out-Null } catch {}

if (-not (Test-Path "server.py")) {
  Write-Host "server.py not found in $here" -ForegroundColor Yellow
  Read-Host "Place server.py here and press Enter to retry"
}

Write-Host "`nStarting server on http://127.0.0.1:8765"
python server.py
