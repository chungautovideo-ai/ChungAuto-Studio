#!/usr/bin/env node
// Mở phần mềm (server editor) chạy tách khỏi cửa sổ AI / Terminal, đợi tới khi http://127.0.0.1:5173 trả lời rồi mới báo.
//   node editor/tools/mo-phan-mem.mjs          → đang chạy thì thôi, chưa chạy thì bật
//   node editor/tools/mo-phan-mem.mjs --im-lang → không in gì (hook đầu phiên)
// Codex chạy lệnh trong hộp cát: tiến trình mở cổng / chạy tiếp sau khi lệnh xong bị chặn → lệnh báo lỗi kèm cách xử lý.
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const quiet = process.argv.includes("--im-lang");
const say = (s) => { if (!quiet) console.log(s); };
const alive = async () => { try { return (await fetch("http://127.0.0.1:5173/home", { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };

const LOG = path.join(ROOT, "workspace", "tmp", "phan-mem.log");
let out = "ignore";
try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); out = fs.openSync(LOG, "a"); } catch {}
// --giu: tiến trình giữ phần mềm (chạy tách riêng) — phần mềm thoát mã 75 (khởi động lại / sau cập nhật) thì bật lại, như Mo-Editor.bat
if (process.argv.includes("--giu")) {
  const run = () => { const t0 = Date.now(); spawn(process.execPath, [path.join(ROOT, "editor", "server.mjs"), "--home"], { cwd: ROOT, windowsHide: true, stdio: ["ignore", out, out] })
    // tắt đột ngột sau khi đã chạy ổn cũng bật lại; lỗi ngay lúc mở (trùng cổng...) thì dừng, không lặp vô hạn
    .on("exit", (code) => { if (code === 75 || (code && Date.now() - t0 > 10000)) run(); else process.exit(code || 0); }); };
  run();
} else {
if (await alive()) {
  say("✓ Phần mềm đang chạy: http://127.0.0.1:5173/ — mở https://autosocial.topexpert.vn/app bằng Chrome hoặc trình duyệt của AI (xem AGENTS.md).");
  process.exit(0);
}
try {
  spawn(process.execPath, [fileURLToPath(import.meta.url), "--giu"], {
    cwd: ROOT, detached: true, windowsHide: true, stdio: "ignore",
  }).unref();
} catch (e) {
  say(`✗ Không bật được phần mềm: ${e.message}`);
}
if (quiet) process.exit(0); // hook đầu phiên: không đợi
for (let i = 0; i < 50; i++) { // bản treo giữ cổng cần ~15 giây để phát hiện và thay
  await new Promise((r) => setTimeout(r, 500));
  if (await alive()) {
    say("✓ Đã mở phần mềm: http://127.0.0.1:5173/ — mở https://autosocial.topexpert.vn/app bằng Chrome hoặc trình duyệt của AI (xem AGENTS.md).");
    process.exit(0);
  }
}
say(`✗ Phần mềm chưa lên (xem ${path.relative(ROOT, LOG)}).
  · Codex: hộp cát của Codex chặn chạy phần mềm → chạy lại ĐÚNG lệnh này với quyền ngoài hộp cát
    (yêu cầu quyền nâng cao / require_escalated, lý do: "mở phần mềm Video Edit Kit trên máy"), người dùng bấm Cho phép.
  · Hoặc nhờ người dùng bấm đúp Mo-Editor.bat (Windows) / Mo-Editor.command (macOS) trong thư mục phần mềm,
    rồi bật “Luôn chạy nền” ở góc dưới menu trái để lần sau AI không cần mở nữa.`);
process.exit(1);
}
