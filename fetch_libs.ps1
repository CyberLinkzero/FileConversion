$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path libs\heic2any,libs\jspdf,libs\pdf-lib,libs\pdfjs,libs\html-docx,libs\html2pdf,libs\mammoth,libs\papaparse,libs\xlsx,libs\fit,libs\jszip,libs\ffmpeg | Out-Null

Invoke-WebRequest -Uri https://unpkg.com/heic2any@0.0.5/dist/heic2any.min.js -OutFile libs/heic2any/heic2any.min.js
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js -OutFile libs/jspdf/jspdf.umd.min.js
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js -OutFile libs/pdf-lib/pdf-lib.min.js
Invoke-WebRequest -Uri https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs -OutFile libs/pdfjs/pdf.min.mjs
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/html-docx-js@0.4.1/dist/html-docx.min.js -OutFile libs/html-docx/html-docx.min.js
Invoke-WebRequest -Uri https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js -OutFile libs/html2pdf/html2pdf.bundle.min.js
Invoke-WebRequest -Uri https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js -OutFile libs/mammoth/mammoth.browser.min.js
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js -OutFile libs/papaparse/papaparse.min.js
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js -OutFile libs/xlsx/xlsx.full.min.js
Invoke-WebRequest -Uri https://unpkg.com/fit-file-parser@1.11.0/dist/fit-file-parser.min.js -OutFile libs/fit/fit-file-parser.min.js
Invoke-WebRequest -Uri https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js -OutFile libs/jszip/jszip.min.js

# FFmpeg (JS + core files)
Invoke-WebRequest -Uri https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js -OutFile libs/ffmpeg/ffmpeg.min.js
Invoke-WebRequest -Uri https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js -OutFile libs/ffmpeg/ffmpeg-core.js
Invoke-WebRequest -Uri https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm -OutFile libs/ffmpeg/ffmpeg-core.wasm
Invoke-WebRequest -Uri https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js -OutFile libs/ffmpeg/ffmpeg-core.worker.js

Write-Host "✅ Libraries downloaded into .\libs"