@echo off
title CyberChat AI Installer
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install fastapi "uvicorn[standard]" pydantic transformers torch --extra-index-url https://download.pytorch.org/whl/cu121
python server.py
pause
