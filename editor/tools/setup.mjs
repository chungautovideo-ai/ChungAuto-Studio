#!/usr/bin/env node
// Cài đặt tự động mọi thứ phần mềm cần (Windows / macOS) — người dùng không phải làm tay.
// Thường được gọi qua cai-dat.ps1 (Windows) / cai-dat.sh (macOS) — 2 file đó lo phần Node.js.
//
//   node editor/tools/setup.mjs            cài phần còn thiếu
//   node editor/tools/setup.mjs --check    chỉ kiểm tra, in trạng thái (JSON)
//   node editor/tools/setup.mjs --khong-mo cài xong không bật chạy nền, không mở trình duyệt
//
// Các bước: thư viện editor → ffmpeg → công cụ nhận giọng + model → Chrome dựng video → .env
// Mọi thứ tải về nằm trong thư mục phần mềm (tools/, editor/node_modules) — không cần quyền admin.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareTools, installFfmpeg, systemStatus, ytdlpPath, installYtdlp } from "../lib/system.mjs";
import { whisperStatus, installWhisper, whisperPaths } from "../lib/whisper.mjs";
import { WEB_APP, moLink } from "../lib/mo-link.mjs";
import { HF } from "../lib/hf.mjs";

const EDITOR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(EDITOR, "..");
const WIN = process.platform === "win32", MAC = process.platform === "darwin";
const args = process.argv.slice(2);
const MARK = path.join(ROOT, "tools", ".setup-done.json");

