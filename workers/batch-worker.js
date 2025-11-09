<script type="module">
/* ... keep everything above ... */

/* ===== Batching & worker pool (with robust fallback) ===== */
function makeWorkerPool(n){
  // 1) Try external module worker (preferred)
  const extURL = new URL('./workers/batch-worker.js', import.meta.url);

  // 2) Inline Blob worker (automatic fallback if external fails)
  const INLINE_WORKER_SRC = `
    // === Inline fallback worker: chroma chord detector with whitening + smoothing ===
    const NAMES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
    const MAJ=[1,0,0,0,1,0,0,1,0,0,0,0], MIN=[1,0,0,1,0,0,0,1,0,0,0,0];
    const hann=(N,i)=>0.5*(1-Math.cos(2*Math.PI*i/(N-1)));
    const hzToMidi=(hz)=>69+12*Math.log2(hz/440);

    function fftMagPrewindowed(frame){
      const N=frame.length, mags=new Float32Array(N/2);
      for(let i=0;i<N;i++) frame[i]=frame[i]*hann(N,i);
      for(let k=1;k<N/2;k++){
        let re=0, im=0, angCoef=-2*Math.PI*k/N;
        for(let n=0;n<N;n++){ const ang=angCoef*n, x=frame[n]; re+=x*Math.cos(ang); im+=x*Math.sin(ang); }
        mags[k]=Math.hypot(re,im);
      }
      return mags;
    }
    function whiten(mags, smoothBins=12){
      const N=mags.length, out=new Float32Array(N);
      for(let k=0;k<N;k++){
        let lo=Math.max(1,k-smoothBins), hi=Math.min(N-1,k+smoothBins), sum=0,cnt=0;
        for(let j=lo;j<=hi;j++){ sum+=mags[j]; cnt++; }
        const env=sum/(cnt||1); out[k]=env>0?mags[k]/env:mags[k];
      }
      return out;
    }
    function chromaFromSpectrum(mags, sr, nfft){
      const c=new Float32Array(12);
      for(let k=1;k<mags.length;k++){
        const f=k*sr/nfft; if(f<40||f>6000) continue;
        let w=1.0; if(f<200) w*=1.4; w*=1/Math.sqrt(1+(f/2000)**2);
        const midi=hzToMidi(f); if(!Number.isFinite(midi)) continue;
        const pc=((Math.round(midi)%12)+12)%12; c[pc]+=w*mags[k];
      }
      let s=0; for(let i=0;i<12;i++) s+=c[i]*c[i];
      if(s>0){ s=Math.sqrt(s); for(let i=0;i<12;i++) c[i]/=s; }
      return c;
    }
    function scoreTemplate(ch, tmpl, rot){
      let s=0, non=0;
      for(let i=0;i<12;i++){ const v=ch[(i+rot)%12]; if(tmpl[i]) s+=v; else non+=0.05*v; }
      return s-non;
    }
    function bestChordFromChroma(ch){
      let best={r:0,q:'',sc:-1};
      for(let r=0;r<12;r++){
        const rootBoost=ch[r]*0.25;
        const sMaj=scoreTemplate(ch,MAJ,r)+rootBoost;
        const sMin=scoreTemplate(ch,MIN,r)+rootBoost*0.9;
        if(sMaj>best.sc) best={r,q:'',sc:sMaj};
        if(sMin>best.sc) best={r,q:'m',sc:sMin};
      }
      return NAMES[best.r]+best.q;
    }
    function labelFrame(frame, sr){
      const mags=fftMagPrewindowed(frame.slice());
      const white=whiten(mags,10);
      const chroma=chromaFromSpectrum(white,sr,frame.length);
      return bestChordFromChroma(chroma);
    }
    function majoritySmooth(labels,w=5){
      if(labels.length===0||w<=1) return labels;
      const out=labels.slice(), half=Math.floor(w/2);
      for(let i=0;i<labels.length;i++){
        const lo=Math.max(0,i-half), hi=Math.min(labels.length-1,i+half);
        const counts=new Map(); for(let j=lo;j<=hi;j++){ counts.set(labels[j],(counts.get(labels[j])||0)+1); }
        let best=labels[i], bc=0; counts.forEach((c,lab)=>{ if(c>bc){bc=c; best=lab;} }); out[i]=best;
      }
      return out;
    }
    self.onmessage=(e)=>{
      const {id,frames,sr}=e.data;
      try{
        const raw=new Array(frames.length);
        for(let i=0;i<frames.length;i++){ try{ raw[i]=labelFrame(frames[i],sr); }catch{ raw[i]='N'; } }
        const labels=majoritySmooth(raw,5);
        self.postMessage({id,labels});
      }catch(err){
        self.postMessage({id,labels:new Array((e.data.frames||[]).length).fill('N')});
      }
    };
  `;

  function newExtWorker(){
    return new Worker(extURL, { type: 'module' });
  }
  function newInlineWorker(){
    const blob = new Blob([INLINE_WORKER_SRC], { type: 'text/javascript' });
    const url  = URL.createObjectURL(blob);
    const w    = new Worker(url, { type: 'module' });
    // Revoke later; keep URL alive while worker exists
    w.addEventListener('error', ()=> URL.revokeObjectURL(url), { once:true });
    w.addEventListener('message', ()=> URL.revokeObjectURL(url), { once:true });
    return w;
  }

  // Try to create N workers; fall back inline if external fails.
  const workers = [];
  for (let i=0;i<n;i++){
    let w;
    try {
      w = newExtWorker();
      // quick ping test to catch CSP/MIME errors early
      const ok = new Promise((resolve, reject)=>{
        const t = setTimeout(()=> reject(new Error('Worker ping timeout')), 1500);
        w.onmessage = ()=>{ clearTimeout(t); resolve(true); };
        w.onerror   = (e)=>{ clearTimeout(t); reject(e?.error||new Error('Worker error')); };
        // send a tiny dummy batch to validate
        w.postMessage({ id:-1, frames:[new Float32Array(8)], sr: 22050 });
      });
      // If ping fails, replace with inline
      workers.push({ worker: w, aliveTest: ok.catch(()=>{
        try { w.terminate(); } catch {}
        const wi = newInlineWorker();
        return new Promise((resolve)=>{
          wi.onmessage = ()=> resolve(true);
          wi.postMessage({ id:-1, frames:[new Float32Array(8)], sr: 22050 });
        }).then(()=> ({ worker: wi }));
      })});
    } catch {
      // construction threw: go inline
      const wi = newInlineWorker();
      workers.push({ worker: wi, aliveTest: Promise.resolve({ worker: wi }) });
    }
  }

  let nextId = 0;
  const poolReady = Promise.all(workers.map(async (slot, idx)=>{
    const res = await slot.aliveTest.catch(()=> null);
    if (res && res.worker){ workers[idx] = { worker: res.worker }; }
    return true;
  })).then(()=>{
    // optional log to on-page log (if available)
    try { log('Workers ready (external or inline fallback).'); } catch {}
    return true;
  });

  function runBatch(frames, sr, signal){
    return new Promise(async (resolve, reject)=>{
      await poolReady;
      const id = nextId++;
      const slot = workers[id % workers.length];
      const w = slot.worker;
      const onMsg = (e)=>{
        if(e.data?.id!==id) return;
        w.removeEventListener('message', onMsg);
        resolve(e.data.labels);
      };
      const onErr = (e)=>{
        w.removeEventListener('message', onMsg);
        reject(e?.error || new Error('Worker failure'));
      };
      w.addEventListener('message', onMsg);
      w.addEventListener('error', onErr, { once:true });

      if(signal){
        signal.addEventListener('abort', ()=>{
          try { w.removeEventListener('message', onMsg); } catch {}
          reject(new DOMException('Aborted','AbortError'));
        }, { once:true });
      }

      try {
        w.postMessage({ id, frames, sr }, frames.map(f=>f.buffer));
      } catch (err){
        w.removeEventListener('message', onMsg);
        reject(err);
      }
    });
  }

  function terminate(){ workers.forEach(s=>{ try{ s.worker.terminate(); }catch{} }); }

  return { runBatch, size:n, terminate };
}

/* ... keep the rest of your script unchanged ... */
</script>
