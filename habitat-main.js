// habitat-main.js

const STORAGE_KEY = "habitatgotchi-v3";

const SPECIES_CONFIG = {
  dog:    { emoji:"🐶", label:"Dog",    baseRel:"Playful, chases cats.",    weightStart:55 },
  cat:    { emoji:"🐱", label:"Cat",    baseRel:"Independent and picky.",   weightStart:40 },
  rabbit: { emoji:"🐰", label:"Rabbit", baseRel:"Shy, spooks easily.",      weightStart:30 },
  fox:    { emoji:"🦊", label:"Fox",    baseRel:"Mischievous chaser.",      weightStart:45 }
};

let state = {
  lastUpdate: Date.now(),
  animals: [],
  poops: [],
  toys: [],
  plants: [],
  houses: [],
  weatherMode: "auto",
  locationName: "",
  justinFrequency: "normal"
};

// --------- helpers ---------
function clamp(v,min=0,max=100){return Math.max(min,Math.min(max,v));}
function randRange(min,max){return min + Math.random()*(max-min);}

// --------- load state ----------
(function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const s = JSON.parse(raw);
      state.lastUpdate = s.lastUpdate || Date.now();
      state.weatherMode = s.weatherMode || "auto";
      state.locationName = s.locationName || "";
      state.justinFrequency = s.justinFrequency || "normal";
      state.animals = (s.animals||[]).map(a=>({
        id: a.id || crypto.randomUUID(),
        name: a.name || "Buddy",
        species: a.species in SPECIES_CONFIG ? a.species : "dog",
        createdAt: a.createdAt || Date.now(),
        hunger: clamp(a.hunger ?? 100),
        happiness: clamp(a.happiness ?? 100),
        energy: clamp(a.energy ?? 100),
        cleanliness: clamp(a.cleanliness ?? 100),
        weight: clamp(a.weight ?? (SPECIES_CONFIG[a.species]?.weightStart ?? 50),20,200),
        health: clamp(a.health ?? 100),
        alive: a.alive !== false,
        overweightMinutes: a.overweightMinutes || 0,
        x: typeof a.x==="number" ? a.x : randRange(10,90),
        depth: typeof a.depth==="number" ? a.depth : randRange(0,1)
      }));
      state.poops = (s.poops||[]).map(p=>({
        id: p.id || crypto.randomUUID(),
        x: typeof p.x==="number"?p.x:randRange(10,90),
        depth: typeof p.depth==="number"?p.depth:randRange(0,1),
        createdAt: p.createdAt || Date.now()
      }));
      state.toys = (s.toys||[]).map(t=>({
        id: t.id || crypto.randomUUID(),
        x: typeof t.x==="number"?t.x:randRange(10,90),
        depth: typeof t.depth==="number"?t.depth:randRange(0,1),
        createdAt: t.createdAt || Date.now()
      }));
      state.plants = (s.plants||[]).map(p=>({
        id: p.id || crypto.randomUUID(),
        x: typeof p.x==="number"?p.x:randRange(10,90),
        depth: typeof p.depth==="number"?p.depth:randRange(0,1),
        createdAt: p.createdAt || Date.now(),
        variant: p.variant || (Math.random()<0.5?"tree":"flower")
      }));
      state.houses = (s.houses||[]).map(h=>({
        id: h.id || crypto.randomUUID(),
        x: typeof h.x==="number"?h.x:randRange(10,90),
        depth: typeof h.depth==="number"?h.depth:randRange(0,1),
        createdAt: h.createdAt || Date.now(),
        variant: h.variant || (Math.random()<0.5?"doghouse":"hut")
      }));
    }
  }catch(e){
    console.warn("load error",e);
  }
})();

