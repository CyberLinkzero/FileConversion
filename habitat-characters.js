// habitat-characters.js
// All the weird humans + their dialogue live here.
// You can add more characters and more legendary lines without touching the core logic.

window.HABITAT_CHARACTERS = {
  justin: {
    name: "Justin",
    // shows under "Justin walks by" select in the main UI
    id: "justin",
    // Common lines – appear most of the time
    commonLines: [
      "See, the earth is flat.",
      "I knew we were living in a simulation.",
      "If this was a bug, QA would’ve caught it… right?",
      "Have you tried turning reality off and on again?",
      "Somewhere, a server is logging this walk.",
      "I’m just an NPC on a coffee break.",
      "Pretty sure these pets are smarter than my last team.",
      "If I walk off-screen, do I still exist?",
      "I updated the terms of service you didn’t read.",
      "I’m not real, I’m just CSS and anxiety.",
      "The cats definitely run this place.",
      "Dog: 1, obedience class: 0.",
      "I knew those birds were government drones.",
      "Don’t mind me, just questioning reality again.",
      "Somewhere out there, another Justin is doing this too."
    ],
    // Legendary lines – rarer, “ohhhh he said the thing”
    legendaryLines: [
      "Congrats, you’ve unlocked the ‘Justin is weird’ achievement.",
      "If the earth was round, my legs would be tired by now.",
      "We’re all just variables waiting to be garbage-collected.",
      "Relax, it’s all just a badly documented API call.",
      "I saw the source code once. It was mostly TODOs.",
      "Plot twist: you’re the one in *my* game.",
      "Real life patch notes: ‘Nerfed happiness, buffed bills.’",
      "I filed a bug report on reality. It’s still ‘under review’."
    ],
    legendaryChance: 0.2 // 20% of the time, pick from legendary instead of common
  }

  // EXAMPLE: add another character later
  // ,neighborAva: {
  //   name: "Ava",
  //   id: "neighborAva",
  //   commonLines: [
  //     "I only came here for the dog.",
  //     "These pets have more personality than my coworkers."
  //   ],
  //   legendaryLines: [
  //     "If love had a sound, it’d be a dog’s paws on hardwood floor."
  //   ],
  //   legendaryChance: 0.15
  // }
};

// Utility: pick a line for a character, with legendary weighting.
window.pickCharacterLine = function pickCharacterLine(characterId) {
  const all = window.HABITAT_CHARACTERS || {};
  const c = all[characterId];
  if (!c) return "";

  const commons = c.commonLines || [];
  const legos   = c.legendaryLines || [];
  const useLegendary =
    legos.length && Math.random() < (c.legendaryChance ?? 0.18);

  const pool = useLegendary && legos.length ? legos : commons;
  if (!pool.length) return "";
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};
