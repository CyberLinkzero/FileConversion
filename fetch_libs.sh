#!/usr/bin/env bash
set -euo pipefail
mkdir -p libs/{heic2any,jspdf,pdf-lib,pdfjs,html-docx,html2pdf,mammoth,papaparse,xlsx,fit,jszip,ffmpeg}

curl -L -o libs/heic2any/heic2any.min.js https://unpkg.com/heic2any@0.0.5/dist/heic2any.min.js
curl -L -o libs/jspdf/jspdf.umd.min.js https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js
curl -L -o libs/pdf-lib/pdf-lib.min.js https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js
curl -L -o libs/pdfjs/pdf.min.mjs https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs
curl -L -o libs/html-docx/html-docx.min.js https://cdn.jsdelivr.net/npm/html-docx-js@0.4.1/dist/html-docx.min.js
curl -L -o libs/html2pdf/html2pdf.bundle.min.js https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
curl -L -o libs/mammoth/mammoth.browser.min.js https://unpkg.com/mammoth@1.6.0/mammoth.browser.min.js
curl -L -o libs/papaparse/papaparse.min.js https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js
curl -L -o libs/xlsx/xlsx.full.min.js https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js
curl -L -o libs/fit/fit-file-parser.min.js https://unpkg.com/fit-file-parser@1.11.0/dist/fit-file-parser.min.js
curl -L -o libs/jszip/jszip.min.js https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js

# FFmpeg (JS + core files)
curl -L -o libs/ffmpeg/ffmpeg.min.js https://unpkg.com/@ffmpeg/ffmpeg@0.12.7/dist/ffmpeg.min.js
curl -L -o libs/ffmpeg/ffmpeg-core.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js
curl -L -o libs/ffmpeg/ffmpeg-core.wasm https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm
curl -L -o libs/ffmpeg/ffmpeg-core.worker.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js

echo "✅ Libraries downloaded into ./libs"