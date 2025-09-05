
(async function(){
  await __boot.loadFirst(['libs/papaparse/papaparse.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js']);
  await __boot.loadFirst(['libs/xlsx/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);

  const byId = (id)=>document.getElementById(id);
  const logEl = byId('data-log');
  function log(m){ if(logEl){ logEl.textContent += m+'\n'; logEl.scrollTop = logEl.scrollHeight; } }

  function download(name, blob){
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click();
  }

  byId('data-convert')?.addEventListener('click', async ()=>{
    const file = byId('data-file')?.files?.[0];
    let text = byId('data-text').value.trim();
    let rows = [], json = null, name = 'data';
    if (file){
      name = file.name.replace(/\.[^.]+$/,'');
      if (/\.xlsx?$/i.test(file.name)){
        const wb = XLSX.read(await file.arrayBuffer());
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
      } else {
        text = await file.text();
      }
    }
    if (!rows.length && text){
      // detect JSON vs CSV
      try{ json = JSON.parse(text); }catch{ json = null; }
      if (json){
        if (Array.isArray(json)) rows = json;
        else if (json && typeof json==='object') rows = [json];
      } else {
        const parsed = Papa.parse(text, { header:true, skipEmptyLines:true });
        rows = parsed.data;
      }
    }
    const out = byId('data-out').value;
    if (out==='csv'){
      const csv = Papa.unparse(rows);
      download(name+'.csv', new Blob([csv],{type:'text/csv'}));
    } else if (out==='json'){
      const pretty = JSON.stringify(rows, null, 2);
      download(name+'.json', new Blob([pretty],{type:'application/json'}));
    } else if (out==='xlsx'){
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const buf = XLSX.write(wb, { bookType:'xlsx', type:'array' });
      download(name+'.xlsx', new Blob([buf], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
    }
    log('Done.');
  });
})();
