# FileConverter.run

🌐 **Live site:** https://fileconverter.run

**FileConverter.run** is a **privacy-first, browser-based file conversion and utility platform** offering a wide range of converters, developer tools, learning labs, and experimental utilities — designed to work **locally in the browser whenever possible**.

No accounts.  
No forced uploads.  
No unnecessary tracking.

---

## 🔐 Core Philosophy

### Privacy First
- Files are processed **locally on your device whenever technically possible**
- No login requirements
- No silent uploads
- Clear separation between client-side tools and any optional helper components

### Practical Utility
- Tools are built for **real workflows**
- Fast, lightweight, and focused
- No bloated “all-in-one” apps that do nothing well

### Modular & Expanding
- Each tool is self-contained
- New tools can be added without breaking existing ones
- Experimental features are clearly separated from core converters

---

## 🔄 Conversion & Utility Tools

### 📄 Document Tools
- PDF ↔ DOCX
- PDF ↔ TXT
- Image → PDF
- PDF merge & split
- PDF compression (browser-safe limits)

### 🖼 Image Tools
- PNG ↔ JPG
- WEBP ↔ PNG
- ICO generation
- Image resize & compression
- Canvas-based image manipulation
- Background removal (browser-based)

### 🎵 Audio Tools
- Audio format conversion
- Audio trimming
- Web Audio API processing
- Experimental transcription workflows

### 🎥 Video Tools
- Browser-based video conversion (FFmpeg.wasm)
- Container and format utilities
- Lightweight trimming and processing

> Video tools are resource-intensive and may be slower due to running entirely in the browser.

### 💻 Data & Developer Tools
- JSON ↔ CSV
- CSV ↔ XLSX
- Text ↔ Binary
- Encoding / decoding utilities
- Hashing and developer helpers

### 📦 Archive & File Utilities
- ZIP file utilities
- File inspection helpers
- Format validation tools

### 🧭 GPS & Mapping Tools
- GPX / KML / TCX / FIT utilities
- GPS data conversion
- Spreadsheet-friendly exports (CSV / XLSX)
- Mapping and coordinate helpers
- Guides for GPS workflows

---

## 🧪 Programming & Learning Labs

FileConverter.run includes **interactive programming and learning tools**, designed to be:
- Readable
- Experiment-friendly
- Browser-native

Includes:
- JavaScript programming labs
- Python learning content
- Progressive lesson paths (easy → advanced)
- In-browser execution and experimentation

---

## 🎮 Games & Interactive Experiments

The platform also hosts **lightweight browser-based games and experiments**, used to:
- Demonstrate browser APIs
- Encourage exploration
- Add creative value to the ecosystem

These tools are **non-essential** and clearly separated from production converters.

---

## 🛠 Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser APIs:
  - File API
  - Canvas API
  - Web Audio API
  - Web Workers
- FFmpeg.wasm (for video tools)
- No required backend for most features
- Hosted via GitHub Pages

---

## 📁 Project Structure (Typical)

```
/
├─ index.html
├─ site.css
├─ js/
│  ├─ shared UI & helpers
│  └─ tool logic
├─ tools/
│  ├─ documents
│  ├─ images
│  ├─ audio
│  ├─ video
│  ├─ data
│  └─ gps
├─ programming-lab/
├─ games/
└─ assets/
```

Each tool is designed to be:
- Self-contained
- Easily removable
- Simple to extend

---

## 🚧 Experimental & Optional Components

Some features are **experimental** and may change:
- Advanced video processing
- Audio transcription helpers
- Local helper services (optional, localhost only)
- Performance and memory experiments

Experimental tools are **never required** to use core converters.

---

## 🤝 Contributing

Contributions are welcome.

You can help by:
- Adding new converters
- Improving UI/UX
- Optimizing performance
- Fixing bugs
- Improving documentation

### Contribution Guidelines
- Respect user privacy
- Prefer client-side processing
- Avoid unnecessary third-party services
- Keep tools modular and readable

---

## ⚠️ Disclaimer

FileConverter.run is provided **as-is**, without warranty of any kind.

Always verify converted files before using them in:
- Production environments
- Legal documents
- Medical or safety-critical workflows

---

## 📄 License

MIT License  
(Unless otherwise noted in individual modules or directories)

---

## 🚀 Project Status

- Actively developed
- Continuously expanding
- Focused on privacy-respecting browser tools

---

## 📬 Links

- 🌐 Website: https://fileconverter.run
- 🛠 Built and maintained by an independent developer
- 🔐 Designed with privacy as a core principle
