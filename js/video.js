(async function(){
  const byId=(id)=>document.getElementById(id);
  const log=(msg)=>{ const el=byId('vid-log'); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };
  async function ensureFFmpeg(){
    if (window.createFFmpeg && window.fetchFile) return;
    const mod = await window.__boot.loadModuleFirst(['https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js']);
    window.createFFmpeg = mod.createFFmpeg; window.fetchFile = mod.fetchFile;
  }
  function getVideoOpts(){
    return {
      out: byId('vid-out').value, res: byId('vid-res').value, fps: byId('vid-fps').value,
      crf: byId('vid-crf').value, preset: byId('vid-preset').value, abr: byId('vid-abr').value,
      ss: byId('vid-ss').value.trim(), t: byId('vid-t').value.trim(), rot: byId('vid-rot').value
    };
  }
  function scaleFilter(height){ if(!height) return null; return `scale=-2:${height}`; }
  function rotateExpr(rot){
    if (!rot) return null;
    if (rot==='clock') return 'transpose=1';
    if (rot==='cclock') return 'transpose=2';
    if (rot==='180') return 'hflip,vflip';
    return null;
  }
  function buildArgs(inName, outName, o){
    const base = ['-y']; if (o.ss) base.push('-ss', o.ss); base.push('-i', inName);
    const filters = [];
    const sc = scaleFilter(o.res); if(sc) filters.push(sc);
    const rt = rotateExpr(o.rot); if(rt) filters.push(rt);
    if (filters.length) base.push('-vf', filters.join(','));
    if (o.fps) base.push('-r', o.fps);

    const lists = [];
    if (o.out==='mp4'){
      const aac = (o.abr==='mute')?['-an']:['-c:a','aac','-b:a', o.abr];
      const h264 = [...base, '-c:v','libx264','-preset',o.preset,'-crf',o.crf,'-pix_fmt','yuv420p', ...aac, '-movflags','+faststart', outName];
      const mpeg4 = [...base, '-c:v','mpeg4', ...(o.abr==='mute'?['-an']:['-c:a','aac','-b:a', o.abr]), '-qscale:v','3', outName];
      lists.push(h264, mpeg4);
      if (o.t) lists.forEach(a=>a.push('-t', o.t));
      return lists;
    } else {
      const vorbis = (o.abr==='mute')?['-an']:['-c:a','libvorbis','-b:a', o.abr];
      const vp8 = [...base, '-c:v','libvpx','-crf', o.crf,'-b:v','0', ...vorbis, outName];
      const mjpeg = [...base, '-c:v','mjpeg', ...(o.abr==='mute'?['-an']:['-c:a','aac','-b:a', o.abr]), outName];
      lists.push(vp8, mjpeg);
      if (o.t) lists.forEach(a=>a.push('-t', o.t));
      return lists;
    }
  }
  async function runWithFallback(ffmpeg, argLists){
    let err; for(const args of argLists){ try{ await ffmpeg.run(...args); return; }catch(e){ err=e; log('Retrying with fallback...'); } }
    throw err||new Error('Encode failed');
  }
  byId('vid-convert').onclick = async ()=>{
    const f = byId('vid-file').files[0]; if(!f) return alert('Pick a video/gif');
    await ensureFFmpeg();
    const { createFFmpeg, fetchFile } = window;
    const ffmpeg = createFFmpeg({ log:false });
    await ffmpeg.load();
    const o = getVideoOpts();
    const inName = 'in.' + (f.name.split('.').pop()||'dat');
    const outName = 'out.' + o.out;
    ffmpeg.FS('writeFile', inName, await fetchFile(f));
    const lists = buildArgs(inName, outName, o);
    await runWithFallback(ffmpeg, lists);
    const data = ffmpeg.FS('readFile', outName);
    const mime = o.out==='mp4'?'video/mp4':'video/webm';
    downloadBlob(new Blob([data.buffer], {type: mime}), rename(f.name, o.out));
    log('✓ Saved ' + rename(f.name, o.out));
  };
})();