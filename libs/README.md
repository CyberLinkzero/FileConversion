# Local Libraries (Self-Hosted)

This folder is where all third‑party libraries live so your site can run on GitHub Pages without relying on CDNs.

## Quick start

- **macOS/Linux**: run `./fetch_libs.sh`
- **Windows (PowerShell)**: run `./fetch_libs.ps1`

These scripts will download the exact versions used and place them here:

- heic2any 0.0.5 → `libs/heic2any/heic2any.min.js`
- jsPDF 2.5.1 → `libs/jspdf/jspdf.umd.min.js`
- pdf-lib 1.17.1 → `libs/pdf-lib/pdf-lib.min.js`
- pdf.js 4.7.76 → `libs/pdfjs/pdf.min.mjs` (+ worker auto-handled by module build)
- html-docx-js 0.4.1 → `libs/html-docx/html-docx.min.js`
- html2pdf.js 0.10.1 → `libs/html2pdf/html2pdf.bundle.min.js`
- Mammoth 1.6.0 → `libs/mammoth/mammoth.browser.min.js`
- PapaParse 5.4.1 → `libs/papaparse/papaparse.min.js`
- SheetJS (XLSX) 0.18.5 → `libs/xlsx/xlsx.full.min.js`
- FIT Parser 1.11.0 → `libs/fit/fit-file-parser.min.js`
- JSZip 3.10.1 → `libs/jszip/jszip.min.js`
- FFmpeg 0.12.7 → `libs/ffmpeg/ffmpeg.min.js` + core files:
  - `libs/ffmpeg/ffmpeg-core.js`
  - `libs/ffmpeg/ffmpeg-core.wasm`
  - `libs/ffmpeg/ffmpeg-core.worker.js`

> After running the script, commit & push the updated `libs/` to GitHub. Your pages will load **local** files first and only fall back to CDNs if a file is missing.