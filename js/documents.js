import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs';

const byId = (id)=>document.getElementById(id);
const log = (msg)=>{ const el=byId('pdf-log'); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };

function parseRanges(s, total){
  if(!s || !s.trim()) return Array.from({length: total}, (_,i)=>i+1);
  const out = new Set();
  for (const part of s.split(',')){
    if (part.includes('-')){
      const [a,b] = part.split('-').map(x=>x.trim());
      const start = Math.max(1, parseInt(a||'1'));
      const end = b? (b.trim()===''? total: parseInt(b)) : start;
      for (let i=start;i<=Math.min(end, total);i++) out.add(i);
    } else {
      const n = parseInt(part.trim()); if(!isNaN(n) && n>=1 && n<=total) out.add(n);
    }
  }
  return Array.from(out).sort((a,b)=>a-b);
}

byId('pdf-render').onclick = async ()=>{
  const f = byId('pdf-file').files[0]; if(!f) return alert('Pick a PDF');
  const dpi = parseInt(byId('pdf-dpi').value||'150'); const scale = dpi/72;
  const fmt = byId('pdf-img-out').value; const transparent = byId('pdf-bg').value==='Transparent';
  const data = new Uint8Array(await f.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages = parseRanges(byId('pdf-range').value, pdf.numPages);
  log(`Rendering ${pages.length} page(s) at ${dpi} DPI...`);

  for (const p of pages){
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    const ctx = canvas.getContext('2d', { alpha: transparent });
    if (!transparent){ ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
    await page.render({ canvasContext: ctx, viewport }).promise;
    const mime = fmt==='png'?'image/png':'image/jpeg';
    const blob = await new Promise(res=> canvas.toBlob(res, mime, 0.9));
    downloadBlob(blob, `${f.name.replace(/\.pdf$/i,'')}_p${p}.${fmt}`);
    log(`✓ Page ${p}`);
  }
};