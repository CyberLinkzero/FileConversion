// romBytes: Uint8Array
// canvas: HTMLCanvasElement
// options: { onStatus?: fn, setInitialVolume?: number }
window.startBSNES = async function (romBytes, canvas, options = {}) {
  // 1. Initialize your Emscripten/WASM module
  // 2. Feed romBytes into bsnes
  // 3. Connect its video output to the canvas
  // 4. Connect its audio to Web Audio
  // 5. Return an object with the methods the HTML page expects:
  //    reset(), stop(), setVolume(), setInputState(), saveState(), loadState(),
  //    getSRAM(), setSRAM()
};
