// habitat-behavior.js
// Tiny behavior / balance layer on top of the core sim.
// Loaded AFTER habitat-main.js so these versions “win”.

// This file assumes these already exist from habitat-main.js:
//   state, clamp, randRange, addLog, showMood, showSpeech,
//   saveState, renderWorld, depthToScreen, handleToyHappiness, etc.

// ---------- Helper: per-animal wander state (not saved to storage) ----------
function getWanderState(a) {
  if (!a._wander) {
    a._wander = {
      targetX: typeof a.x === "number" ? a.x : 50,
      targetDepth: typeof a.depth === "number" ? a.depth : 0.5,
      nextRetargetAt: 0
    };
  }
  return a._wander;
}

// ---------- OVERRIDE: movement loop – smoother wander + energy tuning ----------
(function () {
  let lastMoveTick = Date.now();

  window.tickMovement = function tickMovement() {
    const now = Date.now();
    let dtMs = now - lastMoveTick;
    if (dtMs <= 0) dtMs = 2200; // fallback
    lastMoveTick = now;

    const dtSeconds = dtMs / 1000;
    const dtHours = dtSeconds / 3600;

    (state.animals || []).forEach(a => {
      if (!a.alive) return;

      const w = getWanderState(a);

      // Occasionally pick a new wander target
      if (!w.nextRetargetAt || now >= w.nextRetargetAt) {
        const baseX = typeof a.x === "number" ? a.x : 50;
        const baseD = typeof a.depth === "number" ? a.depth : 0.5;

        // Different wander ranges by species
        let roamX = 10;
        let roamD = 0.12;
        if (a.species === "dog" || a.species === "fox") roamX = 14;
        if (a.species === "rabbit") roamD = 0.18;

        w.targetX = clamp(baseX + randRange(-roamX, roamX), 5, 95);
        w.targetDepth = clamp(baseD + randRange(-roamD, roamD), 0, 1);

        // Next retarget between 8–20 seconds
        const nextMs = randRange(8000, 20000);
        w.nextRetargetAt = now + nextMs;
      }

      const curX = typeof a.x === "number" ? a.x : 50;
      const curD = typeof a.depth === "number" ? a.depth : 0.5;

      const dx = w.targetX - curX;
      const dd = w.targetDepth - curD;

      const dist = Math.sqrt(dx * dx + (dd * 100) * (dd * 100)); // depth scaled
      const moving = dist > 0.5;

      // Species-based speed (percent per second)
      let speedX = 3.0;
      let speedD = 0.12;
      if (a.species === "dog" || a.species === "fox") {
        speedX = 4.0;
        speedD = 0.16;
      }
      if (a.species === "rabbit") {
        speedX = 3.5;
        speedD = 0.20;
      }
      if (a.species === "cat") {
        speedX = 2.6;
        speedD = 0.10;
      }

      let newX = curX;
      let newD = curD;

      if (moving) {
        // Move smoothly toward target
        const stepX = Math.sign(dx) * speedX * dtSeconds;
        const stepD = Math.sign(dd) * speedD * dtSeconds;

        if (Math.abs(stepX) >= Math.abs(dx)) newX = w.targetX;
        else newX = curX + stepX;

        if (Math.abs(stepD) >= Math.abs(dd)) newD = w.targetDepth;
        else newD = curD + stepD;
      }

      a.x = clamp(newX, 5, 95);
      a.depth = clamp(newD, 0, 1);

      // --- Energy tuning ---
      // Base sim in habitat-main already drains energy over time.
      // Here we add:
      //  • Extra drain when actively moving
      //  • Slow regen when more idle and below ~80 energy
      if (moving) {
        // Extra cost for walking around
        a.energy = clamp((a.energy || 0) - 6 * dtHours);
      } else if ((a.energy || 0) < 80) {
        // Very gentle recovery while resting
        a.energy = clamp((a.energy || 0) + 3 * dtHours);
      }

      // Occasional thought bubbles based on mood/personality
      maybeShowThought(a);
    });

    saveState();
    renderWorld();
  };
})();

