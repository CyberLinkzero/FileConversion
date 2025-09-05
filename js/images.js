const imgInput = byId("img-input");
const imgDrop = byId("img-drop");
const imgLog = byId("img-log");
let imgFiles = [];
["dragenter","dragover"].forEach(ev=>imgDrop.addEventListener(ev,e=>{e.preventDefault(); imgDrop.classList.add("drag");}));
["dragleave","drop"].forEach(ev=>imgDrop.addEventListener(ev,e=>{e.preventDefault(); imgDrop.classList.remove("drag"); if(ev==="drop"){ handleImgFiles(e.dataTransfer.files); }}));
imgInput?.addEventListener("change", e=> handleImgFiles(e.target.files));
function handleImgFiles(files){ imgFiles = Array.from(files); imgLog.textContent=""; log(imgLog, `Loaded ${imgFiles.length} file(s).`); }

const imgProgBar = ensureProgress('img-progress');
const imgProgText = byId('img-progress-label');

byId("img-convert")?.addEventListener("click", async ()=>{
  if(!imgFiles.length) return alert("Choose image files first.");
  const mime = byId("img-format").value; let quality = +byId("img-quality").value; if(isNaN(quality)) quality = 90;
  imgProgText.textContent = `Converting ${imgFiles.length} image(s)…`;
  for(let i=0;i<imgFiles.length;i++){
    const file = imgFiles[i];
    try{
      setProgress(imgProgBar, i/imgFiles.length);
      const out = await convertImage(file, mime, quality/100);
      downloadBlob(out.blob, rename(file.name, out.ext));
      log(imgLog, `✓ ${file.name} → ${rename(file.name, out.ext)}`);
    }catch(err){ console.error(err); log(imgLog, `✗ ${file.name}: ${err.message}`); }
  }
  setProgress(imgProgBar, 1); imgProgText.textContent = "Done";
  setTimeout(()=>{ finishProgress(imgProgBar); imgProgText.textContent="Idle"; }, 800);
});

async function convertImage(file, mime, q){
  let srcBlob = file;
  if(/\.heic$/i.test(file.name)){
    const png = await window.heic2any({ blob:file, toType:"image/png"});
    srcBlob = png instanceof Blob ? png : png[0];
  }
  const img = await blobToImage(srcBlob);
  const c = document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight;
  c.getContext("2d").drawImage(img,0,0);
  const blob = await new Promise(res=>c.toBlob(res, mime, /jpe?g|webp/.test(mime)?q:undefined));
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  return { blob, ext };
}
function blobToImage(blob){
  return new Promise((resolve,reject)=>{
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload=()=>{URL.revokeObjectURL(url); resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url); reject(new Error("Failed to load image"))};
    img.src=url;
  });
}

const heicLog = byId("heic-log");
byId("heic-convert")?.addEventListener("click", async ()=>{
  const files = byId("heic-input").files; if(!files.length) return alert("Pick HEIC file(s)");
  for(const f of files){
    try{
      const jpg = await window.heic2any({ blob:f, toType:"image/jpeg", quality:0.9 });
      const blob = jpg instanceof Blob ? jpg : jpg[0];
      downloadBlob(blob, rename(f.name, "jpg"));
      log(heicLog, `✓ ${f.name} → ${rename(f.name, "jpg")}`);
    }catch(e){ log(heicLog, `✗ ${f.name}: ${e.message}`) }
  }
});

const imgPdfLog = byId("img-pdf-log");
byId("img-pdf-btn")?.addEventListener("click", async ()=>{
  const files = Array.from(byId("img-pdf-input").files); if(!files.length) return alert("Pick image(s)");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({unit:"pt", format:"a4"});
  imgPdfLog.textContent = "";
  for(let i=0;i<files.length;i++){
    const img = await blobToImage(files[i]);
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const r = Math.min(pageW/img.naturalWidth, pageH/img.naturalHeight);
    const w = img.naturalWidth*r, h = img.naturalHeight*r;
    if(i>0) pdf.addPage();
    pdf.addImage(img, "PNG", (pageW-w)/2, (pageH-h)/2, w, h, undefined, "FAST");
    log(imgPdfLog, `Added ${files[i].name}`);
  }
  pdf.save("images.pdf");
  log(imgPdfLog, "✓ Saved images.pdf");
});

let ffmpeg; let ffmpegReady = false;
async function ensureFFmpeg(logEl, onProgress){
  if(ffmpegReady) return;
  log(logEl, "Loading FFmpeg.wasm…");
  ffmpeg = window.ffmpeg || window.createFFmpeg({ corePath: 'libs/ffmpeg/ffmpeg-core.js', log:true, progress: ({ratio , corePath: 'libs/ffmpeg/ffmpeg-core.js'})=> onProgress?.(ratio||0) });
  await ffmpeg.load(); ffmpegReady = true; log(logEl, "FFmpeg loaded.");
}

const wgBar = ensureProgress('webp-gif-progress');
const wgText = byId('webp-gif-progress-label');
byId("webp-gif-btn")?.addEventListener("click", async ()=>{
  const f = byId("webp-gif-input").files[0]; if(!f) return alert("Pick a WebP or GIF");
  const target = byId("webp-gif-target").value; const logEl = byId("webp-gif-log"); logEl.textContent = "";
  wgText.textContent = "Transcoding…";
  await ensureFFmpeg(logEl, (r)=> setProgress(wgBar, r));
  const inExt = f.name.split('.').pop(); const inName = `img.${inExt}`; const outName = target==='gif' ? 'out.gif' : 'out.webp';
  await ffmpeg.FS('writeFile', inName, new Uint8Array(await f.arrayBuffer()));
  const args = target==='gif' ? ['-i', inName, '-vf','fps=12,scale=iw:-2:flags=lanczos', outName]
                              : ['-i', inName, '-vf','scale=iw:-2:flags=lanczos', outName];
  await ffmpeg.run(...args);
  const data = ffmpeg.FS('readFile', outName);
  downloadBlob(new Blob([data.buffer],{type: target==='gif'?'image/gif':'image/webp'}), rename(f.name, target));
  setProgress(wgBar, 1); wgText.textContent = "Done";
  setTimeout(()=>{ finishProgress(wgBar); wgText.textContent = "Idle"; }, 800);
  ffmpeg.FS('unlink', inName); ffmpeg.FS('unlink', outName);
});