// Local-first loader with CDN fallback
window.__boot = (function(){
  function loadScript(url){
    return new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = url; s.async = false;
      s.onload = ()=>res(url); s.onerror = ()=>rej(new Error('Failed to load ' + url));
      document.head.appendChild(s);
    });
  }
  async function loadFirst(urls){
    let lastErr;
    for(const u of urls){
      try{ return await loadScript(u); }catch(e){ console.warn('load failed', u, e); lastErr = e; }
    }
    throw lastErr || new Error('All sources failed');
  }
  async function loadModuleFirst(urls){
    let lastErr;
    for(const u of urls){
      try{ return await import(u); }catch(e){ console.warn('module import failed', u, e); lastErr = e; }
    }
    throw lastErr || new Error('All module sources failed');
  }
  return { loadFirst, loadModuleFirst };
})();