// ---------- OVERRIDE: personality / emoji thought bubbles ----------
window.maybeShowThought = function maybeShowThought(a) {
  if (!a || !a.alive) return;
  if (!a.id) return;

  // Add a per-animal cooldown so they don't spam bubbles
  const now = Date.now();
  if (!a._lastThoughtAt) a._lastThoughtAt = 0;
  const gapMin = (now - a._lastThoughtAt) / 60000;
  if (gapMin < 1.4) return; // min ~1.4 minutes between bubbles

  // Only a small chance each movement tick
  if (Math.random() > 0.22) return;

  const hunger = a.hunger ?? 100;
  const happy = a.happiness ?? 100;
  const energy = a.energy ?? 100;
  const clean = a.cleanliness ?? 100;
  const health = a.health ?? 100;
  const personality = a.personality || "chill";
  const species = a.species || "pet";

  let text = "";
  let emoji = "";

  // Strong needs first
  if (hunger < 25) {
    emoji = "🍖";
    text = "I’m really hungry…";
  } else if (clean < 30) {
    emoji = "🧼";
    text = "I feel kinda yucky.";
  } else if (energy < 25) {
    emoji = "😴";
    text = "I could use a nap.";
  } else if (happy < 35) {
    emoji = "😕";
    text = "I need some love.";
  } else if (health < 60) {
    emoji = "💊";
    text = "I don’t feel great.";
  } else {
    // Personality-flavored idle thoughts
    if (species === "dog") {
      if (personality === "goofy") {
        const lines = [
          "Ball? Ball??",
          "Everything is exciting!",
          "Did you see that leaf?!"
        ];
        emoji = "🐶";
        text = lines[Math.floor(Math.random() * lines.length)];
      } else if (personality === "needy") {
        emoji = "💗";
        text = "Are we still best friends?";
      } else if (personality === "lazy") {
        emoji = "🛏️";
        text = "This spot is perfect.";
      } else {
        emoji = "🐾";
        text = "Just guarding the yard.";
      }
    } else if (species === "cat") {
      if (personality === "aloof") {
        emoji = "😼";
        text = "I allow this reality.";
      } else if (personality === "gremlin" || personality === "chaotic") {
        emoji = "😈";
        text = "Something here needs knocking over.";
      } else if (personality === "cuddly") {
        emoji = "💤";
        text = "Nap now, chaos later.";
      } else {
        emoji = "🐱";
        text = "This fence is my kingdom.";
      }
    } else if (species === "rabbit") {
      if (personality === "shy" || personality === "skittish") {
        emoji = "🐰";
        text = "Is it safe to hop yet?";
      } else {
        emoji = "🥕";
        text = "I could go for a snack.";
      }
    } else if (species === "fox") {
      if (personality === "sneaky") {
        emoji = "🦊";
        text = "I’m plotting something fun.";
      } else {
        emoji = "✨";
        text = "This yard is my playground.";
      }
    } else {
      emoji = "🐾";
      text = "Just vibing in the cyber yard.";
    }
  }

  a._lastThoughtAt = now;
  showSpeech(a.id, text, 2700);
  if (emoji) showMood(a.id, emoji);
};

// ---------- OVERRIDE: hazard damage – softer, more forgiving ----------
window.handleHazards = function handleHazards(hours, rawMinutes) {
  if (!state.hazards || !state.hazards.length) return;
  const alive = state.animals.filter(a => a.alive);
  if (!alive.length) return;

  state.hazards.forEach(h => {
    // closest animal
    let closest = null;
    let bestDist = Infinity;
    alive.forEach(a => {
      const dist =
        Math.abs((a.x || 0) - (h.x || 50)) +
        Math.abs((a.depth || 0.5) - (h.depth || 0.5)) * 40;
      if (dist < bestDist) {
        bestDist = dist;
        closest = a;
      }
    });
    if (!closest || bestDist > 18) return;

    // SOFTER damage than the core version:
    if (h.type === "can") {
      closest.health = clamp(closest.health - 3 * hours);
      closest.happiness = clamp(closest.happiness - 4);
      closest.hunger = clamp(closest.hunger - 2);
      if (Math.random() < 0.22) {
        addLog(`${closest.name} sniffed Justin's old can and didn’t like it.`);
      }
    } else if (h.type === "sparkler") {
      closest.health = clamp(closest.health - 8 * hours);
      closest.happiness = clamp(closest.happiness - 4);
      if (Math.random() < 0.26) {
        addLog(`${closest.name} got spooked by Justin's sparkler.`);
      }
    } else if (h.type === "spoiledFood") {
      closest.health = clamp(closest.health - 6 * hours);
      closest.hunger = clamp(closest.hunger - 5);
      if (Math.random() < 0.26) {
        addLog(`${closest.name} nibbled something weird Justin tossed.`);
      }
    }

    // Tiny “survival XP” so hazards are scary but also progress
    closest.xp = (closest.xp || 0) + Math.round(4 * hours);
  });

  // Auto-clear very old hazards like before
  const cutoff = Date.now() - 30 * 60 * 1000;
  state.hazards = state.hazards.filter(h => h.createdAt > cutoff);
};
