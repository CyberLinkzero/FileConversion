from typing import List, Dict, Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch, os, importlib.util, glob, json

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

MODEL_CATALOG = [
  {"id":"TinyLlama/TinyLlama-1.1B-Chat-v1.0","title":"TinyLlama 1.1B Chat (fast, light)"},
  {"id":"Qwen/Qwen2.5-3B-Instruct","title":"Qwen2.5 3B Instruct (balanced)"},
  {"id":"google/gemma-2-2b-it","title":"Gemma 2 2B IT (light, quality)"},
  {"id":"microsoft/Phi-3-mini-4k-instruct","title":"Phi-3 Mini Instruct (4k)"},
  {"id":"mistralai/Mistral-7B-Instruct-v0.3","title":"Mistral 7B Instruct (stronger, heavier)"},
]

current = {"model_id": None, "pipe": None}

class Msg(BaseModel):
    role: str
    content: str
class ChatBody(BaseModel):
    messages: List[Msg]
    tts: Optional[bool] = False
class ToolDef(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any] = {}
class ToolCall(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}

PLUGINS: Dict[str, Any] = {}
TOOLS: List[ToolDef] = []

plugins_dir = os.path.join(os.path.dirname(__file__), 'plugins')
os.makedirs(plugins_dir, exist_ok=True)

def load_plugins():
    global PLUGINS, TOOLS
    PLUGINS = {}; TOOLS = []
    for path in glob.glob(os.path.join(plugins_dir, '*.py')):
        spec = importlib.util.spec_from_file_location("plugin_"+os.path.basename(path).replace('.py',''), path)
        mod = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(mod)  # type: ignore
            tool = getattr(mod, 'TOOL', None)
            runfn = getattr(mod, 'run', None)
            if tool and runfn and callable(runfn):
                PLUGINS[tool['name']] = runfn
                TOOLS.append(ToolDef(**tool))
        except Exception as e:
            print("Failed to load plugin", path, e)

load_plugins()

# Seed example plugin if none exists
if not TOOLS:
    with open(os.path.join(plugins_dir, 'calc.py'), 'w', encoding='utf-8') as f:
        f.write('TOOL = {"name":"calc","description":"Evaluate a Python-style arithmetic expression.","parameters":{"expr":{"type":"string"}}}\n'
                'def run(expr:"str"="0"):\n'
                '    try:\n'
                '        return str(eval(expr, {"__builtins__":{}}, {}))\n'
                '    except Exception as e:\n'
                '        return f"calc error: {e}"\n')
    load_plugins()

def load_model(model_id: str):
    print("Loading model:", model_id)
    tok = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None,
    )
    gen = pipeline("text-generation", model=model, tokenizer=tok, device=0 if torch.cuda.is_available() else -1)
    current["model_id"] = model_id
    current["pipe"] = gen

@app.get('/api/models')
async def models():
    return MODEL_CATALOG

class SelectBody(BaseModel):
    model: str

@app.post('/api/select_model')
async def select_model(body: SelectBody):
    load_model(body.model)
    return {"ok": True, "model": body.model}

@app.get('/api/tools')
async def tools():
    return [t.dict() for t in TOOLS]

class RunToolBody(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}

@app.post('/api/run_tool')
async def run_tool(body: RunToolBody):
    fn = PLUGINS.get(body.name)
    if not fn:
        return {"output": f"tool {body.name} not found"}
    try:
        out = fn(**body.arguments)
    except TypeError:
        out = fn(body.arguments)
    return {"output": str(out)}

@app.post('/api/chat')
async def chat(body: ChatBody):
    if not current["pipe"]:
        return {"reply":"No model selected yet. Please choose a model.", "tool_call": None}

    def render(messages: List[Msg]):
        sys = "You are a helpful assistant. If a plugin is better suited, propose a tool_call JSON on a separate line like: TOOL:{\"name\":\"calc\",\"arguments\":{...}}"
        convo = [f"<system>{sys}</system>"]
        for m in messages:
            if m.role=='user':
                convo.append(f"<user>{m.content}</user>")
            else:
                convo.append(f"<assistant>{m.content}</assistant>")
        convo.append("<assistant>")
        return "\n".join(convo)

    prompt = render(body.messages)
    out = current["pipe"](prompt, max_new_tokens=512, do_sample=True, temperature=0.7)
    text = out[0]['generated_text']
    reply = text.split("<assistant>")[-1].strip()

    tool_call = None
    for line in reply.splitlines():
        if line.strip().startsWith('TOOL:') if hasattr(line.strip(),'startsWith') else line.strip().startswith('TOOL:'):
            try:
                tool_call = json.loads(line.strip()[5:])
            except Exception:
                pass
    return {"reply": reply, "tool_call": tool_call}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=8000)
