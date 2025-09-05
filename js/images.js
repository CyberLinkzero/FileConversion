(async function(){
  const byId = (id)=>document.getElementById(id);
  const log = (msg)=>{ const el=byId('img-log'); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };
  function fitDraw(img, W, H, fit, bg){
    const sw = img.naturalWidth, sh = img.naturalHeight;
    let tw = sw, th = sh;
    if (W || H){
      if (fit==='stretch'){
        tw = W||sw; th = H||sh;
      } else if (fit==='cover'){
        const r = Math.max( (W||sw)/sw, (H||sh)/sh ); tw = Math.round(sw*r); th = Math.round(sh*r);
      } else if (fit==='contain'){
        const r = Math.min( (W||sw)/sw, (H||sh)/sh ); tw = Math.round(sw*r); th = Math.round(sh*r);
      } else { // none
        tw = Math.min(sw, W||sw); th = Math.min(sh, H||sh);
      }
    }
    const cw = fit==='contain' || fit==='cover' ? (W||tw) : tw;
    const ch = fit==='contain' || fit==='cover' ? (H||th) : th;
    const x = Math.floor((cw - tw)/2), y = Math.floor((ch - th)/2);
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    if (bg==='white') { ctx.fillStyle='#fff'; ctx.fillRect(0,0,cw,ch); }
    if (bg==='black') { ctx.fillStyle='#000'; ctx.fillRect(0,0,cw,ch); }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, x, y, tw, th);
    return c;
  }
  byId('img-convert').onclick = async ()=>{
    const files = byId('img-files').files; if(!files.length) return alert('Pick images');
    const out = byId('img-out').value; const qv = byId('img-q').value; const q = qv? (parseInt(qv)/100):undefined;
    const W = +byId('img-w').value||0; const H = +byId('img-h').value||0;
    const fit = byId('img-fit').value.toLowerCase(); const bg = byId('img-bg').value.toLowerCase();
    for (const f of files){
      const url = URL.createObjectURL(f);
      const img = new Image(); img.src = url; await img.decode();
      const canvas = fitDraw(img, W, H, fit, bg);
      const type = out==='jpg'?'image/jpeg': (out==='png'?'image/png':'image/webp');
      const blob = await new Promise(res=> canvas.toBlob(res, type, q));
      URL.revokeObjectURL(url);
      downloadBlob(blob, rename(f.name, out));
      log('✓ ' + f.name + ' → ' + rename(f.name,out));
    }
  };

  // Animated GIF/WebP with ffmpeg.wasm (loaded on demand via CDN)
  async function ensureFFmpeg(){
    if (window.createFFmpeg && window.fetchFile) return;
    const mod = await window.__boot.loadModuleFirst([
      'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js'
    ]);
    window.createFFmpeg = mod.createFFmpeg; window.fetchFile = mod.fetchFile;
  }
  function gifArgs(inName, outName, {fps, h, loop, ditherOn}){
    const base = ['-i', inName, '-y']; if (fps) base.push('-r', String(fps));
    const dither = ditherOn ? 'sierra2_4a' : 'none';
    if (outName.endsWith('.gif')){
      const scale = h? `scale=-2:${h}` : null;
      return [
        ['-i', inName, ...(fps?['-r',String(fps)]:[]), ...(scale?['-vf',`${scale},palettegen`]:['-vf','palettegen']), '-y', 'pal.png'],
        ['-i', inName, '-i', 'pal.png', ...(fps?['-r',String(fps)]:[]),
         ...(scale?['-vf',f'[x];[x][1:v]paletteuse=dither={dither}'.replace('[x]', scale)]:['-lavfi',`paletteuse=dither=${dither}`]),
         '-loop', String(loop), '-y', outName]
      ];
    } else { // webp
      const scale = h? `scale=-2:${h}` : null;
      return [['-i', inName, ...(fps?['-r',String(fps)]:[]), ...(scale?['-vf',scale]:[]), '-loop', String(loop), '-y', outName]];
    }
  }
  byId('anim-convert').onclick = async ()=>{
    const f = byId('anim-file').files[0]; if(!f) return alert('Pick a GIF or WebP');
    const out = byId('anim-out').value;
    const fps = parseInt(byId('gif-fps').value); const h = parseInt(byId('gif-h').value)||0;
    const loop = parseInt(byId('gif-loop').value||'0'); const ditherOn = byId('gif-dither').value==='On';
    await ensureFFmpeg();
    const { createFFmpeg, fetchFile } = window;
    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();
    const inName = 'in.' + f.name.split('.').pop().toLowerCase();
    const outName = 'out.' + out;
    ffmpeg.FS('writeFile', inName, await fetchFile(f));
    const jobs = gifArgs(inName, outName, {fps, h: h||null, loop, ditherOn});
    for (const args of jobs){ await ffmpeg.run(...args); }
    const data = ffmpeg.FS('readFile', outName);
    downloadBlob(new Blob([data.buffer], {type: out==='gif'?'image/gif':'image/webp'}), rename(f.name, out));
  };
})();