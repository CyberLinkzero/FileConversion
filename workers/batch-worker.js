// /workers/batch-worker.js
// Chroma-based chord detector (major/minor) — batch API compatible.
// Input: { id, frames: Float32Array[], sr } ; Output: { id, labels: string[] }

//////////////////// Windowing & FFT ////////////////////
function hann(N, i){ return 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1))); }

// Naive DFT magnitudes (OK for 4096-size frames in a worker; GH Pages-safe)
function fftMag(frame){
  const N = frame.length;
  const mags = new Float32Array(N/2);
  // Pre-window (in-place copy is done by caller; but we’re safer here too)
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) w[i] = frame[i] * hann(N, i);

  for (let k = 1; k < N/2; k++){
    let re = 0, im = 0;
    const angCoef = -2 * Math.PI * k / N;
    for (let n = 0; n < N; n++){
      const ang = angCoef * n;
      const x = w[n];
      re += x * Math.cos(ang);
      im += x * Math.sin(ang);
    }
    mags[k] = Math.hypot(re, im);
  }
  return mags;
}

//////////////////// Chroma ////////////////////
function hzToMidi(hz){ return 69 + 12*Math.log2(hz/440); }

function chromaFromSpectrum(mags, sr, nfft){
  // 12-dim chroma vector normalized
  const c = new Float32Array(12);
  for (let k = 1; k < mags.length; k++){
    const f = k * sr / nfft;
    if (f < 50 || f > 5500) continue;       // focus band
    const midi = hzToMidi(f);
    if (!Number.isFinite(midi)) continue;
    const pc = Math.round(midi) % 12;
    c[(pc + 12) % 12] += mags[k];
  }
  // normalize (L1)
  let s = 0; for (let i = 0; i < 12; i++) s += c[i];
  if (s > 0) for (let i = 0; i < 12; i++) c[i] /= s;
  return c;
}

//////////////////// Chord Templates ////////////////////
// Binary templates for triads; rotate for each root.
const MAJ = [1,0,0,0,1,0,0,1,0,0,0,0]; // 1, 3, 5
const MIN = [1,0,0,1,0,0,0,1,0,0,0,0]; // 1, b3, 5
const NAMES = ['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];

function scoreTemplate(chroma, tmpl, rot){
  let s = 0;
  for (let i = 0; i < 12; i++){
    if (tmpl[i]) s += chroma[(i + rot) % 12];
  }
  return s;
}

function bestChordFromChroma(ch){
  let best = null;
  for (let r = 0; r < 12; r++){
    const sMaj = scoreTemplate(ch, MAJ, r);
    const sMin = scoreTemplate(ch, MIN, r);
    // Light preference for consistent bass (emphasize root a bit)
    const rootBoost = ch[r] * 0.15;
    const scMaj = sMaj + rootBoost;
    const scMin = sMin + rootBoost * 0.8;
    if (!best || scMaj > best.sc) best = { r, q: '',  sc: scMaj };
    if (scMin > best.sc)          best = { r, q: 'm', sc: scMin };
  }
  return NAMES[best.r] + best.q;
}

//////////////////// Frame → Label ////////////////////
function labelFrame(frame, sr){
  const mags   = fftMag(frame);               // magnitude spectrum
  const chroma = chromaFromSpectrum(mags, sr, frame.length);
  return bestChordFromChroma(chroma);
}

//////////////////// Batch API ////////////////////
self.onmessage = (e) => {
  const { id, frames, sr } = e.data;
  const labels = new Array(frames.length);
  for (let i = 0; i < frames.length; i++){
    try {
      labels[i] = labelFrame(frames[i], sr);
    } catch {
      labels[i] = 'N'; // fallback "no chord"
    }
  }
  self.postMessage({ id, labels });
};
