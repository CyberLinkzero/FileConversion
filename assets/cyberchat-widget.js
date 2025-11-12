(function(){
  const sc = document.currentScript;
  const cfg = {
    baseURL: (sc?.dataset.endpoint || "https://127.0.0.1:8443").replace(/\/$/,""),
    title: sc?.dataset.title || "EvolveBot",
    downloadUrl: sc?.dataset.downloadUrl || "",
    autoload: (sc?.dataset.autoload || "true").toLowerCase() === "true"
  };

  const host = document.createElement("div");
  host.style.position="fixed"; host.style.zIndex=2147483647; host.style.bottom="20px"; host.style.right="20px";
  document.documentElement.appendChild(host);
  const root = host.attachShadow({mode:"open"});
  const css = document.createElement("style");
  css.textContent = `
    .bubble{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#111827;color:#7dd3fc;border:1px solid #263044;cursor:pointer}
    .panel{position:fixed;bottom:94px;right:20px;width:min(440px,calc(100vw - 32px));display:none}
    .open{display:block}
    .card{background:#0f1117;color:#e5e7eb;border:1px solid #212734;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.4)}
    .head{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #212734}
    .title{font-weight:700}
    .pill{margin-left:8px;padding:2px 8px;border-radius:999px;border:1px solid #263044;background:#111827;font-size:.75rem;color:#a3b1c6}
    .row{display:flex;gap:8px;padding:10px;border-bottom:1px solid #212734}
    .in{flex:1;border:1px solid #263044;background:#0f1726;color:#e5e7eb;padding:10px 12px;border-radius:10px}
    .btn{padding:10px 12px;border-radius:10px;border:1px solid #263044;background:#121826;color:#cbd5e1;cursor:pointer}
    .btn.link{color:#7dd3fc;border-color:#2a3b55}
    .msgs{padding:10px;max-height:56vh;overflow:auto}
    .msg{padding:10px 12px;border:1px solid #1f2632;border-radius:10px;margin:6px 0;white-space:pre-wrap}
    .user{background:#0b1220;margin-left:auto}
    .hint{padding:10px;font-size:.85rem;color:#9aa4b2}
  `;
  root.appendChild(css);

  const html = document.createElement("div");
  html.innerHTML = `
    <button class="bubble" aria-label="Open ${cfg.title}">💬</button>
    <div class="panel"><div class="card">
      <div class="head">
        <div class="title">${cfg.title}</div>
        <span id="st" class="pill">Offline</span>
        <div style="flex:1"></div>
        <button id="min" class="btn">▾</button>
      </div>
      <div class="row">
        <input id="pair" class="in" placeholder="Enter 6‑digit pairing code">
        <button id="bind" class="btn">Pair</button>
      </div>
      <div class="row" id="cta">
        <a id="dl" class="btn link" target="_blank" rel="noopener">⬇ Get App</a>
        <button id="tls" class="btn">TLS Guide</button>
        <button id="mdl" class="btn">Install AI</button>
      </div>
      <div class="hint">1) Click <b>Get App</b> to download the EXE. 2) Run the app → open <code>/pair</code> → paste code here → <b>Pair</b>. 3) Use <b>Install AI</b> to pre‑download a model if desired.</div>
      <div class="msgs" id="msgs" aria-live="polite"></div>
      <div class="row">
        <input id="in" class="in" placeholder="Type a message…">
        <button id="send" class="btn">Send</button>
      </div>
    </div></div>
  `;
  root.appendChild(html);

  const el = {
    bubble: root.querySelector(".bubble"),
    panel: root.querySelector(".panel"),
    st: root.getElementById("st"),
    pair: root.getElementById("pair"),
    bind: root.getElementById("bind"),
    msgs: root.getElementById("msgs"),
    input: root.getElementById("in"),
    send: root.getElementById("send"),
    min: root.getElementById("min"),
    dl: root.getElementById("dl"),
    tls: root.getElementById("tls"),
    mdl: root.getElementById("mdl"),
    cta: root.getElementById("cta"),
  };

  if (cfg.downloadUrl) { el.dl.href = cfg.downloadUrl; } else { el.dl.style.display = "none"; }

  let open=false, token=(localStorage.getItem("cyberchat_token")||"");
  function setOnline(ok){ el.st.textContent = ok?"Online":"Offline"; el.st.style.color = ok?"#7de4ad":"#f59f9f"; }
  function add(role, text){ const d = document.createElement("div"); d.className="msg"+(role==="user"?" user":""); d.textContent=text; el.msgs.appendChild(d); el.msgs.scrollTop=el.msgs.scrollHeight; }

  async function api(path, opts={}){
    const ctl = new AbortController(); const t = setTimeout(()=>ctl.abort(), 6000);
    const headers = Object.assign({"Content-Type":"application/json"}, (token?{"Authorization":"Bearer "+token}:{}) );
    try{
      const r = await fetch(cfg.baseURL+path, Object.assign({signal:ctl.signal, headers}, opts));
      clearTimeout(t);
      if (r.status === 401) { setOnline(false); return {unauth:true}; }
      if (!r.ok) throw new Error("HTTP "+r.status);
      setOnline(true);
      return await r.json();
    }catch(e){ setOnline(false); return {error:String(e)}; }
  }

  async function pair(){
    const code = (el.pair.value||"").trim().toUpperCase();
    if (!code) return add("ai","Enter your 6‑digit code from the app (visit /pair).");
    const res = await api("/pair/verify", {method:"POST", body:JSON.stringify({code})});
    if (res && res.token){
      token = res.token; localStorage.setItem("cyberchat_token", token);
      add("ai","✅ Paired. You can chat now.");
    } else if (res && res.unauth) { add("ai","Pairing failed: unauthorized. Generate a fresh code and try again."); }
    else { add("ai","Pairing failed. Check code and expiry."); }
  }

  async function send(){
    const v = el.input.value.trim(); if (!v) return;
    add("user", v); el.input.value="";
    const res = await api("/api/chat", {method:"POST", body:JSON.stringify({messages:[{role:"user",content:v}]})});
    if (res && res.reply){ add("ai", res.reply); }
    else if (res && res.unauth){ add("ai","🔒 Not paired. Enter the code from the app."); }
    else { add("ai","Could not reach server."); }
  }

  async function tlsGuide(){
    add("ai","TLS setup:\n1) Run app → http://127.0.0.1:8000/pair\n2) Click Generate TLS\n3) Visit https://127.0.0.1:8443/healthz once\n4) This widget should use the HTTPS endpoint.");
  }

  async function installModel(){
    add("ai","Installing model… (the app will download to its HF cache).");
    const res = await api("/api/install_model", {method:"POST", body: JSON.stringify({model_id: ""})});
    if (res && res.ok){ add("ai","✅ Model downloaded: "+res.model+"  (Set env CYBERCHAT_ENABLE_HF=1 to enable HF mode)."); }
    else { add("ai","❌ Model install failed: "+(res && res.error ? res.error : "unknown error")+"\nHint: run app as Admin or enable Developer Mode on Windows for symlinks (optional)."); }
  }

  el.bubble.onclick = ()=>{ open=!open; el.panel.classList.toggle("open", open); };
  el.min.onclick = ()=>{ open=false; el.panel.classList.remove("open"); };
  el.bind.onclick = pair;
  el.send.onclick = send;
  el.tls.onclick = tlsGuide;
  el.mdl.onclick = installModel;
  el.input.addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); send(); }});

  if (cfg.autoload) { (async()=>{ const r = await api("/healthz"); if (r && !r.error) setOnline(true); })(); }
})();
