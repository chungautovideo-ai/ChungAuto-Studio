"""Lay the spoken pieces of a video end to end (speaker clips .mp4 and/or voice pieces .wav),
trimming each one to its speech (Whisper word bounds) so there is no dead air between pieces.

usage: assemble_audio.py <work_dir> <piece> [<piece> ...] [--gap 0.12] [--head 0.10] [--tail 0.30]
  piece = path to .mp4 (A-roll, video+audio) or .mp3/.wav (voice-over)
writes <work_dir>/timeline.json  [{"src", "kind": "aroll"|"vo", "in", "out", "start", "end", "text", "lufs_in"}]
       <work_dir>/master.wav     (48 kHz, -14 LUFS) and <work_dir>/master/words.json (captions source)

Loudness rule: every piece is measured on its trimmed range and gain-matched to the same level BEFORE
concatenation (recorded pieces often differ by several dB), then a gentle
compressor + limiter keep the whole voice track even. The final check prints each piece's level; the
spread must stay within ±1 LU.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

from common import duration, load_json, run, save_json

HERE = Path(__file__).parent


def words_for(src, cache):
    out = cache / Path(src).stem
    if not (out / "words.json").exists():
        run([sys.executable, HERE / "transcribe.py", src, "--out", out], stdout=subprocess.DEVNULL)
    return load_json(out / "words.json")


PIECE_LUFS = -16.0  # every piece is matched to this before concat; the master is then lifted to -14


def lufs(src, start=None, length=None):
    """integrated loudness (LUFS) of src, optionally of [start, start+length]"""
    cut = (["-ss", str(start), "-t", str(length)] if start is not None else [])
    err = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *cut, "-i", str(src), "-vn", "-af", "ebur128",
                          "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="ignore").stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", err)[-1])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work")
    ap.add_argument("pieces", nargs="+")
    ap.add_argument("--gap", type=float, default=0.12, help="silence inserted between pieces")
    ap.add_argument("--head", type=float, default=0.10)
    ap.add_argument("--tail", type=float, default=0.30)
    a = ap.parse_args()
    work = Path(a.work)
    cache = work / "piece_words"
    cache.mkdir(parents=True, exist_ok=True)

    timeline, t, parts = [], 0.0, []
    for src in a.pieces:
        w = words_for(src, cache)
        dur = duration(src)
        if not w:
            sys.exit(f"no speech found in {src}")
        i = max(0.0, w[0]["s"] - a.head)
        o = min(dur, w[-1]["e"] + a.tail)
        kind = "aroll" if Path(src).suffix.lower() in {".mp4", ".mov"} else "vo"
        level = lufs(src, i, o - i)
        timeline.append({"src": str(src), "kind": kind, "in": round(i, 3), "out": round(o, 3),
                         "start": round(t, 3), "end": round(t + o - i, 3),
                         "text": " ".join(x["w"] for x in w), "lufs_in": level})
        parts.append((src, i, o, PIECE_LUFS - level))
        t += (o - i) + a.gap

    def render(gains):
        """trim each piece, gain-match it, pad the gap, concat, even out, lift to -14 LUFS"""
        inputs, filt = [], []
        for k, ((src, i, o, _), gain) in enumerate(zip(parts, gains)):
            inputs += ["-i", src]
            filt.append(f"[{k}:a]atrim={i}:{o},asetpts=PTS-STARTPTS,aresample=48000,"
                        f"aformat=channel_layouts=stereo,volume={gain:.2f}dB,apad=pad_dur={a.gap}[a{k}]")
        filt.append("".join(f"[a{k}]" for k in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1,"
                    "acompressor=threshold=-24dB:ratio=2.5:attack=15:release=250[out]")
        pre = work / "master_pre.wav"
        run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filt),
             "-map", "[out]", "-ar", "48000", pre])
        # one static gain to -14 LUFS (keeps the matched balance), limiter catches peaks
        run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af",
             f"volume={-14 - lufs(pre):.2f}dB,alimiter=limit=0.84:level=false", "-ar", "48000", work / "master.wav"])
        pre.unlink()
        return [lufs(work / "master.wav", s["start"], s["end"] - s["start"]) for s in timeline]

    # the compressor reacts differently per voice, so measure in the master and correct up to 2 more passes
    gains = [p[3] for p in parts]
    for _ in range(3):
        out_levels = render(gains)
        mid = sorted(out_levels)[len(out_levels) // 2]
        if max(out_levels) - min(out_levels) <= 1.0:
            break
        gains = [g + (mid - lv) for g, lv in zip(gains, out_levels)]
    save_json(timeline, work / "timeline.json")

    # check: every piece in the master within ±1 LU of the median
    mid = sorted(out_levels)[len(out_levels) // 2]
    for s, lv in zip(timeline, out_levels):
        flag = "" if abs(lv - mid) <= 1.0 else "  <-- lệch, kiểm tra lại"
        print(f"  {Path(s['src']).name:16} {s['lufs_in']:6.1f} -> {lv:6.1f} LUFS{flag}")
    print(f"  master {lufs(work / 'master.wav'):.1f} LUFS, độ lệch giữa các đoạn {max(out_levels) - min(out_levels):.1f} LU")
    run([sys.executable, HERE / "transcribe.py", work / "master.wav", "--out", work / "master"],
        stdout=subprocess.DEVNULL)
    for s in timeline:
        print(f"{s['start']:6.2f}-{s['end']:6.2f} {s['kind']:5} {Path(s['src']).name}: {s['text'][:60]}")
    print(f"total {t - a.gap:.2f}s -> {work / 'master.wav'}")


if __name__ == "__main__":
    main()
