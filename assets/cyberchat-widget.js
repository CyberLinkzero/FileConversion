(function(){
  const currentScript = document.currentScript;
  const CFG = {
    baseURL: (currentScript?.dataset.endpoint || "").replace(/\/$/, ""),
    title: currentScript?.dataset.title || "CyberChat",
    greeting: currentScript?.dataset.greeting || "Hi! I'm here to help.",
    primary: currentScript?.dataset.primary || "#7dd3fc",
    accent: currentScript?.dataset.accent || "#a78bfa",
    position: (currentScript?.dataset.position || "right").toLowerCase(),
    voice: currentScript?.dataset.voice || "auto",
  };

  const host = document.createElement("div");
  host.id = "cyberchat-host";
  host.style.position = "fixed";
  host.style.zIndex = "2147483000";
  host.style.bottom = "20px";
  host.style[CFG.position === "left" ? "left" : "right"] = "20px";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({mode:"open"});

  const style = document.createElement("style");
  style.textContent = `
    .btn{cursor:pointer;user-select:none}
    .bubble{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(100% 100% at 50% 0%, ${CFG.primary} 0%, ${CFG.accent} 100%);box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15)}
    .bubble:hover{transform:translateY(-1px);transition:.15s ease}
    .panel{position:fixed;bottom:96px;${CFG.position}:20px;width:min(420px,calc(100vw - 32px));max-height:min(78vh,720px);display:none;opacity:0;transform:translateY(8px);transition:.2s ease}
    .panel.open{display:block;opacity:1;transform:translateY(0)}
    .card{background:#0f1117;color:#e5e7eb;border:1px solid #212734;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
    .header{display:flex;gap:10px;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(125,211,252,.08) 0%,rgba(167,139,250,.06) 100%);border-bottom:1px solid #212734;cursor:move}
    .title{font-weight:700;letter-spacing:.3px}
    .select,.smallbtn{border:1px solid #263044;background:#121826;color:#cbd5e1;border-radius:10px;padding:6px 8px;font-size:.85rem}
    .smallbtn{display:grid;place-items:center}
    .body{display:grid;grid-template-rows:auto 1fr auto;height:min(78vh,720px)}
    .topbar{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #212734}
    .avatar{width:58px;height:58px}
    .greeting{font-size:.95rem;color:#b7c0cc}
    .time{font-size:.7rem;opacity:.6}
    .messages{overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
    .msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.4;border:1px solid #1f2632;white-space:pre-wrap}
    .ai{background:#111827;color:#e5e7eb}
    .user{margin-left:auto;background:#0b1220;color:#dbeafe;border-color:#203049}
    .composer{display:flex;gap:8px;padding:10px;border-top:1px solid #212734;background:#0b0f16}
    .in{flex:1;border:1px solid #263044;background:#0f1726;color:#e5e7eb;padding:10px 12px;border-radius:12px;outline:none}
    .in:focus{border-color:${CFG.primary}77}
    .send{padding:10px 14px;border-radius:12px;background:${CFG.primary};color:#001018;font-weight:700;border:1px solid #6bbfe4}
    .send:disabled{opacity:.6;filter:grayscale(1);cursor:not-allowed}
    .tool{width:40px;height:40px;border-radius:12px;border:1px solid #263044;background:#121826;display:grid;place-items:center}
    .pill{padding:4px 8px;border-radius:999px;border:1px solid #263044;background:#111827;font-size:.75rem;color:#a3b1c6}
  `;
  shadow.appendChild(style);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <button class="bubble btn" aria-label="Open ${CFG.title}">${faceSVG()}</button>
    <div class="panel" role="dialog" aria-modal="false" aria-label="${CFG.title}">
      <div class="card body">
        <div class="header" id="cc-drag">
          <div class="title">${CFG.title}</div>
          <span class="pill" id="cc-status">Offline</span>
          <div style="flex:1"></div>
          <select class="select" id="cc-model"></select>
          <button class="smallbtn" id="cc-refresh" title="Refresh models">⟳</button>
          <button class="smallbtn" id="cc-plugins" title="Plugins">⚙︎</button>
          <button class="smallbtn" id="cc-min" title="Minimize">▾</button>
        </div>
        <div class="topbar">
          <div class="avatar">${faceSVG(true)}</div>
          <div>
            <div class="greeting">${CFG.greeting}</div>
            <div class="time" id="cc-topline">Pick a model to start</div>
          </div>
        </div>
        <div class="messages" id="cc-messages" aria-live="polite"></div>
        <div class="composer">
          <button class="tool" id="cc-mic" title="Talk">🎙</button>
          <input class="in" id="cc-input" placeholder="Type a message…" autocomplete="off" />
          <button class="tool" id="cc-tts" title="Read responses">🔈</button>
          <button class="send" id="cc-send">Send</button>
        </div>
      </div>
    </div>
  `;
  shadow.appendChild(wrapper);

  const state = { open:false, speaking:false, listening:false, history: loadHistory(), ttsEnabled:true, model:null, tools:[], connected:false };
  const el = {
    bubble: shadow.querySelector(".bubble"), panel: shadow.querySelector(".panel"),
    messages: shadow.getElementById("cc-messages"), input: shadow.getElementById("cc-input"),
    send: shadow.getElementById("cc-send"), mic: shadow.getElementById("cc-mic"), tts: shadow.getElementById("cc-tts"),
    status: shadow.getElementById("cc-status"), drag: shadow.getElementById("cc-drag"), min: shadow.getElementById("cc-min"),
    model: shadow.getElementById("cc-model"), refresh: shadow.getElementById("cc-refresh"), plugins: shadow.getElementById("cc-plugins"),
    topline: shadow.getElementById("cc-topline")
  };

  renderHistory(); addMsg("assistant", CFG.greeting);
  el.bubble.addEventListener("click", togglePanel);
  el.min.addEventListener("click", togglePanel);
  document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && state.open) togglePanel(); });
  el.send.addEventListener("click", onSend);
  el.input.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); onSend(); }});
  el.tts.addEventListener("click", ()=>{ state.ttsEnabled=!state.ttsEnabled; el.tts.style.opacity= state.ttsEnabled?"1":".5"; });
  enableDrag(el.drag, el.panel);
  el.refresh.addEventListener("click", refreshModels);
  el.model.addEventListener("change", async ()=>{
    const pick = el.model.value; if(!pick) return;
    await fetchJSON(CFG.baseURL+"/api/select_model", {method:"POST", body:{model:pick}});
    state.model = pick; el.topline.textContent = "Model: "+pick; touchOnline(true); refreshTools();
  });
  el.plugins.addEventListener("click", showPlugins);

  // STT
  let recognition=null; if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR(); recognition.continuous=false; recognition.interimResults=false; recognition.lang=document.documentElement.lang || "en-US";
    recognition.onstart=()=>{ state.listening=true; el.mic.style.opacity=".6"; el.status.textContent="Listening…"; };
    recognition.onend=()=>{ state.listening=false; el.mic.style.opacity="1"; el.status.textContent= state.connected?"Online":"Offline"; };
    recognition.onresult=(ev)=>{ const text = ev.results[0][0].transcript; el.input.value=text; onSend(); };
    el.mic.addEventListener("click", ()=>{ state.listening? recognition.stop(): recognition.start(); });
  } else { el.mic.disabled = true; el.mic.title = "Voice input not supported in this browser"; }

  setTimeout(()=>{ refreshModels(); refreshTools(); }, 50);

  async function refreshModels(){
    try{
      const list = await fetchJSON(CFG.baseURL+"/api/models");
      el.model.innerHTML = `<option value="">Select model…</option>` + list.map(m=>`<option value="${escapeAttr(m.id)}">${escapeHTML(m.title||m.id)}</option>`).join("");
      touchOnline(true);
    }catch(e){ touchOnline(false); }
  }
  async function refreshTools(){ try{ state.tools = await fetchJSON(CFG.baseURL+"/api/tools"); } catch(e){ state.tools=[]; } }
  function showPlugins(){
    const names = state.tools.map(t=>`• ${t.name} — ${t.description}`).join("\n") || "No plugins available.";
    addMsg("assistant", `Available plugins on this PC:\n${names}`);
  }
  function touchOnline(ok){ state.connected=ok; el.status.textContent = ok? "Online":"Offline"; el.status.style.color = ok? "#7de4ad":"#f59f9f"; }

  async function onSend(){
    const text = el.input.value.trim(); if(!text) return; addMsg("user", text); el.input.value=""; el.send.disabled=true; el.topline.textContent="Thinking…";
    try{
      const out = await fetchJSON(CFG.baseURL+"/api/chat", {method:"POST", body:{messages: compactHistory(state.history), tts:false}});
      if(out.tool_call){ addMsg("assistant", `🔧 Using plugin: ${out.tool_call.name}`);
        const toolRes = await fetchJSON(CFG.baseURL+"/api/run_tool", {method:"POST", body: out.tool_call});
        addMsg("assistant", toolRes.output || "[No output]"); }
      if(out.reply){ addMsg("assistant", out.reply); if(state.ttsEnabled) speak(out.reply); }
      touchOnline(true);
    }catch(e){ console.error(e); addMsg("assistant", "Sorry, I could not reach the local AI server."); touchOnline(false); }
    finally{ el.send.disabled=false; el.topline.textContent = state.connected? "Ready" : "Start local server to go Online"; }
  }

  function addMsg(role, content){
    const item = document.createElement("div"); item.className = `msg ${role==="assistant"?"ai":"user"}`; item.textContent = content; el.messages.appendChild(item);
    el.messages.scrollTop = el.messages.scrollHeight; state.history.push({role, content, t:Date.now()}); saveHistory(); animateMouth(role==="assistant");
  }
  function renderHistory(){ if(!state.history.length) return; for(const m of state.history){ addMsg(m.role, m.content); } }
  function saveHistory(){ try{ localStorage.setItem("cyberchat_history", JSON.stringify(state.history.slice(-50))); }catch(_){ } }
  function loadHistory(){ try{ return JSON.parse(localStorage.getItem("cyberchat_history")||"[]"); }catch(_){ return []; } }
  function compactHistory(h){ return h.map(({role, content})=>({role, content})); }

  function enableDrag(handle, panel){ let sx=0, sy=0, px=0, py=0, dragging=false;
    handle.addEventListener("pointerdown", (e)=>{ dragging=true; sx=e.clientX; sy=e.clientY; const r=panel.getBoundingClientRect(); px=r.left; py=r.top; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener("pointermove", (e)=>{ if(!dragging) return; const nx=px+(e.clientX-sx), ny=py+(e.clientY-sy); panel.style.left = nx+"px"; panel.style.right="auto"; panel.style.top=ny+"px"; panel.style.bottom="auto"; });
    const stop=()=> dragging=false; handle.addEventListener("pointerup", stop); handle.addEventListener("pointercancel", stop);
  }

  function speak(text){ if(!("speechSynthesis" in window)) return; const u = new SpeechSynthesisUtterance(text);
    if(CFG.voice && CFG.voice!=="auto"){ const pick=speechSynthesis.getVoices().find(v=> v.name.toLowerCase().includes(CFG.voice.toLowerCase())); if(pick) u.voice=pick; }
    u.rate=1.02; u.pitch=1.0; u.volume=1.0; u.onstart=()=>animateMouth(true); u.onend=()=>animateMouth(false); speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  function animateMouth(talking){ const mouth=shadow.querySelectorAll("#cc-mouth"); mouth.forEach(m=>{ m.setAttribute("d", talking? "M 18 28 Q 24 33 30 28" : "M 18 28 Q 24 29 30 28"); }); }
  function escapeHTML(s){ return String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
  function escapeAttr(s){ return String(s).replace(/"/g,"&quot;"); }
  function faceSVG(full){ const torso = full? `<rect x="6" y="38" rx="10" ry="10" width="48" height="22" fill="#0b1220" stroke="#1b2333"/>` : "";
    return `<svg width="${full?58:40}" height="${full?58:40}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><radialGradient id="g1" cx="50%" cy="0%" r="100%"><stop offset="0%" stop-color="${CFG.primary}"/><stop offset="100%" stop-color="${CFG.accent}"/></radialGradient></defs>
      <circle cx="30" cy="26" r="16" fill="#0b1220" stroke="url(#g1)" stroke-width="2" />
      <circle cx="24" cy="24" r="2.5" fill="#cbeafe"/>
      <circle cx="36" cy="24" r="2.5" fill="#cbeafe"/>
      <path id="cc-mouth" d="M 18 28 Q 24 29 30 28" stroke="#cbeafe" fill="none" stroke-width="2" stroke-linecap="round"/>
      ${torso}
    </svg>`;
  }

  async function fetchJSON(url, opts={}){
    const body = opts.body? JSON.stringify(opts.body): undefined;
    const r = await fetch(url, {method: opts.method||"GET", headers: {"Content-Type":"application/json"}, body});
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.json();
  }
})();
