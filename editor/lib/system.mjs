// Kiểm tra máy: ffmpeg / ffprobe / công cụ nhận giọng — dùng chung cho editor và các lệnh tools/.
// Máy chưa có ffmpeg → phần mềm tự tải bản dựng sẵn đúng máy (eugeneware/ffmpeg-static, ~20–28MB mỗi file) vào tools/ffmpeg/.

import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import zlib from "node:zlib";
import { whisperStatus } from "./whisper.mjs";

const FF_RELEASE = "b6.1.1";
const ffKey = () => `${process.platform}-${process.arch === "arm64" ? "arm64" : "x64"}`; // darwin-arm64 | darwin-x64 | win32-x64
const exe = (n) => (process.platform === "win32" ? n + ".exe" : n);
const ffDir = (root) => path.join(root, "tools", "ffmpeg");
const has = (cmd) => { try { execSync(`${cmd} -version`, { stdio: "ignore" }); return true; } catch { return false; } };
const addPath = (dir) => { if (dir && !String(process.env.PATH).split(path.delimiter).includes(dir)) process.env.PATH = dir + path.delimiter + process.env.PATH; };

// Gọi 1 lần khi khởi động: thêm Homebrew (macOS) và ffmpeg đi kèm vào PATH nếu cần.
export function prepareTools(root) {
  if (process.platform === "darwin") for (const p of ["/usr/local/bin", "/opt/homebrew/bin"]) addPath(p);
  // bản ffmpeg phần mềm đã tải (nếu có) được ưu tiên khi máy không có ffmpeg hệ thống
  if (root && (!has("ffmpeg") || !has("ffprobe")) && fs.existsSync(path.join(ffDir(root), exe("ffmpeg")))) addPath(ffDir(root));
  return { ffmpeg: has("ffmpeg"), ffprobe: has("ffprobe") };
}

const brewBin = () => ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"].find((f) => fs.existsSync(f)) || "";

// Tải ffmpeg + ffprobe dựng sẵn cho máy này. onProgress({ phase, pct })
export async function installFfmpeg(root, onProgress = () => {}) {
  const dir = ffDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const names = ["ffmpeg", "ffprobe"];
  for (let i = 0; i < names.length; i++) {
    const n = names[i], url = `https://github.com/eugeneware/ffmpeg-static/releases/download/${FF_RELEASE}/${n}-${ffKey()}.gz`;
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok || !r.body) throw new Error(`Tải ${n} lỗi (${r.status}). Máy này: ${ffKey()}`);
    const total = Number(r.headers.get("content-length")) || 0, chunks = [];
    let got = 0;
    for await (const c of r.body) { chunks.push(c); got += c.length; onProgress({ phase: `Đang tải ${n} (${Math.round(got / 1048576)}/${Math.round(total / 1048576) || "?"} MB)…`, pct: Math.round(((i + (total ? got / total : 0)) / names.length) * 100) }); }
    const out = path.join(dir, exe(n));
    fs.writeFileSync(out, zlib.gunzipSync(Buffer.concat(chunks)));
    if (process.platform !== "win32") { fs.chmodSync(out, 0o755); try { execSync(`xattr -d com.apple.quarantine "${out}"`, { stdio: "ignore" }); } catch {} }
  }
  prepareTools(root);
  onProgress({ phase: "Đã cài ffmpeg", pct: 100 });
}

// yt-dlp (tải video công khai để AI xem khung + nghe lời khi Phân tích kênh): 1 file chạy được, ~18MB, vào tools/yt-dlp/
const ytName = () => (process.platform === "win32" ? "yt-dlp.exe" : process.platform === "darwin" ? "yt-dlp_macos" : "yt-dlp");
export const ytdlpPath = (root) => path.join(root, "tools", "yt-dlp", exe("yt-dlp"));
export async function installYtdlp(root, onProgress = () => {}) {
  const out = ytdlpPath(root);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = await fetch(`https://github.com/yt-dlp/yt-dlp/releases/latest/download/${ytName()}`, { redirect: "follow" });
  if (!r.ok || !r.body) throw new Error(`Tải yt-dlp lỗi (${r.status})`);
  const total = Number(r.headers.get("content-length")) || 0, chunks = [];
  let got = 0;
  for await (const c of r.body) { chunks.push(c); got += c.length; onProgress({ phase: `Đang tải yt-dlp (${Math.round(got / 1048576)}/${Math.round(total / 1048576) || "?"} MB)…`, pct: total ? Math.round((got / total) * 100) : 0 }); }
  fs.writeFileSync(out, Buffer.concat(chunks));
  if (process.platform !== "win32") { fs.chmodSync(out, 0o755); try { execSync(`xattr -d com.apple.quarantine "${out}"`, { stdio: "ignore" }); } catch {} }
  onProgress({ phase: "Đã cài yt-dlp", pct: 100 });
  return out;
}

export function systemStatus(root) {
  const w = whisperStatus(root);
  return {
    platform: process.platform === "win32" ? "win" : process.platform === "darwin" ? "mac" : "linux",
    arch: process.arch,
    node: process.versions.node,
    ffmpeg: has("ffmpeg"), ffprobe: has("ffprobe"),
    whisper: w,
    brew: process.platform === "darwin" ? !!brewBin() : null,
  };
}

// macOS: cài công cụ nhận giọng bằng Homebrew (người dùng bấm nút → đồng ý). onLine(log)
export function brewInstall(pkgs, onLine = () => {}) {
  return new Promise((ok, bad) => {
    const brew = brewBin();
    if (!brew) return bad(new Error("Máy chưa có Homebrew. Cài tại https://brew.sh rồi thử lại."));
    const ch = spawn(brew, ["install", ...pkgs], { env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: "1" } });
    const feed = (d) => d.toString().split(/\r?\n/).forEach((l) => l && onLine(l));
    ch.stdout.on("data", feed); ch.stderr.on("data", feed);
    ch.on("error", bad);
    ch.on("close", (c) => (c === 0 ? ok() : bad(new Error(`brew install lỗi (mã ${c})`))));
  });
}
