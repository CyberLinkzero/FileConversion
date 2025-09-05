
(async function(){
  // Use PDF.js to render pages
  await __boot.loadFirst(['libs/pdfjs/pdf.min.mjs','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs']);
  const byId = (id)=>document.getElementById(id);
  const logEl = byId('pdf-log');
  function log(m){ if(logEl){ logEl.textContent += m+'\n'; logEl.scrollTop = logEl.scrollHeight; } }

  function parseRanges(spec, max){
    if(!spec) return Array.from({length:max},(_,i)=>i+1);
    const pages = new Set();
    spec.split(',').forEach(part=>{
      const m = part.trim().match(/^(\d+)(-(\d+))?$/);
      if (m){
        const a=+m[1], b=m[3]?+m[3]:a;
        for (let p=Math.max(1,a); p<=Math.min(max,b); p++) pages.add(p);
      }
    });
    return Array.from(pages).sort((a,b)=>a-b);
  }

  byId('pdf-convert')?.addEventListener('click', async ()=>{
    const f = byId('pdf-file')?.files?.[0];
    if(!f) return alert('Pick a PDF');
    const dpi = parseInt(byId('pdf-dpi').value||'144',10);
    const bg = byId('pdf-bg').value;
    const data = new Uint8Array(await f.arrayBuffer());

    const pdfjs = await import('libs/pdfjs/pdf.min.mjs').catch(()=>import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs'));
    const pdf = await pdfjs.getDocument({ data }).promise;
    const max = pdf.numPages;
    const ranges = parseRanges(byId('pdf-pages').value.trim(), max);
    const preview = byId('pdf-preview'); preview.innerHTML=''; let idx=0;
    for (const pno of ranges){
      idx++;
      Progress && Progress.show(`Rendering page ${pno}/${ranges.length}`);
      const page = await pdf.getPage(pno);
      const scale = dpi/72;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext('2d', { alpha: bg==='transparent' });
      if (bg==='white'){ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
      await page.render({ canvasContext: ctx, viewport }).promise;
      const a = document.createElement('a');
      a.download = f.name.replace(/\.pdf$/i,'') + `-p${pno}.png`;
      a.href = canvas.toDataURL('image/png');
      const img = document.createElement('img'); img.src=a.href; img.style.maxWidth='100%'; img.style.display='block'; img.style.marginBottom='8px';
      preview.appendChild(img);
      const btn = document.createElement('button'); btn.textContent='Download page '+pno; btn.onclick=()=>a.click(); preview.appendChild(btn);
      Progress && Progress.update(Math.round(idx*100/ranges.length));
    }
    Progress && Progress.done();
    log('Done.');
  });
})();
