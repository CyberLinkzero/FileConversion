from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn, os, json, re, time, secrets, hmac, hashlib

APP_TITLE = "CyberChat Server (Patch3)"
HTTPS_PORT = int(os.environ.get("CYBERCHAT_PORT", "8443"))
HTTP_PORT  = int(os.environ.get("CYBERCHAT_HTTP_PORT", "8000"))
CERT_FILE = os.environ.get("CYBERCHAT_CERT", "cert.pem")
KEY_FILE  = os.environ.get("CYBERCHAT_KEY",  "key.pem")
ALLOW_INSECURE = os.environ.get("CYBERCHAT_ALLOW_INSECURE","0") == "1"

# Disable HF by default (only on-demand install)
ENABLE_HF = os.environ.get("CYBERCHAT_ENABLE_HF","0") == "1"
HF_MODEL = os.environ.get("CYBERCHAT_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")

app = FastAPI(title=APP_TITLE)

origins_env = os.environ.get("CYBERCHAT_ORIGINS", "*")
ALLOWED_ORIGINS = ["*"] if origins_env == "*" else [o.strip() for o in origins_env.split(",") if o.strip()]

app.add_middleware(CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PnaHeader(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        resp: Response = await call_next(request)
        resp.headers["Access-Control-Allow-Private-Network"] = "true"
        return resp
app.add_middleware(PnaHeader)

# ===== Pairing (code -> token) =====
PAIR_LEN = 6
PAIR_TTL = 10 * 60
SECRET_FILE = "pair_secret.key"
_current_code: Optional[str] = None
_code_expire: float = 0.0

def get_or_make_secret()->bytes:
    if os.path.exists(SECRET_FILE):
        return open(SECRET_FILE, "rb").read()
    s = secrets.token_bytes(32)
    open(SECRET_FILE, "wb").write(s)
    return s

SECRET = get_or_make_secret()

def new_code()->str:
    global _current_code, _code_expire
    _current_code = ''.join(secrets.choice("ABCDEFGHJKMNPQRSTUVWXYZ23456789") for _ in range(PAIR_LEN))
    _code_expire = time.time() + PAIR_TTL
    return _current_code

def code_valid(code:str)->bool:
    return _current_code and (time.time() < _code_expire) and hmac.compare_digest(_current_code, code)

def sign_token(sub:str)->str:
    ts = str(int(time.time()))
    body = f"{sub}|{ts}".encode()
    import hashlib, hmac
    sig = hmac.new(SECRET, body, hashlib.sha256).hexdigest()
    return f"{sub}.{ts}.{sig}"

def verify_token(tok:str)->bool:
    try:
        sub, ts, sig = tok.split(".", 2)
        body = f"{sub}|{ts}".encode()
        import hashlib, hmac
        expected = hmac.new(SECRET, body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig): return False
        if time.time() - int(ts) > 30*24*3600: return False
        return True
    except Exception:
        return False

@app.get("/pair/code")
def pair_code():
    remaining = int(max(0, _code_expire - time.time())) if _current_code else 0
    return {"code": _current_code or new_code(), "expires_in": remaining}

class PairVerify(BaseModel):
    code: str

@app.post("/pair/verify")
def pair_verify(p: PairVerify):
    if not code_valid(p.code.strip().upper()):
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    token = sign_token("web")
    new_code()
    return {"token": token, "token_type": "Bearer", "expires_in_days": 30}

def require_auth(request: Request):
    if ALLOW_INSECURE: return
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer ") and verify_token(auth[7:].strip()):
        return
    raise HTTPException(status_code=401, detail="Unauthorized: pair first via /pair/code -> /pair/verify")

# ===== TLS bootstrap (JSON post) =====
@app.get("/pair", response_class=HTMLResponse)
def pair_page():
    code = _current_code or new_code()
    html = """
<!doctype html><meta charset='utf-8'>
<title>Pair CyberChat</title>
<style>
body{{background:#0f1117;color:#e5e7eb;font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0}}
.card{{width:min(560px,92vw);border:1px solid #212734;border-radius:14px;background:#0b1220;padding:20px;box-shadow:0 10px 28px rgba(0,0,0,.45)}}
h1{{margin:0}}.muted{{color:#9aa4b2}}.row{{display:flex;gap:10px;margin:14px 0}}input,button{{padding:10px 12px;border-radius:10px;border:1px solid #263044;background:#121826;color:#cbd5e1;flex:1}}
.small{{font-size:.9rem;color:#9aa4b2}}
</style>
<div class='card'>
  <h1>Pair CyberChat</h1>
  <p class='muted'>Enter this 6‑digit code in your website widget:</p>
  <p style='font-size:2rem;letter-spacing:.2rem;font-weight:700">{code}</p>
  <hr style='border-color:#212734'>
  <p class='muted'>Then generate a local TLS cert so HTTPS pages can connect:</p>
  <div class="row">
    <input id="c" placeholder="Re‑enter code to confirm">
    <button id="g">Generate TLS</button>
  </div>
  <p class='small'>Prefer trusted certs? Install <code>mkcert</code>, click again.</p>
  <pre id="out" style="white-space:pre-wrap"></pre>
</div>
<script>
  const out = document.getElementById('out');
  document.getElementById('g').onclick = async () => {{
    const code = document.getElementById('c').value.trim().toUpperCase();
    out.textContent = 'Working...';
    try {{
      const r = await fetch('/gen-cert', {{method:'POST', headers:{{'Content-Type':'application/json'}}, body: JSON.stringify({{code}})}});
      const j = await r.json();
      if(!r.ok) throw new Error((j && j.detail) || r.statusText);
      out.textContent = 'TLS ready. Open https://127.0.0.1:{https_port}/healthz once, then Reconnect in the widget.';
    }} catch(e) {{ out.textContent = 'Failed: ' + e.message; }}
  }};
</script>
""".format(code=code, https_port=HTTPS_PORT)
    return HTMLResponse(html)

class GenCertBody(BaseModel):
    code: str

@app.post("/gen-cert")
def gen_cert(body: GenCertBody):
    code = (body.code or "").strip().upper()
    if not code_valid(code):
        raise HTTPException(status_code=401, detail="Invalid/expired code—reload /pair for a fresh one.")
    created = False
    if not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
        try:
            import subprocess
            subprocess.check_call(["mkcert", "127.0.0.1"])
            if os.path.exists("127.0.0.1.pem") and os.path.exists("127.0.0.1-key.pem"):
                os.replace("127.0.0.1.pem", CERT_FILE)
                os.replace("127.0.0.1-key.pem", KEY_FILE)
                created = True
        except Exception:
            pass
    if not created and not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
        try:
            import subprocess
            subprocess.check_call(["openssl","req","-x509","-nodes","-newkey","rsa:2048",
                                   "-keyout",KEY_FILE,"-out",CERT_FILE,"-days","365",
                                   "-subj","/CN=127.0.0.1"])
            created = True
        except Exception:
            pass
    if not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
        raise HTTPException(status_code=500, detail="Could not create cert. Install mkcert or openssl and retry.")
    return {"ok": True, "https":"https://127.0.0.1:%d/healthz" % HTTPS_PORT}

# ===== FAQ + (optional) HF model =====
FAQ_PATH = os.path.join(os.path.dirname(__file__), "faq.json")
DEFAULT_FAQ: Dict[str,str] = {
    "hello": "Hey! I’m EvolveBot. Ask me about FileConverter.run or Knack.bz.",
    "pricing": "Free for now; more features may be added later.",
    "fileconverter.run": "Privacy‑first, client‑side conversions—no uploads."
}
def load_faq()->Dict[str,str]:
    try:
        if os.path.exists(FAQ_PATH):
            data = json.load(open(FAQ_PATH,"r",encoding="utf-8"))
            if isinstance(data, dict): return {k.lower():v for k,v in data.items()}
    except Exception as e:
        print(f"[faq] {e}")
    return {k.lower():v for k,v in DEFAULT_FAQ.items()}
FAQ = load_faq()

def match_faq(q:str)->Optional[str]:
    ql = re.sub(r"[^a-z0-9 ]+"," ",q.lower())
    for k,v in FAQ.items():
        if k in ql: return v
    return None

_pipe = None

def ensure_pipe():
    global _pipe
    if _pipe is not None: return _pipe
    if not ENABLE_HF:
        _pipe = False
        return _pipe
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
        print(f"[hf] loading {HF_MODEL} ...")
        tok = AutoTokenizer.from_pretrained(HF_MODEL)
        mdl = AutoModelForCausalLM.from_pretrained(HF_MODEL, device_map="auto", torch_dtype="auto")
        _pipe = pipeline("text-generation", model=mdl, tokenizer=tok)
    except Exception as e:
        print(f"[hf] failed to load model: {e}")
        _pipe = False
    return _pipe

def hf_reply(prompt: str, max_new_tokens: int = 128) -> str:
    p = ensure_pipe()
    if not p:
        return "[AI offline] " + prompt
    out = p(prompt, max_new_tokens=max_new_tokens, do_sample=True, temperature=0.7)
    if isinstance(out, list) and out:
        text = out[0].get("generated_text","")
        if text.startswith(prompt): return (text[len(prompt):] or text).strip()
        return text.strip()
    return "[no output]"

# ===== API =====
@app.get("/")
def root():
    return {"ok": True, "server": APP_TITLE, "try": ["/pair", "/healthz", "/api/models", "/api/chat", "/api/install_model", "/docs"]}

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/api/models", dependencies=[Depends(require_auth)])
def models():
    return [
        {"id":"TinyLlama/TinyLlama-1.1B-Chat-v1.0"},
        {"id":"microsoft/Phi-3-mini-4k-instruct"},
        {"id":"mistralai/Mistral-7B-Instruct-v0.2"},
        {"id":"google/gemma-2-2b-it"},
        {"id":"Qwen/Qwen2.5-3B-Instruct"}
    ]

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: Optional[str] = "auto"
    max_new_tokens: Optional[int] = 128

@app.post("/api/chat", dependencies=[Depends(require_auth)])
def chat(body: ChatRequest, request: Request):
    text = ""
    for m in body.messages or []:
        if m.role == "user": text = m.content
    if not text: return {"reply":"Say something and I’ll help.","mode":"faq"}

    if body.mode in ("auto","faq"):
        ans = match_faq(text)
        if ans: return {"reply": ans, "mode": "faq"}
        if body.mode == "faq": return {"reply": "No matching FAQ. Try AI mode.", "mode":"faq"}

    if body.mode in ("auto","hf"):
        return {"reply": hf_reply(text, body.max_new_tokens or 128), "mode": "hf"}

    return {"reply": f"[echo] {text}", "mode":"echo"}

# Prefetch an HF model (no chat auth required; this is a local action)
class InstallModelBody(BaseModel):
    model_id: str = HF_MODEL

@app.post("/api/install_model")
def install_model(body: InstallModelBody):
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        AutoTokenizer.from_pretrained(body.model_id)
        AutoModelForCausalLM.from_pretrained(body.model_id)
        return {"ok": True, "model": body.model_id, "note": "Downloaded to local HF cache."}
    except Exception as e:
        return {"ok": False, "model": body.model_id, "error": str(e), "hint": "Ensure internet access. On Windows, enable Developer Mode or run as Admin to allow symlinks (optional)."}

def has_certs()->bool:
    return os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)

if __name__ == "__main__":
    tls = has_certs()
    if tls:
        print(f"✅ CyberChat HTTPS → https://127.0.0.1:{HTTPS_PORT}")
        uvicorn.run(app, host="127.0.0.1", port=HTTPS_PORT,
                    ssl_keyfile=KEY_FILE, ssl_certfile=CERT_FILE,
                    log_config=None, log_level="info", access_log=True)
    else:
        print(f"⚠️  No certs found → HTTP fallback http://127.0.0.1:{HTTP_PORT}  (use /pair to generate TLS)")
        uvicorn.run(app, host="127.0.0.1", port=HTTP_PORT,
                    log_config=None, log_level="info", access_log=True)