function saveState(){
  state.lastUpdate = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --------- logging ----------
const logEl = document.getElementById("log");
function addLog(msg){
  const now = new Date();
  const t = now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const div = document.createElement("div");
  div.className = "log-entry";
  div.innerHTML = `<span class="time">${t}</span><span class="msg">${msg}</span>`;
  logEl.prepend(div);
  while(logEl.children.length>120) logEl.removeChild(logEl.lastChild);
}

const fastToggle = document.getElementById("fastToggle");

function getTimePhase(date=new Date()){
  const h = date.getHours();
  if(h >= 6 && h < 8) return "dawn";
  if(h >= 8 && h < 18) return "day";
  if(h >= 18 && h < 20) return "dusk";
  return "night";
}

function getCurrentWeather(date=new Date()){
  const mode = state.weatherMode || "auto";
  if(mode !== "auto") return mode;
  const h = date.getHours();
  if(h < 9) return "clear";
  if(h < 13) return "cloudy";
  if(h < 17) return "rainy";
  if(h < 20) return "cloudy";
  return "snowy";
}

// --------- simulation ----------
function simulateFromLastUpdate(){
  const now = Date.now();
  let elapsedMs = now - state.lastUpdate;
  if(elapsedMs < 5000) return;
  if(fastToggle.checked) elapsedMs *= 8;
  let elapsedMinutes = elapsedMs/60000;
  const rawMinutes = elapsedMinutes;
  if(elapsedMinutes <= 0) return;
  elapsedMinutes = Math.min(elapsedMinutes, 24*60);
  const hours = elapsedMinutes/60;

  const alive = state.animals.filter(a=>a.alive);
  if(!alive.length){
    state.lastUpdate = now;
    return;
  }

  let hungerDropPerHour = 16;
  let happyDropPerHour  = 9;
  let energyDropPerHour = 9;
  let cleanDropPerHour  = 6;

  const weatherNow = getCurrentWeather(new Date(state.lastUpdate));
  const hasShelter = state.houses.length > 0;

  if(weatherNow === "rainy"){
    cleanDropPerHour += 3;
    if(hasShelter) cleanDropPerHour *= 0.6;
  }else if(weatherNow === "snowy"){
    energyDropPerHour += 3;
    if(hasShelter) energyDropPerHour *= 0.7;
  }else if(weatherNow === "cloudy"){
    happyDropPerHour += 1;
  }else if(weatherNow === "clear"){
    happyDropPerHour = Math.max(5, happyDropPerHour - 1);
  }

  alive.forEach(a=>{
    a.hunger      = clamp(a.hunger - hungerDropPerHour*hours);
    a.happiness   = clamp(a.happiness - happyDropPerHour*hours);
    a.energy      = clamp(a.energy - energyDropPerHour*hours);
    a.cleanliness = clamp(a.cleanliness - cleanDropPerHour*hours);

    if(a.hunger < 25)      a.health = clamp(a.health - 15*hours);
    if(a.cleanliness < 25) a.health = clamp(a.health - 10*hours);
    if(a.happiness < 20)   a.health = clamp(a.health - 8*hours);

    if(a.hunger < 40 && a.energy > 40){
      a.weight = clamp(a.weight - 6*hours, 20, 200);
    }
    if(a.hunger > 70 && a.energy < 40){
      a.weight = clamp(a.weight + 9*hours, 20, 200);
    }

    if(a.weight >= 140){
      a.overweightMinutes += rawMinutes;
      a.health = clamp(a.health - 10*hours);
    }else{
      a.overweightMinutes = Math.max(0, a.overweightMinutes - rawMinutes/2);
    }

    const tooSkinny = a.weight <= 25;
    const tooFat    = a.weight >= 175 || a.overweightMinutes > 6*60;
    const zeroStat  = a.health <= 0;

    if(a.alive && (tooSkinny || tooFat || zeroStat)){
      a.alive = false;
      if(tooFat)      addLog(`${a.name} the ${a.species} became too overweight and died. 💔`);
      else if(tooSkinny) addLog(`${a.name} the ${a.species} became too weak and died. 💔`);
      else            addLog(`${a.name} the ${a.species} died from poor health. 💔`);
    }

    if(a.alive){
      const pooRatePerHour = 0.4;
      if(Math.random() < pooRatePerHour * hours){
        spawnPooNearAnimal(a);
      }
    }
  });

  if(state.poops.length){
    const envPenalty = Math.min(state.poops.length*0.4, 8);
    alive.forEach(a=>{
      a.cleanliness = clamp(a.cleanliness - envPenalty*hours*0.4);
      a.health      = clamp(a.health      - envPenalty*hours*0.3);
    });
  }

  handleInteractions(hours, rawMinutes);
  handleToyHappiness(hours);

  state.lastUpdate = now;
  saveState();
  render();
}

function spawnPooNearAnimal(a){
  const x = clamp((a.x||50)+randRange(-6,6),5,95);
  const depth = clamp((a.depth||0.5)+randRange(-0.05,0.05),0,1);
  state.poops.push({
    id: crypto.randomUUID(),
    x, depth,
    createdAt: Date.now()
  });
}

function handleToyHappiness(hours){
  if(!state.toys.length) return;
  const alive = state.animals.filter(a=>a.alive);
  if(!alive.length) return;
  state.toys.forEach(t=>{
    alive.forEach(a=>{
      const dist = Math.abs((a.x||0) - t.x) + Math.abs((a.depth||0)-(t.depth||0))*40;
      if(dist < 18){
        a.happiness = clamp(a.happiness + 4*hours + 2);
        a.energy = clamp(a.energy - 2*hours);
        showMood(a.id,"❤️");
      }
    });
  });
  const cut = Date.now() - 10*60*1000;
  state.toys = state.toys.filter(t=>t.createdAt > cut);
}

function handleInteractions(hours, rawMinutes){
  const a = state.animals.filter(x=>x.alive);
  if(a.length < 2) return;

  for(let i=0;i<a.length;i++){
    for(let j=i+1;j<a.length;j++){
      const p1 = a[i], p2 = a[j];
      const dist = Math.abs((p1.x||0) - (p2.x||0)) + Math.abs((p1.depth||0)-(p2.depth||0))*40;
      if(dist > 18) continue;

      const combo = [p1.species,p2.species].sort().join("-");

      const moveToward = (chaser, target, strength=0.3)=>{
        const dx = (target.x||50) - (chaser.x||50);
        const dd = (target.depth||0.5) - (chaser.depth||0.5);
        chaser.x = clamp((chaser.x||50) + dx*strength,5,95);
        chaser.depth = clamp((chaser.depth||0.5) + dd*strength,0,1);
      };
      const moveAway = (prey, from, strength=0.4)=>{
        const dx = (prey.x||50) - (from.x||50);
        const dd = (prey.depth||0.5) - (from.depth||0.5);
        prey.x = clamp((prey.x||50) + dx*strength,5,95);
        prey.depth = clamp((prey.depth||0.5) + dd*strength,0,1);
      };

      switch(combo){
        case "cat-dog":{
          let dog = p1.species==="dog"?p1:p2;
          let cat = p1.species==="cat"?p1:p2;
          dog.happiness = clamp(dog.happiness + 4*hours);
          cat.happiness = clamp(cat.happiness - 7*hours);
          cat.energy = clamp(cat.energy - 5*hours);
          moveToward(dog,cat,0.35);
          moveAway(cat,dog,0.5);
          if(Math.random()<0.25){
            addLog(`${dog.name} chased ${cat.name}.`);
            showMood(dog.id,"💨");
            showMood(cat.id,"😱");
          }
          break;
        }
        case "cat-rabbit":{
          let cat2 = p1.species==="cat"?p1:p2;
          let rabbit = p1.species==="rabbit"?p1:p2;
          rabbit.happiness = clamp(rabbit.happiness - 6*hours);
          rabbit.energy = clamp(rabbit.energy - 5*hours);
          moveAway(rabbit,cat2,0.5);
          if(Math.random()<0.25){
            addLog(`${cat2.name} pounced near ${rabbit.name} and scared them.`);
            showMood(cat2.id,"😼");
            showMood(rabbit.id,"😨");
          }
          break;
        }
        case "dog-dog":{
          if(Math.random()<0.25){
            p1.happiness = clamp(p1.happiness + 6);
            p2.happiness = clamp(p2.happiness + 6);
            p1.energy = clamp(p1.energy - 4);
            p2.energy = clamp(p2.energy - 4);
            moveToward(p1,p2,0.2);
            moveToward(p2,p1,0.2);
            addLog(`${p1.name} and ${p2.name} play-fought.`);
            showMood(p1.id,"❤️");
            showMood(p2.id,"❤️");
          }
          break;
        }
        case "fox-rabbit":{
          let fox = p1.species==="fox"?p1:p2;
          let r2 = p1.species==="rabbit"?p1:p2;
          r2.happiness = clamp(r2.happiness - 8*hours);
          r2.energy = clamp(r2.energy - 6*hours);
          moveToward(fox,r2,0.3);
          moveAway(r2,fox,0.5);
          if(Math.random()<0.2){
            addLog(`${fox.name} stalked ${r2.name}.`);
            showMood(fox.id,"👀");
            showMood(r2.id,"💢");
          }
          break;
        }
        case "cat-fox":{
          if(Math.random()<0.18){
            p1.happiness = clamp(p1.happiness - 3);
            p2.happiness = clamp(p2.happiness - 3);
            moveAway(p1,p2,0.3);
            moveAway(p2,p1,0.3);
            addLog(`${p1.name} and ${p2.name} had a spat.`);
            showMood(p1.id,"💢");
            showMood(p2.id,"💢");
          }
          break;
        }
      }
    }
  }
}

// --------- world render ----------
const worldEl = document.getElementById("world");
const yardSize = document.getElementById("yardSize");
yardSize.addEventListener("input", ()=>{
  const scale = yardSize.value/100;
  worldEl.style.height = (260*scale)+"px";
});

function applyTimeOfDay(){
  const phase = getTimePhase();
  worldEl.classList.remove("world-day","world-night","world-dawn","world-dusk");
  worldEl.classList.add("world-"+phase);
}

function renderWeather(){
  worldEl.querySelectorAll(".cloud,.raindrop,.snowflake").forEach(el=>el.remove());
  const w = getCurrentWeather();
  worldEl.classList.remove("weather-clear","weather-cloudy","weather-rainy","weather-snowy");
  worldEl.classList.add("weather-"+w);

  if(w === "cloudy" || w === "rainy" || w === "snowy"){
    const cloudCount = 3;
    for(let i=0;i<cloudCount;i++){
      const c = document.createElement("div");
      c.className = "cloud";
      c.style.top = (10 + i*8) + "%";
      c.style.left = (i*30 - 20) + "%";
      worldEl.appendChild(c);
    }
  }
  if(w === "rainy"){
    const dropCount = 40;
    for(let i=0;i<dropCount;i++){
      const r = document.createElement("div");
      r.className = "raindrop";
      r.style.left = (5 + Math.random()*90) + "%";
      r.style.top = (20 + Math.random()*40) + "%";
      r.style.animationDelay = (Math.random()*1).toFixed(2)+"s";
      worldEl.appendChild(r);
    }
  }
  if(w === "snowy"){
    const flakeCount = 30;
    for(let i=0;i<flakeCount;i++){
      const s = document.createElement("div");
      s.className = "snowflake";
      s.textContent = "❄️";
      s.style.left = (5 + Math.random()*90) + "%";
      s.style.top = (10 + Math.random()*40) + "%";
      s.style.animationDelay = (Math.random()*4).toFixed(2)+"s";
      worldEl.appendChild(s);
    }
  }
}

function clearWorldSprites(){
  worldEl.querySelectorAll(".animal-sprite,.speech,.mood,.poo,.toy,.plant,.house").forEach(el=>el.remove());
  // NOTE: we do NOT remove Justin here so he can keep walking during re-renders
  worldEl.querySelectorAll(".cloud,.raindrop,.snowflake").forEach(el=>el.remove());
}

function showSpeech(id,text,ms=2000){
  const el = document.getElementById("speech-"+id);
  if(!el) return;
  el.textContent = text;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), ms);
}

