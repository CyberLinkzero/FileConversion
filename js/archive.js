(async function(){
  await __boot.loadFirst(['libs/jszip/jszip.min.js','https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js']);
  const byId=(id)=>document.getElementById(id);
  const log=(msg)=>{ const el=byId('zip-log'); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };
  byId('zip-make').onclick = async ()=>{
    const files = byId('zip-files').files; if(!files.length) return alert('Pick files');
    const zip = new JSZip();
    const level = +byId('zip-level').value;
    const flatten = byId('zip-flatten').value==='true';
    for (const f of files){
      const path = flatten ? f.name.split(/[\\/]/).pop() : f.webkitRelativePath || f.name;
      zip.file(path, await f.arrayBuffer(), { compression: level? 'DEFLATE':'STORE', compressionOptions:{level} });
      log('Added ' + path);
    }
    const blob = await zip.generateAsync({ type:'blob' });
    downloadBlob(blob, 'files.zip'); log('✓ Saved files.zip');
  };
})();