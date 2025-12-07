// bsnes-core.js
// Wrapper layer around your bsnes WebAssembly build to match the API
// expected by bsnes-emulator.html

(function () {
  "use strict";

  // ---------------- CONFIG / PLACEHOLDERS ----------------
  // You MUST adapt these parts to your actual bsnes WASM build.

  // 1) How you get the Emscripten module:
  //
  //   - If your glue script defines a global `createBsnesModule` factory:
  //        createBsnesModule(opts) -> Promise<Module>
  //
  //   - If it just defines `Module` and auto-instantiates, you may already
  //     have a ready Module and don't need a factory.
  //
  // Replace this with whatever your build uses.
  let modulePromise = null;

  function getBsnesModule() {
    if (!modulePromise) {
      modulePromise = new Promise((resolve, reject) => {
        // TODO: Replace this detection with your real factory.
        // Example if your glue is built with MODULARIZE=1:
        //
        //   if (typeof createBsnesModule !== "function") {
        //     return reject(new Error("createBsnesModule not found"));
        //   }
        //   createBsnesModule({
        //     onAbort: (err) => reject(new Error("bsnes abort: " + err))
        //   }).then(resolve).catch(reject);
        //
        // Example if you just have a global Module already:
        //
        //   if (typeof Module === "undefined") {
        //     return reject(new Error("Global Module not found"));
        //   }
        //   resolve(Module);
        //

        if (typeof createBsnesModule === "function") {
          createBsnesModule({}).then(resolve).catch(reject);
        } else if (typeof Module !== "undefined") {
          resolve(Module);
        } else {
          reject(new Error("No bsnes module factory found (createBsnesModule / Module)."));
        }
      });
    }
    return modulePromise;
  }

  // 2) Export name mapping:
  //
  // You’ll need to map your C exports (from bsnes) into JS functions here.
  // These are just example names – change them to match your build.
  function makeExports(Module) {
    // Typical Emscripten C exports are accessible as Module._functionName
    // or via Module.cwrap("functionName", returnType, [argTypes])

    const cwrap = Module.cwrap.bind(Module);

    // TODO: change these names to match your actual exported C functions
    const initEmu    = cwrap("bsnes_init", "void", []);
    const resetEmu   = cwrap("bsnes_reset", "void", []);
    const runFrame   = cwrap("bsnes_run_frame", "void", []);
    const loadRom    = cwrap("bsnes_load_rom", "number", ["number", "number"]);
    const setInput   = cwrap("bsnes_set_input", "void", ["number", "number"]); // port, bitmask
    const setVol     = cwrap("bsnes_set_volume", "void", ["number"]);          // 0..1 (float mapped to double)
    const saveState  = cwrap("bsnes_save_state", "number", ["number"]);        // buffer ptr, returns size
    const loadState  = cwrap("bsnes_load_state", "void", ["number", "number"]); // ptr, size
    const getSram    = cwrap("bsnes_get_sram", "number", ["number"]);          // buffer ptr, returns size
    const setSram    = cwrap("bsnes_set_sram", "void", ["number", "number"]);  // ptr, size

    // If your exports are different, rewrite this section.

    return {
      initEmu,
      resetEmu,
      runFrame,
      loadRom,
      setInput,
      setVol,
      saveState,
      loadState,
      getSram,
      setSram
    };
  }

  // ---------------- VIDEO / AUDIO NOTES ----------------
  //
  // Video:
  //   Usually you tell Emscripten to render into a canvas already, or you
  //   copy a framebuffer into our canvas each frame.
  //
  //   For now, this wrapper just assumes your Module is already configured
  //   to draw into `canvas` that we set in Module.canvas.
  //
  // Audio:
  //   Many ports will create an internal WebAudio context. We just forward
  //   volume via setVolume().

  // ---------------- INPUT BITMASK ----------------
  //
  // We'll encode SNES buttons into a bitmask expected by your core.
  // Adjust the mapping to match bsnes’ input layout if needed.
  //
  // Example mapping (you might need to swap bits depending on your core):
  const BUTTON_MASKS = {
    b:      1 << 0,
    y:      1 << 1,
    select: 1 << 2,
    start:  1 << 3,
    up:     1 << 4,
    down:   1 << 5,
    left:   1 << 6,
    right:  1 << 7,
    a:      1 << 8,
    x:      1 << 9,
    l:      1 << 10,
    r:      1 << 11
  };

  function inputStateToMask(stateObj) {
    let mask = 0;
    for (const [name, bit] of Object.entries(BUTTON_MASKS)) {
      if (stateObj[name]) mask |= bit;
    }
    return mask;
  }

  // ---------------- MAIN ENTRY POINT ----------------

  // romBytes: Uint8Array
  // canvas: HTMLCanvasElement
  // options: { onStatus?: fn, setInitialVolume?: number }
  window.startBSNES = async function (romBytes, canvas, options = {}) {
    const onStatus = typeof options.onStatus === "function"
      ? options.onStatus
      : () => {};

    const initialVolume = typeof options.setInitialVolume === "number"
      ? options.setInitialVolume
      : 0.8;

    const Module = await getBsnesModule();
    const exports = makeExports(Module);

    // Configure canvas for Emscripten if needed.
    // If your build uses Module.canvas, set it here:
    if (Module.canvas !== canvas) {
      Module.canvas = canvas;
    }

    onStatus("Initializing bsnes core…");
    exports.initEmu();

    // ---- Load ROM into wasm memory ----
    onStatus("Loading ROM into bsnes…");

    const romPtr = Module._malloc(romBytes.length);
    Module.HEAPU8.set(romBytes, romPtr);

    // loadRom(romPtr, romSize) should return nonzero on success (adjust as needed)
    const ok = exports.loadRom(romPtr, romBytes.length);
    Module._free(romPtr);

    if (!ok) {
      onStatus("Failed to load ROM in bsnes core.");
      throw new Error("bsnes_load_rom failed");
    }

    // ---- Volume ----
    function setVolume(value) {
      const v = Math.max(0, Math.min(1, value));
      try {
        exports.setVol(v);
      } catch (e) {
        console.warn("setVolume failed:", e);
      }
    }
    setVolume(initialVolume);

    // ---- Input state ----
    const currentInputMasks = new Map(); // port -> bitmask

    function setInputState(port, stateObj) {
      // port: usually 0 for player1
      const mask = inputStateToMask(stateObj || {});
      currentInputMasks.set(port, mask);
      try {
        exports.setInput(port, mask);
      } catch (e) {
        console.warn("setInputState failed:", e);
      }
    }

    // ---- Save / load state ----
    //
    // For saveState we need to allocate a buffer in wasm, call bsnes_save_state,
    // which fills it and returns the number of bytes used.
    //
    // The details depend on how your bsnes build does serialization.
    function saveState() {
      // Choose a max buffer size for save states. Adjust as needed.
      const maxSize = 1024 * 512; // 512 KB (example)
      const ptr = Module._malloc(maxSize);
      const size = exports.saveState(ptr); // expected to return size
      if (!size || size <= 0 || size > maxSize) {
        Module._free(ptr);
        throw new Error("bsnes_save_state returned invalid size: " + size);
      }
      const out = new Uint8Array(size);
      out.set(Module.HEAPU8.subarray(ptr, ptr + size));
      Module._free(ptr);
      return out;
    }

    function loadState(bytes) {
      const ptr = Module._malloc(bytes.length);
      Module.HEAPU8.set(bytes, ptr);
      exports.loadState(ptr, bytes.length);
      Module._free(ptr);
    }

    // ---- SRAM get/set ----
    function getSRAM() {
      // same pattern as saveState
      const maxSize = 128 * 1024; // 128 KB typical SRAM upper bound
      const ptr = Module._malloc(maxSize);
      const size = exports.getSram(ptr); // returns bytes used
      if (!size || size <= 0 || size > maxSize) {
        Module._free(ptr);
        return new Uint8Array(0);
      }
      const out = new Uint8Array(size);
      out.set(Module.HEAPU8.subarray(ptr, ptr + size));
      Module._free(ptr);
      return out;
    }

    function setSRAM(bytes) {
      if (!bytes || !bytes.length) return;
      const ptr = Module._malloc(bytes.length);
      Module.HEAPU8.set(bytes, ptr);
      exports.setSram(ptr, bytes.length);
      Module._free(ptr);
    }

    // ---- Main loop ----
    let running = true;

    function frameLoop() {
      if (!running) return;
      try {
        exports.runFrame();
      } catch (e) {
        console.error("bsnes_run_frame failed:", e);
        running = false;
        onStatus("Emulation stopped due to error.");
        return;
      }
      requestAnimationFrame(frameLoop);
    }

    requestAnimationFrame(frameLoop);
    onStatus("bsnes core started.");

    // ---- Public instance ----
    function reset() {
      try {
        exports.resetEmu();
        onStatus("ROM reset.");
      } catch (e) {
        console.warn("reset failed:", e);
      }
    }

    function stop() {
      running = false;
      onStatus("Emulation stopped.");
      // If your Module has extra cleanup, do it here.
      // e.g., Module._bsnes_shutdown && Module._bsnes_shutdown();
    }

    return {
      reset,
      stop,
      setVolume,
      setInputState,
      saveState,
      loadState,
      getSRAM,
      setSRAM
    };
  };
})();