function showMood(id,emoji,ms=1800){
  const el = document.getElementById("mood-"+id);
  if(!el) return;
  el.textContent = emoji;
  el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"), ms);
}

function depthToScreen(depth){
  const groundBottom = 88;
  const fenceLine = 57;
  const y = groundBottom - (groundBottom - fenceLine)*depth;
  const scale = 1 - 0.4*depth;
  return {y,scale};
}

let selectedId = null;

function renderWorld(){
  clearWorldSprites();
  applyTimeOfDay();
  renderWeather();

  // animals
  state.animals.forEach(a=>{
    const sprite = document.createElement("div");
    sprite.className = "animal-sprite";
    sprite.id = "sprite-"+a.id;
    sprite.dataset.id = a.id;
    const pos = depthToScreen(a.depth ?? 0.5);
    sprite.style.left = (a.x ?? 50)+"%";
    sprite.style.top = pos.y+"%";
    sprite.style.transform = `translate(-50%,-100%) scale(${pos.scale})`;
    if(!a.alive){sprite.classList.add("dead");}

    if(a.species==="dog"){
      const wrap = document.createElement("div");
      wrap.className = "dog-shape";
      const body = document.createElement("div"); body.className="dog-body"; wrap.appendChild(body);
      const head = document.createElement("div"); head.className="dog-head";
      const ear = document.createElement("div"); ear.className="dog-ear";
      const earSpot = document.createElement("div"); earSpot.className="dog-ear-spot"; ear.appendChild(earSpot);
      const eye = document.createElement("div"); eye.className="dog-eye";
      const nose = document.createElement("div"); nose.className="dog-nose";
      const mouth = document.createElement("div"); mouth.className="dog-mouth-line";
      head.appendChild(ear); head.appendChild(eye); head.appendChild(nose); head.appendChild(mouth);
      wrap.appendChild(head);
      ["front","front2","back","back2"].forEach(cls=>{
        const leg = document.createElement("div");
        leg.className = "dog-leg "+cls;
        wrap.appendChild(leg);
      });
      const tail = document.createElement("div"); tail.className="dog-tail"; wrap.appendChild(tail);

      if(!a.alive) wrap.classList.add("dog-ghost");
      else{
        if(a.weight >= 130) wrap.classList.add("dog-fat");
        else if(a.weight <= 35) wrap.classList.add("dog-skinny");
        if(a.happiness < 30 || a.health < 40 || a.hunger < 25) wrap.classList.add("dog-sad");
      }
      sprite.appendChild(wrap);
    }else{
      const span = document.createElement("div");
      span.className = "emoji-animal";
      span.textContent = SPECIES_CONFIG[a.species]?.emoji || "❓";
      sprite.appendChild(span);
    }

    const bubble = document.createElement("div");
    bubble.className = "speech";
    bubble.id = "speech-"+a.id;

    const mood = document.createElement("div");
    mood.className = "mood";
    mood.id = "mood-"+a.id;

    worldEl.appendChild(sprite);
    worldEl.appendChild(bubble);
    worldEl.appendChild(mood);

    sprite.addEventListener("click", ()=>{
      selectedId = a.id;
      render();
      showSpeech(a.id,"I’m "+a.name);
    });
  });

  // poo
  state.poops.forEach(p=>{
    const pos = depthToScreen(p.depth);
    const el = document.createElement("div");
    el.className = "poo";
    el.style.left = p.x+"%";
    el.style.top = pos.y+"%";
    el.style.transform = "translate(-50%,-100%) scale("+(pos.scale*0.9)+")";
    el.textContent = "💩";
    el.title = "Click Clean Yard to remove";
    el.dataset.id = p.id;
    worldEl.appendChild(el);
  });

  // toys (click to pick up)
  state.toys.forEach(t=>{
    const pos = depthToScreen(t.depth);
    const el = document.createElement("div");
    el.className = "toy";
    el.style.left = t.x+"%";
    el.style.top = pos.y+"%";
    el.style.transform = "translate(-50%,-100%) scale("+pos.scale+")";
    el.textContent = Math.random()<0.5?"🧸":"⚽";
    el.title = "Click to pick up toy";
    el.dataset.id = t.id;
    el.addEventListener("click",()=>{
      state.toys = state.toys.filter(x=>x.id!==t.id);
      addLog("You picked up a toy.");
      saveState();
      renderWorld();
    });
    worldEl.appendChild(el);
  });

  // plants (click to remove)
  state.plants.forEach(p=>{
    const pos = depthToScreen(p.depth);
    const el = document.createElement("div");
    el.className = "plant";
    el.style.left = p.x+"%";
    el.style.top = pos.y+"%";
    el.style.transform = "translate(-50%,-100%) scale("+pos.scale+")";
    el.textContent = p.variant==="tree"?"🌳":"🌻";
    el.title = "Click to remove plant";
    el.dataset.id = p.id;
    el.addEventListener("click",()=>{
      state.plants = state.plants.filter(x=>x.id!==p.id);
      addLog("You removed a plant.");
      saveState();
      renderWorld();
    });
    worldEl.appendChild(el);
  });

  // houses (click to remove)
  state.houses.forEach(h=>{
    const pos = depthToScreen(h.depth);
    const el = document.createElement("div");
    el.className = "house";
    el.style.left = h.x+"%";
    el.style.top = pos.y+"%";
    el.style.transform = "translate(-50%,-100%) scale("+pos.scale+")";
    let emoji = "🏠";
    if(h.variant==="hut") emoji = "🏡";
    if(h.variant==="tent") emoji = "⛺";
    if(h.variant==="doghouse") emoji = "🐕‍🦺";
    el.textContent = emoji;
    el.title = "Click to remove animal house";
    el.dataset.id = h.id;
    el.addEventListener("click",()=>{
      state.houses = state.houses.filter(x=>x.id!==h.id);
      addLog("You removed an animal house.");
      saveState();
      renderWorld();
    });
    worldEl.appendChild(el);
  });
}

