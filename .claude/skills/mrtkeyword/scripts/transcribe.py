"""Vietnamese transcription with word timestamps (faster-whisper on GPU, whisper.cpp fallback).

usage: transcribe.py <media> --out <dir> [--vocab "Master Prompt, ChatGPT"] [--model large-v3-turbo]
writes: <dir>/words.json  [{"w": word, "s": start, "e": end, "p": prob, "seg": i}]
        <dir>/segments.json, <dir>/transcript.txt (numbered lines for review)
"""
import argparse
import sys
from pathlib import Path

from common import add_cuda_dll_dirs, extract_wav, has_cuda, save_json


def fw_transcribe(wav, model_name, vocab):
    add_cuda_dll_dirs()
    import torch  # noqa: F401  (loads cuDNN DLLs before ctranslate2)
    from faster_whisper import WhisperModel

    import soundfile as sf

    # decode ourselves: faster-whisper's PyAV decoder breaks with the av version auto-editor needs
    audio, _ = sf.read(wav, dtype="float32")
    gpu = has_cuda()
    model = WhisperModel(model_name, device="cuda" if gpu else "cpu", compute_type="float16" if gpu else "int8")
    segs, _ = model.transcribe(
        audio, language="vi", word_timestamps=True, beam_size=5,
        initial_prompt=vocab or None, condition_on_previous_text=False,
        vad_filter=False,
    )
    words, segments = [], []
    for i, s in enumerate(segs):
        segments.append({"i": i, "s": round(s.start, 3), "e": round(s.end, 3), "text": s.text.strip()})
        for w in s.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3),
                          "p": round(w.probability, 3), "seg": i})
    return words, segments


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("media")
    ap.add_argument("--out", required=True)
    ap.add_argument("--vocab", default="")
    ap.add_argument("--model", default="large-v3-turbo")
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    wav = extract_wav(a.media, out / "audio16k.wav")
    words, segments = fw_transcribe(str(wav), a.model, a.vocab)
    words = [w for w in words if w["w"]]
    save_json(words, out / "words.json")
    save_json(segments, out / "segments.json")
    lines = [f"[{s['i']:03d}] {s['s']:7.2f}-{s['e']:7.2f}  {s['text']}" for s in segments]
    (out / "transcript.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"{len(segments)} segments, {len(words)} words -> {out}", file=sys.stderr)


if __name__ == "__main__":
    main()
