"""Turn one recorded video (person talking) or one audio file (voice) into mrtkeyword segments.

usage: prep_input.py <video-or-audio> <project dir> [--vocab "tên riêng, thuật ngữ"]
                     [--remove-words 12-18] [--keep-words 7-7] [--no-cut] [--denoise]
steps  1. transcribe (Whisper)                          -> <project>/work/raw/words.json, transcript.txt
       2. find_cuts + apply_cuts: drop fillers, repeats, retakes, long pauses
                                                        -> work/raw/edl_review.txt, cut.mp4|cut.wav
       3. split the cut take into 3.5–9 s segments at sentence ends (cut in the pause between words);
          video is reframed to 1080x1920 @30 (centre crop for a horizontal take)
                                                        -> <project>/clips/01.mp4 … or <project>/voice/vo_01.wav …
       4. assemble_audio (trim, equal loudness, -14 LUFS) -> work/asm/master.wav, timeline.json, master/words.json
       5. captions (2–4 words)                          -> work/asm/captions.json
Read work/raw/edl_review.txt; to change what is cut, rerun with --remove-words / --keep-words (word
indices from the review). Transcription is cached, so a rerun only redoes steps 2–5.
"""
import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from common import OUT_FPS, OUT_H, OUT_W, duration, ffprobe_json, load_json, run

HERE = Path(__file__).resolve().parent
PY = sys.executable
MIN_SEG, MAX_SEG, HARD_SEG = 3.5, 9.0, 11.0


def has_video(p):
    return any(s["codec_type"] == "video" and not s.get("disposition", {}).get("attached_pic") for s in ffprobe_json(p)["streams"])


def split_points(words, total):
    """segment boundaries (seconds): close a segment at a sentence end once it is long enough,
    or at the widest pause once it gets too long; boundaries sit in the middle of the pause"""
    # after the pause removal there is almost no silence left, so Whisper's own sentence split ("seg")
    # and punctuation mark the sentence ends; past HARD_SEG it cuts at the widest gap seen so far
    bounds, start, best = [0.0], 0.0, None
    for i, w in enumerate(words[:-1]):
        nxt = words[i + 1]
        gap, cut = nxt["s"] - w["e"], (w["e"] + nxt["s"]) / 2
        length = w["e"] - start
        sentence_end = w["w"].rstrip().endswith((".", "?", "!", "…")) or gap >= 0.45 or nxt.get("seg") != w.get("seg")
        if best is None or gap > best[0] or (sentence_end and gap >= best[0] - 0.05):
            best = (gap, cut)
        if (sentence_end and length >= MIN_SEG) or (length >= MAX_SEG and gap >= 0.12):
            bounds.append(cut)
            start, best = cut, None
        elif length >= HARD_SEG and best:
            bounds.append(best[1])
            start, best = best[1], None
    if total - bounds[-1] < 2.0 and len(bounds) > 1:  # a very short tail joins the previous segment
        bounds.pop()
    return bounds + [total]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("media")
    ap.add_argument("project")
    ap.add_argument("--vocab", default="")
    ap.add_argument("--remove-words", default="")
    ap.add_argument("--keep-words", default="")
    ap.add_argument("--no-cut", action="store_true", help="keep the take as it is (no filler/pause removal)")
    ap.add_argument("--denoise", action="store_true", help="needs tools/bin/deep-filter.exe")
    a = ap.parse_args()
    prj = Path(a.project).resolve()
    raw = prj / "work/raw"
    raw.mkdir(parents=True, exist_ok=True)
    media = Path(a.media).resolve()
    video = has_video(media)

    # 1-2. transcribe, cut
    if not (raw / "words.json").exists():
        run([PY, HERE / "transcribe.py", media, "--out", raw, "--vocab", a.vocab])
    if a.no_cut:
        cut = media
        shutil.copy2(raw / "words.json", raw / "words_cut.json")
    else:
        run([PY, HERE / "find_cuts.py", raw, "--remove-words", a.remove_words, "--keep-words", a.keep_words])
        run([PY, HERE / "apply_cuts.py", media, raw] + (["--denoise"] if a.denoise else []))
        cut = raw / ("cut.mp4" if video else "cut.wav")
    words = [w for w in load_json(raw / "words_cut.json") if w["w"]]
    if not words:
        sys.exit("không nghe thấy lời nói nào trong file")

    # 3. split into segments
    bounds = split_points(words, duration(cut))
    out_dir = prj / ("clips" if video else "voice")
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    pieces = []
    for k, (s, e) in enumerate(zip(bounds, bounds[1:]), 1):
        if video:
            dst = out_dir / f"{k:02d}.mp4"
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-to", f"{e:.3f}", "-i", cut,
                 "-vf", f"scale={OUT_W}:{OUT_H}:force_original_aspect_ratio=increase:flags=lanczos,crop={OUT_W}:{OUT_H},fps={OUT_FPS},setsar=1",
                 "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", dst])
        else:
            dst = out_dir / f"vo_{k:02d}.wav"
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-to", f"{e:.3f}", "-i", cut, "-ar", "48000", dst])
        pieces.append(dst)

    # 4-5. assemble + captions
    asm = prj / "work/asm"
    if asm.exists():
        shutil.rmtree(asm)
    run([PY, HERE / "assemble_audio.py", asm, *pieces])
    run([PY, HERE / "captions.py", asm / "master/words.json", "--out", asm / "captions.json"], stdout=subprocess.DEVNULL)
    print(f"\n{'video' if video else 'âm thanh'}: {len(pieces)} đoạn -> {out_dir}")
    if not a.no_cut:
        print(f"xem lại phần đã cắt: {raw / 'edl_review.txt'}")


if __name__ == "__main__":
    main()