// --------- pet list ----------
const petGrid = document.getElementById("petGrid");
const petCountEl = document.getElementById("petCount");
const petCountTopEl = document.getElementById("petCountTop");
const statusText = document.getElementById("statusText");

function getRelText(a, all){
  if(!a.alive) return "Dead. You can replace them with a new animal.";
  const neighbors = all.filter(x=>x.id!==a.id && x.alive);
  const dogs = neighbors.filter(x=>x.species==="dog");
  const cats = neighbors.filter(x=>x.species==="cat");
  const rabbits = neighbors.filter(x=>x.species==="rabbit");
  const foxes = neighbors.filter(x=>x.species==="fox");

  if(a.species==="cat"){
    if(dogs.length) return "Stressed by dogs chasing around.";
    if(foxes.length) return "Keeps an eye on fox trouble.";
  }
  if(a.species==="rabbit"){
    if(cats.length || foxes.length || dogs.length) return "Nervous around predators.";
  }
  if(a.species==="dog"){
    if(cats.length) return "Would love to chase cats.";
  }
  if(a.species==="fox"){
    if(rabbits.length) return "Very interested in rabbits…";
  }
  return SPECIES_CONFIG[a.species]?.baseRel || "";
}

const locationInput   = document.getElementById("locationInput");
const weatherSelect   = document.getElementById("weatherSelect");
const justinFreqSelect= document.getElementById("justinFreq");

