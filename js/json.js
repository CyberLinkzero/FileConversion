// -------- JSON helpers --------
function flatten(obj, prefix='', res={}){
  for(const [k,v] of Object.entries(obj||{})){
    const key = prefix ? `${prefix}.${k}` : k;
    if(v && typeof v === 'object' && !Array.isArray(v)){
      flatten(v, key, res);
    }else{
      res[key] = v;
    }
  }
  return res;
}
function tableFromArray(arr){
  const cols = Array.from(arr.reduce((s,o)=>{Object.keys(o).forEach(k=>s.add(k)); return s;}, new Set()));
  const header = '<tr>'+cols.map(c=>`<th>${c}</th>`).join('')+'</tr>';
  const rows = arr.map(o=>'<tr>'+cols.map(c=>`<td>${o[c]??''}</td>`).join('')+'</tr>').join('');
  return `<table style="border-collapse:collapse;width:100%"><thead>${header}</thead><tbody>${rows}</tbody></table>`;
}

// -------- JSON ⇄ CSV preview & export --------
byId("json-preview")?.addEventListener("click", async ()=>{
  const area = byId("json-preview-area"); area.classList.add("hidden"); area.innerHTML="";
  const str = byId("json-input").value.trim() || await (async()=>{
    const f = (byId("json-file").files||[])[0]; if(!f) return '[]'; return await f.text();
  })();
  try{
    let data = JSON.parse(str); if(!Array.isArray(data)) data = [data];
    let flat = data.map(x=>flatten(x));
    if(byId("json-stringify-nonprim").checked){
      flat = flat.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k, (v && typeof v==='object')?JSON.stringify(v):v])));
    }
    if(byId("json-explode-arr").checked){
      // Try explode the first array column found
      const first = flat[0] || {};
      const key = Object.keys(first).find(k=>Array.isArray(first[k]));
      if(key){
        const exploded=[];
        for(const row of flat){
          const arr = Array.isArray(row[key]) ? row[key] : [row[key]];
          arr.forEach(val=>exploded.push({...row, [key]: val}));
        }
        flat = exploded;
      }
    }
    const html = tableFromArray(flat.slice(0,100));
    area.innerHTML = html; area.classList.remove("hidden");
    byId("json-log").textContent = `Previewing ${Math.min(100, flat.length)} of ${flat.length} rows`;
  }catch(e){ byId("json-log").textContent = `Error: ${e.message}`; }
});

byId("json-to-csv")?.addEventListener("click", async ()=>{
  const str = byId("json-input").value.trim() || await (async()=>{
    const f = (byId("json-file").files||[])[0]; if(!f) return '[]'; return await f.text();
  })();
  try{
    let data = JSON.parse(str); if(!Array.isArray(data)) data=[data];
    let flat = data.map(x=>flatten(x));
    if(byId("json-stringify-nonprim").checked){
      flat = flat.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k, (v && typeof v==='object')?JSON.stringify(v):v])));
    }
    const csv = Papa.unparse(flat);
    downloadBlob(new Blob([csv],{type:"text/csv"}),"data.csv");
  }catch(e){ byId("json-log").textContent = `Error: ${e.message}`; }
});

byId("csv-preview")?.addEventListener("click", async ()=>{
  const f = (byId("csv-file").files||[])[0]; const area = byId("csv-preview-area"); const logEl = byId("csv-log");
  area.classList.add("hidden"); area.innerHTML=""; logEl.textContent="";
  if(!f) return alert("Pick a CSV");
  const text = await f.text();
  const parsed = Papa.parse(text, {header:true});
  const rows = parsed.data;
  area.innerHTML = tableFromArray(rows.slice(0,100));
  area.classList.remove("hidden");
  log(logEl, `Parsed ${rows.length} rows`);
});
byId("csv-to-json")?.addEventListener("click", async ()=>{
  const f = (byId("csv-file").files||[])[0]; const logEl = byId("csv-log");
  if(!f) return alert("Pick a CSV");
  const text = await f.text();
  const parsed = Papa.parse(text, {header:true});
  const json = JSON.stringify(parsed.data, null, 2);
  downloadBlob(new Blob([json],{type:"application/json"}),"data.json");
  log(logEl, "✓ Saved data.json");
});

