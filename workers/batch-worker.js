// workers/yin-worker.js
// Lightweight YIN pitch tracker → segments into notes; returns [{start,end,midi}]

self.onmessage = (e) => {
  const { id, mono, sr, hopSamples } = e.data;
  try {
    const conf = { sr, fmin: 80, fmax: 1000, frame: 2048, hop: hopSamples || 256, thresh: 0.15, minVoicedFrames: 3 };
    const f0 = yinTrack(mono, conf);                // per-frame Hz (0 if unvoiced)
    const notes = segmentNotesFromF0(f0, conf);     // [{start,end,midi}]
    self.postMessage({ id, notes });
  } catch (err){
    self.postMessage({ id, notes: [] });
  }
};

/* ===== YIN core ===== */
function yinTrack(x, { sr, fmin, fmax, frame, hop, thresh }){
  const N = x.length;
  const frames = Math.max(0, Math.floor((N - frame) / hop));
  const f0 = new Float32Array(frames);
  const tauMin = Math.max(1, Math.floor(sr / fmax));
  const tauMax = Math.min(frame-1, Math.floor(sr / fmin));
  const buf = new Float32Array(frame);

  for (let i=0;i<frames;i++){
    const off = i*hop;
    for (let n=0;n<frame;n++) buf[n] = x[off + n] || 0;
    const tau = yinPitch(buf, tauMin, tauMax, thresh);
    f0[i] = tau > 0 ? sr / tau : 0;
  }
  return f0;
}

function yinPitch(buf, tauMin, tauMax, thresh){
  const N = buf.length;
  const diff = new Float32Array(tauMax+1);
  // difference function
  for (let tau=tauMin; tau<=tauMax; tau++){
    let s=0;
    for (let i=0;i<N-tau;i++){
      const d = buf[i] - buf[i+tau];
      s += d*d;
    }
    diff[tau] = s;
  }
  // cumulative mean normalized difference
  const cmnd = new Float32Array(tauMax+1);
  cmnd[0]=1; let running=0;
  for (let tau=1; tau<=tauMax; tau++){
    running += diff[tau];
    cmnd[tau] = diff[tau] * tau / (running || 1);
  }
  // absolute threshold
  let tau = -1;
  for (let t=tauMin; t<=tauMax; t++){
    if (cmnd[t] < thresh){
      // parabolic interpolation for sub-sample accuracy
      let t0 = t, t1 = t-1, t2 = t+1;
      if (t1>=tauMin && t2<=tauMax){
        const a = cmnd[t1], b = cmnd[t0], c = cmnd[t2];
        const denom = (a - 2*b + c);
        const p = denom !== 0 ? 0.5*(a - c)/denom : 0;
        tau = t + p;
      } else {
        tau = t;
      }
      break;
    }
  }
  return tau>0 ? tau : 0;
}

/* ===== F0 → note segmentation ===== */
function hzToMidi(hz){ return hz>0 ? 69 + 12*Math.log2(hz/440) : 0; }
function segmentNotesFromF0(f0, { sr, hop, minVoicedFrames=3 }){
  const notes = [];
  let on=-1, lastMidi=0;
  for (let i=0;i<f0.length;i++){
    const hz = f0[i];
    if (hz>0){
      const midi = Math.round(hzToMidi(hz));
      if (on<0){ on=i; lastMidi=midi; }
      else {
        // if pitch jumps a lot, close and start new
        if (Math.abs(midi - lastMidi) >= 2){
          if (i-on >= minVoicedFrames){
            notes.push(idxToNote(on, i, lastMidi, sr, hop));
          }
          on = i; lastMidi = midi;
        } else {
          // continue same note; keep lastMidi as running median-ish
          lastMidi = Math.round((lastMidi*3 + midi)/4);
        }
      }
    } else {
      if (on>=0 && i-on >= minVoicedFrames){
        notes.push(idxToNote(on, i, lastMidi, sr, hop));
      }
      on = -1;
    }
  }
  if (on>=0){
    notes.push(idxToNote(on, f0.length, lastMidi, sr, hop));
  }
  return notes;
}
function idxToNote(a, b, midi, sr, hop){
  return { start: (a*hop)/sr, end: (b*hop)/sr, midi: midi };
}