function render(){
  const animals = state.animals;
  const aliveCount = animals.filter(a=>a.alive).length;
  petCountEl.textContent = aliveCount;
  petCountTopEl.textContent = animals.length;

  petGrid.innerHTML = "";
  animals.forEach(a=>{
    const card = document.createElement("div");
    card.className = "pet-card";
    card.dataset.id = a.id;
    if(a.id === selectedId) card.classList.add("selected");
    const cfg = SPECIES_CONFIG[a.species] || {emoji:"❓",label:"?"};

    const header = document.createElement("div");
    header.className = "pet-header";

    const main = document.createElement("div");
    main.className = "pet-main";
    main.innerHTML = `
      <div class="pet-avatar-small">${cfg.emoji}</div>
      <div>
        <div class="pet-name">${a.name}</div>
        <div class="pet-meta">${cfg.label.toUpperCase()}</div>
      </div>
    `;
    header.appendChild(main);

    const relText = getRelText(a, animals);
    const rel = document.createElement("div");
    rel.className = /stressed|nervous|predator|trouble|dead/i.test(relText) ? "pet-rel danger" : "pet-rel";
    rel.textContent = relText;
    header.appendChild(rel);
    card.appendChild(header);

    const statRow = document.createElement("div");
    statRow.className = "stat-row";
    statRow.appendChild(renderStat("Hunger", a.hunger));
    statRow.appendChild(renderStat("Happy", a.happiness));
    statRow.appendChild(renderStat("Energy", a.energy));
    statRow.appendChild(renderStat("Clean", a.cleanliness));
    statRow.appendChild(renderStat("Weight", a.weight, 20,200,true));
    statRow.appendChild(renderStat("Health", a.health));
    card.appendChild(statRow);

    if(!a.alive){
      const badge = document.createElement("div");
      badge.className = "pet-badge-dead";
      badge.textContent = "Dead";
      card.appendChild(badge);
    }

    card.addEventListener("click", ()=>{
      selectedId = a.id;
      render();
    });

    petGrid.appendChild(card);
  });

  renderWorld();
  updateStatus();

  locationInput.value = state.locationName || "";
  weatherSelect.value = state.weatherMode || "auto";
  justinFreqSelect.value = state.justinFrequency || "normal";
}

