
(async function(){
  await __boot.loadFirst(['libs/jszip/jszip.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js']);
  const byId = (id)=>document.getElementById(id);
  const logEl = byId('zip-log');
  function log(m){ if(logEl){ logEl.textContent += m+'\n'; logEl.scrollTop = logEl.scrollHeight; } }

  function download(name, blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }

  byId('zip-make')?.addEventListener('click', async ()=>{
    const files = byId('zip-files')?.files || [];
    if (!files.length) return alert('Pick files or a folder');
    const level = parseInt(byId('zip-level').value||'5',10);
    Progress && Progress.show('Zipping…');
    const zip = new JSZip();
    let i=0;
    for (const f of files){
      const path = (f.webkitRelativePath || f.name);
      zip.file(path, f);
      i++; if (i%10===0) Progress && Progress.update(Math.round(i*100/files.length));
    }
    const blob = await zip.generateAsync({ type:'blob', compression:'DEFLATE', compressionOptions:{ level }}, (m)=>{
      if (m && typeof m.percent==='number') Progress && Progress.update(Math.round(m.percent));
    });
    Progress && Progress.done();
    download('archive.zip', blob);
    log('Done.');
  });

  byId('zip-unpack')?.addEventListener('click', async ()=>{
    const f = byId('zip-file')?.files?.[0];
    if (!f) return alert('Pick a ZIP');
    const preview = document.getElementById('zip-preview'); preview.innerHTML='';
    const zip = await JSZip.loadAsync(f);
    for (const [name, entry] of Object.entries(zip.files)){
      const div = document.createElement('div'); div.textContent = name; preview.appendChild(div);
    }
  });
})();
