// Mở link cho người dùng: ưu tiên Chrome thường (giữ đăng nhập website), không có thì trình duyệt mặc định.
import fs from "node:fs";
import path from "node:path";
import { execSync, spawn } from "node:child_process";

export const WEB_APP = "https://autosocial.topexpert.vn/app";

// link người dùng nên mở: bản web, mất mạng thì địa chỉ trên máy
export async function linkMo(local) {
  try { if ((await fetch(WEB_APP, { method: "HEAD", signal: AbortSignal.timeout(3000) })).ok) return WEB_APP; } catch {}
  return local;
}

export function moLink(link) {
  if (process.platform === "win32") {
    const dirs = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA].filter(Boolean);
    const chrome = dirs.map((d) => path.join(d, "Google", "Chrome", "Application", "chrome.exe")).find((f) => fs.existsSync(f));
    if (chrome) { spawn(chrome, [link], { detached: true, stdio: "ignore", windowsHide: true }).unref(); return; }
    try { execSync(`start "" "${link}"`, { stdio: "ignore", shell: true }); } catch {}
    return;
  }
  if (process.platform === "darwin") {
    try { execSync(`open -a "Google Chrome" "${link}"`, { stdio: "ignore" }); return; } catch {}
    try { execSync(`open "${link}"`, { stdio: "ignore" }); } catch {}
    return;
  }
  try { execSync(`xdg-open "${link}"`, { stdio: "ignore" }); } catch {}
}
