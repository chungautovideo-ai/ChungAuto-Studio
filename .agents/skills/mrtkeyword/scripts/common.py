"""Shared paths and helpers for the mrtkeyword scripts.

Skill layout: mrtkeyword/scripts (this folder) and mrtkeyword/tools (Python venv + models, made by
CAI-DAT.bat). Run every script with that venv: mrtkeyword/tools/.venv/Scripts/python.exe <script> ...
"""
import json
import os
import subprocess
import sys

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1]
TOOLS = Path(os.environ.get("KFX_TOOLS", SKILL / "tools"))  # made by CAI-DAT.bat: .venv + models
MODELS = TOOLS / "models"
DEEP_FILTER = TOOLS / "bin" / "deep-filter.exe"  # optional noise removal (apply_cuts --denoise)

os.environ.setdefault("HF_HOME", str(MODELS / "hf"))
os.environ.setdefault("U2NET_HOME", str(MODELS / "u2net"))
os.environ.setdefault("TORCH_HOME", str(MODELS / "torch"))

OUT_W, OUT_H, OUT_FPS = 1080, 1920, 30


def has_cuda():
    """NVIDIA GPU usable by torch? Everything also runs on the CPU, only slower."""
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def add_cuda_dll_dirs():
    """ctranslate2/onnxruntime on Windows need the pip-installed NVIDIA DLLs on the search path."""
    if os.name != "nt":
        return
    site = Path(sys.prefix) / "Lib" / "site-packages"
    for sub in ("nvidia", "torch"):
        root = site / sub
        if not root.exists():
            continue
        for d in list(root.glob("*/bin")) + [root / "lib"]:
            if d.is_dir():
                os.add_dll_directory(str(d))
                os.environ["PATH"] = str(d) + os.pathsep + os.environ["PATH"]


def run(cmd, **kw):
    print("$", " ".join(str(c) for c in cmd), file=sys.stderr)
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


def ffprobe_json(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)],
        check=True, capture_output=True, text=True, encoding="utf-8",
    ).stdout
    return json.loads(out)


def duration(path):
    return float(ffprobe_json(path)["format"]["duration"])


def extract_wav(src, dst, sr=16000, mono=True):
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ar", str(sr)]
    if mono:
        cmd += ["-ac", "1"]
    run(cmd + [dst])
    return dst


def load_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def save_json(obj, p):
    Path(p).parent.mkdir(parents=True, exist_ok=True)
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")
    return p
