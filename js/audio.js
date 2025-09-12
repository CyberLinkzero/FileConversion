// js/audio.js — uses window.__FF__ and window.__FF_CORE__
(function () {
  const logEl = document.getElementById('log');
  const progressBar = document.getElementById('progressBar');
  const progressLabel = document.getElementById('progressLabel');
  const fileInput = document.getElementById('audioFile');
  const outFormatSel = document.getElementById('outFormat');
  const btnConvert = document.getElementById('convertBtn');
  const btnCancel = document.getElementById('cancelBtn');
  const dlLink = document.getElementById('downloadLink');

  const log = (m) => { logEl.textContent += (m + "\n"); logEl.scrollTop = logEl.scrollHeight; };
  const setProgress = (pct, msg) => {
    const v = Math.max(0, Math.min(100, pct | 0));
    progressBar.style.width = v + '%';
    progressLabel.textContent = (msg || 'Working…') + ` (${v}%)`;
  };
  const resetProgress = () => { progressBar.style.width = '0%'; progressLabel.textContent = 'Idle'; };

  const FF = (window.__FF__ || window.FFmpeg || window.FFmpegWASM);
  if (!FF) {
    console.error('FFmpeg global missing after load');
    log('❌ FFmpeg global missing after load.');
    return;
  }
  const { createFFmpeg, fetchFile } = FF;

  const ffmpeg = createFFmpeg({
    log: true,
    progress: ({ ratio }) => {
      const pct = Math.round(((ratio || 0) * 100));
      setProgress(pct, 'Transcoding');
    },
    corePath: (window.__FF_CORE__ || 'libs/ffmpeg/ffmpeg-core.js')
  });

  let abortController = null;

  async function ensureLoaded() {
    if (ffmpeg.isLoaded()) return;
    log('🔧 Loading FFmpeg core… (first run takes longer)');
    await ffmpeg.load();
    log('✅ FFmpeg ready');
  }

  function deriveNames(file, outExt) {
    const inName = file.name;
    let base = inName.replace(/\.[^/.]+$/, '');
    if (!base) base = 'output';
    const outName = `${base}.${outExt}`;
    const memIn = `in_${Date.now()}${inName.includes('.') ? inName.slice(inName.lastIndexOf('.')) : '.dat'}`;
    const memOut = `out_${Date.now()}.${outExt}`;
    return { inName, memIn, memOut, outName };
  }

  function pickCmd(outExt, memIn, memOut) {
    if (outExt === 'mp3') {
      return ['-i', memIn, '-vn', '-c:a', 'mp3', '-q:a', '2', memOut];
    }
    if (outExt === 'wav') {
      return ['-i', memIn, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', memOut];
    }
    if (outExt === 'ogg') {
      return ['-i', memIn, '-vn', '-c:a', 'libvorbis', '-q:a', '4', memOut];
    }
    return ['-i', memIn, '-vn', '-c:a', 'copy', memOut];
  }

  async function convert() {
    const file = fileInput.files && fileInput.files[0];
    if (!file) { alert('Pick a file first.'); return; }

    btnConvert.disabled = true;
    btnCancel.disabled = false;
    dlLink.style.display = 'none';
    dlLink.removeAttribute('href');
    resetProgress();
    log(`🎧 Selected: ${file.name} (${(file.size/1e6).toFixed(2)} MB)`);

    try {
      await ensureLoaded();

      const outExt = outFormatSel.value;
      const { memIn, memOut, outName } = deriveNames(file, outExt);

      // Write input into MEMFS
      const data = await fetchFile(file);
      ffmpeg.FS('writeFile', memIn, data);
      log(`➡️  Loaded into memory: ${memIn}`);

      const cmd = pickCmd(outExt, memIn, memOut);
      log('▶️  ffmpeg ' + cmd.map(x => (/\s/.test(x) ? `"${x}"` : x)).join(' '));

      // Cancel support
      abortController = new AbortController();
      await ffmpeg.run(...cmd, { signal: abortController.signal });

      // Read output
      const outData = ffmpeg.FS('readFile', memOut);
      const blob = new Blob([outData.buffer], { type:
        outExt === 'mp3' ? 'audio/mpeg' :
        outExt === 'wav' ? 'audio/wav' :
        outExt === 'ogg' ? 'audio/ogg' : 'application/octet-stream'
      });
      const url = URL.createObjectURL(blob);
      dlLink.href = url;
      dlLink.download = outName;
      dlLink.style.display = 'inline-block';
      setProgress(100, 'Done');
      log(`✅ Complete: ${outName}`);

      // Cleanup MEMFS
      try { ffmpeg.FS('unlink', memIn); } catch(_) {}
      try { ffmpeg.FS('unlink', memOut); } catch(_) {}
    } catch (err) {
      log('❌ Error: ' + (err && err.message ? err.message : String(err)));
      progressLabel.textContent = 'Error';
    } finally {
      btnConvert.disabled = false;
      btnCancel.disabled = true;
      abortController = null;
    }
  }

  function cancelRun() {
    if (abortController) {
      try { abortController.abort(); } catch(_) {}
      log('🛑 Canceled.');
      btnCancel.disabled = true;
      btnConvert.disabled = false;
    }
  }

  btnConvert.addEventListener('click', convert);
  btnCancel.addEventListener('click', cancelRun);

  // Nice UX: auto-pick sensible output based on extension
  fileInput.addEventListener('change', () => {
    const f = fileInput.files && fileInput.files[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (['wav','aiff','aif'].includes(ext)) outFormatSel.value = 'mp3';
    if (['ogg','oga'].includes(ext)) outFormatSel.value = 'wav';
    if (['mp4','mkv','mov','avi','webm'].includes(ext)) outFormatSel.value = 'mp3'; // extract audio
  });

  log('UI ready. Pick a file to begin.');
})();
