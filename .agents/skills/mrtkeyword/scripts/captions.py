"""Group word timings into the sample's caption style: 2–4 words per card, break on punctuation
or pauses, never more than ~20 characters.

usage: captions.py <words.json> --out captions.json [--max-words 4] [--max-chars 20] [--srt out.srt]
output: [{"text": "một cái project mới", "s": 21.30, "e": 22.32, "words": [...]}, ...]
"""
import argparse
import re

from common import load_json, save_json


def group(words, max_words, max_chars, pause=0.25):
    caps, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        text = " ".join(x["w"] for x in cur)
        nxt = words[i + 1] if i + 1 < len(words) else None
        gap = (nxt["s"] - w["e"]) if nxt else 1
        punct = bool(re.search(r"[.,!?…:;]$", w["w"]))
        too_long = nxt and len(text) + 1 + len(nxt["w"]) > max_chars
        new_sentence = nxt and (nxt.get("seg") != w.get("seg") or (nxt["w"][:1].isupper() and len(cur) >= 2))
        if not nxt or len(cur) >= max_words or punct or gap > pause or too_long or new_sentence:
            caps.append(cur)
            cur = []
    # no orphan words: fold a lone word into the previous card of the same sentence when it still fits
    merged = []
    for c in caps:
        prev = merged[-1] if merged else None
        if (prev and len(c) == 1 and c[0].get("seg") == prev[-1].get("seg")
                and c[0]["s"] - prev[-1]["e"] < 0.3
                and len(" ".join(x["w"] for x in prev + c)) <= max_chars + 6):
            prev.extend(c)
        else:
            merged.append(c)
    caps = merged
    out = []
    for c in caps:
        text = re.sub(r"[.,!?…:;]+$", "", " ".join(x["w"] for x in c)).strip()
        out.append({"text": text, "s": c[0]["s"], "e": c[-1]["e"],
                    "words": [{"w": x["w"], "s": x["s"], "e": x["e"]} for x in c]})
    # hold each card until the next one starts (no flicker in short gaps)
    for a, b in zip(out, out[1:]):
        if b["s"] - a["e"] < 0.4:
            a["e"] = b["s"]
    return out


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("words")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-words", type=int, default=4)
    ap.add_argument("--max-chars", type=int, default=20)
    ap.add_argument("--srt")
    a = ap.parse_args()
    caps = group(load_json(a.words), a.max_words, a.max_chars)
    save_json(caps, a.out)
    if a.srt:
        with open(a.srt, "w", encoding="utf-8") as f:
            for i, c in enumerate(caps, 1):
                f.write(f"{i}\n{srt_time(c['s'])} --> {srt_time(c['e'])}\n{c['text']}\n\n")
    print(f"{len(caps)} caption cards -> {a.out}")


if __name__ == "__main__":
    main()