function renderStat(label,value,min=0,max=100,customRange=false){
  const wrap = document.createElement("div");
  wrap.className = "stat";
  const labelDiv = document.createElement("div");
  labelDiv.className = "stat-label";
  const v = customRange ? Math.round(value) : Math.round(value);
  labelDiv.innerHTML = `<span>${label}</span><span>${v}</span>`;
  const bar = document.createElement("div");
  bar.className = "stat-bar";
  const fill = document.createElement("div");
  fill.className = "stat-fill";
  const frac = clamp((value-min)/(max-min),0,1);
  fill.style.transform = `scaleX(${frac})`;
  if(frac<.3) fill.classList.add("low");
  else if(frac<.6) fill.classList.add("mid");
  bar.appendChild(fill);
  wrap.appendChild(labelDiv);
  wrap.appendChild(bar);
  return wrap;
}

function updateStatus(){
  const a = state.animals.find(x=>x.id===selectedId);
  if(!a){
    statusText.textContent = "Select an animal card to care for it.";
    document.getElementById("reviveBtn").disabled = true;
    setControlsDisabled(true);
    return;
  }
  setControlsDisabled(false);
  const reviveBtn = document.getElementById("reviveBtn");
  if(!a.alive){
    statusText.innerHTML = `<span class="error">${a.name} is dead. You can spawn a new ${a.species} using the button.</span>`;
    reviveBtn.disabled = false;
  }else{
    reviveBtn.disabled = true;
    if(a.weight >= 150){
      statusText.innerHTML = `<span class="error">${a.name} is extremely overweight. Walk more and feed less.</span>`;
    }else if(a.weight >= 130){
      statusText.textContent = `${a.name} is getting chubby. A bit more exercise would help.`;
    }else if(a.hunger < 25){
      statusText.innerHTML = `<span class="error">${a.name} is very hungry.</span>`;
    }else if(a.happiness < 30){
      statusText.textContent = `${a.name} feels lonely. Try playing with them.`;
    }else if(a.cleanliness < 30){
      statusText.textContent = `${a.name} is very dirty. Time for a wash.`;
    }else if(state.poops.length){
      statusText.textContent = `${a.name} doesn’t like the messy yard. Clean up the poo.`;
    }else{
      statusText.textContent = `${a.name} is doing okay. Check back once in a while so they stay alive.`;
    }
  }
}

function setControlsDisabled(disabled){
  ["feedBtn","playBtn","washBtn","walkBtn","releaseBtn","cleanYardBtn","dropToyBtn","addPlantBtn","addHouseBtn"].forEach(id=>{
    document.getElementById(id).disabled = disabled;
  });
}

function actionTick(){
  const now = Date.now();
  const fakeMs = 2*60*1000;
  state.lastUpdate = now - fakeMs;
  simulateFromLastUpdate();
}

// --------- controls ----------
const addPetBtn       = document.getElementById("addPetBtn");
const speciesSelect   = document.getElementById("speciesSelect");
const nameInput       = document.getElementById("nameInput");
const feedBtn         = document.getElementById("feedBtn");
const playBtn         = document.getElementById("playBtn");
const washBtn         = document.getElementById("washBtn");
const walkBtn         = document.getElementById("walkBtn");
const releaseBtn      = document.getElementById("releaseBtn");
const reviveBtn       = document.getElementById("reviveBtn");
const clearLogBtn     = document.getElementById("clearLogBtn");
const cleanYardBtn    = document.getElementById("cleanYardBtn");
const dropToyBtn      = document.getElementById("dropToyBtn");
const addPlantBtn     = document.getElementById("addPlantBtn");
const addHouseBtn     = document.getElementById("addHouseBtn");

