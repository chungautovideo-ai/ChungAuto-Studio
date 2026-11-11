"""Turn work/plan.json + the assembled audio into remotion/src/data.json (and work/sfx_events.json).

usage: build_data.py <project dir>
needs  <project>/work/plan.json, work/asm/{timeline.json, master/words.json, captions.json}
Cue values in plan.json are spoken words: each is looked up in words.json INSIDE its own segment
(window start-0.8 … end+0.2, so Whisper's early timing at clip edges cannot leak into the previous clip),
in the order listed, and clamped to ≥ segment start. "+1.5" = seconds after the segment start.
A cue that cannot be found is reported and left out (the effect falls back to an offset).
"""
import json
import re
import sys
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding="utf-8")

SKILL = Path(__file__).resolve().parents[1]
REG = json.loads((SKILL / "keywords.json").read_text(encoding="utf-8"))


def norm(w):
    return re.sub(r"[^\wÀ-ỹ]", "", str(w).lower())


def main():
    prj = Path(sys.argv[1])
    plan = json.loads((prj / "work/plan.json").read_text(encoding="utf-8"))
    asm = prj / "work/asm"
    tl = json.loads((asm / "timeline.json").read_text(encoding="utf-8"))
    words = json.loads((asm / "master/words.json").read_text(encoding="utf-8"))
    caps = json.loads((asm / "captions.json").read_text(encoding="utf-8"))
    segs = [{"id": Path(s["src"]).stem, "kind": s["kind"], "src": f"clips/{Path(s['src']).name}" if s["kind"] == "aroll" else None,
             "in": s["in"], "start": s["start"], "end": s["end"]} for s in tl]
    S = {s["id"]: s for s in segs}
    warn = []

    def find(token, seg, after=None):
        s = S[seg]
        if isinstance(token, (int, float)):
            return round(s["start"] + float(token), 2)
        token = str(token).strip()
        if not token:
            return None
        if token.startswith("+"):
            return round(s["start"] + float(token[1:]), 2)
        first = norm(token.split()[0])
        lo, hi = s["start"] - 0.8, s["end"] + 0.2
        for w in words:
            if lo <= w["s"] <= hi and (after is None or w["s"] > after) and norm(w["w"]) == first:
                return round(max(w["s"], s["start"] + 0.05), 2)
        warn.append(f"không thấy từ '{token}' trong đoạn {seg}")
        return None

    # captions: fix Whisper wording + keep compounds together
    fix = [(re.compile(a), b) for a, b in plan.get("fix", [])]
    comp = {(norm(a), norm(b)) for a, b in plan.get("compounds", [])}
    for a_, b_ in zip(caps, caps[1:]):
        if a_["words"] and b_["words"] and (norm(a_["words"][-1]["w"]), norm(b_["words"][0]["w"])) in comp:
            w0 = b_["words"].pop(0)
            a_["words"].append(w0)
            a_["e"] = max(a_["e"], w0["e"])
            if b_["words"]:
                b_["s"] = b_["words"][0]["s"]
            for c in (a_, b_):
                c["text"] = " ".join(x["w"] for x in c["words"])
    caps = [c for c in caps if c["words"]]

    def fixt(t):
        for r, b in fix:
            t = r.sub(b, t)
        return t

    aroll_ids = [s["id"] for s in segs if s["kind"] == "aroll"]
    fx_out, cuts, events = [], [s["start"] for s in segs[1:]], []
    layouts = {}
    for f in plan["fx"]:
        sid, name = f["seg"], f["fx"]
        if REG.get(name, {}).get("status") == "merged":  # a duplicate name -> the keyword it was merged into
            name = REG[name]["alias_of"]
        meta = REG.get(name)
        if not meta or meta["status"] != "built":
            raise SystemExit(f"keyword '{name}' chưa được dựng — chọn keyword có status built trong keywords.json")
        layouts[name] = meta["layout"]
        cues, after = {}, None
        for cname in meta["cues"]:
            if cname in f.get("cues", {}):
                v = find(f["cues"][cname], sid, after)
                if v is not None:
                    cues[cname] = v
                    after = v
        params = {k: v for k, v in (f.get("params") or {}).items() if v not in (None, "", [])}
        if name in ("reel-orbit", "edit-timeline") and "thumbs" not in params:
            params["thumbs"] = [i for i in aroll_ids if i != sid][:9]
        first_cue = min(cues.values()) if cues else S[sid]["start"] + 0.3
        item = {"seg": sid, "fx": name, "cues": cues, "params": params}
        if f.get("n"):
            item.update(n=f["n"], pillAt=round(first_cue, 2), pillEnd=round(S[sid]["end"] + 0.05, 2))
        fx_out.append(item)
        if meta.get("cut") and meta["cut"] in cues:
            cuts.append(cues[meta["cut"]])
        for cname, kind in meta.get("sfx", []):
            if cname in cues:
                events.append({"t": cues[cname], "kind": kind, "why": f"{name} · {cname}"})

    punch = {}
    for sid, lst in plan.get("punch", {}).items():
        out = [[S[sid]["start"], 1.0]]
        for tok, z in lst:
            v = find(tok, sid)
            if v is not None:
                out.append([v, z])
        punch[sid] = out
    for f in fx_out:  # keywords that frame the face get their own punch-in from their first cue
        z = REG[f["fx"]].get("punch")
        if z and f["seg"] not in punch:
            punch[f["seg"]] = [[S[f["seg"]]["start"], 1.0], [min(f["cues"].values()) if f["cues"] else S[f["seg"]]["start"], z]]

    cover = plan.get("cover") if plan.get("cover", {}).get("line1") else None
    stickers = []
    for k in plan.get("stickers", []):
        sid = k["seg"]
        t0 = find(k.get("from", "+0.1"), sid) or S[sid]["start"] + 0.1
        if cover and t0 < 0.5:
            t0 = 0.5
        to = k.get("to", "end")
        t1 = S[sid]["end"] + (0.6 if sid == segs[-1]["id"] else 0.1) if to == "end" else (find(to, sid, t0) or S[sid]["end"]) - 0.05
        st = {"t0": round(t0, 2), "t1": round(t1, 2), "text": k["text"], "size": k.get("size", 100), "variant": k.get("variant", "fire"), "shake": k.get("shake", False)}
        if "y" in k:
            st.update(y=k["y"], rotate=k.get("rotate", -3))
        else:
            st["clip"] = sid
        stickers.append(st)
        events.append({"t": st["t0"], "kind": "impact" if k.get("shake") else "pop", "why": f"sticker {k['text'][:18]}"})

    if cover:
        events.append({"t": 0.0, "kind": "hook", "why": "mở đầu"})
        events.append({"t": 0.5, "kind": "whoosh", "why": "bìa → video"})
    for s in segs[1:]:
        events.append({"t": s["start"], "kind": "whoosh", "why": f"chuyển đoạn {s['id']}"})
    events.sort(key=lambda e: e["t"])

    rem = prj / "remotion"
    data = {"fps": 30, "duration": round(tl[-1]["end"] + 0.6, 2), "segments": segs,
            "captions": [{"text": fixt(c["text"]), "s": c["s"], "e": c["e"]} for c in caps],
            "fx": fx_out, "stickers": stickers, "punch": punch, "cuts": sorted(set(round(c, 2) for c in cuts)),
            "layouts": layouts, "hasBgm": (rem / "public/bgm.wav").exists(), "cover": cover}
    (rem / "src/data.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (prj / "work/sfx_events.json").write_text(json.dumps(events, ensure_ascii=False, indent=1), encoding="utf-8")
    for w in warn:
        print("–", w)
    print(f"{len(fx_out)} keyword, {len(stickers)} sticker, {len(events)} SFX event -> remotion/src/data.json, work/sfx_events.json")


if __name__ == "__main__":
    main()
