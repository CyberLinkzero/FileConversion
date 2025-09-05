
(async function(){
  await __boot.loadFirst(['libs/ffmpeg/ffmpeg.min.js','https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js']);
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({
    log: true,
    progress: ({ ratio })=> { try{ Progress.update(Math.round(ratio*100), 'Encoding…'); }catch(e){} },
    corePath: (window.location.href.includes('http') ? undefined : undefined) // let it auto-pick CDN if local not present
  });

  const byId = (id)=>document.getElementById(id);
  const logEl = byId('audio-log');
  function log(m){ if(logEl){ logEl.textContent += m + '\n'; logEl.scrollTop = logEl.scrollHeight; } }

  byId('audio-convert')?.addEventListener('click', async ()=>{
    const f = byId('audio-file')?.files?.[0];
    if(!f) return alert('Pick an audio file');
    const outFmt = byId('audio-format').value;
    const kbps = parseInt(byId('audio-bitrate').value||'192', 10);
    const start = byId('audio-start').value.trim();
    const dur = byId('audio-duration').value.trim();
    const vol = parseFloat(byId('audio-volume').value||'1');
    const inName = 'input.' + (f.name.split('.').pop() || 'dat');
    const outName = 'out.' + outFmt;

    const args = ['-i', inName];
    if (start) { args.push('-ss', start); }
    if (dur) { args.push('-t', dur); }
    if (vol !== 1) { args.push('-filter:a', `volume=${vol}`); }

    if (outFmt === 'mp3'){
      args.push('-vn','-b:a', `${kbps}k`, outName);
    } else if (outFmt === 'wav'){
      args.push('-vn','-c:a','pcm_s16le', outName);
    } else if (outFmt === 'ogg'){
      args.push('-vn','-c:a','libopus','-b:a', `${kbps}k`, outName);
    } else {
      return alert('Unsupported format');
    }

    try{
      Progress && Progress.show('Transcoding audio…');
      if (!ffmpeg.loaded) await ffmpeg.load();
      ffmpeg.FS('writeFile', inName, await fetchFile(f));
      await ffmpeg.run(...args);
      const data = ffmpeg.FS('readFile', outName);
      const mime = outFmt==='mp3' ? 'audio/mpeg' : (outFmt==='wav' ? 'audio/wav' : 'audio/ogg');
      const blob = new Blob([data.buffer], {type:mime});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.name.replace(/\.[^.]+$/, '') + '.' + outFmt; a.click();
      Progress && Progress.done();
      log('Done.');
    }catch(e){
      Progress && Progress.hide();
      console.error(e); alert('Audio conversion failed: ' + (e?.message||e));
    }finally{
      try{ ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);}catch{}
    }
  });
})();
