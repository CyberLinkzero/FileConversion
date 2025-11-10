@echo off
setlocal
title Local Lyrics Transcriber (Whisper)

REM Use current directory as app dir
set APPDIR=%~dp0
cd /d "%APPDIR%"

where python >nul 2>nul
if errorlevel 1 (
  echo Python not found. Please install Python 3.10+ from https://www.python.org/downloads/
  pause
  exit /b 1
)

if not exist venv (
  echo Creating venv...
  python -m venv venv
)

call venv\Scripts\activate
echo Upgrading pip...
python -m pip install --upgrade pip

echo Installing dependencies (first run may take a while)...
pip install flask openai-whisper

REM Optional speed-ups (ignore errors)
pip install torch --index-url https://download.pytorch.org/whl/cu121 >nul 2>nul

if not exist server.py (
  echo server.py not found in %APPDIR%.
  echo Place server.py next to this BAT or update this script to curl it.
  pause
  exit /b 1
)

echo.
echo Starting server on http://127.0.0.1:8765
echo Keep this window open while using the website.
python server.py
