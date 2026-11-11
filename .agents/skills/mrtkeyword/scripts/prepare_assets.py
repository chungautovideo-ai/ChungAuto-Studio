"""Set up <project>/remotion for a mrtkeyword video: template, clips, audio, thumbs, face boxes, mattes, music.

usage: prepare_assets.py <project dir> [--music <file>]
expects what prep_input.py made: <project>/clips/NN.mp4 (1080x1920 speaker segments; none for a voice-only
input) and <project>/work/asm/master.wav; optional <project>/img/ (pictures for photo-snap "img") is copied
to public/img; reads <project>/work/plan.json to know which segments need the speaker cut out.
Safe to re-run: existing mattes / node_modules are kept.
"""
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
SKILL = HERE.parent
PY = sys.executable  # the package venv python this script was started with
REG = json.loads((SKILL / "keywords.json").read_text(encoding="utf-8"))


def run(cmd, **kw):
    print("$", " ".join(str(c) for c in cmd))
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def dur(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True)
    return float(out.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--music")
    a = ap.parse_args()
    prj = Path(a.project).resolve()
    rem = prj / "remotion"
    pub = rem / "public"
    # 1. template + node_modules (installed once in the template by CAI-DAT.bat, copied from there)
    shutil.copytree(SKILL / "template", rem, dirs_exist_ok=True, ignore=shutil.ignore_patterns("node_modules"))
    for d in ("clips", "thumbs"):
        (pub / d).mkdir(parents=True, exist_ok=True)
    if not (rem / "node_modules").exists():
        if (SKILL / "template/node_modules").exists():
            shutil.copytree(SKILL / "template/node_modules", rem / "node_modules")
        else:
            subprocess.run("npm install --no-audit --no-fund", cwd=rem, shell=True, check=True)
    # 2. clips, audio, thumbs, pictures
    clips = sorted((prj / "clips").glob("*.mp4"))
    for c in clips:
        shutil.copy2(c, pub / "clips" / c.name)
        run(["ffmpeg", "-v", "error", "-y", "-ss", "1", "-i", c, "-frames:v", "1", "-vf", "scale=540:-1", pub / "thumbs" / f"{c.stem}.jpg"])
    shutil.copy2(prj / "work/asm/master.wav", pub / "master.wav")
    if (prj / "img").is_dir():
        shutil.copytree(prj / "img", pub / "img", dirs_exist_ok=True)
    # 3. face boxes (stickers and effects avoid the face)
    if clips:
        run([PY, HERE / "face_boxes.py", pub / "clips", "--out", rem / "src/faces.json"])
    # 4. mattes for the speaker segments whose keyword needs the speaker cut out
    plan = json.loads((prj / "work/plan.json").read_text(encoding="utf-8"))
    for f in plan["fx"]:
        meta = REG.get(f["fx"], {})
        if meta.get("status") == "merged":
            meta = REG.get(meta["alias_of"], {})
        if meta.get("needs_matte") or (f.get("params") or {}).get("img"):
            src, out = pub / "clips" / f"{f['seg']}.mp4", pub / f"matte_{f['seg']}.webm"
            if src.exists() and not out.exists():  # voice segments have no clip -> no matte
                run([PY, HERE / "matte.py", src, "--start", "0", "--end", f"{dur(src):.3f}", "--out", out])
    # 5. cover face + music
    cv = plan.get("cover") or {}
    if cv.get("clip") and (pub / "clips" / f"{cv['clip']}.mp4").exists():
        run(["ffmpeg", "-v", "error", "-y", "-ss", str(cv.get("at", 2.0)), "-i", pub / "clips" / f"{cv['clip']}.mp4", "-frames:v", "1", "-q:v", "2", pub / "thumb_face.jpg"])
    music = a.music or plan.get("music")
    if music:
        run([PY, HERE / "duck_bgm.py", music, pub / "master.wav", pub / "bgm.wav"])
    print("ready:", rem)


if __name__ == "__main__":
    main()
