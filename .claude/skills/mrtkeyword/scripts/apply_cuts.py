"""Render the EDL: cut the source video to the kept ranges (10 ms audio fades at every joint),
optionally denoise the voice with DeepFilterNet, loudness-normalise, and remap word timings.

usage: apply_cuts.py <video-or-audio> <work_dir> [--denoise] [--out cut.mp4|cut.wav]
reads  <work_dir>/edl.json, words.json
writes <work_dir>/cut.mp4, words_cut.json
"""
import argparse
from pathlib import Path

from common import DEEP_FILTER, extract_wav, ffprobe_json, load_json, run, save_json

FADE = 0.01


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("work")
    ap.add_argument("--denoise", action="store_true")
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    work = Path(a.work)
    edl = load_json(work / "edl.json")
    keep = edl["keep"]
    has_video = any(st["codec_type"] == "video" and not st.get("disposition", {}).get("attached_pic")
                    for st in ffprobe_json(a.video)["streams"])
    out = Path(a.out) if a.out else work / ("cut.mp4" if has_video else "cut.wav")

    inputs = ["-i", a.video]
    audio_in = "0:a"
    if a.denoise:
        wav48 = extract_wav(a.video, work / "audio48k.wav", sr=48000)
        dn_dir = work / "denoised"
        dn_dir.mkdir(exist_ok=True)
        run([DEEP_FILTER, wav48, "-o", dn_dir])
        inputs += ["-i", str(dn_dir / "audio48k.wav")]
        audio_in = "1:a"

    parts, labels = [], []
    for k, (s, e) in enumerate(keep):
        d = e - s
        if has_video:
            parts.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{k}]")
        parts.append(f"[{audio_in}]atrim=start={s}:end={e},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:d={FADE},afade=t=out:st={max(0, d - FADE):.3f}:d={FADE}[a{k}]")
        labels.append(f"[v{k}][a{k}]" if has_video else f"[a{k}]")
    v = 1 if has_video else 0
    parts.append("".join(labels) + f"concat=n={len(keep)}:v={v}:a=1" + ("[vc][ac]" if has_video else "[ac]"))
    parts.append("[ac]loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
    graph = work / "cut_graph.txt"
    graph.write_text(";\n".join(parts), encoding="utf-8")

    if has_video:
        enc = ["-map", "[vc]", "-map", "[aout]",
               "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart"]
    else:  # voice-only input (branch B)
        enc = ["-map", "[aout]", "-ar", "48000"]
    run(["ffmpeg", "-v", "error", "-y", *inputs, "-/filter_complex", graph, *enc, out])

    # remap word timings onto the cut timeline
    words = load_json(work / "words.json")
    remapped, offset = [], 0.0
    for s, e in keep:
        for w in words:
            if w["s"] >= s - 1e-3 and w["e"] <= e + 1e-3:
                remapped.append({**w, "s": round(w["s"] - s + offset, 3), "e": round(w["e"] - s + offset, 3)})
        offset += e - s
    save_json(remapped, work / "words_cut.json")
    print(f"{out}  ({offset:.1f}s, {len(keep)} ranges, {len(remapped)} words)")


if __name__ == "__main__":
    main()