addPetBtn.addEventListener("click",()=>{
  simulateFromLastUpdate();
  if(state.animals.length >= 8){
    statusText.innerHTML = `<span class="error">Backyard is full. Release someone before adding more.</span>`;
    return;
  }
  const species = speciesSelect.value;
  const cfg = SPECIES_CONFIG[species] || SPECIES_CONFIG.dog;
  let name = nameInput.value.trim();
  if(!name){
    const defaults = {dog:"Buddy",cat:"Luna",rabbit:"Clover",fox:"Rusty"};
    name = defaults[species] || "Buddy";
  }
  const a = {
    id: crypto.randomUUID(),
    name,
    species,
    createdAt: Date.now(),
    hunger:100,
    happiness:100,
    energy:100,
    cleanliness:100,
    weight:cfg.weightStart ?? 50,
    health:100,
    alive:true,
    overweightMinutes:0,
    x: randRange(10,90),
    depth: randRange(0,1)
  };
  state.animals.push(a);
  selectedId = a.id;
  addLog(`You added ${name} the ${species} to the backyard.`);
  showMood(a.id,"❤️");
  nameInput.value = "";
  saveState();
  render();
});

function getSelected(){
  return state.animals.find(a=>a.id===selectedId);
}

feedBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a || !a.alive) return;
  actionTick();
  a.hunger = clamp(a.hunger + 35);
  a.happiness = clamp(a.happiness + 4);
  a.cleanliness = clamp(a.cleanliness - 3);
  a.weight = clamp(a.weight + 6,20,200);
  addLog(`You fed ${a.name}.`);
  showMood(a.id,"😋");
  saveState();
  render();
});

playBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a || !a.alive) return;
  actionTick();
  a.happiness = clamp(a.happiness + 25);
  a.energy = clamp(a.energy - 10);
  a.hunger = clamp(a.hunger - 5);
  a.weight = clamp(a.weight - 2,20,200);
  addLog(`You played with ${a.name}.`);
  showMood(a.id,"❤️");
  saveState();
  render();
});

washBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a || !a.alive) return;
  actionTick();
  a.cleanliness = clamp(a.cleanliness + 35);
  a.happiness = clamp(a.happiness - 2);
  addLog(`You washed ${a.name}.`);
  showMood(a.id,"🫧");
  saveState();
  render();
});

walkBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a || !a.alive) return;
  actionTick();
  a.energy = clamp(a.energy - 9);
  a.happiness = clamp(a.happiness + 15);
  a.hunger = clamp(a.hunger - 7);
  a.weight = clamp(a.weight - 3,20,200);
  addLog(`You took ${a.name} for a walk.`);
  showMood(a.id,"🚶‍♂️");
  a.depth = clamp(a.depth + randRange(-0.2,0.2),0,1);
  a.x = clamp((a.x ?? 50) + randRange(-10,10),5,95);
  saveState();
  render();
});

releaseBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a) return;
  if(!confirm(`Release ${a.name} from the backyard?`)) return;
  state.animals = state.animals.filter(x=>x.id!==a.id);
  addLog(`You released ${a.name}.`);
  selectedId = null;
  saveState();
  render();
});

reviveBtn.addEventListener("click",()=>{
  const a = getSelected(); if(!a || a.alive) return;
  const oldSpecies = a.species;
  const cfg = SPECIES_CONFIG[oldSpecies] || SPECIES_CONFIG.dog;
  const newAnimal = {
    id: crypto.randomUUID(),
    name: a.name,
    species: oldSpecies,
    createdAt: Date.now(),
    hunger:100,
    happiness:100,
    energy:100,
    cleanliness:100,
    weight:cfg.weightStart ?? 50,
    health:100,
    alive:true,
    overweightMinutes:0,
    x: randRange(10,90),
    depth: randRange(0,1)
  };
  const idx = state.animals.findIndex(x=>x.id===a.id);
  if(idx !== -1) state.animals.splice(idx,1,newAnimal);
  selectedId = newAnimal.id;
  addLog(`A new ${oldSpecies} named ${newAnimal.name} has joined the backyard.`);
  showMood(newAnimal.id,"💗");
  saveState();
  render();
});

cleanYardBtn.addEventListener("click",()=>{
  if(!state.poops.length){
    addLog("The yard is already clean.");
    return;
  }
  const count = state.poops.length;
  state.poops = [];
  state.animals.forEach(a=>{
    if(a.alive){
      a.cleanliness = clamp(a.cleanliness + 8);
      a.happiness = clamp(a.happiness + 4);
    }
  });
  addLog(`You cleaned ${count} poo piles from the yard. ✨`);
  saveState();
  render();
});

dropToyBtn.addEventListener("click",()=>{
  simulateFromLastUpdate();
  if(state.toys.length >= 5){
    addLog("There are already plenty of toys in the yard.");
    return;
  }
  const toy = {
    id: crypto.randomUUID(),
    x: randRange(10,90),
    depth: randRange(0.1,0.9),
    createdAt: Date.now()
  };
  state.toys.push(toy);
  addLog("You dropped a toy in the yard.");
  saveState();
  renderWorld();
});

