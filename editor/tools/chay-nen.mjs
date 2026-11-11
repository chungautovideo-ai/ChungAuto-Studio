#!/usr/bin/env node
// Cho phần mềm LUÔN chạy nền (không phụ thuộc cửa sổ AI / Terminal): tự chạy khi đăng nhập máy, tự bật lại khi bị tắt hoặc sau khi cập nhật.
//   node editor/tools/chay-nen.mjs --bat     bật (và chạy ngay)
//   node editor/tools/chay-nen.mjs --tat     tắt (gỡ khỏi khởi động cùng máy)
//   node editor/tools/chay-nen.mjs           xem trạng thái
// macOS: LaunchAgent ~/Library/LaunchAgents/vn.videoeditkit.editor.plist · Windows: tệp ẩn trong thư mục Startup
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NODE = process.execPath;
const LOGDIR = path.join(ROOT, "workspace", "tmp");
const mode = process.argv.includes("--bat") ? "bat" : process.argv.includes("--tat") ? "tat" : "xem";
const sh = (c) => { try { return execSync(c, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return ""; } };
const alive = async () => { try { return (await fetch("http://127.0.0.1:5173/home", { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };

if (process.platform === "darwin") {
  const LABEL = "vn.videoeditkit.editor";
  const PL = path.join(os.homedir(), "Library", "LaunchAgents", `${LABEL}.plist`);
  const uid = process.getuid();
  if (mode === "bat") {
    fs.mkdirSync(path.dirname(PL), { recursive: true });
    fs.mkdirSync(LOGDIR, { recursive: true });
    const x = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
    fs.writeFileSync(PL, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key><array><string>${x(NODE)}</string><string>${x(path.join(ROOT, "editor", "server.mjs"))}</string><string>--home</string></array>
  <key>WorkingDirectory</key><string>${x(ROOT)}</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>${x(path.join(ROOT, "tools", "node", "bin"))}:${x(path.join(ROOT, "tools", "bin"))}:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>5</integer>
  <key>StandardOutPath</key><string>${x(path.join(LOGDIR, "phan-mem.log"))}</string>
  <key>StandardErrorPath</key><string>${x(path.join(LOGDIR, "phan-mem.log"))}</string>
</dict></plist>
`);
    sh(`launchctl bootout gui/${uid} "${PL}"`);
    sh(`launchctl bootstrap gui/${uid} "${PL}"`) || sh(`launchctl load -w "${PL}"`);
  } else if (mode === "tat") {
    sh(`launchctl bootout gui/${uid} "${PL}"`) || sh(`launchctl unload -w "${PL}"`);
    fs.rmSync(PL, { force: true });
  }
  const on = fs.existsSync(PL);
  // Thư mục phần mềm trong Desktop / Documents / Downloads / iCloud Drive → mỗi lần bật máy macOS hỏi quyền truy cập (iCloud) cho tiến trình chạy nền
  const H = os.homedir(), cloud = ["Desktop", "Documents", "Downloads", path.join("Library", "Mobile Documents")].find((d) => (ROOT + path.sep).startsWith(path.join(H, d) + path.sep));
  if (on && cloud) console.log(`⚠ Thư mục phần mềm đang nằm trong ~/${cloud} (được iCloud đồng bộ) → macOS sẽ hỏi quyền truy cập iCloud / thư mục mỗi lần bật máy. Nên chuyển cả thư mục phần mềm sang thư mục nhà (vd ~/VideoEditKit) rồi bật lại “Luôn chạy nền”.`);
  await new Promise((r) => setTimeout(r, mode === "bat" ? 2500 : 0));
  console.log(on ? `✓ Phần mềm chạy nền: BẬT (tự chạy khi đăng nhập máy, tự bật lại) — ${(await alive()) ? "đang chạy" : "đang khởi động"} tại http://127.0.0.1:5173/` : "Phần mềm chạy nền: TẮT");
} else if (process.platform === "win32") {
  const STARTUP = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
  const VBS = path.join(STARTUP, "Video Edit Kit.vbs");
  const BAT = path.join(ROOT, "workspace", "tmp", "chay-nen.bat");
  // AI mở phần mềm ở chế độ bảo vệ (Codex sandbox) / phần mềm diệt virus có thể chặn ghi vào Startup → dùng khoá Run của Windows
  const VBS2 = path.join(LOGDIR, "chay-nen.vbs");
  const RUN = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
  const regOn = () => /Video Edit Kit/.test(sh(`reg query "${RUN}" /v "Video Edit Kit"`));
  const isOn = () => fs.existsSync(VBS) || regOn();
  if (mode === "bat") {
    fs.mkdirSync(LOGDIR, { recursive: true });
    // vòng lặp: thoát vì cổng đã có phần mềm khác chạy (mã 0) → dừng; còn lại (cập nhật 75, lỗi) → chạy lại sau 3 giây
    fs.writeFileSync(BAT, `@echo off\r\nchcp 65001 >nul\r\ncd /d "${ROOT}"\r\nset "PATH=${path.dirname(NODE)};${path.join(ROOT, "tools", "bin")};%PATH%"\r\n:loop\r\n"${NODE}" editor\\server.mjs --home >> "${path.join(LOGDIR, "phan-mem.log")}" 2>&1\r\nif %errorlevel%==0 goto :eof\r\ntimeout /t 3 /nobreak >nul\r\ngoto loop\r\n`, "utf8");
    const vbs = `CreateObject("WScript.Shell").Run """${BAT}""", 0, False\r\n`;
    let run = VBS;
    try { fs.mkdirSync(STARTUP, { recursive: true }); fs.writeFileSync(VBS, vbs, "utf8"); }
    catch {
      fs.writeFileSync(VBS2, vbs, "utf8");
      run = VBS2;
      sh(`reg add "${RUN}" /v "Video Edit Kit" /t REG_SZ /d "wscript.exe \\"${VBS2}\\"" /f`);
      if (!regOn()) {
        console.log("✗ Máy đang chặn bật chạy nền: phần mềm đang được mở bên trong AI (Codex) ở chế độ bảo vệ, không được ghi vào mục tự khởi động của Windows.\n" +
          "Cách bật: đóng phần mềm, bấm đúp Mo-Editor.bat trong thư mục phần mềm rồi bật lại công tắc \"Luôn chạy nền\".");
        process.exit(3);
      }
    }
    if (!(await alive())) { try { spawn("wscript.exe", [run], { detached: true, stdio: "ignore", windowsHide: true }).unref(); } catch {} }
  } else if (mode === "tat") {
    try { fs.rmSync(VBS, { force: true }); } catch {}
    if (regOn()) sh(`reg delete "${RUN}" /v "Video Edit Kit" /f`);
  }
  await new Promise((r) => setTimeout(r, mode === "bat" ? 2500 : 0));
  console.log(isOn() ? `✓ Phần mềm chạy nền: BẬT (tự chạy khi bật máy, tự bật lại) — ${(await alive()) ? "đang chạy" : "đang khởi động"} tại http://127.0.0.1:5173/` : "Phần mềm chạy nền: TẮT");
} else {
  console.log("Chỉ hỗ trợ macOS và Windows.");
}
