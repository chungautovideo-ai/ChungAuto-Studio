#!/usr/bin/env node
// Mở AutoSocial: phần mềm chưa chạy thì bật (chạy tách riêng, tự bật lại), rồi mở bản web trong Chrome.
// Biểu tượng Desktop / Start gọi lệnh này qua AutoSocial.vbs.
//   node editor/tools/mo-app.mjs
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { linkMo, moLink } from "../lib/mo-link.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const URL = "http://127.0.0.1:5173/";
const LOG = path.join(ROOT, "workspace", "tmp", "mo-app.log");
const log = (s) => { try { fs.mkdirSync(path.dirname(LOG), { recursive: true }); fs.appendFileSync(LOG, `${new Date().toISOString()} ${s}\n`); } catch {} };
const alive = async () => { try { return (await fetch(URL + "home", { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };

if (!(await alive())) {
  log("bật phần mềm");
  spawn(process.execPath, [path.join(ROOT, "editor", "tools", "mo-phan-mem.mjs"), "--giu"], { cwd: ROOT, detached: true, windowsHide: true, stdio: "ignore" }).unref();
  let ok = false;
  for (let i = 0; i < 60 && !ok; i++) { await new Promise((r) => setTimeout(r, 500)); ok = await alive(); }
  if (!ok) log("phần mềm chưa lên sau 30s — vẫn mở cửa sổ (trang tự báo lỗi kết nối)");
}

const link = await linkMo(URL);
log(`mở ${link}`);
moLink(link);
setTimeout(() => process.exit(0), 300);
