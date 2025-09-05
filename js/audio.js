let ffmpeg; let ffmpegReady=false;
async function ensureFFmpeg(logEl){
  if(ffmpegReady) return; log(logEl,"Loading FFmpeg.wasm…");
  ffmpeg = window.ffmpeg || window.createFFmpeg({log:true , corePath: 'libs/ffmpeg/ffmpeg-core.js'});
  await ffmpeg.load(); ffmpegReady=true; log(logEl,"FFmpeg loaded.");
}
byId("audio-btn")?.addEventListener("click", async ()=>{
  const f = (byId("audio-input").files||[])[0]; const target = byId("audio-target").value; const logEl = byId("audio-log");
  logEl.textContent=""; if(!f) return alert("Pick an audio file");
  await ensureFFmpeg(logEl);
  const inExt = f.name.split('.').pop(); const inName = `in.${inExt}`; const outName = target==='mp3'?'out.mp3':'out.wav';
  ffmpeg.FS('writeFile', inName, new Uint8Array(await f.arrayBuffer()));
  const args = target==='mp3' ? ['-i',inName,'-codec:a','libmp3lame','-q:a','2', outName] : ['-i',inName, outName];
  await ffmpeg.run(...args);
  const data = ffmpeg.FS('readFile', outName);
  downloadBlob(new Blob([data.buffer], {type: target==='mp3'?'audio/mpeg':'audio/wav'}), rename(f.name, target));
  log(logEl, `✓ ${rename(f.name, target)}`);
  ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);
});