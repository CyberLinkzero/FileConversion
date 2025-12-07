// libs/bsnes-core-byuu.js
// Adapter that uses the `byuu` web core (bsnes/higan) under the hood
// and exposes window.startBSNES(romBytes, canvas, options)

(function () {
  "use strict";

  let byuuInitialized = false;
  let lastContainer = null;

  async function ensureByuuInitialized(canvas, onStatus) {
    if (typeof byuu === "undefined") {
      throw new Error(
        "byuu core not found. Make sure byuu-bundle.js is included BEFORE bsnes-core-byuu.js."
      );
    }

    // Choose a container: the canvas parent if it exists, otherwise body.
    const container = canvas.parentElement || document.body;

    // Only initialize once per page load
    if (!byuuInitialized) {
      onStatus("Initializing bsnes/byuu core…");
      // Use the canvas size; byuu will create its own internal canvas element
      await byuu.initialize(container, canvas.width || 512, canvas.height || 448);
      byuuInitialized = true;
      lastContainer = container;
    }

    return container;
  }

  window.startBSNES = async function (romBytes, canvas, options = {}) {
    const onStatus =
      typeof options.onStatus === "function" ? options.onStatus : () => {};

    await ensureByuuInitialized(canvas, onStatus);

    // Turn the in-memory ROM into a blob URL that byuu.loadURL can fetch
    const romBlob = new Blob([romBytes], { type: "application/octet-stream" });
    const romUrl = URL.createObjectURL(romBlob);

    onStatus("Loading ROM into bsnes/byuu core…");
    let info;
    try {
      info = await byuu.loadURL(romUrl);
      console.log("[byuu] ROM info:", info);
    } finally {
      // We can revoke after load; byuu has already read it
      URL.revokeObjectURL(romUrl);
    }

    const started = byuu.start();
    if (!started) {
      throw new Error("byuu.start() returned false – failed to start emulation.");
    }

    onStatus("bsnes core running.");

    // Minimal volume & input stubs for now – safe no-ops until you wire them.
    function setVolume(value) {
      const v = Math.max(0, Math.min(1, value));
      console.log("[byuu] setVolume (stub):", v);
      // If a future byuu version exposes volume, wire it here.
      // e.g. byuu.setVolume?.(v);
    }

    function setInputState(port, stateObj) {
      // Here you'd translate your stateObj → byuu controller API
      // For now this is a no-op so nothing breaks.
      console.log("[byuu] setInputState (stub): port =", port, stateObj);
    }

    function reset() {
      console.log("[byuu] reset (stub)");
      // If byuu exposes a soft reset, call it here (e.g. byuu.reset?.()).
    }

    function stop() {
      console.log("[byuu] stop → byuu.terminate()");
      try {
        byuu.terminate && byuu.terminate();
      } catch (e) {
        console.warn("byuu.terminate failed:", e);
      }
      byuuInitialized = false;
    }

    function saveState() {
      // Proper save-state support would use byuu's API (not public in README),
      // so we expose a clear error instead of silently failing.
      throw new Error("saveState() is not wired to byuu yet.");
    }

    function loadState(bytes) {
      console.warn("loadState() is not wired to byuu yet; ignoring.", bytes);
    }

    function getSRAM() {
      console.warn("getSRAM() is not wired to byuu yet; returning empty.");
      return new Uint8Array(0);
    }

    function setSRAM(bytes) {
      console.warn("setSRAM() is not wired to byuu yet; ignoring.", bytes);
    }

    return {
      reset,
      stop,
      setVolume,
      setInputState,
      saveState,
      loadState,
      getSRAM,
      setSRAM,
    };
  };
})();
