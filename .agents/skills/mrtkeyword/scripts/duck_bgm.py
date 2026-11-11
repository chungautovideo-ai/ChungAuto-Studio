"""Quiet, ducked background music under the voice (so it never fights the words).
Usage: python duck_bgm.py <music> <master.wav> <out bgm.wav> [--lufs -26]
Music is trimmed/padded to the voice length, normalised to --lufs, faded in 1 s / out 2.5 s, then
side-chain compressed by the voice (ratio 6, release 450 ms). Ends ≈ 18 LU under a -15 LUFS voice."""
import argparse
import json
import subprocess

ap = argparse.ArgumentParser()
ap.add_argument("music")
ap.add_argument("master")
ap.add_argument("out")
ap.add_argument("--lufs", type=float, default=-26)
a = ap.parse_args()

dur = float(json.loads(subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", a.master],
    capture_output=True, text=True, check=True).stdout)["format"]["duration"])
graph = (f"[0:a]atrim=0:{dur},loudnorm=I={a.lufs}:TP=-3,apad=whole_dur={dur},afade=t=in:d=1,"
         f"afade=t=out:st={max(dur - 2.5, 0)}:d=2.5,aresample=48000[m];"
         "[1:a]aresample=48000[k];"
         "[m][k]sidechaincompress=threshold=0.02:ratio=6:attack=30:release=450[out]")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.music, "-i", a.master, "-filter_complex", graph,
                "-map", "[out]", "-ac", "2", a.out], check=True)
print(a.out)