const step = (n, t) => console.log(`\n[${n}/5] ${t}`);
const ok = (t) => console.log(`  ✓ ${t}`);
const warn = (t) => console.log(`  ! ${t}`);
const bar = (() => { let last = -10; return (p) => { if (p.pct - last >= 10 || p.pct >= 100) { last = p.pct; console.log(`    ${String(p.pct).padStart(3)}%  ${p.phase}`); } }; })();
function run(cmd, argv, opts = {}) {
  return new Promise((res, rej) => {
    const o = { stdio: "inherit", shell: WIN, ...opts };
    // Có shell thì ghép thành 1 chuỗi (tránh cảnh báo DEP0190 của Node khi truyền mảng tham số)
    const q = (a) => (/[\s"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
    const ch = o.shell ? spawn([cmd, ...argv].map(q).join(" "), o) : spawn(cmd, argv, o);
    ch.on("error", rej);
    ch.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} ${argv.join(" ")} → mã lỗi ${c}`))));
  });
}
const has = (c) => { try { execSync(c, { stdio: "ignore" }); return true; } catch { return false; } };

if (args.includes("--check")) {
  prepareTools(ROOT);
  console.log(JSON.stringify({ ...systemStatus(ROOT), deps: fs.existsSync(path.join(EDITOR, "node_modules")), ytdlp: fs.existsSync(ytdlpPath(ROOT)), setupDone: fs.existsSync(MARK) }, null, 2));
  process.exit(0);
}

console.log(`Cài đặt Video Edit Kit — ${WIN ? "Windows" : MAC ? "macOS" : process.platform} ${process.arch}, Node ${process.versions.node}`);
const problems = [];

// 1) Thư viện editor
step(1, "Thư viện phần mềm");
if (fs.existsSync(path.join(EDITOR, "node_modules", "@anthropic-ai"))) ok("đã có");
else {
  try { await run(WIN ? "npm.cmd" : "npm", ["install", "--omit=dev", "--no-audit", "--no-fund"], { cwd: EDITOR }); ok("đã cài"); }
  catch (e) { problems.push("Thư viện editor: " + e.message); warn(e.message); }
}

// 2) ffmpeg (máy có sẵn thì dùng, không thì tải bản dựng sẵn ~40–60MB)
step(2, "ffmpeg (xử lý video)");
if (prepareTools(ROOT).ffmpeg && prepareTools(ROOT).ffprobe) ok("đã có");
else {
  try { await installFfmpeg(ROOT, bar); ok("đã cài vào tools/ffmpeg"); }
  catch (e) { problems.push("ffmpeg: " + e.message); warn(e.message); }
}

// 3) Công cụ nhận giọng (whisper) + model
step(3, "Nhận giọng nói tiếng Việt (whisper)");
async function macWhisper() {
  const brew = ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"].find((f) => fs.existsSync(f));
  if (brew) { console.log("    cài bằng Homebrew…"); await run(brew, ["install", "whisper-cpp"], { env: { ...process.env, HOMEBREW_NO_AUTO_UPDATE: "1" } }); return; }
  // Không có Homebrew → tự dựng whisper.cpp từ mã nguồn (cần Command Line Tools của Apple)
  if (!has("xcode-select -p") || !has("clang --version")) {
    try { execSync("xcode-select --install", { stdio: "ignore" }); } catch {}
    throw new Error("Cần Command Line Tools của Apple: một hộp thoại vừa hiện ra → bấm Install, đợi xong rồi chạy lại cài đặt.");
  }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "vek-whisper-"));
  const ver = "1.9.5";
  console.log("    tải mã nguồn whisper.cpp + CMake…");
  execSync(`curl -fsSL https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v${ver}.tar.gz | tar xz -C "${work}"`, { stdio: "inherit" });
  let cmake = has("cmake --version") ? "cmake" : "";
  if (!cmake) {
    const cm = "3.30.5";
    execSync(`curl -fsSL https://github.com/Kitware/CMake/releases/download/v${cm}/cmake-${cm}-macos-universal.tar.gz | tar xz -C "${work}"`, { stdio: "inherit" });
    cmake = path.join(work, `cmake-${cm}-macos-universal`, "CMake.app", "Contents", "bin", "cmake");
  }
  const src = path.join(work, `whisper.cpp-${ver}`);
  console.log("    dựng whisper-cli (2–4 phút)…");
  execSync(`"${cmake}" -S "${src}" -B "${src}/build" -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DGGML_METAL_EMBED_LIBRARY=ON -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF`, { stdio: "inherit" });
  execSync(`"${cmake}" --build "${src}/build" --config Release -j --target whisper-cli`, { stdio: "inherit" });
  const out = path.join(ROOT, "tools", "whisper", "bin");
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(path.join(src, "build", "bin", "whisper-cli"), path.join(out, "whisper-cli"));
  fs.chmodSync(path.join(out, "whisper-cli"), 0o755);
  fs.rmSync(work, { recursive: true, force: true });
}
try {
  let st = whisperStatus(ROOT);
  if (st.ready) ok("đã có");
  else {
    if (!st.bin && MAC) await macWhisper();
    await installWhisper(ROOT, bar); // Windows: tải công cụ + model; macOS: tải model
    st = whisperStatus(ROOT);
    st.ready ? ok(`đã cài (${path.basename(whisperPaths(ROOT).model)})`) : (problems.push("whisper chưa sẵn sàng"), warn("whisper chưa sẵn sàng"));
  }
} catch (e) { problems.push("Nhận giọng: " + e.message); warn(e.message); }

// 3b) yt-dlp — tải video công khai cho Phân tích kênh (không có cũng không sao: AI xem trong trình duyệt)
if (fs.existsSync(ytdlpPath(ROOT))) ok("yt-dlp (phân tích kênh): đã có");
else {
  try { await installYtdlp(ROOT, bar); ok("yt-dlp (phân tích kênh): đã cài vào tools/yt-dlp"); }
  catch (e) { warn("yt-dlp: " + e.message + " — Phân tích kênh vẫn chạy, chỉ không nghe được lời thoại."); }
}

// 4) Chrome để dựng video (HyperFrames tự tải bản riêng, không đụng Chrome của bạn)
step(4, "Trình dựng video (HyperFrames + Chrome)");
try { await run(WIN ? "npx.cmd" : "npx", ["--yes", HF, "browser", "ensure"], { cwd: ROOT }); ok("sẵn sàng"); }
catch (e) { problems.push("HyperFrames: " + e.message); warn(e.message + " — sẽ tự thử lại lần xuất video đầu tiên."); }

// 5) .env
step(5, "Cấu hình");
const env = path.join(ROOT, ".env"), example = path.join(ROOT, ".env.example");
if (!fs.existsSync(env) && fs.existsSync(example)) { fs.copyFileSync(example, env); ok("đã tạo .env từ .env.example"); } else ok("đã có .env");
// Nhạc nền + SFX tổng hợp ngay trên máy (không đóng gói để file tải về nhẹ)
if (!fs.existsSync(path.join(EDITOR, "assets", "music", "beat-bass.wav"))) {
  try { await run(process.execPath, [path.join(EDITOR, "tools", "make-sfx.mjs")], { shell: false }); ok("đã tạo nhạc nền"); }
  catch (e) { problems.push("Nhạc nền: " + e.message); warn(e.message); }
} else ok("đã có nhạc nền");

fs.mkdirSync(path.dirname(MARK), { recursive: true });
fs.writeFileSync(MARK, JSON.stringify({ at: new Date().toISOString(), platform: process.platform, arch: process.arch, problems }, null, 2));
// Cài xong là dùng được ngay, không phụ thuộc cửa sổ AI: bật chạy nền, đợi phần mềm lên rồi mới mở trang web
const phanMemLen = async () => { try { return (await fetch("http://127.0.0.1:5173/home", { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };
const chayTool = (ten, a = []) => run(process.execPath, [path.join(EDITOR, "tools", ten), ...a], { shell: false }).then(() => true, () => false);
if (!args.includes("--khong-mo")) {
  console.log("\n[Xong] Bật chạy nền và mở phần mềm");
  const nen = await chayTool("chay-nen.mjs", ["--bat"]);
  if (!nen) warn("chưa bật được chạy nền, mở phần mềm cách thường");
  let len = false;
  for (let i = 0; i < 20 && !len; i++) { len = await phanMemLen(); if (!len) await new Promise((r) => setTimeout(r, 1000)); }
  if (!len) len = await chayTool("mo-phan-mem.mjs");
  if (len) { try { moLink(WEB_APP); ok("đã mở " + WEB_APP); } catch { warn("chưa mở được trình duyệt, tự mở link bên dưới"); } }
  else warn("phần mềm chưa lên");
}
console.log(problems.length
  ? `\n⚠ Xong nhưng còn ${problems.length} việc:\n - ${problems.join("\n - ")}\n\nMở phần mềm: https://autosocial.topexpert.vn/app`
  : `\n✓ Cài đặt xong.\n\nMở phần mềm: https://autosocial.topexpert.vn/app\nTrang báo máy chưa chạy phần mềm thì ${WIN ? "bấm đúp Mo-Editor.bat" : "bấm đúp Mo-Editor.command"} rồi tải lại trang.\n\n[AI] Tin nhắn báo xong trong khung chat phải ghi nguyên đường dẫn https://autosocial.topexpert.vn/app dạng bấm được, kể cả khi không mở được trình duyệt.`);
process.exit(problems.length ? 1 : 0);