addPlantBtn.addEventListener("click",()=>{
  simulateFromLastUpdate();
  if(state.plants.length >= 8){
    addLog("The yard is full of plants for now.");
    return;
  }
  const plant = {
    id: crypto.randomUUID(),
    x: randRange(5,95),
    depth: randRange(0.1,0.9),
    createdAt: Date.now(),
    variant: Math.random()<0.6 ? "tree" : "flower"
  };
  state.plants.push(plant);
  addLog("You added a plant to the yard.");
  saveState();
  renderWorld();
});

addHouseBtn.addEventListener("click",()=>{
  simulateFromLastUpdate();
  if(state.houses.length >= 6){
    addLog("There are enough animal houses in the yard.");
    return;
  }
  const variants = ["doghouse","hut","tent","hut","doghouse"];
  const house = {
    id: crypto.randomUUID(),
    x: randRange(8,92),
    depth: randRange(0.15,0.75),
    createdAt: Date.now(),
    variant: variants[Math.floor(Math.random()*variants.length)]
  };
  state.houses.push(house);
  addLog("You added an animal house to the yard.");
  saveState();
  renderWorld();
});

clearLogBtn.addEventListener("click",()=>{logEl.innerHTML="";});

locationInput.addEventListener("change",()=>{
  state.locationName = locationInput.value.trim();
  saveState();
  if(state.locationName){
    addLog(`Location set to "${state.locationName}". (Weather is still simulated in-browser)`);
  }else{
    addLog("Location cleared.");
  }
});

weatherSelect.addEventListener("change",()=>{
  state.weatherMode = weatherSelect.value;
  saveState();
  addLog(`Weather mode set to "${state.weatherMode}".`);
  renderWorld();
});

justinFreqSelect.addEventListener("change",()=>{
  state.justinFrequency = justinFreqSelect.value;
  saveState();
  addLog(`Justin walk frequency set to "${state.justinFrequency}".`);
  scheduleJustin();
});

// movement loop – gentle wandering
function tickMovement(){
  state.animals.forEach(a=>{
    if(!a.alive) return;
    const stepX = randRange(-3,3);
    const stepD = randRange(-0.05,0.05);
    a.x = clamp((a.x ?? 50) + stepX,5,95);
    a.depth = clamp((a.depth ?? 0.5) + stepD,0,1);
  });
  saveState();
  renderWorld();
}

setInterval(()=>{simulateFromLastUpdate();},15000);
setInterval(()=>{tickMovement();},3500);
setInterval(()=>{applyTimeOfDay();renderWeather();},60000);

// --------- Justin engine (uses pickCharacterLine from habitat-characters.js) ---------
let justinTimer = null;

function scheduleJustin(){
  if(justinTimer) clearTimeout(justinTimer);
  const freq = state.justinFrequency || "normal";
  let baseMs;
  switch(freq){
    case "rare":   baseMs = 120000; break; // ~2 min
    case "often":  baseMs = 45000;  break; // ~45s
    case "chaos":  baseMs = 20000;  break; // ~20s
    default:       baseMs = 70000;  break; // ~70s
  }
  const jitter = baseMs*0.3;
  const delay = baseMs + (Math.random()*2*jitter - jitter);
  justinTimer = setTimeout(spawnJustin, Math.max(8000,delay));
}

function spawnJustin(){
  const existing = document.getElementById("justin");
  if(existing) existing.remove();

  const el = document.createElement("div");
  el.id = "justin";
  el.className = "justin";
  el.style.left = "-15%";

  const stick = document.createElement("div");
  stick.className = "justin-stick";
  stick.innerHTML = `
    <div class="j-head"></div>
    <div class="j-body"></div>
    <div class="j-arm j-arm-left"></div>
    <div class="j-arm j-arm-right"></div>
    <div class="j-leg j-leg-left"></div>
    <div class="j-leg j-leg-right"></div>
  `;
  el.appendChild(stick);

  const bubble = document.createElement("div");
  bubble.className = "justin-bubble";
  // 🔥 this pulls from habitat-characters.js (common + legendary)
  bubble.textContent = (window.pickCharacterLine
    ? window.pickCharacterLine("justin")
    : "I’m supposed to say something profound here.");
  el.appendChild(bubble);

  worldEl.appendChild(el);

  requestAnimationFrame(()=>{
    el.style.left = "115%";
  });

  const duration = 18000;
  setTimeout(()=>{
    el.remove();
  }, duration + 800);

  scheduleJustin();
}

// --------- boot ---------
simulateFromLastUpdate();
render();
addLog("HabitatGotchi loaded. Time, day/night, weather, houses, and Justin have been applied.");
scheduleJustin();
