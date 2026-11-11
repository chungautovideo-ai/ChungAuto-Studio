"""Turn chosen SFX moments into a frame-accurate, level-matched schedule for Main.tsx, and check density.
Rules: references/sfx-rules.md.

usage: sfx_plan.py <events.json> --voice <master.wav> --words <words.json> --sfx-dir <remotion/public/sfx>
                   --out <remotion/src/sfx.json> [--fps 30] [--map kind=file,...]
events.json: [{"t": 7.02, "kind": "pop", "why": "pill 'kịch bản' hiện"}, ...]   t = frame the visual event happens
kinds: hook, whoosh, pop, ding, click, impact, error, correct, page
out: [{"f": "pop", "t": 7.033, "v": 0.31, "kind": "pop", "why": "..."}]   (f = file name without .wav, v = linear volume)
exit 0 = no ⚠, 1 = warnings to fix (or explain in the report)
"""
import argparse
import json
import math
import re
import subprocess
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8")

# when the sound starts relative to the visual event (s): whooshes lead into the cut, impacts land with the spring
OFFSET = {"whoosh": -0.08, "impact": 0.12, "hook": 0.0}
# sound peak relative to the voice peak (dB): quieter for frequent small sounds, louder for hits
REL_DB = {"pop": -16, "ding": -16, "click": -14, "page": -14, "error": -14, "correct": -15, "whoosh": -15, "impact": -12, "hook": -12}
DEFAULT_FILE = {"hook": "ding", "whoosh": "whoosh", "pop": "pop", "ding": "ding", "click": "click", "impact": "boom",
                "error": "boom", "correct": "ding", "page": "tick"}
MAX_IN_3S, MAX_PER_SEC = 2, 0.7


def peak_db(path):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
    return float(re.findall(r"max_volume:\s*(-?[\d.]+) dB", err)[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("events")
    ap.add_argument("--voice", required=True)
    ap.add_argument("--words", required=True)
    ap.add_argument("--sfx-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--map", default="", help="override kind=file, e.g. impact=boom2,hook=bell")
    a = ap.parse_args()
    events = json.loads(Path(a.events).read_text(encoding="utf-8"))
    words = json.loads(Path(a.words).read_text(encoding="utf-8"))
    files = dict(DEFAULT_FILE, **dict(kv.split("=") for kv in a.map.split(",") if kv))
    voice_pk = peak_db(a.voice)
    sfx_pk = {}
    warns, out = [], []

    for e in sorted(events, key=lambda x: x["t"]):
        kind = e["kind"]
        f = files.get(kind, kind)
        wav = Path(a.sfx_dir) / f"{f}.wav"
        if not wav.exists():
            warns.append(f"{e['t']:.2f}s thiếu file âm thanh {wav.name} cho loại '{kind}'")
            continue
        t = e["t"] + OFFSET.get(kind, 0.0)
        # a heavy hit must not land inside a spoken keyword: move it to the end of that word
        if kind == "impact":
            for w in words:
                if w["s"] + 0.03 < t < w["e"] - 0.03 and len(re.sub(r"\W", "", w["w"])) >= 3:
                    warns.append(f"{t:.2f}s tiếng nặng rơi giữa từ '{w['w']}' → dời tới {w['e']:.2f}s")
                    t = w["e"]
                    break
        t = math.ceil(max(0.0, t) * a.fps) / a.fps  # round UP to a frame: sound never before the picture
        if f not in sfx_pk:
            sfx_pk[f] = peak_db(wav)
        gain_db = voice_pk + REL_DB.get(kind, -15) + e.get("gain_db", 0) - sfx_pk[f]
        if gain_db > 0:
            warns.append(f"{t:.2f}s file '{f}' quá nhỏ (đỉnh {sfx_pk[f]:.1f} dB): cần +{gain_db:.1f} dB, Remotion chỉ tới 1.0 → chuẩn hoá file SFX lên")
        out.append({"f": f, "t": round(t, 3), "v": round(min(1.0, 10 ** (gain_db / 20)), 3), "kind": kind, "why": e.get("why", "")})

    # density: ≤2 in any 3 s window and ≤0.7/s overall (the opening hook does not count)
    body = [x for x in out if x["kind"] != "hook"]
    for i, x in enumerate(body):
        n = sum(1 for y in body[i:] if y["t"] < x["t"] + 3.0)
        if n > MAX_IN_3S:
            warns.append(f"{x['t']:.2f}s quá dày: {n} tiếng trong 3 giây (tối đa {MAX_IN_3S}) — bỏ bớt, chỉ giữ tiếng đầu của chuỗi giống nhau")
    if body:
        span = max(1.0, words[-1]["e"] - words[0]["s"]) if words else max(x["t"] for x in body)
        if len(body) / span > MAX_PER_SEC:
            warns.append(f"cả bài {len(body)} tiếng / {span:.0f}s = {len(body) / span:.2f}/s (tối đa {MAX_PER_SEC}/s)")
    if not any(x["kind"] == "hook" and x["t"] <= 0.5 for x in out):
        warns.append("không có tiếng mở đầu (hook) trong 0,5 giây đầu")
    used = {}
    for x in out:
        used[x["f"]] = used.get(x["f"], 0) + 1
    for f, n in used.items():
        if f not in ("pop", "whoosh", "ding") and n > 4:
            warns.append(f"file '{f}' dùng {n} lần — đổi bớt sang tiếng cùng loại khác cho đỡ nhàm")

    Path(a.out).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    for x in out:
        print(f"  {x['t']:7.3f}s  {x['kind']:7} {x['f']:8} vol {x['v']:.3f}  {x['why']}")
    for w in warns:
        print("⚠", w)
    print(f"\n{len(out)} tiếng, giọng đỉnh {voice_pk:.1f} dB, {len(warns)} cảnh báo → {a.out}")
    sys.exit(1 if warns else 0)


if __name__ == "__main__":
    main()
