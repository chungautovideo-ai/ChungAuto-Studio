// Nhận giọng nói tiếng Việt ngay trong phần mềm (whisper.cpp chạy trên máy, không gửi âm thanh đi đâu).
//
//   tools/whisper/bin/…/whisper-cli(.exe)   công cụ nhận giọng (bản chính thức ggml-org/whisper.cpp)
//   tools/whisper/<model>.bin               model (mặc định large-v3-turbo-q5_0, ~550MB, tải 1 lần)
//
// Ghi lời nói từng từ vào <project>/work/transcript.json  { words: [{ word, start, end }] }.
// Biến môi trường (tuỳ chọn): HYPERFRAMES_WHISPER_PATH (đường dẫn whisper-cli), WHISPER_MODEL (đường dẫn model).

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import {waitForAsrLock} from '../../src/services/asr-lock.mjs';
import { unzip } from "./zip.mjs";
import { docTuDien, promptArgs, suaChu } from "./sua-chu-asr.mjs";

export const WHISPER_RELEASE = "b5454";
export const MODEL_NAME = "ggml-large-v3-turbo-q5_0.bin";
const BIN_URL = `https://github.com/ggml-org/whisper.cpp/releases/download/${WHISPER_RELEASE}/whisper-bin-x64.zip`;
const MODEL_URL = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL_NAME}`;
const MODEL_BYTES = 574041195;

export function whisperPaths(root) {
  const dir = path.join(root, "tools", "whisper");
  const exe = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
  const local = [path.join(dir, "bin", "Release", exe), path.join(dir, "bin", exe), path.join(dir, exe),
    // macOS / Linux: brew install whisper-cpp (Apple Silicon /opt/homebrew, Intel /usr/local); bản cũ tên whisper-cpp
    ...(process.platform === "win32" ? [] : ["/opt/homebrew/bin/whisper-cli", "/usr/local/bin/whisper-cli", "/opt/homebrew/bin/whisper-cpp", "/usr/local/bin/whisper-cpp"])]
    .find((f) => fs.existsSync(f));
  return {
    dir,
    bin: process.env.HYPERFRAMES_WHISPER_PATH || local || findOnPath(exe) || (process.platform === "win32" ? "" : findOnPath("whisper-cpp")),
    model: process.env.WHISPER_MODEL || path.join(dir, MODEL_NAME),
  };
}
function findOnPath(exe) {
  for (const p of String(process.env.PATH || "").split(path.delimiter)) {
    const f = path.join(p, exe);
    if (p && fs.existsSync(f)) return f;
  }
  return "";
}

export function whisperStatus(root) {
  const p = whisperPaths(root);
  const binOk = !!p.bin && fs.existsSync(p.bin), modelOk = fs.existsSync(p.model);
  return {
    ready: binOk && modelOk, bin: binOk, model: modelOk,
    // Tự cài được trên Windows; macOS / Linux: brew install whisper-cpp (chỉ cần tải model)
    canInstallBin: process.platform === "win32",
    downloadMB: Math.round(((binOk ? 0 : 9e6) + (modelOk ? 0 : MODEL_BYTES)) / 1048576),
  };
}

async function download(url, dest, onBytes) {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok || !r.body) throw new Error(`Tải thất bại (${r.status}): ${url}`);
  const total = Number(r.headers.get("content-length")) || 0;
  const tmp = dest + ".part";
  const ws = fs.createWriteStream(tmp);
  let got = 0;
  for await (const chunk of r.body) {
    got += chunk.length;
    if (!ws.write(chunk)) await new Promise((ok) => ws.once("drain", ok));
    onBytes?.(got, total);
  }
  await new Promise((ok, bad) => ws.end((e) => (e ? bad(e) : ok())));
  fs.renameSync(tmp, dest);
}

// Cài whisper: tải công cụ (Windows) + model. onProgress({ phase, pct })
export async function installWhisper(root, onProgress = () => {}) {
  const p = whisperPaths(root);
  fs.mkdirSync(p.dir, { recursive: true });
  if (!p.bin || !fs.existsSync(p.bin)) {
    if (process.platform !== "win32") throw new Error("Trên macOS/Linux hãy cài công cụ bằng: brew install whisper-cpp (rồi bấm lại).");
    onProgress({ phase: "Đang tải công cụ nhận giọng…", pct: 0 });
    const zipFile = path.join(p.dir, "whisper-bin-x64.zip");
    await download(BIN_URL, zipFile, (g, t) => onProgress({ phase: "Đang tải công cụ nhận giọng…", pct: t ? Math.round((g / t) * 5) : 0 }));
    for (const f of unzip(fs.readFileSync(zipFile))) {
      if (f.name.endsWith("/")) continue;
      const out = path.join(p.dir, "bin", f.name);
      if (!out.startsWith(path.join(p.dir, "bin"))) continue; // chống đường dẫn lạ trong zip
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, f.data);
    }
    fs.rmSync(zipFile, { force: true });
  }
  if (!fs.existsSync(p.model)) {
    await download(MODEL_URL, p.model, (g, t) => onProgress({ phase: `Đang tải model nhận giọng (${Math.round(g / 1048576)}/${Math.round((t || MODEL_BYTES) / 1048576)} MB)…`, pct: 5 + Math.round((g / (t || MODEL_BYTES)) * 95) }));
  }
  onProgress({ phase: "Đã cài xong", pct: 100 });
  return whisperStatus(root);
}

function run(cmd, args, onLine, timeoutMs=0, cwd, signal) {
  return new Promise((ok, bad) => {
    const ch = spawn(cmd, args, { windowsHide: true, ...(cwd?{cwd}:{}),...(signal?{signal}:{}) });
    let expired=false;const timer=timeoutMs>0?setTimeout(()=>{expired=true;ch.kill();},timeoutMs):null;
    let err = "";
    const feed = (d) => { const s = d.toString(); err = (err + s).slice(-4000); s.split(/\r?\n/).forEach((l) => l && onLine?.(l)); };
    ch.stdout.on("data", feed);
    ch.stderr.on("data", feed);
    let failure;
    ch.on("error", error=>{failure=error;});
    ch.on("close", (code) => {clearTimeout(timer);failure?bad(failure):expired?bad(new Error('Nhận giọng vượt thời gian cho phép.')):code === 0 ? ok() : bad(new Error(err.trim().split("\n").slice(-3).join(" ") || `mã lỗi ${code}`));});
  });
}

// Nhận giọng 1 video → danh sách từ có mốc thời gian (giây của video gốc).
// maxSec: chỉ nghe N giây đầu (phân tích kênh: hook + phần chính là đủ, nhanh hơn nhiều với clip dài)
export async function transcribe(root,video,outFile,options={}){
 if(!whisperStatus(root).ready)throw new Error('Chưa cài công cụ nhận giọng.');
 const lock=await waitForAsrLock(root,{signal:options.signal,validate:options.validate,onWait:()=>options.onProgress?.({phase:'Đang chờ lượt nhận giọng trên máy…',pct:0,waitingResource:true})});
 try{options.validate?.();options.signal?.throwIfAborted();return await transcribeUnlocked(root,video,outFile,{...options,onProgress:progress=>options.onProgress?.({...progress,waitingResource:false})});}finally{lock.release();}
}
async function transcribeUnlocked(root, video, outFile, { language = "vi", onProgress = () => {}, maxSec = 0, timeoutMs=0, signal, vocabulary = true } = {}) {
  signal?.throwIfAborted();
  const st = whisperStatus(root);
  if (!st.ready) throw new Error("Chưa cài công cụ nhận giọng.");
  const p = whisperPaths(root);
  const tuDien = vocabulary ? docTuDien(root) : {}; // vocabulary:false khi nghe kênh người khác
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vek-asr-"));
  try {
    onProgress({ phase: "Đang tách âm thanh…", pct: 2 });
    const wav = path.join(tmp, "audio.wav");
    await run("ffmpeg", ["-v", "error", "-y", "-i", video, ...(maxSec > 0 ? ["-t", String(maxSec)] : []), "-vn", "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav],null,timeoutMs,undefined,signal);
    onProgress({ phase: "Đang nghe lời nói…", pct: 5 });
    const threads = String(Math.max(2, Math.min(8, os.cpus().length - 1)));
    // -ml 1 -sow: mỗi đoạn kết quả là 1 từ (tách theo khoảng trắng) → có mốc bắt đầu/kết thúc từng từ
    // Native Windows CLI builds can decode non-ASCII argv using the system
    // code page. Resolve model and scratch arguments relative to Unicode cwd;
    // scratch on the installation drive must not repeat the accented root.
    const modelDirectory = path.dirname(path.resolve(p.model));
    const nativePath = file => path.relative(modelDirectory, path.resolve(file));
    await run(path.resolve(p.bin), ["-m", path.basename(p.model), "-f", nativePath(wav), "-l", language, "-ml", "1", "-sow", "-oj", "-of", nativePath(path.join(tmp, "out")), "-t", threads, "-pp", ...promptArgs(tuDien, language)], (l) => {
      const m = l.match(/progress\s*=\s*(\d+)%/);
      if (m) onProgress({ phase: "Đang nghe lời nói…", pct: 5 + Math.round(Number(m[1]) * 0.93) });
    },timeoutMs,modelDirectory,signal);
    signal?.throwIfAborted();
    const j = JSON.parse(fs.readFileSync(path.join(tmp, "out.json"), "utf8"));
    const words = [];
    for (const s of j.transcription || []) {
      const text = String(s.text || "");
      const w = text.trim().normalize("NFC");
      if (!w || /^\[.*\]$/.test(w)) continue; // bỏ nhãn [Âm nhạc]…
      const start = (s.offsets?.from ?? 0) / 1000, end = (s.offsets?.to ?? 0) / 1000;
      const prev = words[words.length - 1];
      // mảnh không có khoảng trắng đầu = phần tiếp của từ trước (dấu câu, âm tiết bị tách)
      if (prev && !/^\s/.test(text)) { prev.word += w; prev.end = Math.max(prev.end, end); continue; }
      words.push({ word: w, start: Math.round(start * 1000) / 1000, end: Math.round(Math.max(end, start + 0.05) * 1000) / 1000 });
    }
    const fixed = language === "en" ? { words, fixes: [] } : suaChu(words, tuDien);
    const data = { engine: "whisper.cpp", model: path.basename(p.model), language, createdAt: new Date().toISOString(), words: fixed.words, ...(fixed.fixes.length ? { textFixes: fixed.fixes } : {}) };
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, JSON.stringify(data, null, 1));
    onProgress({ phase: `Xong — ${words.length} từ`, pct: 100 });
    return data;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
