let ffmpeg; let ffmpegReady=false;
async function ensureFFmpeg(logEl){
  if(ffmpegReady) return; log(logEl,"Loading FFmpeg.wasm…");
  ffmpeg = window.ffmpeg || window.createFFmpeg({log:true , corePath: 'libs/ffmpeg/ffmpeg-core.js'});
  await ffmpeg.load(); ffmpegReady=true; log(logEl,"FFmpeg loaded.");
}

// MP4 ↔ WebM
byId("video-btn")?.addEventListener("click", async ()=>{
  const f = (byId("video-input").files||[])[0]; const tgt = byId("video-target").value; const logEl = byId("video-log");
  logEl.textContent=""; if(!f) return alert("Pick a video");
  await ensureFFmpeg(logEl);
  const inExt = f.name.split('.').pop(); const inName = `in.${inExt}`; const outName = tgt==='mp4'?'out.mp4':'out.webm';
  ffmpeg.FS('writeFile', inName, new Uint8Array(await f.arrayBuffer()));
  const args = tgt==='mp4' ? ['-i', inName, '-vcodec','libx264','-crf','23','-preset','veryfast','-acodec','aac','-b:a','160k', outName]
                           : ['-i', inName, '-vcodec','libvpx-vp9','-crf','30','-b:v','0','-acodec','libopus', outName];
  await ffmpeg.run(...args);
  const data = ffmpeg.FS('readFile', outName);
  downloadBlob(new Blob([data.buffer], {type: tgt==='mp4'?'video/mp4':'video/webm'}), rename(f.name, tgt));
  log(logEl, `✓ ${rename(f.name, tgt)}`);
  ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);
});

// GIF ↔ MP4
byId("gif-mp4-btn")?.addEventListener("click", async ()=>{
  const f = (byId("gif-mp4-input").files||[])[0]; const tgt = byId("gif-mp4-target").value; const logEl = byId("gif-mp4-log");
  logEl.textContent=""; if(!f) return alert("Pick a GIF or MP4");
  await ensureFFmpeg(logEl);
  const inExt = f.name.split('.').pop(); const inName = `in.${inExt}`; const outName = tgt==='mp4'?'out.mp4':'out.gif';
  ffmpeg.FS('writeFile', inName, new Uint8Array(await f.arrayBuffer()));
  const args = tgt==='mp4' ? ['-i', inName, '-movflags','faststart','-pix_fmt','yuv420p','-vf','scale=iw:-2:flags=lanczos,fps=24', outName]
                           : ['-i', inName, '-vf','fps=12,scale=iw:-2:flags=lanczos', outName];
  await ffmpeg.run(...args);
  const data = ffmpeg.FS('readFile', outName);
  downloadBlob(new Blob([data.buffer], {type: tgt==='mp4'?'video/mp4':'image/gif'}), rename(f.name, tgt));
  log(logEl, `✓ ${rename(f.name, tgt)}`);
  ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);
});