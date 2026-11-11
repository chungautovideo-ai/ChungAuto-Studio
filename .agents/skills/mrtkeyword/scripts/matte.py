"""Cut the speaker out of a stretch of footage for the sample's "person pops out of the rounded
card" layout, using RobustVideoMatting on the GPU (temporally stable, real-time class).
Output is a VP9 WebM with alpha, same size/fps as the source.

usage: matte.py <video> --start 36.0 --end 39.5 --out person.webm [--model resnet50|mobilenetv3]
"""
import argparse
import subprocess

from common import MODELS, add_cuda_dll_dirs, ffprobe_json, has_cuda


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--start", type=float, required=True)
    ap.add_argument("--end", type=float, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default="mobilenetv3", choices=["resnet50", "mobilenetv3"])
    a = ap.parse_args()
    add_cuda_dll_dirs()
    import numpy as np
    import torch

    v = next(s for s in ffprobe_json(a.video)["streams"] if s["codec_type"] == "video")
    W, H, fps = v["width"], v["height"], v["r_frame_rate"]
    dev = "cuda" if has_cuda() else "cpu"
    model = torch.jit.load(str(MODELS / "rvm" / f"rvm_{a.model}_fp32.torchscript"), map_location=dev).to(dev).eval()
    ratio = min(1.0, 512 / max(W, H))  # RVM guidance: ~0.25 for 1080p, ~0.4 for 720p

    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{a.start}", "-to", f"{a.end}", "-i", a.video,
                            "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba",
                            "-s", f"{W}x{H}", "-r", fps, "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                            "-b:v", "0", "-crf", "22", "-auto-alt-ref", "0", "-row-mt", "1", a.out],
                           stdin=subprocess.PIPE)
    rec, n, size = [None] * 4, 0, W * H * 3
    with torch.no_grad():
        while True:
            buf = dec.stdout.read(size)
            if len(buf) < size:
                break
            src = torch.from_numpy(np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()).to(dev)
            src = src.permute(2, 0, 1).unsqueeze(0).float() / 255
            fgr, pha, *rec = model(src, *rec, ratio)
            rgba = torch.cat([fgr, pha], 1)[0].permute(1, 2, 0).mul(255).clamp(0, 255).byte().cpu().numpy()
            enc.stdin.write(rgba.tobytes())
            n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(f"{a.out}  ({n} frames)")


if __name__ == "__main__":
    main()
