window.$ = (s)=>document.querySelector(s);
window.$$ = (s)=>Array.from(document.querySelectorAll(s));
window.byId = (id)=>document.getElementById(id);
window.log = (el,msg)=>{ if(!el) return; el.textContent += msg + "\n"; el.scrollTop = el.scrollHeight; };
window.rename = (name,newExt)=> name.replace(/\.[^.]+$/, '') + '.' + newExt;
window.downloadBlob = (blob, filename)=>{
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename || 'download';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(url), 0);
};
window.ensureProgress = (hostId)=>{
  const host = byId(hostId); if(!host) return null;
  let el = host.querySelector('.progress > span');
  if(!el){
    host.insertAdjacentHTML('beforeend','<div class="progress"><span></span></div>');
    el = host.querySelector('.progress > span');
  }
  return (pct)=>{ if(el) el.style.width = Math.max(0, Math.min(100, pct)) + '%'; };
};
document.addEventListener('DOMContentLoaded',()=>{
  const y = byId('year'); if (y) y.textContent = new Date().getFullYear();
});