// -------- JSON ⇄ DOCX --------
byId("jsondoc-preview")?.addEventListener("click", async ()=>{
  const data = await readJsonDocInput(); const box = byId("jsondoc-preview-box"); box.classList.add("hidden"); box.innerHTML="";
  const mode = byId("jsondoc-mode").value; const title = byId("jsondoc-title").value.trim();
  const html = renderJsonToHtml(data, mode, title);
  box.innerHTML = html; box.classList.remove("hidden");
});

byId("jsondoc-docx")?.addEventListener("click", async ()=>{ byId("jsondoc-log").textContent = "Generating DOCX…";
  try{
    await ensureHtmlDocx();
    const data = await readJsonDocInput();
    const mode = byId("jsondoc-mode").value; const title = byId("jsondoc-title").value.trim();
    const html = renderJsonToHtml(data, mode, title);
    const blob = window.htmlDocx.asBlob(html);
    downloadBlob(blob, "data.docx");
  }catch(e){
    byId("jsondoc-log").textContent = "Error: " + (e?.message||e);
    console.error(e);
  }
});

async function readJsonDocInput(){
  const txt = byId("jsondoc-input").value.trim() || await (async()=>{
    const f = (byId("jsondoc-file").files||[])[0]; if(!f) return '[]'; return await f.text();
  })();
  let data = JSON.parse(txt); if(!Array.isArray(data)) data=[data]; return data;
}

function renderJsonToHtml(rows, mode, title){
  let body='';
  if(mode==='table'){ body = tableFromArray(rows); }
  else {
    body = rows.map((row,i)=>'<div style="padding:8px;border:1px solid #ccc;margin-bottom:8px">'+
      Object.entries(row).map(([k,v])=>`<div><strong>${k}:</strong> ${typeof v==='object'?JSON.stringify(v):v}</div>`).join('')
    +'</div>').join('');
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>table,td,th{border:1px solid #999}td,th{padding:6px}</style></head><body>`+
         (title?`<h1>${title}</h1>`:'')+ body +`</body></html>`;
}

// Robust loader with multi-CDN fallback
async function ensureHtmlDocx(){
  if (window.htmlDocx && window.htmlDocx.asBlob) return;
  const urls = [
    'https://cdn.jsdelivr.net/npm/html-docx-js@0.4.1/dist/html-docx.min.js',
    'https://unpkg.com/html-docx-js@0.4.1/dist/html-docx.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html-docx-js/0.4.1/html-docx.min.js'
  ];
  for (const url of urls){
    try{
      await new Promise((res, rej)=>{
        const s = document.createElement('script');
        s.src = url; s.crossOrigin = 'anonymous';
        s.onload = res; s.onerror = ()=>rej(new Error('load failed: ' + url));
        document.head.appendChild(s);
      });
      if (window.htmlDocx && window.htmlDocx.asBlob) return;
    }catch(e){
      console.warn('html-docx-js load error:', e && e.message || e);
    }
  }
  throw new Error('Could not load html-docx-js from CDNs');
}

// -------- DOCX → HTML/TXT/JSON preview + export --------
byId("docx-to-html")?.addEventListener("click", async ()=>{
  const f = (byId("docx-in").files||[])[0]; const logEl = byId("docx-log"); const prev = byId("docx-html-preview");
  if(!f) return alert("Pick a .docx");
  await window.ensureMammoth();
  const arrayBuffer = await f.arrayBuffer();
  const result = await window.mammoth.convertToHtml({arrayBuffer});
  prev.innerHTML = result.value; prev.classList.remove("hidden");
  byId("docx-dl-html").disabled=false; byId("docx-dl-txt").disabled=false; byId("docx-extract-json").disabled=false;
  log(logEl, "Converted to HTML (preview shown).");
  byId("docx-dl-html").onclick = ()=> downloadBlob(new Blob([result.value],{type:"text/html"}), "doc.html");
  byId("docx-dl-txt").onclick = ()=>{
    const tmp = document.createElement('div'); tmp.innerHTML = result.value; const txt = tmp.textContent || tmp.innerText || "";
    downloadBlob(new Blob([txt],{type:"text/plain"}), "doc.txt");
  };
  byId("docx-extract-json").onclick = ()=>{
    const tmp = document.createElement('div'); tmp.innerHTML = result.value;
    const lines = (tmp.textContent||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);
    const js = JSON.stringify(lines.map((t,i)=>({id:i+1,text:t})), null, 2);
    downloadBlob(new Blob([js],{type:"application/json"}), "doc.json");
  };
});