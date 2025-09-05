(async function(){
  // load libs
  await __boot.loadFirst(['libs/papaparse/papaparse.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js']);
  await __boot.loadFirst(['libs/xlsx/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);

  const byId=(id)=>document.getElementById(id);
  const log=(id,msg)=>{ const el=byId(id); if(el){ el.textContent += msg+'\n'; el.scrollTop = el.scrollHeight; } };
  function flatten(obj,prefix='',res={}){ for(const [k,v] of Object.entries(obj||{})){ const key=prefix?`${prefix}.${k}`:k; if(v && typeof v==='object' && !Array.isArray(v)) flatten(v,key,res); else res[key]=v; } return res; }
  function tableFromArray(arr){
    const cols = Array.from(arr.reduce((s,o)=>{Object.keys(o||{}).forEach(k=>s.add(k));return s;}, new Set()));
    const header = '<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
    const rows = arr.map(o=>'<tr>'+cols.map(c=>`<td>${(o||{})[c]??''}</td>`).join('')+'</tr>').join('');
    return `<table style="border-collapse:collapse;width:100%"><thead>${header}</thead><tbody>${rows}</tbody></table>`;
  }

  // CSV -> JSON
  byId('csv-to-json').onclick = async ()=>{
    const f = byId('csv-file').files[0]; if(!f) return alert('Pick a CSV');
    const delim = byId('csv-delim').value.replace('\\t','\t'); const header = byId('csv-header').value==='true';
    const text = await f.text();
    const parsed = Papa.parse(text, { header, delimiter: delim });
    const json = JSON.stringify(parsed.data, null, 2);
    downloadBlob(new Blob([json],{type:'application/json'}), f.name.replace(/\.csv$/i,'')+'.json');
    log('data-log','✓ CSV → JSON');
  };

  // JSON -> CSV
  byId('json-to-csv').onclick = async ()=>{
    const text = byId('json-input').value.trim(); if(!text) return alert('Paste JSON');
    let data = JSON.parse(text); if(!Array.isArray(data)) data=[data];
    const csv = Papa.unparse(data.map(x=>flatten(x)));
    downloadBlob(new Blob([csv],{type:'text/csv'}),'data.csv');
    log('data-log','✓ JSON → CSV');
  };

  // XLSX load sheets
  byId('xlsx-load').onclick = async ()=>{
    const f = byId('xlsx-file').files[0]; if(!f) return alert('Pick XLSX');
    const wb = XLSX.read(await f.arrayBuffer());
    const sel = byId('xlsx-sheet'); sel.innerHTML = wb.SheetNames.map(n=>`<option>${n}</option>`).join('');
    log('xlsx-log', `Loaded ${wb.SheetNames.length} sheet(s)`);
    sel.dataset._wb = f.name; window._wb = wb;
  };

  // XLSX -> JSON
  byId('xlsx-to-json').onclick = async ()=>{
    if(!window._wb) return alert('Load sheets first');
    const sheet = byId('xlsx-sheet').value;
    const dates = byId('xlsx-dates').value==='true';
    const ws = window._wb.Sheets[sheet];
    const json = XLSX.utils.sheet_to_json(ws, { raw: dates, defval: '' });
    downloadBlob(new Blob([JSON.stringify(json,null,2)],{type:'application/json'}), sheet+'.json');
    log('xlsx-log','✓ Sheet → JSON');
  };

  // XLSX -> CSV
  byId('xlsx-to-csv').onclick = async ()=>{
    if(!window._wb) return alert('Load sheets first');
    const sheet = byId('xlsx-sheet').value;
    const ws = window._wb.Sheets[sheet];
    const csv = XLSX.utils.sheet_to_csv(ws);
    downloadBlob(new Blob([csv],{type:'text/csv'}), sheet+'.csv');
    log('xlsx-log','✓ Sheet → CSV');
  };

  // JSON -> DOC (.doc via HTML)
  function escapeHtml(s){ return (s+'').replace(/[&<>]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m])); }
  function rowsToPlainText(rows){
    const out=[]; rows.forEach((row,i)=>{ const flat=flatten(row||{}); for(const [k,v] of Object.entries(flat)) out.push(`${k}: ${typeof v==='object'?JSON.stringify(v):(v??'')}`); if(i<rows.length-1) out.push(''); });
    return out.join('\n');
  }
  function renderJsonToHtml(rows, title){
    const flat = rows.map(x=>flatten(x));
    const html = tableFromArray(flat);
    const fragment = (title?`<h1>${title}</h1>`:'') + html + `<style>body{font-family:Segoe UI,Arial,sans-serif}td,th{border:1px solid #999;padding:6px}</style>`;
    const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title||'Document'}</title></head><body>${fragment}</body></html>`;
    return { fragment, page };
  }
  async function readJsonDocInput(){
    const ta = byId('jsondoc-input'); const fi = byId('jsondoc-file');
    const txt = (ta && ta.value.trim()) || (fi && fi.files && fi.files[0]? await fi.files[0].text() : '[]');
    let data = JSON.parse(txt); if(!Array.isArray(data)) data=[data]; return data;
  }
  byId('jsondoc-preview').onclick = async ()=>{
    const data = await readJsonDocInput();
    const title = byId('jsondoc-title').value.trim();
    const plain = byId('jsondoc-plain').checked;
    const box = byId('jsondoc-preview-box'); box.classList.add('hidden'); box.innerHTML=''; box.style.whiteSpace='';
    if (plain){
      const txt = (title? title + '\n\n' : '') + rowsToPlainText(data);
      box.textContent = txt; box.style.whiteSpace='pre-wrap';
    } else {
      const html = renderJsonToHtml(data, title);
      box.innerHTML = html.page;
      const b = byId('jsondoc-dl-html'); b.disabled=false; b.onclick=()=> downloadBlob(new Blob([html.fragment],{type:'text/html'}),'doc-source.html');
    }
    box.classList.remove('hidden');
  };
  byId('jsondoc-doc').onclick = async ()=>{
    try{
      const data = await readJsonDocInput();
      const title = byId('jsondoc-title').value.trim();
      const plain = byId('jsondoc-plain').checked;
      let blob, name='data.doc';
      if (plain){
        const txt = (title? title + '\n\n' : '') + rowsToPlainText(data);
        const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title||'Document'}</title></head><body><pre>${escapeHtml(txt)}</pre></body></html>`;
        blob = new Blob([page], { type: 'application/msword' }); name='data_plain.doc';
      } else {
        const html = renderJsonToHtml(data, title);
        blob = new Blob([html.page], { type: 'application/msword' });
      }
      downloadBlob(blob, name);
      const logEl = byId('jsondoc-log'); if (logEl) logEl.textContent = '✓ Saved ' + name;
    }catch(e){
      const logEl = byId('jsondoc-log'); if (logEl) logEl.textContent = 'Error: ' + (e?.message||e);
      console.error(e);
    }
  };
})();