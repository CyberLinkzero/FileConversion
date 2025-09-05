
(async function(){
  await __boot.loadFirst(['libs/ffmpeg/ffmpeg.min.js','https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js']);
  const { createFFmpeg, fetchFile } = FFmpeg;
  const ffmpeg = createFFmpeg({
    log: true,
    progress: ({ ratio })=> { try{ Progress.update(Math.round(ratio*100), 'Transcoding…'); }catch(e){} }
  });

  const byId = (id)=>document.getElementById(id);
  const logEl = byId('video-log');
  function log(m){ if(logEl){ logEl.textContent += m + '\n'; logEl.scrollTop = logEl.scrollHeight; } }

  byId('video-convert')?.addEventListener('click', async ()=>{
    const f = byId('video-file')?.files?.[0];
    if(!f) return alert('Pick a video file');
    const fmt = byId('video-format').value;
    const width = parseInt(byId('video-width').value||'0',10);
    const fps = parseInt(byId('video-fps').value||'30',10);
    const crf = parseInt(byId('video-crf').value||'28',10);
    const start = byId('video-start').value.trim();
    const dur = byId('video-duration').value.trim();

    const inName = 'input.' + (f.name.split('.').pop() || 'mp4');
    const outName = 'out.' + fmt;
    const args = ['-i', inName];
    if (start) { args.push('-ss', start); }
    if (dur) { args.push('-t', dur); }
    if (width>0) { args.push('-vf', `scale=${width}:-2`); }
    if (fps>0) { args.push('-r', String(fps)); }

    if (fmt==='webm'){
      args.push('-c:v','libvpx-vp9','-b:v','0','-crf', String(crf), '-c:a','libopus', outName);
    } else if (fmt==='mp4'){
      // Best effort: many ffmpeg.wasm builds don't include x264; this may fail. We try native aac + mpeg4 fallback.
      args.push('-c:v','libx264','-crf', String(Math.max(18,Math.min(35,crf))), '-pix_fmt','yuv420p', '-c:a','aac','-b:a','192k', outName);
    } else {
      return alert('Unsupported');
    }

    try{
      Progress && Progress.show('Transcoding video…');
      if (!ffmpeg.loaded) await ffmpeg.load();
      ffmpeg.FS('writeFile', inName, await fetchFile(f));
      await ffmpeg.run(...args);
      const data = ffmpeg.FS('readFile', outName);
      const mime = fmt==='webm' ? 'video/webm' : 'video/mp4';
      const blob = new Blob([data.buffer], {type:mime});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.name.replace(/\.[^.]+$/, '') + '.' + fmt; a.click();
      Progress && Progress.done();
      log('Done.');
    }catch(e){
      Progress && Progress.hide();
      console.error(e); alert('Video conversion failed (try WebM): ' + (e?.message||e));
    }finally{
      try{ ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);}catch{}
    }
  });
})();
