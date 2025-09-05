// Shared boot utilities (local-first with CDN fallback)
window.__boot = (function(){
  function loadScript(url){
    return new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = url; s.async = false;
      s.onload = ()=>res(url);
      s.onerror = ()=>rej(new Error('Failed to load ' + url));
      document.head.appendChild(s);
    });
  }
  async function loadModule(url){
    // dynamic import for ESM (pdf.js, ffmpeg)
    try{
      await import(url);
      return url;
    }catch(e){
      throw new Error('Failed to import ' + url + ': ' + (e?.message||e));
    }
  }
  async function loadFirst(urls, isModule=false){
    let lastErr;
    for(const u of urls){
      try{
        if(isModule) return await loadModule(u);
        else return await loadScript(u);
      }catch(e){ console.warn('load failed', u, e); lastErr = e; }
    }
    throw lastErr || new Error('All sources failed');
  }
  function deferPageScript(src){
    return new Promise((res, rej)=>{
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  return { loadFirst, deferPageScript };
})();