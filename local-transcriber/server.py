# server.py — tiny local lyrics transcriber service
# Runs on http://127.0.0.1:8765
import os, sys, tempfile
from flask import Flask, request, jsonify
app = Flask(__name__)

# Lazy import to keep startup fast
whisper_model = None
def load_model():
    global whisper_model
    if whisper_model is None:
        import whisper
        # small is a good balance; change to "base" for smaller or "medium"/"large" for better
        whisper_model = whisper.load_model("small")
    return whisper_model

@app.get("/health")
def health():
    return jsonify(ok=True)

@app.post("/transcribe")
def transcribe():
    if 'file' not in request.files:
        return jsonify(error="no file"), 400
    f = request.files['file']
    if not f.filename:
        return jsonify(error="empty filename"), 400
    with tempfile.NamedTemporaryFile(suffix=os.path.splitext(f.filename)[-1] or ".wav", delete=False) as tmp:
        f.save(tmp.name)
        tmp_path = tmp.name
    try:
        model = load_model()
        res = model.transcribe(tmp_path)
        # words may not always be present; make a rough list if needed
        words = res.get("segments") or []
        out_words = []
        for seg in words:
            # approximate split by spaces for a word-level list
            start = seg.get("start", 0.0)
            text = (seg.get("text") or "").strip()
            if not text:
                continue
            parts = text.split()
            # assign progressive times across the segment duration
            dur = max(seg.get("end", start) - start, 0.001)
            step = dur / max(1, len(parts))
            for i, w in enumerate(parts):
                out_words.append({"start": start + i*step, "end": start + (i+1)*step, "text": w})
        return jsonify(words=out_words, language=res.get("language","en"), duration=res.get("duration"))
    finally:
        try: os.remove(tmp_path)
        except: pass

if __name__ == "__main__":
    # Allow port override via env if you want
    port = int(os.environ.get("PORT", "8765"))
    app.run(host="127.0.0.1", port=port)
