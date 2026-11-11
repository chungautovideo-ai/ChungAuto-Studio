"""Suggest keywords for each A-roll segment and write a plan draft the agent then fills with content.

usage: suggest.py <project dir> [--per-min 8]
reads  <project>/work/asm/timeline.json (from /auto-video assemble_audio.py)
writes <project>/work/plan_draft.json  — one entry per segment: best built keyword + cue words guessed from the
       segment's own words + empty params to fill; first segment = hook (stickers only), last = cta-circle.
prints a table "segment | text | top-3 keywords (score)" so the agent can swap picks before filling.
Rules baked in: no keyword twice in a row, ≥ 3 different layouts, half/cutout not more than 2 segments in a row.
"""
import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8")

SKILL = Path(__file__).resolve().parents[1]
REG = json.loads((SKILL / "keywords.json").read_text(encoding="utf-8"))
BUILT = {k: v for k, v in REG.items() if v["status"] == "built" and k not in ("cta-circle", "end-wall")}
# keywords drawn on the speaker's face/body: never on a voice segment (no speaker there)
NO_VO = {"text-behind", "locked-on", "scribble", "reel-orbit", "edit-timeline", "face-scan", "neon-outline", "stamp-hit",
         "clone-crowd", "spotlight", "end-wall", "cta-circle", "photo-snap",
         "glitch-cut", "film-grain", "rec-frame", "arrow-doodle"}  # photo-snap only with a picture (agent adds "img")


def fold(s):
    s = unicodedata.normalize("NFD", s.lower().replace("đ", "d"))
    return re.sub(r"[̀-ͯ]", "", s)


def score(text, kw, pool=None):
    f = fold(text)
    sc = sum(2 for tr in (pool or BUILT)[kw]["triggers"] if fold(tr) in f)
    sc += 3 if fold(kw.replace("-", " ")) in f else 0  # the keyword itself is spoken (keyword-list videos)
    body = re.sub(r"^\W*(s[oố]\s*)?\d+\W", "", text.strip(), flags=re.I)  # "Số 3." list numbering is not a figure
    if re.search(r"\d", body) and kw in ("glass-graph", "glass-counter"):
        sc += 2
    return sc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    a = ap.parse_args()
    prj = Path(a.project)
    tl = json.loads((prj / "work/asm/timeline.json").read_text(encoding="utf-8"))
    segs = list(tl)  # speaker segments (aroll) and voice-only segments (vo)
    ids = [Path(s["src"]).stem for s in segs]
    seg_kind = [s["kind"] for s in segs]
    plan, used, layouts = [], [], []
    for i, s in enumerate(segs):
        sid, text = ids[i], s.get("text", "")
        if i == 0:
            print(f"{sid} | HOOK  | {text[:70]}")
            continue
        if i == len(segs) - 1:
            if seg_kind[i] == "vo":  # no speaker to put in the circle: viewers' comments pop up instead
                plan.append({"seg": sid, "fx": "comment-pop", "cues": {"on": ""}, "params": {"comments": []}})
            else:
                plan.append({"seg": sid, "fx": "cta-circle", "cues": {"type": "", "send": ""}, "params": {"code": "", "avatar": "B"}})
            print(f"{sid} | CTA   | {text[:70]}")
            continue
        pool = {k: v for k, v in BUILT.items() if seg_kind[i] == "aroll" or k not in NO_VO}
        if i == len(segs) - 2 and seg_kind[i] == "aroll":  # the line before the CTA may be a wrap-up → end-wall
            pool["end-wall"] = REG["end-wall"]
        ranked = sorted(pool, key=lambda k: -score(text, k, pool))
        pick, vo = None, seg_kind[i] == "vo"
        for kw in ranked:
            lay = pool[kw]["layout"]
            if used and used[-1] == kw:
                continue
            if not vo and lay != "full" and layouts[-2:] == [lay, lay]:
                continue
            if not vo and lay == "full" and layouts[-2:] == ["full", "full"]:
                continue
            pick = kw
            break
        pick = pick or ranked[0]
        used.append(pick)
        if not vo:  # the layout-variety rule is about how the speaker is shown
            layouts.append(pool[pick]["layout"])
        words = [w for w in re.findall(r"[\wÀ-ỹ]+", text)]
        cues = {name: (words[min(len(words) - 1, 2 + 3 * j)] if words else "") for j, name in enumerate(pool[pick]["cues"])}
        plan.append({"seg": sid, "fx": pick, "n": None, "cues": cues, "params": {k: None for k in pool[pick]["params"]}})
        top = ", ".join(f"{k}({score(text, k, pool)})" for k in ranked[:3])
        print(f"{sid} | {pick:14s} | {text[:60]}  ← {top}")
    kinds = set(layouts)
    if layouts and len(kinds) < 3:
        print(f"– chỉ {len(kinds)} kiểu bố cục ({', '.join(sorted(kinds))}): đổi vài keyword để đủ ≥ 3 kiểu")
    draft = {"fix": [], "compounds": [], "cover": {"label": "", "line1": "", "line2": "", "tag": "", "clip": ids[0] if seg_kind[0] == "aroll" else None, "at": 2.0},
             "music": None, "punch": {ids[0]: []}, "stickers": [], "fx": plan}
    out = prj / "work/plan_draft.json"
    out.write_text(json.dumps(draft, ensure_ascii=False, indent=1), encoding="utf-8")
    print("->", out)


if __name__ == "__main__":
    main()
