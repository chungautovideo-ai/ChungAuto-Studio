// Làm rõ giọng (audio.clean = "nhe" | "vua" | "manh"): lọc ù / khử ồn nền (quạt, xe, máy lạnh) / nén cho giọng đều / giảm xì
// bằng ffmpeg có sẵn — không tốn tiền AI. Ra work/voice-<mức>.wav (mono 48 kHz, đúng độ dài video gốc → khớp khẩu hình),
// bộ dựng dùng file này thay cho tiếng của video gốc (xem trước + xuất video).
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

export const VOICE_CLEAN = {
  // đo trên giọng + ồn nâu (quạt / máy lạnh): chênh giọng – ồn từ 16 dB → nhẹ ~21 · vừa ~25 · mạnh ~48 dB (mạnh chậm hơn: ~1s / 16s video)
  nhe: "highpass=f=80,afftdn=nr=12:nf=-35:tn=1,alimiter=limit=0.95",
  vua: "highpass=f=90,lowpass=f=14000,afftdn=nr=25:nf=-30:tn=1,acompressor=threshold=-22dB:ratio=2.5:attack=5:release=150:makeup=1.6,deesser,alimiter=limit=0.95",
  manh: "highpass=f=100,lowpass=f=12000,anlmdn=s=10:p=0.002:r=0.006,afftdn=nr=25:nf=-30:tn=1,agate=threshold=0.03:ratio=3:range=0.1:attack=5:release=250,acompressor=threshold=-24dB:ratio=3:attack=5:release=120:makeup=2,deesser,alimiter=limit=0.95",
};
export const voiceFile = (level) => `work/voice-${level}.wav`;

// file đã có và mới hơn video gốc → dùng được
export function voiceReady(projectDir, source, level) {
  if (!VOICE_CLEAN[level]) return false;
  const out = path.join(projectDir, voiceFile(level)), src = path.join(projectDir, source || "");
  try { return fs.statSync(out).size > 1000 && (!fs.existsSync(src) || fs.statSync(out).mtimeMs >= fs.statSync(src).mtimeMs); } catch { return false; }
}

// tạo file giọng đã làm rõ (chạy nền, không chặn) → Promise
export function makeVoice(projectDir, source, level, { ffmpeg = "ffmpeg" } = {}) {
  return new Promise((resolve, reject) => {
    if (!VOICE_CLEAN[level]) return reject(new Error("Mức làm rõ giọng không hợp lệ."));
    const out = path.join(projectDir, voiceFile(level)), tmp = out.replace(/\.wav$/, ".tmp.wav");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const p = spawn(ffmpeg, ["-v", "error", "-y", "-i", path.join(projectDir, source), "-vn", "-ac", "1", "-ar", "48000", "-af", VOICE_CLEAN[level], "-c:a", "pcm_s16le", tmp],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(tmp)) { fs.rmSync(tmp, { force: true }); return reject(new Error(err.trim().split("\n").pop() || `ffmpeg lỗi ${code}`)); }
      fs.renameSync(tmp, out);
      resolve(voiceFile(level));
    });
  });
}
