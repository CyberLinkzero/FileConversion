window.$ = (sel)=>document.querySelector(sel);
window.$$ = (sel)=>Array.from(document.querySelectorAll(sel));
window.byId = (id)=>document.getElementById(id);
window.log = (el,msg)=>{ if(!el) return; el.textContent += msg + "\n"; el.scrollTop = el.scrollHeight; };
window.rename = (name,newExt)=> name.replace(/\.[^.]+$/, '') + '.' + newExt;
window.downloadBlob = (blob, filename)=>{
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename || 'download';
  // append for Safari/iOS compatibility
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke after a tick to allow the click to resolve
  setTimeout(()=> URL.revokeObjectURL(url), 0);
};
document.addEventListener('DOMContentLoaded',()=>{
  const y = byId('year'); if (y) y.textContent = new Date().getFullYear();
  try{
    const saved = JSON.parse(localStorage.getItem('anyconvert_brand')||'null');
    if(saved){
      document.title = saved.name || document.title;
      const h1 = document.querySelector('h1'); if(h1) h1.textContent = saved.name || h1.textContent;
      document.documentElement.style.setProperty('--brand', saved.primary || '#7dd3fc');
      document.documentElement.style.setProperty('--accent', saved.secondary || '#a78bfa');
    }
  }catch{}
});

// progress helpers
function ensureProgress(containerId){
  let wrap = byId(containerId);
  if(!wrap) return null;
  if(!wrap.querySelector('.bar')){ wrap.innerHTML = '<div class="bar"></div>'; }
  return wrap.querySelector('.bar');
}
function setProgress(barEl, ratio){
  if(!barEl) return;
  const pct = Math.max(0, Math.min(100, Math.round((ratio||0)*100)));
  barEl.style.width = pct + '%';
}
function finishProgress(barEl){
  setProgress(barEl, 1);
  setTimeout(()=> setProgress(barEl, 0), 600);
}