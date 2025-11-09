// /workers/batch-worker.js
// Lightweight batch processor (replace computeLabel with your chord/feature logic)

function computeLabel(frame, sr) {
  // Placeholder: simple loud/soft via RMS — swap with your chord analyzer.
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
  const rms = Math.sqrt(sum / frame.length);
  // Return fake chord labels for demo; keep string output for main pipeline
  return rms > 0.02 ? 'C' : 'Am';
}

self.onmessage = (e) => {
  const { id, frames, sr } = e.data;
  const labels = new Array(frames.length);
  for (let i = 0; i < frames.length; i++) labels[i] = computeLabel(frames[i], sr);
  self.postMessage({ id, labels });
};
