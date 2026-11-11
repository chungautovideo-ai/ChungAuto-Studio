"""Classify an input for routing: filmed video / voice-only / text / url.

usage: probe_input.py <path-or-url-or-text-file>
prints JSON: {"kind": "video"|"voice"|"text"|"url", ...}
"""
import json
import re
import sys
from pathlib import Path

from common import ffprobe_json

AUDIO_EXT = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus", ".wma"}
TEXT_EXT = {".txt", ".md", ".docx", ".pdf", ".html"}


def main(arg):
    if re.match(r"^https?://", arg):
        return {"kind": "url", "url": arg}
    p = Path(arg)
    if not p.exists():
        return {"kind": "text", "chars": len(arg)}
    ext = p.suffix.lower()
    if ext in TEXT_EXT:
        return {"kind": "text", "path": str(p)}
    info = ffprobe_json(p)
    streams = info.get("streams", [])
    # cover art in audio files shows up as a 1-frame video stream
    video = [s for s in streams if s["codec_type"] == "video"
             and s.get("disposition", {}).get("attached_pic", 0) == 0]
    audio = [s for s in streams if s["codec_type"] == "audio"]
    dur = float(info["format"].get("duration", 0))
    if video and ext not in AUDIO_EXT:
        v = video[0]
        return {"kind": "video", "path": str(p), "duration": dur,
                "width": v.get("width"), "height": v.get("height"),
                "fps": v.get("r_frame_rate"), "has_audio": bool(audio)}
    if audio:
        return {"kind": "voice", "path": str(p), "duration": dur}
    return {"kind": "unknown", "path": str(p)}


if __name__ == "__main__":
    print(json.dumps(main(sys.argv[1]), ensure_ascii=False, indent=1))
