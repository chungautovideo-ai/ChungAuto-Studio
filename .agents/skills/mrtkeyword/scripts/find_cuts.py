"""Propose an edit decision list (EDL) for a talking-head take: drop fillers, repeated words,
false starts / retakes and long pauses. the agent reviews edl_review.txt and can override with
--remove-words / --keep-words (word indices from the review) and rerun.

usage: find_cuts.py <work_dir> [--max-gap 0.35] [--pad 0.08]
                    [--remove-words 12-18,40-41] [--keep-words 7-7]
reads  <work_dir>/words.json, segments.json
writes <work_dir>/edl.json, edl_review.txt
"""
import argparse
import difflib
import re
from pathlib import Path

from common import load_json, save_json

FILLERS = {"ờ", "ơ", "ừ", "ừm", "ờm", "ưm", "hừm", "ầ", "ừa", "uhm", "um", "uh", "ah", "ờờ"}
# Vietnamese reduplication that is NOT a stumble when a single word repeats
REDUP_OK = {"từ", "dần", "luôn", "nhiều", "rất", "mãi", "đi", "nhé", "nha", "thật"}


def norm(w):
    return re.sub(r"[^\wÀ-ỹ]", "", w.lower())


def parse_ranges(s):
    out = set()
    for part in filter(None, (s or "").split(",")):
        a, _, b = part.partition("-")
        out.update(range(int(a), int(b or a) + 1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("--max-gap", type=float, default=0.35)
    ap.add_argument("--pad", type=float, default=0.08)
    ap.add_argument("--remove-words", default="")
    ap.add_argument("--keep-words", default="")
    a = ap.parse_args()
    work = Path(a.work)
    words = load_json(work / "words.json")
    segs = load_json(work / "segments.json")
    n = len(words)
    nw = [norm(w["w"]) for w in words]
    drop = {}  # word index -> reason

    for i, t in enumerate(nw):
        if t in FILLERS:
            drop[i] = "filler"

    # consecutive repeated n-grams: keep the LAST occurrence (speaker's correction)
    for size in range(6, 0, -1):
        i = 0
        while i + 2 * size <= n:
            first, second = nw[i:i + size], nw[i + size:i + 2 * size]
            if first == second and all(first):
                gap = words[i + size]["s"] - words[i + size - 1]["e"]
                if size > 1 or first[0] not in REDUP_OK or gap > 0.3:
                    for k in range(i, i + size):
                        drop.setdefault(k, f"repeat x{size}")
                    i += size
                    continue
            i += 1

    # retakes / false starts at segment level: keep the later take
    seg_words = {}
    for i, w in enumerate(words):
        seg_words.setdefault(w["seg"], []).append(i)
    order = sorted(seg_words)
    for x, y in zip(order, order[1:]):
        tx = [nw[i] for i in seg_words[x]]
        ty = [nw[i] for i in seg_words[y]]
        if len(tx) < 2:
            continue
        is_prefix = ty[:len(tx)] == tx
        similar = difflib.SequenceMatcher(None, tx, ty[:len(tx) + 3]).ratio() > 0.75
        if is_prefix or similar:
            for i in seg_words[x]:
                drop.setdefault(i, "retake")

    for i in parse_ranges(a.remove_words):
        drop[i] = "manual"
    for i in parse_ranges(a.keep_words):
        drop.pop(i, None)

    kept = [i for i in range(n) if i not in drop]
    keep, prev = [], None
    for i in kept:
        s, e = words[i]["s"] - a.pad, words[i]["e"] + a.pad
        # extend the current range only if no word was dropped in between and the pause is short
        if keep and prev == i - 1 and words[i]["s"] - words[prev]["e"] <= a.max_gap:
            keep[-1][1] = e
        else:
            keep.append([max(0.0, s), e])
        prev = i
    # merge overlaps created by padding
    merged = []
    for s, e in keep:
        if merged and s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([round(s, 3), round(e, 3)])

    src_dur = words[-1]["e"] if words else 0
    out_dur = sum(e - s for s, e in merged)
    removed = []
    for i in sorted(drop):
        removed.append({"i": i, "w": words[i]["w"], "s": words[i]["s"], "e": words[i]["e"], "reason": drop[i]})
    save_json({"keep": merged, "removed": removed,
               "params": {"max_gap": a.max_gap, "pad": a.pad,
                          "remove_words": a.remove_words, "keep_words": a.keep_words},
               "stats": {"src_speech_end": src_dur, "out_dur": round(out_dur, 2), "cuts": len(merged)}},
              work / "edl.json")

    # review file: every word with its index, dropped ones in ~~strike~~
    lines = []
    for sg in segs:
        idx = seg_words.get(sg["i"], [])
        toks = [f"~~{words[i]['w']}~~({i},{drop[i]})" if i in drop else f"{words[i]['w']}" for i in idx]
        rng = f"{idx[0]}-{idx[-1]}" if idx else "-"
        lines.append(f"[{sg['i']:03d}] {sg['s']:7.2f}s words {rng}: " + " ".join(toks))
    lines.append(f"\nSpeech {src_dur:.1f}s -> {out_dur:.1f}s after cuts, {len(merged)} kept ranges, {len(drop)} words dropped")
    (work / "edl_review.txt").write_text("\n".join(lines), encoding="utf-8")
    print(lines[-1].strip())


if __name__ == "__main__":
    main()
