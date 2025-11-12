from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import uvicorn, os, json, re

APP_TITLE = "CyberChat HTTPS Server"
HTTPS_PORT = int(os.environ.get("CYBERCHAT_PORT", "8443"))
CERT_FILE = os.environ.get("CYBERCHAT_CERT", "cert.pem")
KEY_FILE  = os.environ.get("CYBERCHAT_KEY",  "key.pem")

# ---------- App & Middleware ----------
app = FastAPI(title=APP_TITLE)

# CORS: loosen for dev; restrict to your domains for prod
ALLOWED_ORIGINS = os.environ.get("CYBERCHAT_ORIGINS", "*")
if ALLOWED_ORIGINS == "*":
    origins = ["*"]
else:
    origins = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Private Network Access header for Chrome
class PnaHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        resp = await call_next(request)
        resp.headers["Access-Control-Allow-Private-Network"] = "true"
        return resp

app.add_middleware(PnaHeaderMiddleware)

# ---------- FAQ (preprogrammed answers) ----------
FAQ_PATH = os.environ.get("CYBERCHAT_FAQ", os.path.join(os.path.dirname(__file__), "faq.json"))
DEFAULT_FAQ: Dict[str, str] = {
    "hello": "Hey! I’m EvolveBot. Ask me anything about FileConverter.run or Knack.bz.",
    "what is fileconverter.run": "FileConverter.run is a privacy‑first, in‑browser file converter. No uploads—everything runs locally in your browser.",
    "pricing": "It’s free to use. Advanced features may be added later.",
    "help": "Try: drag & drop a file, choose the target format, click Convert."
}

def load_faq() -> Dict[str, str]:
    try:
        if os.path.exists(FAQ_PATH):
            with open(FAQ_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    return {k.lower(): v for k, v in data.items()}
    except Exception as e:
        print(f"[faq] failed loading {FAQ_PATH}: {e}")
    return {k.lower(): v for k, v in DEFAULT_FAQ.items()}

FAQ = load_faq()

def match_faq(q: str) -> Optional[str]:
    ql = q.lower().strip()
    # exact
    if ql in FAQ:
        return FAQ[ql]
    # simple fuzzy: strip punctuation and try contains
    qn = re.sub(r"[^a-z0-9 ]+", " ", ql)
    for k,v in FAQ.items():
        kn = re.sub(r"[^a-z0-9 ]+", " ", k)
        if kn in qn or qn in kn:
            return v
    return None

# ---------- Optional: Hugging Face model (lazy) ----------
HF_MODEL = os.environ.get("CYBERCHAT_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
_pipe = None

def ensure_pipe():
    global _pipe
    if _pipe is not None:
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
    if p in (None, False):
        return "[AI offline] " + prompt
    out = p(prompt, max_new_tokens=max_new_tokens, do_sample=True, temperature=0.7)
    if isinstance(out, list) and out:
        text = out[0].get("generated_text", "")
        # Return only the added part after the prompt if possible
        if text.startswith(prompt):
            return text[len(prompt):].strip() or text.strip()
        return text.strip()
    return "[no output]"

# ---------- Schemas ----------
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    mode: Optional[str] = "auto"   # "auto" | "faq" | "hf"
    max_new_tokens: Optional[int] = 128

# ---------- Routes ----------
@app.get("/")
def root():
    return {
        "ok": True,
        "server": APP_TITLE,
        "try": ["/healthz", "/api/models", "/docs", "/api/chat"]
    }

@app.get("/healthz")
def healthz():
    return {"status": "ok"}

@app.get("/api/models")
def models():
    # Suggested options; actual download happens on first HF call
    return [
        {"id":"TinyLlama/TinyLlama-1.1B-Chat-v1.0"},
        {"id":"microsoft/Phi-3-mini-4k-instruct"},
        {"id":"mistralai/Mistral-7B-Instruct-v0.2"},
        {"id":"google/gemma-2-2b-it"},
        {"id":"Qwen/Qwen2.5-3B-Instruct"}
    ]

@app.post("/api/chat")
def chat(body: ChatRequest):
    user_text = ""
    for m in body.messages or []:
        if m.role == "user":
            user_text = m.content
    if not user_text:
        return {"reply": "Say something and I’ll help."}

    # 1) FAQ first (unless forced to HF)
    if body.mode in ("auto", "faq"):
        ans = match_faq(user_text)
        if ans:
            return {"reply": ans, "mode": "faq"}
        if body.mode == "faq":
            return {"reply": "No matching FAQ. Try 'Upgrade to AI' for free-form answers.", "mode": "faq"}

    # 2) HF fallback (if installed)
    if body.mode in ("auto", "hf"):
        reply = hf_reply(user_text, max_new_tokens=body.max_new_tokens or 128)
        return {"reply": reply, "mode": "hf"}

    # 3) Fallback echo
    return {"reply": f"[echo] {user_text}", "mode": "echo"}

# ---------- Entrypoint (HTTPS) ----------
if __name__ == "__main__":
    print("✅ CyberChat HTTPS server")
    print(f"   HTTPS: https://127.0.0.1:{HTTPS_PORT}")
    print("   Health: /healthz | Docs: /docs")
    # disable default log_config to avoid TTY crash in frozen builds
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=HTTPS_PORT,
        ssl_keyfile=KEY_FILE,
        ssl_certfile=CERT_FILE,
        log_config=None,
        log_level="info",
        access_log=True,
    )
