(async function(){
  // Load optional libs (PapaParse for CSV, SheetJS for XLSX) with local-first fallbacks
  await __boot.loadFirst(['libs/papaparse/papaparse.min.js','https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js']);
  await __boot.loadFirst(['libs/xlsx/xlsx.full.min.js','https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js']);

  const byId = (id)=>document.getElementById(id);
  const logEl = byId('gps-log');
  function log(msg){ if(!logEl) return; logEl.textContent += msg + '\n'; logEl.scrollTop = logEl.scrollHeight; }
  function setPreview(html){ const box=byId('gps-preview'); box.innerHTML = html||''; box.classList.toggle('hidden', !html); }

  const mappingEls = { lat: byId('map-lat'), lon: byId('map-lon'), ele: byId('map-ele'), time: byId('map-time') };

  // Normalize data shape: [{lat:number, lon:number, ele?:number, time?:string ISO}]
  let current = [];           // normalized points
  let foundHeaders = [];      // for CSV/XLSX mapping
  let lastTitle = '';

  byId('gps-clear').onclick = ()=>{ byId('gps-text').value=''; byId('gps-file').value=''; current=[]; foundHeaders=[]; updateMapping([]); setPreview(''); log('Cleared.'); };
  byId('gps-sample').onclick = ()=>{
    const csv = 'lat,lon,ele,time\n37.7749,-122.4194,12,2024-01-01T10:00:00Z\n37.7755,-122.4188,13,2024-01-01T10:05:00Z\n';
    downloadBlob(new Blob([csv],{type:'text/csv'}),'gps_template.csv');
  };

  function updateMapping(headers){
    foundHeaders = headers || [];
    const opts = (keys)=> keys.map(k=>`<option value="${k}">${k}</option>`).join('');
    Object.values(mappingEls).forEach(sel=> sel.innerHTML = '<option value="">(none)</option>' + opts(foundHeaders));
    // Auto pick common names
    function pick(sel, names){ for(const n of names){ if(foundHeaders.includes(n)){ sel.value = n; return; } } }
    pick(mappingEls.lat, ['lat','latitude','Lat','Latitude']);
    pick(mappingEls.lon, ['lon','lng','longitude','Lon','Lng','Longitude']);
    pick(mappingEls.ele, ['ele','elevation','alt','altitude','Elevation','Altitude']);
    pick(mappingEls.time, ['time','timestamp','date','datetime','Time','Timestamp','Date','Datetime']);
  }

  // Parsing helpers
  function parseXML(text){ return new DOMParser().parseFromString(text, 'application/xml'); }
  function textContent(node, sel){ const el=node.querySelector(sel); return el? (el.textContent||'').trim() : ''; }
  function asNum(v){ const n = Number(v); return Number.isFinite(n)? n : null; }
  function toISO(x){ if(!x) return ''; try{ const d=new Date(x); if(!isNaN(d)) return d.toISOString(); }catch{} return ''; }

  function parseGPX(text){
    const doc = parseXML(text);
    const trkpts = Array.from(doc.getElementsByTagName('trkpt'));
    if (!trkpts.length){ log('No <trkpt> found in GPX.'); return []; }
    const pts = trkpts.map(pt=>{
      const lat = asNum(pt.getAttribute('lat'));
      const lon = asNum(pt.getAttribute('lon'));
      const ele = asNum(textContent(pt, 'ele'));
      const time = textContent(pt, 'time');
      return { lat, lon, ele: ele ?? undefined, time: time? toISO(time): undefined };
    }).filter(p=> Number.isFinite(p.lat) && Number.isFinite(p.lon));
    return pts;
  }

  function parseTCX(text){
    const doc = parseXML(text);
    const tps = Array.from(doc.getElementsByTagName('Trackpoint'));
    if (!tps.length){ log('No <Trackpoint> found in TCX.'); return []; }
    const pts = tps.map(tp=>{
      const lat = asNum(textContent(tp, 'LatitudeDegrees'));
      const lon = asNum(textContent(tp, 'LongitudeDegrees'));
      const ele = asNum(textContent(tp, 'AltitudeMeters'));
      const time = textContent(tp, 'Time');
      return (Number.isFinite(lat) && Number.isFinite(lon)) ? { lat, lon, ele: ele ?? undefined, time: time? toISO(time): undefined } : null;
    }).filter(Boolean);
    return pts;
  }

  function parseKML(text){
    const doc = parseXML(text);
    // Prefer LineString coordinates; fallback to gx:Track
    const coordsNodes = Array.from(doc.getElementsByTagName('coordinates'));
    let coordsText = coordsNodes.map(n=> (n.textContent||'').trim()).join(' ');
    if (!coordsText){
      // gx:Track stores <gx:coord> lon lat ele and <when> times
      const gx = 'http://www.google.com/kml/ext/2.2';
      const track = Array.from(doc.getElementsByTagNameNS(gx, 'Track'))[0];
      if (track){
        const when = Array.from(track.getElementsByTagNameNS(gx.replace('/ext/2.2','/2.2'), 'when')).map(n=> (n.textContent||'').trim());
        const coord = Array.from(track.getElementsByTagNameNS(gx, 'coord')).map(n=> (n.textContent||'').trim());
        const pts=[];
        for (let i=0;i<coord.length;i++){
          const parts = coord[i].split(/\s+/).map(Number); // lon lat ele
          const lon = parts[0], lat=parts[1], ele=Number.isFinite(parts[2])?parts[2]:undefined;
          const time = when[i]? toISO(when[i]) : undefined;
          if (Number.isFinite(lat) && Number.isFinite(lon)) pts.push({lat,lon,ele,time});
        }
        return pts;
      }
    }
    if (!coordsText){ log('No coordinates found in KML.'); return []; }
    const pts=[];
    coordsText.split(/[\s\n]+/).forEach(line=>{
      if(!line) return;
      const parts = line.split(',').map(s=>s.trim());
      const lon = asNum(parts[0]), lat = asNum(parts[1]), ele = asNum(parts[2]);
      if (Number.isFinite(lat) && Number.isFinite(lon)){
        pts.push({ lat, lon, ele: Number.isFinite(ele)?ele:undefined });
      }
    });
    return pts;
  }

  function parseCSV(text){
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    updateMapping(parsed.meta.fields || []);
    // We'll map after the user confirms (or auto-picked)
    return { rows: parsed.data, headers: parsed.meta.fields || [] };
  }

  async function parseXLSX(file){
    const wb = XLSX.read(await file.arrayBuffer());
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const headers = Object.keys(rows[0]||{});
    updateMapping(headers);
    return { rows, headers };
  }

  function applyMapping(rows){
    const latKey = mappingEls.lat.value;
    const lonKey = mappingEls.lon.value;
    const eleKey = mappingEls.ele.value;
    const timeKey = mappingEls.time.value;
    const tfmt = byId('map-timefmt').value;
    const out = [];
    function normTime(v){
      if (!v && v!==0) return undefined;
      if (tfmt==='unix') return new Date(Number(v)*1000).toISOString();
      if (tfmt==='unixms') return new Date(Number(v)).toISOString();
      if (tfmt==='excel'){
        // Excel serial date to JS: days since 1899-12-30
        const ms = (Number(v)-25569)*86400*1000;
        return new Date(ms).toISOString();
      }
      if (tfmt==='iso' || tfmt==='auto'){
        const d = new Date(v); if(!isNaN(d)) return d.toISOString();
        // auto fallback: try number
        const num = Number(v);
        if (Number.isFinite(num)){
          if (num > 1e12) return new Date(num).toISOString(); // ms
          if (num > 1e9)  return new Date(num*1000).toISOString(); // s
        }
        return undefined;
      }
    }
    for (const r of rows){
      const lat = asNum(r[latKey]);
      const lon = asNum(r[lonKey]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const ele = eleKey ? asNum(r[eleKey]) : null;
      const time = timeKey ? normTime(r[timeKey]) : undefined;
      out.push({ lat, lon, ele: Number.isFinite(ele)?ele:undefined, time });
    }
    return out;
  }

  function detect(text){
    const t = text.slice(0, 2000).toLowerCase();
    if (t.includes('<gpx')) return 'gpx';
    if (t.includes('<trainingcenterdatabase')) return 'tcx';
    if (t.includes('<kml')) return 'kml';
    if (t.includes(',') || t.includes('\t')) return 'csv';
    return 'unknown';
  }

  function previewTable(rows, max=10){
    if (!rows.length) return '<div class="small muted">No points to preview.</div>';
    const cols = ['lat','lon','ele','time'];
    const head = '<tr>' + cols.map(c=>`<th>${c}</th>`).join('') + '</tr>';
    const body = rows.slice(0,max).map(r=>'<tr>'+cols.map(c=>`<td>${r[c]??''}</td>`).join('')+'</tr>').join('');
    return `<table style="border-collapse:collapse;width:100%"><thead>${head}</thead><tbody>${body}</tbody></table><div class="small muted">Showing first ${Math.min(max, rows.length)} of ${rows.length}</div>`;
  }

  // Exporters
  function escapeXml(s){ return s==null?'':String(s).replace(/[<>&'"]/g, c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c])); }
  function toGPX(points, name){
    const head = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AnyConvert+" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>${name?`\n    <name>${escapeXml(name)}</name>`:''}
    <trkseg>`;
    const seg = points.map(p=>{
      const attrs = `lat="${p.lat}" lon="${p.lon}"`;
      const ele = p.ele!=null? `<ele>${p.ele}</ele>`:'';
      const time = p.time? `<time>${escapeXml(p.time)}</time>`:'';
      return `\n      <trkpt ${attrs}>${ele}${time}</trkpt>`;
    }).join('');
    const tail = `\n    </trkseg>\n  </trk>\n</gpx>`;
    return head + seg + tail;
  }
  function toTCX(points, name){
    const head = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Other">
      ${name?`<Notes>${escapeXml(name)}</Notes>`:''}
      <Lap StartTime="${escapeXml(points[0]?.time || new Date().toISOString())}">
        <Track>`;
    const track = points.map(p=>{
      const time = p.time? `<Time>${escapeXml(p.time)}</Time>`:``;
      const pos = (p.lat!=null && p.lon!=null) ? `<Position><LatitudeDegrees>${p.lat}</LatitudeDegrees><LongitudeDegrees>${p.lon}</LongitudeDegrees></Position>`:'';
      const alt = p.ele!=null? `<AltitudeMeters>${p.ele}</AltitudeMeters>`:'';
      return `\n          <Trackpoint>${time}${pos}${alt}</Trackpoint>`;
    }).join('');
    const tail = `
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
    return head + track + tail;
  }
  function toKML(points, name){
    const head = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      ${name?`<name>${escapeXml(name)}</name>`:''}
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>`;
    const coords = points.map(p=> `${p.lon},${p.lat},${p.ele!=null?p.ele:0}`).join(' ');
    const tail = `</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;
    return head + coords + tail;
  }
  function toCSV(points){
    const rows = points.map(p=>({lat:p.lat, lon:p.lon, ele:p.ele??'', time:p.time??''}));
    return Papa.unparse(rows);
  }
  function toXLSX(points){
    const rows = points.map(p=>({lat:p.lat, lon:p.lon, ele:p.ele??'', time:p.time??''}));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GPS');
    const out = XLSX.write(wb, { bookType: 'xlsx', type:'array' });
    return new Blob([out], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }


  // --- Map preview (Leaflet) ---
  async function ensureLeaflet(){
    // Add CSS if not present
    if (!document.getElementById('leaflet-css')){
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    await __boot.loadFirst([
      'libs/leaflet/leaflet.js',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    ]);
  }
  let map, baseLayers={}, trackLayer, startMarker, endMarker;
  function initMap(){
    if (map) return;
    map = L.map('map', { scrollWheelZoom:true, preferCanvas:true });
    // Base layers
    baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });
    baseLayers.sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    });
    baseLayers.toner = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
      attribution: 'Map tiles by Stamen Design'
    });
    baseLayers.osm.addTo(map);
    map.setView([20,0], 2);
  }
  function setBase(name){
    Object.values(baseLayers).forEach(l=>{ if(map.hasLayer(l)) map.removeLayer(l); });
    (baseLayers[name] || baseLayers.osm).addTo(map);
  }
  function updateMap(points){
    if (!points || !points.length) return;
    if (!map) initMap();
    if (trackLayer){ map.removeLayer(trackLayer); trackLayer = null; }
    if (startMarker){ map.removeLayer(startMarker); startMarker = null; }
    if (endMarker){ map.removeLayer(endMarker); endMarker = null; }

    const latlngs = points.map(p=>[p.lat, p.lon]);
    trackLayer = L.polyline(latlngs, { weight:4, opacity:0.9 }).addTo(map);
    startMarker = L.marker(latlngs[0]).addTo(map).bindTooltip('Start', {permanent:false});
    endMarker = L.marker(latlngs[latlngs.length-1]).addTo(map).bindTooltip('End', {permanent:false});
    const bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds.pad(0.15));
  }


  // --- Distance/elevation stats, splits, and hover ---
  const EARTH_M = 6371000;
  function haversine(aLat,aLon,bLat,bLon){
    const toRad = Math.PI/180;
    const dLat = (bLat-aLat)*toRad;
    const dLon = (bLon-aLon)*toRad;
    const s1 = Math.sin(dLat/2), s2 = Math.sin(dLon/2);
    const aa = s1*s1 + Math.cos(aLat*toRad)*Math.cos(bLat*toRad)*s2*s2;
    return 2 * EARTH_M * Math.asin(Math.sqrt(aa));
  }
  function formatDuration(sec){
    if(!Number.isFinite(sec) || sec<=0) return '-';
    const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.floor(sec%60);
    return (h? h+':':'' ) + (h? String(m).padStart(2,'0') : m) + ':' + String(s).padStart(2,'0');
  }
  function paceStr(secondsPerUnit, unit){ // unit: km or mi
    if(!Number.isFinite(secondsPerUnit) || secondsPerUnit<=0) return '-';
    const m = Math.floor(secondsPerUnit/60), s = Math.round(secondsPerUnit%60);
    return `${m}:${String(s).padStart(2,'0')} / ${unit}`;
  }

  let _cumDist=[], _timesISO=[]; // state for hover
  function computeStats(points){
    const out = { totalM:0, gain:0, loss:0, minEle:undefined, maxEle:undefined, elapsedS:undefined, points:points.length };
    _cumDist = [0]; _timesISO = [];
    let total = 0;
    let prev = null;
    let firstTime, lastTime;
    for (let i=0;i<points.length;i++){
      const p = points[i];
      if (prev){
        const d = haversine(prev.lat, prev.lon, p.lat, p.lon);
        total += (Number.isFinite(d)? d : 0);
        if (Number.isFinite(p.ele) && Number.isFinite(prev.ele)){
          const diff = p.ele - prev.ele;
          if (diff > 0) out.gain += diff; else out.loss += Math.abs(diff);
        }
      }
      if (Number.isFinite(p.ele)){
        if (out.minEle==null || p.ele<out.minEle) out.minEle = p.ele;
        if (out.maxEle==null || p.ele>out.maxEle) out.maxEle = p.ele;
      }
      if (p.time){
        const t = new Date(p.time);
        if (!isNaN(t)){
          if (!firstTime) firstTime = t;
          lastTime = t;
          _timesISO[i] = t;
        } else _timesISO[i] = null;
      } else {
        _timesISO[i] = null;
      }
      _cumDist[i+1] = total;
      prev = p;
    }
    out.totalM = total;
    out.elapsedS = (firstTime && lastTime)? Math.max(0, (lastTime - firstTime)/1000) : undefined;
    return out;
  }

  function unitsFactor(unit){ return unit==='mi' ? 1609.344 : 1000; }
  function fmtDist(meters, unit){
    if(!Number.isFinite(meters)) return '-';
    const f = unitsFactor(unit);
    const v = meters / f;
    return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + unit;
  }
  function fmtEle(m){ return Number.isFinite(m) ? (m.toFixed(0)+' m') : '-'; }
  function avgSpeedStr(meters, seconds, unit){
    if(!Number.isFinite(meters) || !Number.isFinite(seconds) || seconds<=0) return '-';
    const f = unitsFactor(unit);
    const speed = (meters/seconds) / (f/3600); // unit per hour
    return speed.toFixed(2)+' '+unit+'/h';
  }

  function renderStats(stats, unit){
    const el = document.getElementById('gps-stats'); if(!el) return;
    const lines = [
      `<div>Total distance: <strong>${fmtDist(stats.totalM, unit)}</strong></div>`,
      `<div>Elapsed time: <strong>${formatDuration(stats.elapsedS)}</strong></div>`,
      `<div>Avg speed: <strong>${avgSpeedStr(stats.totalM, stats.elapsedS, unit)}</strong></div>`,
      `<div>Elev gain/loss: <strong>${fmtEle(stats.gain)}</strong> / <strong>${fmtEle(stats.loss)}</strong></div>`,
      `<div>Min / Max elev: <strong>${fmtEle(stats.minEle)}</strong> / <strong>${fmtEle(stats.maxEle)}</strong></div>`,
      `<div>Points: <strong>${stats.points}</strong></div>`
    ];
    el.innerHTML = lines.join('');
  }

  function computeSplits(points, splitEvery, splitUnit){
    const stepM = splitEvery * unitsFactor(splitUnit);
    const rows = [];
    if (!points.length || !Number.isFinite(stepM) || stepM<=0) return rows;
    let segStartIdx = 0;
    let segStartT = points[0]?.time ? new Date(points[0].time) : null;
    let nextBoundary = stepM;
    for (let i=1;i<_cumDist.length;i++){
      const dist = _cumDist[i];
      if (dist >= nextBoundary || i === _cumDist.length-1){
        const segEndIdx = i;
        const segM = _cumDist[segEndIdx] - _cumDist[segStartIdx];
        let segS = undefined;
        const tStart = segStartT;
        const tEnd = points[segEndIdx-1]?.time ? new Date(points[segEndIdx-1].time) : null;
        if (tStart && tEnd && !isNaN(tStart) && !isNaN(tEnd)) segS = Math.max(0,(tEnd - tStart)/1000);
        const pace = segS? paceStr(segS/(segM/unitsFactor(splitUnit)), splitUnit) : '-';
        rows.push({
          idx: rows.length+1,
          dist: fmtDist(segM, splitUnit),
          time: formatDuration(segS),
          pace: pace
        });
        segStartIdx = segEndIdx;
        segStartT = points[segStartIdx]?.time ? new Date(points[segStartIdx].time) : segStartT;
        nextBoundary += stepM;
      }
    }
    return rows;
  }
  function renderSplits(rows){
    const el = document.getElementById('gps-splits'); if(!el) return;
    if (!rows.length){ el.innerHTML = '<div class="small muted">No splits (need distance and times).</div>'; return; }
    const header = '<tr><th>#</th><th>Distance</th><th>Time</th><th>Pace</th></tr>';
    const body = rows.map(r=> `<tr><td>${r.idx}</td><td>${r.dist}</td><td>${r.time}</td><td>${r.pace}</td></tr>`).join('');
    el.innerHTML = `<table style="border-collapse:collapse;width:100%"><thead>${header}</thead><tbody>${body}</tbody></table>`;
  }

  // Hover readouts on map
  let hoverMarker;
  function findNearestIndex(lat, lon){
    if (!_cumDist || _cumDist.length<2) return -1;
    let best=-1, bestD=1e20;
    for (let i=0;i<current.length;i++){
      const p = current[i];
      const d = haversine(lat,lon,p.lat,p.lon);
      if (d < bestD){ bestD=d; best=i; }
    }
    return best;
  }
  function updateHover(latlng, unit){
    const idx = findNearestIndex(latlng.lat, latlng.lng);
    const box = document.getElementById('hover-info');
    if (idx<0){ if(box) box.textContent=''; return; }
    const p = current[idx];
    const distHere = _cumDist[idx];
    const text = [
      `Point ${idx+1}`,
      `Dist: ${fmtDist(distHere, unit)}`,
      `Ele: ${fmtEle(p.ele)}`,
      `Time: ${p.time? new Date(p.time).toLocaleString():'-'}`
    ].join('  ·  ');
    if (box) box.textContent = text;
    if (!hoverMarker){
      hoverMarker = L.circleMarker([p.lat,p.lon], {radius:6, weight:2, opacity:1, fillOpacity:0.7}).addTo(map);
    }
    hoverMarker.setLatLng([p.lat,p.lon]);
  }

  // Parse button
  byId('gps-parse').onclick = async ()=>{
    await ensureLeaflet(); initMap();
    setPreview(''); current=[]; lastTitle='';
    const fi = byId('gps-file'); const ta = byId('gps-text');
    let text = ta.value.trim(); let file = fi.files[0] || null;
    try{
      if (file){
        lastTitle = file.name.replace(/\.[^.]+$/,'');
        if (/\.xlsx?$/i.test(file.name)){ const x = await parseXLSX(file); current = applyMapping(x.rows); setPreview(previewTable(current)); log(`Parsed XLSX: ${current.length} points`); return; }
        text = await file.text();
      }
      if (!text){ return alert('Provide a file or paste text'); }
      const kind = detect(text);
      if (kind==='gpx'){ current = parseGPX(text); updateMapping([]); }
      else if (kind==='tcx'){ current = parseTCX(text); updateMapping([]); }
      else if (kind==='kml'){ current = parseKML(text); updateMapping([]); }
      else if (kind==='csv'){ const parsed = parseCSV(text); current = applyMapping(parsed.rows); }
      else { alert('Could not detect format. Try GPX/TCX/KML/CSV/XLSX.'); return; }
      setPreview(previewTable(current)); updateMap(current);
      const stats = computeStats(current);
      const unit = (document.getElementById('unit-dist')||{value:'km'}).value;
      renderStats(stats, unit);
      const splitEvery = parseFloat((document.getElementById('split-every')||{value:'1'}).value||'1');
      const splitUnit = (document.getElementById('split-unit')||{value:'km'}).value;
      renderSplits(computeSplits(current, splitEvery, splitUnit));
      if (map){ map.off('mousemove'); map.on('mousemove', (e)=> updateHover(e.latlng, unit)); }
      log(`Parsed ${kind.toUpperCase()}: ${current.length} points`);
    }catch(e){
      console.error(e); alert('Parse error: ' + (e?.message||e));
    }
  };

  // Download button
  byId('gps-download').onclick = ()=>{
    if (!current.length) return alert('No points parsed yet.');
    const name = byId('gps-title').value.trim() || lastTitle || 'track';
    const fmt = byId('gps-export').value;
    if (fmt==='gpx'){
      const s = toGPX(current, name);
      downloadBlob(new Blob([s],{type:'application/gpx+xml'}), name + '.gpx');
    } else if (fmt==='tcx'){
      const s = toTCX(current, name);
      downloadBlob(new Blob([s],{type:'application/vnd.garmin.tcx+xml'}), name + '.tcx');
    } else if (fmt==='kml'){
      const s = toKML(current, name);
      downloadBlob(new Blob([s],{type:'application/vnd.google-earth.kml+xml'}), name + '.kml');
    } else if (fmt==='csv'){
      const s = toCSV(current);
      downloadBlob(new Blob([s],{type:'text/csv'}), name + '.csv');
    } else if (fmt==='xlsx'){
      const blob = toXLSX(current);
      downloadBlob(blob, name + '.xlsx');
    }
  };


  const styleSel = byId('map-style'); if (styleSel){ styleSel.onchange = ()=>{ if(!map) return; setBase(styleSel.value); }; }

  // Recompute on controls
  const uSel = byId('unit-dist'); if (uSel){ uSel.onchange = ()=>{ if(!current.length) return; const s=computeStats(current); renderStats(s, uSel.value); }; }
  const splitEvery = byId('split-every'); const splitUnit = byId('split-unit'); const recompute = byId('recompute-splits');
  function recomputeSplitsNow(){ if(!current.length) return; renderSplits(computeSplits(current, parseFloat(splitEvery.value||'1'), splitUnit.value)); }
  if (recompute) recompute.onclick = recomputeSplitsNow;
  if (splitEvery) splitEvery.onchange = recomputeSplitsNow;
  if (splitUnit) splitUnit.onchange = recomputeSplitsNow;

  const fitBtn = byId('map-fit'); if (fitBtn){ fitBtn.onclick = ()=>{ if(!map || !trackLayer) return; try{ map.fitBounds(trackLayer.getBounds().pad(0.15)); }catch(e){} }; }

  // Minor: populate year
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();