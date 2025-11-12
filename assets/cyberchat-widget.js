(function(){
  const sc = document.currentScript;
  const cfg = {
    baseURL: (sc?.dataset.endpoint || "").replace(/\/$/,""),
    title: sc?.dataset.title || "CyberChat",
    position: (sc?.dataset.position || "right").toLowerCase(),
    greeting: sc?.dataset.greeting || "Hey! Need a hand?",
    primary: sc?.dataset.primary || "#7dd3fc",
    accent: sc?.dataset.accent || "#a78bfa",
    autoload: (sc?.dataset.autoload || "false").toLowerCase() === "true"
  };

  const host = document.createElement("div");
  host.id = "cyberchat-safe-host";
  host.style.position = "fixed";
  host.style.zIndex = 2147483000;
  host.style.bottom = "20px";
  host.style[cfg.position==="left"?"left":"right"] = "20px";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({mode:"open"});

  const css = document.createElement("style");
  css.textContent = `
    .bubble{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(100% 100% at 50% 0%, ${cfg.primary} 0%, ${cfg.accent} 100%);box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.15);cursor:pointer}
    .panel{position:fixed;bottom:96px;${cfg.position}:20px;width:min(420px,calc(100vw - 32px));max-height:min(78vh,720px);display:none;opacity:0;transform:translateY(8px);transition:.2s ease}
    .open{display:block;opacity:1;transform:translateY(0)}
    .card{background:#0f1117;color:#e5e7eb;border:1px solid #212734;border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.45);overflow:hidden}
    .head{display:flex;gap:8px;align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(125,211,252,.08) 0%,rgba(167,139,250,.06) 100%);border-bottom:1px solid #212734}
    .title{font-weight:700}
    .pill{margin-left:8px;padding:2px 8px;border-radius:999px;border:1px solid #263044;background:#111827;font-size:.75rem;color:#a3b1c6}
    .body{display:grid;grid-template-rows:auto 1fr auto;height:min(78vh,720px)}
    .top{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #212734}
    .avatar{width:58px;height:58px}
    .messages{overflow:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
    .msg{max-width:85%;padding:10px 12px;border-radius:14px;line-height:1.4;border:1px solid #1f2632;white-space:pre-wrap}
    .ai{background:#111827}
    .user{margin-left:auto;background:#0b1220;color:#dbeafe;border-color:#203049}
    .compose{display:flex;gap:8px;padding:10px;border-top:1px solid #212734;background:#0b0f16}
    .in{flex:1;border:1px solid #263044;background:#0f1726;color:#e5e7eb;padding:10px 12px;border-radius:12px;outline:none}
    .send{padding:10px 14px;border-radius:12px;background:${cfg.primary};color:#001018;font-weight:700;border:1px solid #6bbfe4}
    .mini{border:1px solid #263044;background:#121826;color:#cbd5e1;border-radius:10px;padding:6px 8px;font-size:.85rem;cursor:pointer}
    .warn{color:#fbbf24}
    .err{color:#f87171}
  `;
  root.appendChild(css);

  const html = document.createElement("div");
  html.innerHTML = `
    <button class="bubble" aria-label="Open ${cfg.title}">💬</button>
    <div class="panel"><div class="card body">
      <div class="head">
        <div class="title">${cfg.title}</div>
        <span id="cc-safe-status" class="pill">Offline</span>
        <div style="flex:1"></div>
        <button id="cc-safe-retry" class="mini">Reconnect</button>
        <button id="cc-safe-min" class="mini">▾</button>
      </div>
      <div class="top">
        <div class="avatar">🫧</div>
        <div>
          <div>${cfg.greeting}</div>
          <div id="cc-safe-top" style="opacity:.7;font-size:.85rem">Click Reconnect to check your local server.</div>
        </div>
      </div>
      <div id="cc-safe-msgs" class="messages" aria-live="polite"></div>
      <div class="compose">
        <input id="cc-safe-in" class="in" placeholder="Type a message…" />
        <button id="cc-safe-send" class="send">Send</button>
      </div>
    </div></div>
  `;
  root.appendChild(html);

  const el = {
    bubble: root.querySelector(".bubble"),
    panel: root.querySelector(".panel"),
    status: root.getElementById("cc-safe-status"),
    top: root.getElementById("cc-safe-top"),
    msgs: root.getElementById("cc-safe-msgs"),
    input: root.getElementById("cc-safe-in"),
    send: root.getElementById("cc-safe-send"),
    retry: root.getElementById("cc-safe-retry"),
    min: root.getElementById("cc-safe-min")
  };

  let open = false; let connected = false;
  const add = (role, text)=>{
    const d = document.createElement("div");
    d.className = "msg " + (role==="user"?"user":"ai");
    d.textContent = text;
    el.msgs.appendChild(d); el.msgs.scrollTop = el.msgs.scrollHeight;
  };

  function setStatus(ok){
    connected = !!ok;
    el.status.textContent = ok ? "Online" : "Offline";
    el.status.style.color = ok ? "#7de4ad" : "#f59f9f";
  }

  async function pingOnce(){
    const url = (cfg.baseURL||"").replace(/\/$/,"") + "/healthz";
    if (!url) { setStatus(false); add("ai","Set data-endpoint, e.g. http://127.0.0.1:8000"); return false; }
    if (location.protocol === "https:" && url.startsWith("http://")) {
      setStatus(false);
      add("ai","⚠️ Page is HTTPS but local server is HTTP. Use HTTPS server or test over http://localhost.");
      return false;
    }
    try{
      const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 900);
      const r = await fetch(url, {signal: ctl.signal}); clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      await r.json(); setStatus(true); el.top.textContent = "Connected. Ask away."; return true;
    }catch(e){ setStatus(false); el.top.textContent = "Not connected. Click Reconnect after starting the server."; return false; }
  }

  async function chatOnce(text){
    const url = (cfg.baseURL||"").replace(/\/$/,"") + "/api/chat";
    try{
      const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 5000);
      const r = await fetch(url, {method:"POST", headers:{"Content-Type":"application/json"}, signal:ctl.signal, body: JSON.stringify({messages:[{role:"user",content:text}]})});
      clearTimeout(t);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json(); add("ai", j.reply || "[no reply]");
    }catch(e){ add("ai", "Could not reach local AI. Is it running?"); setStatus(false); }
  }

  el.bubble.addEventListener("click", ()=>{ open = !open; el.panel.classList.toggle("open", open); });
  el.min.addEventListener("click", ()=>{ open = false; el.panel.classList.remove("open"); });
  el.retry.addEventListener("click", pingOnce);
  el.send.addEventListener("click", ()=>{ const v = el.input.value.trim(); if(!v) return; add("user", v); el.input.value=""; chatOnce(v); });
  el.input.addEventListener("keydown", (e)=>{ if(e.key==="Enter"){ e.preventDefault(); el.send.click(); }});

  if (cfg.autoload) setTimeout(pingOnce, 0);
})();
