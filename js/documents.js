const mergeProgBar = ensureProgress('pdf-merge-progress');
const mergeProgText = byId('pdf-merge-progress-label');

byId("pdf-merge-btn")?.addEventListener("click", async ()=>{
  const files = Array.from(byId("pdf-merge-input").files||[]);
  const logEl = byId("pdf-merge-log"); logEl.textContent="";
  if(!files.length) return alert("Pick PDFs");
  mergeProgText.textContent = `Merging ${files.length} PDFs…`;
  const { PDFDocument } = window.PDFLib;
  const outPdf = await PDFDocument.create();
  for(let i=0;i<files.length;i++){
    const f = files[i];
    const bytes = new Uint8Array(await f.arrayBuffer());
    const src = await PDFDocument.load(bytes);
    const pages = await outPdf.copyPages(src, src.getPageIndices());
    pages.forEach(p=>outPdf.addPage(p));
    setProgress(mergeProgBar, (i+1)/files.length);
    log(logEl, `Added ${f.name} (${src.getPageCount()} pages)`);
  }
  const outBytes = await outPdf.save();
  downloadBlob(new Blob([outBytes],{type:"application/pdf"}), "merged.pdf");
  setProgress(mergeProgBar, 1); mergeProgText.textContent = "Done";
  setTimeout(()=>{ finishProgress(mergeProgBar); mergeProgText.textContent="Idle"; }, 800);
});

const splitProgBar = ensureProgress('pdf-split-progress');
const splitProgText = byId('pdf-split-progress-label');

byId("pdf-split-btn")?.addEventListener("click", async ()=>{
  const file = (byId("pdf-split-input").files||[])[0];
  const ranges = byId("pdf-split-ranges").value.trim();
  const logEl = byId("pdf-split-log"); logEl.textContent="";
  if(!file) return alert("Pick a PDF"); if(!ranges) return alert("Enter page ranges");
  const { PDFDocument } = window.PDFLib;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const src = await PDFDocument.load(bytes);
  const sets = ranges.split(",").map(r=>r.trim()).filter(Boolean);
  splitProgText.textContent = "Splitting…";
  for(let idx=0; idx<sets.length; idx++){
    const s = sets[idx];
    let [a,b] = s.split("-").map(n=>parseInt(n,10));
    if(!b) b=a;
    a = Math.max(1,a); b=Math.min(src.getPageCount(), b);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, Array.from({length:b-a+1},(_,i)=>i+a-1));
    pages.forEach(p=>out.addPage(p));
    const outBytes = await out.save();
    const name = `split_${idx+1}_${a}-{b}.pdf`.replace("{b}", b);
    downloadBlob(new Blob([outBytes],{type:"application/pdf"}), name);
    log(logEl, `✓ Saved ${name}`);
    setProgress(splitProgBar, (idx+1)/sets.length);
  }
  splitProgText.textContent = "Done"; setTimeout(()=>{ finishProgress(splitProgBar); splitProgText.textContent="Idle"; }, 800);
});

const docxProgBar = ensureProgress('docx-progress');
const docxProgText = byId('docx-progress-label');

byId("docx-btn")?.addEventListener("click", async ()=>{
  const f = (byId("docx-input").files||[])[0]; const logEl = byId("docx-log"); logEl.textContent="";
  if(!f) return alert("Pick a .docx");
  docxProgText.textContent = "Converting…";
  await window.ensureMammoth(); await window.ensureHtml2Pdf();
  const arrayBuffer = await f.arrayBuffer();
  const result = await window.mammoth.convertToHtml({arrayBuffer});
  const html = `<div style="font-family:serif;padding:24px">${result.value}</div>`;
  const frame = document.createElement('div'); frame.innerHTML = html; document.body.appendChild(frame);
  await window.html2pdf().from(frame).set({margin:10, filename: 'docx.pdf', image:{type:'jpeg', quality:0.95}, html2canvas:{scale:2}, jsPDF:{unit:'pt', format:'a4', orientation:'portrait'}}).save();
  frame.remove();
  setProgress(docxProgBar,1); docxProgText.textContent = "Done";
  setTimeout(()=>{ finishProgress(docxProgBar); docxProgText.textContent="Idle"; }, 800);
});

const p2iBar = ensureProgress('pdf2img-progress');
const p2iText = byId('pdf2img-progress-label');

byId("pdf2img-btn")?.addEventListener("click", async ()=>{
  const f = (byId("pdf2img-input").files||[])[0]; const logEl = byId("pdf2img-log"); const out = byId("pdf2img-out");
  out.classList.add("hidden"); out.innerHTML=""; logEl.textContent="";
  if(!f) return alert("Pick a PDF");
  const pdfjsLib = await import("libs/pdfjs/pdf.min.mjs").catch(()=>import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs"));
  const pdf = await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
  p2iText.textContent = `Rendering ${pdf.numPages} page(s)…`;
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({scale:1.5});
    const canvas = document.createElement('canvas'); canvas.width=viewport.width; canvas.height=viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({canvasContext:ctx, viewport}).promise;
    canvas.toBlob(b=>{ if(b){ downloadBlob(b, `page_${i}.png`);} }, "image/png");
    out.appendChild(canvas);
    setProgress(p2iBar, i/pdf.numPages);
    log(logEl, `Rendered page ${i}`);
  }
  out.classList.remove("hidden");
  p2iText.textContent="Done"; setTimeout(()=>{ finishProgress(p2iBar); p2iText.textContent="Idle"; }, 800);
});