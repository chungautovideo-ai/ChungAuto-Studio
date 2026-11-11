#!/usr/bin/env node
// Hook SessionStart của Claude Code (.claude/settings.json): mỗi phiên mở trong thư mục phần mềm → nhắc Claude
// bật lệnh chờ việc từ editor (chạy nền), để bấm "AI edit" là Claude làm ngay trong khung chat — người dùng theo dõi được.
// Có việc đang chờ sẵn thì nhắc nhận luôn.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WS = path.join(ROOT, "workspace", "content");
// mở phiên AI trong thư mục phần mềm → bật luôn phần mềm (hook chạy ngoài hộp cát của AI, không đợi)
try { spawnSync(process.execPath, [path.join(ROOT, "editor", "tools", "mo-phan-mem.mjs"), "--im-lang"], { stdio: "ignore", timeout: 5000, windowsHide: true }); } catch {}
const waiting = [];
try {
  for (const day of fs.readdirSync(WS)) for (const p of fs.readdirSync(path.join(WS, day))) {
    const f = path.join(WS, day, p, "work", "ai-job.json");
    try { const j = JSON.parse(fs.readFileSync(f, "utf8")); if (j.status === "waiting") waiting.push(`workspace/content/${day}/${p}`); } catch {}
  }
} catch {}
const lines = [
  "Video Edit Kit: chạy NỀN ngay bây giờ (không chờ kết thúc): node editor/tools/ai-inbox.mjs --wait --agent claude",
  "Lệnh này tự thoát khi người dùng bấm \"AI edit\" trong phần mềm và in hướng dẫn → làm đúng theo đó NGAY TRONG PHIÊN NÀY (người dùng theo dõi được), xong thì chạy lại lệnh chờ (nền).",
];
if (waiting.length) lines.push(`Đang có ${waiting.length} việc chờ sẵn (${waiting.join(", ")}) → nói ngắn cho người dùng biết rồi chạy: node editor/tools/ai-inbox.mjs --next --agent claude và làm luôn.`);
// máy không có Node: hook chạy bằng Node của phần mềm → hướng dẫn ghi đúng đường dẫn đó
if (/[\\/]tools[\\/]node[\\/]/.test(process.execPath)) for (let i = 0; i < lines.length; i++) lines[i] = lines[i].replace(/(^|[\s:])node (?=editor\/)/g, `$1${process.platform === "win32" ? "tools\\node\\node.exe" : "tools/node/bin/node"} `);
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lines.join("\n") } }));
