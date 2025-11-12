# CyberChat Upgrade Pack

This bundle contains:
- `assets/cyberchat-widget.js` — drop-in web widget with model picker + plugins
- `cyberchat.html` — sample page with FAQ-first chat and installer prompt
- `server.py` — local FastAPI + Transformers backend with plugin system
- `install_and_run.bat` — Windows one-click installer/launcher
- `install_and_run.sh` — macOS/Linux installer/launcher

## Quick Start
1. Upload `assets/cyberchat-widget.js` and `cyberchat.html` to your site.
2. On your PC, run **one** of:
   - Windows: `install_and_run.bat`
   - macOS/Linux: `./install_and_run.sh`
3. In the widget, pick a model from the dropdown. First run will download it.
4. (Optional) Add plugins in a `plugins/` folder next to `server.py`.

## Download Buttons
In `cyberchat.html`, update the installer links to point to your hosted files:
- `/downloads/CyberChatServer-Windows.exe`
- `/downloads/CyberChatServer-macOS.dmg`
- `/downloads/CyberChatServer-Linux.AppImage`
