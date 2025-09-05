// ---- CSV → XLSX ----
byId("csv2xlsx-btn")?.addEventListener("click", async ()=>{
  const f = (byId("csv-input").files||[])[0]; const logEl = byId("csv-log"); logEl.textContent="";
  if(!f) return alert("Pick a CSV");
  const text = await f.text();
  const rows = Papa.parse(text, {header:true}).data;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const out = XLSX.write(wb, {bookType:"xlsx", type:"array"});
  downloadBlob(new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), "data.xlsx");
  log(logEl, "✓ Saved data.xlsx");
});

// ---- XLSX → CSV ----
byId("xlsx2csv-btn")?.addEventListener("click", async ()=>{
  const f = (byId("xlsx-input").files||[])[0]; const logEl = byId("xlsx-log"); logEl.textContent="";
  if(!f) return alert("Pick an .xlsx");
  const data = new Uint8Array(await f.arrayBuffer());
  const wb = XLSX.read(data, {type:"array"});
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, {defval:""});
  const csv = Papa.unparse(rows);
  downloadBlob(new Blob([csv],{type:"text/csv"}), "data.csv");
  log(logEl, "✓ Saved data.csv");
});

// ---- GPS → CSV/XLSX (basic GPX/KML/TCX/FIT parsing) ----
function parseXml(text){
  const p = new DOMParser(); return p.parseFromString(text, "application/xml");
}
function collectPointsFromGpx(doc){
  return Array.from(doc.querySelectorAll("trkpt, rtept, wpt")).map((pt,i)=>({
    idx:i+1,
    lat:+pt.getAttribute("lat"), lon:+pt.getAttribute("lon"),
    ele:+(pt.querySelector("ele")?.textContent||0),
    time: pt.querySelector("time")?.textContent||""
  }));
}
function collectPointsFromKml(doc){
  const coords = Array.from(doc.querySelectorAll("coordinates")).map(c=>c.textContent.trim()).join(" ").split(/\\s+/);
  const rows=[]; let i=1;
  for(const c of coords){
    const [lon,lat,ele] = c.split(",").map(Number);
    if(!isNaN(lat)&&!isNaN(lon)) rows.push({idx:i++, lat, lon, ele:ele||0, time:""});
  }
  return rows;
}
function collectPointsFromTcx(doc){
  const pts = Array.from(doc.querySelectorAll("Trackpoint"));
  return pts.map((tp,i)=>({
    idx:i+1,
    lat:+(tp.querySelector("Position > LatitudeDegrees")?.textContent||0),
    lon:+(tp.querySelector("Position > LongitudeDegrees")?.textContent||0),
    ele:+(tp.querySelector("AltitudeMeters")?.textContent||0),
    time: tp.querySelector("Time")?.textContent||""
  }));
}
async function collectFromFit(file){
  return await new Promise((resolve,reject)=>{
    const parser = new window.FITParser({ force:true, speedUnit:'m/s', lengthUnit:'m', elapsedRecordField:true });
    const reader = new FileReader();
    reader.onload = ()=>{
      parser.parse(reader.result, (err, data)=>{
        if(err) return reject(err);
        const rec = data.activity?.sessions?.[0]?.laps?.flatMap(l=>l.records)||[];
        const rows = (rec||[]).map((r,i)=>({
          idx:i+1, lat:+(r.position_lat||0), lon:+(r.position_long||0),
          ele:+(r.altitude||0), time:r.timestamp?new Date(r.timestamp*1000).toISOString():""
        }));
        resolve(rows);
      });
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

byId("gps-to-csv")?.addEventListener("click", ()=> exportGps("csv"));
byId("gps-to-xlsx")?.addEventListener("click", ()=> exportGps("xlsx"));

async function exportGps(kind){
  const files = Array.from(byId("gps-input").files||[]); const logEl = byId("gps-log"); logEl.textContent="";
  if(!files.length) return alert("Pick GPX/KML/TCX/FIT");
  let rows=[];
  for(const f of files){
    try{
      if(/\\.fit$/i.test(f.name)) rows = rows.concat(await collectFromFit(f));
      else{
        const txt = await f.text(); const doc = parseXml(txt);
        if(doc.querySelector("gpx")) rows = rows.concat(collectPointsFromGpx(doc));
        else if(doc.querySelector("kml")) rows = rows.concat(collectPointsFromKml(doc));
        else if(doc.querySelector("TrainingCenterDatabase")) rows = rows.concat(collectPointsFromTcx(doc));
      }
      log(logEl, `Parsed ${f.name}`);
    }catch(e){ log(logEl, `✗ ${f.name}: ${e.message}`); }
  }
  if(!rows.length) return log(logEl, "No points found.");
  if(kind==="csv"){
    const csv = Papa.unparse(rows);
    downloadBlob(new Blob([csv],{type:"text/csv"}), "gps.csv");
  }else{
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "GPS");
    const out = XLSX.write(wb, {bookType:"xlsx", type:"array"});
    downloadBlob(new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), "gps.xlsx");
  }
  log(logEl, `✓ Saved gps.${kind}`);
}

// ---- CSV/XLSX → GPX/KML/TCX ----
byId("tabular-export")?.addEventListener("click", async ()=>{
  const f = (byId("tabular-input").files||[])[0]; const t = byId("tabular-target").value; const logEl = byId("tabular-log"); logEl.textContent="";
  if(!f) return alert("Pick CSV/XLSX");
  let rows=[];
  if(/\\.xlsx$/i.test(f.name)){
    const wb = XLSX.read(new Uint8Array(await f.arrayBuffer()), {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(ws, {defval:""});
  }else{
    rows = Papa.parse(await f.text(), {header:true}).data;
  }
  // Expect lat/lon columns (case-insensitive)
  const norm = rows.map(r=>{
    const obj = {}; for(const [k,v] of Object.entries(r)) obj[k.toLowerCase()] = v;
    return {lat:+obj.lat||+obj.latitude||0, lon:+obj.lon||+obj.longitude||0, ele:+obj.ele||+obj.elevation||0, time:obj.time||obj.timestamp||"" , name: obj.name||""};
  }).filter(r=>!isNaN(r.lat)&&!isNaN(r.lon) && (r.lat||r.lon));
  let out = "";
  if(t==="gpx"){
    out = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="AnyConvert"><trk><name>Track</name><trkseg>`+
      norm.map(p=>`<trkpt lat="${p.lat}" lon="${p.lon}">${p.ele?`<ele>${p.ele}</ele>`:''}${p.time?`<time>${p.time}</time>`:''}${p.name?`<name>${p.name}</name>`:''}</trkpt>`).join("")+
      `</trkseg></trk></gpx>`;
    downloadBlob(new Blob([out],{type:"application/gpx+xml"}), "track.gpx");
  }else if(t==="kml"){
    out = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Path</name><LineString><coordinates>`+
      norm.map(p=>`${p.lon},${p.lat},${p.ele||0}`).join(" ")+
      `</coordinates></LineString></Placemark></Document></kml>`;
    downloadBlob(new Blob([out],{type:"application/vnd.google-earth.kml+xml"}), "track.kml");
  }else{ // tcx
    out = `<?xml version="1.0" encoding="UTF-8"?><TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"><Activities><Activity Sport="Other"><Id>${new Date().toISOString()}</Id><Lap StartTime="${new Date().toISOString()}"><Track>`+
      norm.map(p=>`<Trackpoint>${p.time?`<Time>${p.time}</Time>`:''}<Position><LatitudeDegrees>${p.lat}</LatitudeDegrees><LongitudeDegrees>${p.lon}</LongitudeDegrees></Position>${p.ele?`<AltitudeMeters>${p.ele}</AltitudeMeters>`:''}</Trackpoint>`).join("")+
      `</Track></Lap></Activity></Activities></TrainingCenterDatabase>`;
    downloadBlob(new Blob([out],{type:"application/xml"}), "track.tcx");
  }
  log(logEl, "✓ Export complete");
});