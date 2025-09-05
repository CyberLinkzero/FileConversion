
(async function(){
  // Optional HEIC support
  try{ await __boot.loadFirst(['libs/heic2any/heic2any.min.js','https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.1/index.min.js']); }catch(e){ /* optional */ }

  const byId = (id)=>document.getElementById(id);
  const logEl = byId('img-log');
  function log(m){ if(logEl){ logEl.textContent += m+'\n'; logEl.scrollTop = logEl.scrollHeight; } }

  async function readImageFile(file){
    if (/\.heic$/i.test(file.name) && window.heic2any){
      // Convert HEIC -> blob PNG via heic2any first
      const blob = await window.heic2any({ blob: file, toType: 'image/png' });
      return await createImageBitmap(blob);
    }
    return await createImageBitmap(file);
  }

  byId('img-convert')?.addEventListener('click', async ()=>{
    const f = byId('img-file')?.files?.[0];
    if(!f) return alert('Pick an image');
    const fmt = byId('img-format').value;
    const quality = parseFloat(byId('img-quality').value||'0.85');
    const maxW = parseInt(byId('img-w').value||'0',10);
    const maxH = parseInt(byId('img-h').value||'0',10);
    const bg = byId('img-bg').value;

    const bmp = await readImageFile(f);
    let w = bmp.width, h = bmp.height;
    if (maxW>0 || maxH>0){
      const rw = maxW>0 ? maxW/w : 1;
      const rh = maxH>0 ? maxH/h : 1;
      const r = Math.min(rw||1, rh||1);
      if (r<1){ w = Math.floor(w*r); h = Math.floor(h*r); }
    }
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d');
    if (fmt==='jpeg'){ ctx.fillStyle = bg || '#ffffff'; ctx.fillRect(0,0,w,h); }
    ctx.drawImage(bmp, 0,0, w,h);

    const type = fmt==='jpeg' ? 'image/jpeg' : (fmt==='png' ? 'image/png' : 'image/webp');
    const blob = await new Promise(res=> canvas.toBlob(res, type, fmt==='png'? undefined : quality));
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download = f.name.replace(/\.[^.]+$/,'') + '.' + (fmt==='jpeg'?'jpg':fmt); a.click();

    const prev = byId('img-preview'); if(prev){ prev.innerHTML=''; const img=document.createElement('img'); img.src=a.href; img.style.maxWidth='100%'; prev.appendChild(img); }
    log('Done.');
  });
})();
