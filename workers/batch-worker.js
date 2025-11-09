// /workers/batch-worker.js
// Chroma chord detector with spectral whitening, bass emphasis and median smoothing.
// Input: { id, frames: Float32Array[], sr }  ->  Output: { id, labels: string[] }

//////////////////// Utils ////////////////////
const NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const MAJ = [1,0,0,0,1,0,0,1,0,0,0,0]; // 1,3,5
const MIN = [1,0,0,1,0,0,0,1,0,0,0,0]; // 1,b3,5
function hann(N,i){ return 0.5*(1-Math.cos(2*Math.PI*i/(N-1))); }
function hzToMidi(hz){ return 69 + 12*Math.log2(hz/440); }

//////////////////// DFT (naive, GH-Pages safe) ////////////////////
function fftMagPrewindowed(frame){
  const N = frame.length, mags = new Float32Array(N/2);
  // window in-place
  for (let i=0;i<N;i++) frame[i] = frame[i]*hann(N,i);
  for (let k=1;k<N/2;k++){
    let re=0, im=0, angCoef=-2*Math.PI*k/N;
    for (let n=0;n<N;n++){ const ang=angCoef*n, x=frame[n]; re+=x*Math.cos(ang); im+=x*Math.sin(ang); }
    mags[k] = Math.hypot(re,im);
  }
  return mags;
}

//////////////////// Whitening + Chroma ////////////////////
// simple spectral whitening: divide by a smoothed envelope
function whiten(mags, smoothBins=12){
  const N = mags.length;
  const out = new Float32Array(N);
  for (let k=0;k<N;k++){
    let lo = Math.max(1, k-smoothBins), hi = Math.min(N-1, k+smoothBins), sum=0, cnt=0;
    for (let j=lo;j<=hi;j++){ sum += mags[j]; cnt++; }
    const env = sum / (cnt||1);
    out[k] = env>0 ? mags[k] / env : mags[k];
  }
  return out;
}

function chromaFromSpectrum(mags, sr, nfft){
  const c = new Float32Array(12);
  for (let k=1;k<mags.length;k++){
    const f = k*sr/nfft;
    if (f<40 || f>6000) continue;
    let w = 1.0;
    if (f<200) w *= 1.4;                     // bass emphasis
    w *= 1/Math.sqrt(1 + (f/2000)**2);       // treble roll-off

    const midi = hzToMidi(f);
    if (!Number.isFinite(midi)) continue;
    const pc = Math.round(midi) % 12;
    c[(pc+12)%12] += w * mags[k];
  }
  // L2 normalize
  let s=0; for (let i=0;i<12;i++) s += c[i]*c[i];
  if (s>0){ s=Math.sqrt(s); for (let i=0;i<12;i++) c[i]/=s; }
  return c;
}

//////////////////// Chord Scoring ////////////////////
function scoreTemplate(ch, tmpl, rot){
  let s=0;
  for (let i=0;i<12;i++) if (tmpl[i]) s += ch[(i+rot)%12];
  let non=0; // mild penalty for off-template energy
  for (let i=0;i<12;i++) if (!tmpl[i]) non += ch[(i+rot)%12]*0.05;
  return s - non;
}
function bestChordFromChroma(ch){
  let best = {r:0,q:'',sc:-1};
  for (let r=0;r<12;r++){
    const rootBoost = ch[r]*0.25;
    const sMaj = scoreTemplate(ch, MAJ, r) + rootBoost;
    const sMin = scoreTemplate(ch, MIN, r) + rootBoost*0.9;
    if (sMaj > best.sc) best = {r,q:'', sc:sMaj};
    if (sMin > best.sc) best = {r,q:'m',sc:sMin};
  }
  return NAMES[best.r] + best.q;
}

//////////////////// Frame Label ////////////////////
function labelFrame(frame, sr){
  const mags   = fftMagPrewindowed(frame.slice());
  const white  = whiten(mags, 10);
  const chroma = chromaFromSpectrum(white, sr, frame.length);
  return bestChordFromChroma(chroma);
}

//////////////////// Median Smoothing ////////////////////
function medianSmooth(labels, w=5){
  if (labels.length===0 || w<=1) return labels;
  const out = labels.slice();
  const half = Math.floor(w/2);
  for (let i=0;i<labels.length;i++){
    const lo = Math.max(0, i-half), hi = Math.min(labels.length-1, i+half);
    const counts = new Map();
    for (let j=lo;j<=hi;j++){ counts.set(labels[j], (counts.get(labels[j])||0)+1); }
    let best=labels[i], bc=0;
    counts.forEach((c,lab)=>{ if(c>bc){ bc=c; best=lab; } });
    out[i]=best;
  }
  return out;
}

//////////////////// Batch API ////////////////////
self.onmessage = (e) => {
  const { id, frames, sr } = e.data;
  let raw = new Array(frames.length);
  for (let i=0;i<frames.length;i++){
    try { raw[i] = labelFrame(frames[i], sr); }
    catch { raw[i] = 'N'; }
  }
  const labels = medianSmooth(raw, 5);
  self.postMessage({ id, labels });
};
