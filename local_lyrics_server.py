from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import tempfile, os, subprocess, sys

USE_DEMUCS = False
MODEL_NAME = "small"  # base/small/medium/large-v2 (small is a good default)

app = Flask(__name__)
model = WhisperModel(MODEL_NAME, device="auto", compute_type="int8_float16")

def isolate_vocals(in_path):
    if not USE_DEMUCS:
        return in_path
    outdir = tempfile.mkdtemp()
    subprocess.run([sys.executable, "-m", "demucs", "-n", "htdemucs", "-o", outdir, in_path], check=True)
    for root, _, files in os.walk(outdir):
        for f in files:
            if "vocals" in f.lower() and f.lower().endswith((".wav",".mp3",".flac",".ogg",".m4a")):
                return os.path.join(root, f)
    return in_path

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "POST,GET,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp

@app.get("/health")
def health():
    return jsonify({"ok": True, "model": MODEL_NAME})

@app.post("/transcribe")
def transcribe():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "no file"}), 400
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(f.filename)[1] or ".wav") as tmp:
        f.save(tmp.name)
        src = isolate_vocals(tmp.name)
        segments, info = model.transcribe(src, vad_filter=True, word_timestamps=True, language=None)
        words = []
        for seg in segments:
            if seg.words:
                for w in seg.words:
                    words.append({"start": float(w.start or seg.start),
                                  "end":   float(w.end or seg.end),
                                  "text":  (w.word or "").strip()})
            else:
                if seg.text.strip():
                    words.append({"start": float(seg.start), "end": float(seg.end), "text": seg.text.strip()})
        try:
            os.unlink(tmp.name)
        except Exception:
            pass
        return jsonify({"duration": info.duration, "language": info.language, "words": words})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8765)
