// ZIP
byId("zip-make-btn")?.addEventListener("click", async ()=>{
  const files = Array.from(byId("zip-make-input").files||[]); const logEl = byId("zip-make-log"); logEl.textContent="";
  if(!files.length) return alert("Pick files");
  const zip = new JSZip();
  for(const f of files){
    zip.file(f.name, await f.arrayBuffer());
    log(logEl, `Added ${f.name}`);
  }
  const blob = await zip.generateAsync({type:"blob"});
  downloadBlob(blob, "bundle.zip");
  log(logEl, "✓ Saved bundle.zip");
});
// Unzip
byId("zip-open-btn")?.addEventListener("click", async ()=>{
  const f = (byId("zip-open-input").files||[])[0]; const logEl = byId("zip-open-log"); logEl.textContent="";
  if(!f) return alert("Pick a .zip");
  const zip = await JSZip.loadAsync(await f.arrayBuffer());
  for(const [name,file] of Object.entries(zip.files)){
    if(file.dir) continue;
    const blob = await file.async("blob");
    downloadBlob(blob, name);
    log(logEl, `Extracted ${name}`);
  }
  log(logEl, "✓ Unzipped all files");
});