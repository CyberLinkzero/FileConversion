# AnyConvert+ (self-hosted, with advanced options)

- Open `index.html` locally or host on GitHub Pages.
- Libraries load from `libs/` first; if missing, a CDN fallback is used.
- To self-host libraries, download into `libs/` (see earlier instructions you have).

Pages:
- Images: PNG/JPG/WebP (canvas) + GIF/WebP animated (ffmpeg.wasm) with FPS/scale/loop/dither.
- Documents: PDF→images with page ranges, DPI, background.
- Data: CSV↔JSON, XLSX→CSV/JSON, JSON→DOC (.doc via HTML) with "clear formatting".
- Audio: MP3/WAV/M4A with bitrate, sample-rate, channels, trim, volume.
- Video: MP4/WebM with resolution, fps, CRF, preset, audio bitrate/mute, trim, rotate.
- Archive: ZIP with compression level and flatten option.