(async function(){
  const byId=(id)=>document.getElementById(id);
  const log=(msg)=>{ const el=byId('aud-log'); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };
  async function ensureFFmpeg(){
    if (window.createFFmpeg && window.fetchFile) return;
    const mod = await window.__boot.loadModuleFirst(['https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js']);
    window.createFFmpeg = mod.createFFmpeg; window.fetchFile = mod.fetchFile;
  }
  function getAudioOpts(){
    return {
      out: byId('aud-out').value, br: byId('aud-bitrate').value, sr: byId('aud-sr').value,
      ch: byId('aud-ch').value, ss: byId('aud-ss').value.trim(), t: byId('aud-t').value.trim(),
      vol: byId('aud-vol').value
    };
  }
  function buildArgs(inName, outName, o){
    const a=['-y']; if(o.ss) a.push('-ss', o.ss);
    a.push('-i', inName);
    if (o.sr) a.push('-ar', o.sr);
    if (o.ch) a.push('-ac', o.ch);
    if (o.vol) a.push('-filter:a', `volume=${o.vol}dB`);
    if (o.t) a.push('-t', o.t);
    if (o.out==='wav') return [ [...a, '-c:a','pcm_s16le', outName] ];
    if (o.out==='m4a'){
      const arr = [...a, '-c:a','aac']; if (o.br) arr.push('-b:a', o.br); arr.push('-movflags','+faststart', outName); return [arr];
    }
    const list=[];
    const lame=[...a, ...(o.br?['-b:a',o.br]:[]), '-c:a','libmp3lame', outName];
    const native=[...a, ...(o.br?['-b:a',o.br]:[]), '-c:a','mp3', outName];
    list.push(lame, native);
    return list;
  }
  async function runWithFallback(ffmpeg, argLists){
    let err; for(const args of argLists){ try{ await ffmpeg.run(...args); return; }catch(e){ err=e; log('Retrying with fallback...'); } }
    throw err||new Error('Encode failed');
  }
  byId('aud-convert').onclick = async ()=>{
    const f = byId('aud-file').files[0]; if(!f) return alert('Pick an audio/video');
    await ensureFFmpeg();
    const { createFFmpeg, fetchFile } = window;
    const ffmpeg = createFFmpeg({ log:false });
    await ffmpeg.load();
    const o = getAudioOpts();
    const inName = 'in.' + (f.name.split('.').pop()||'dat');
    const outName = 'out.' + o.out;
    ffmpeg.FS('writeFile', inName, await fetchFile(f));
    const lists = buildArgs(inName, outName, o);
    await runWithFallback(ffmpeg, lists);
    const data = ffmpeg.FS('readFile', outName);
    downloadBlob(new Blob([data.buffer], {type: o.out==='wav'?'audio/wav': (o.out==='m4a'?'audio/mp4':'audio/mpeg')}), rename(f.name, o.out));
    log('✓ Saved ' + rename(f.name, o.out));
  };
})();