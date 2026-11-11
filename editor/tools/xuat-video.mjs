#!/usr/bin/env node
// Xuất video của 1 dự án (AI chạy khi người dùng bấm "Xuất video" trong editor).
// Tiến độ ghi vào <dự án>/work/render.json → editor đọc lại được kể cả khi tải lại trang.
//   node editor/tools/xuat-video.mjs <thư mục dự án> [--quality final|draft]
// In ra dòng cuối: SAVED <đường dẫn file đã lưu>
import {plateReviewStatus,assertReviewedSnapshot} from '../../src/services/plate-review.mjs';
import fs from "node:fs";
import path from "node:path";
import { spawn, execSync } from "node:child_process";
import { spawnShellSafe } from "../../src/services/unc-spawn.mjs";
import { fileURLToPath } from "node:url";
import {createRenderSnapshot} from "../../src/services/render-snapshots.mjs";
import {finalizeRenderArtifact} from "../../src/services/render-artifacts.mjs";
import {registerRenderRun} from '../../src/services/render-run-registry.mjs';
import {waitForRenderLock} from '../../src/services/render-lock.mjs';
import {assertProjectRevision} from '../../src/services/project-revisions.mjs';
import {renderEnvironment} from '../../src/services/render-environment.mjs';
import {hyperframesCommand} from '../../src/services/hyperframes-command.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// FFmpeg/FFprobe kèm app đứng đầu PATH của công cụ này: bước chuẩn hóa âm lượng + xác minh file xuất gọi `ffmpeg`/`ffprobe` theo tên.
{ const ff = path.join(ROOT, "tools", "ffmpeg"); if (fs.existsSync(path.join(ff, process.platform === "win32" ? "ffprobe.exe" : "ffprobe")) && !String(process.env.PATH).split(path.delimiter).includes(ff)) process.env.PATH = `${ff}${path.delimiter}${process.env.PATH}`; }
const args = process.argv.slice(2);
const dirArg = args.find((a) => !a.startsWith("--"));
const quality = args.includes("--quality") && args[args.indexOf("--quality") + 1] === "draft" ? "draft" : "final";
const expectedRevision=args.includes('--revision')?args[args.indexOf('--revision')+1]:undefined;
const batchId=args.includes('--batch-id')?args[args.indexOf('--batch-id')+1]:null;
const batchItem=args.includes('--batch-item')?Number(args[args.indexOf('--batch-item')+1]):null;
if(batchId&&(!/^[a-f0-9-]{36}$/i.test(batchId)||!Number.isInteger(batchItem)||batchItem<0||batchItem>19)){console.error('Mã lô xuất không hợp lệ.');process.exit(1);}
const batch=batchId?{taskId:batchId,item:batchItem}:null;
if (!dirArg) { console.error("Dùng: node editor/tools/xuat-video.mjs <thư mục dự án> [--quality final|draft]"); process.exit(1); }
const PROJECT = path.resolve(ROOT, dirArg);
if (!fs.existsSync(path.join(PROJECT, "project.json"))) { console.error("Không thấy project.json trong " + PROJECT); process.exit(1); }
// Máy không GPU (Claude/Codex/Antigravity hay người dùng gọi CLI): có máy xuất hộ trực tuyến thì gửi sang, chờ, in SAVED như thường.
const STATUS = path.join(PROJECT, "work", "render.json");
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const prev = readJson(STATUS) || {};
// máy xuất hộ: luôn ghi vào renders/ của dự án trên NAS (thư mục xuất trong settings có thể là ổ riêng của máy khác)
const destination = process.env.CONTENTOS_RENDER_TO_PROJECT === '1' ? '' : (prev.target?.dir || readJson(path.join(ROOT, 'workspace', 'settings.json'))?.exportDir || '');
const destName = process.env.CONTENTOS_RENDER_TO_PROJECT === '1' ? '' : (prev.target?.name || '');
const overwrite = !!(destName && prev.target?.overwrite);
// Máy không GPU (Claude/Codex/Antigravity hay người dùng gọi CLI): có máy xuất hộ trực tuyến thì gửi sang, chờ, in SAVED như thường.
if (!batch) {
  const farm = await import('../../src/services/render-farm.mjs');
  let farmSettings = {}; try { farmSettings = JSON.parse(fs.readFileSync(path.join(ROOT, 'workspace', 'settings.json'), 'utf8')); } catch {}
  const helper = farm.shouldOffload(ROOT, farmSettings);
  if (helper) {
    const fj = farm.submitJob(ROOT, { projectDir: PROJECT, quality, revision: expectedRevision });
    console.log(`→ Gửi sang máy xuất hộ ${helper.host} (${helper.gpu}) · việc ${fj.id}`);
    let last = -1;
    for (;;) {
      await new Promise((r) => setTimeout(r, 3000));
      const j = farm.readJob(ROOT, fj.id) || {};
      if (j.status === 'queued' && Date.now() - fj.createdAt > 180000) { farm.cancelJob(ROOT, fj.id); console.error(`Máy xuất hộ ${helper.host} không nhận việc sau 3 phút. Chạy lại với CONTENTOS_RENDER_LOCAL=1 để xuất tại máy này.`); process.exit(1); }
      if (j.progress !== last && j.status === 'rendering') { last = j.progress; console.log(`… ${Math.round(j.progress || 0)}% (máy ${j.worker})`); }
      if (j.status === 'done') {
        let saved = path.join(ROOT, j.saved);
        if (destination && path.resolve(destination) !== path.resolve(PROJECT, 'renders')) {
          try {
            fs.mkdirSync(destination, { recursive: true });
            const wanted = destName || path.basename(saved), base = path.basename(wanted, path.extname(wanted));
            let to = path.join(destination, wanted);
            if (!overwrite) for (let k = 2; fs.existsSync(to); k++) to = path.join(destination, `${base}-${k}.mp4`);
            fs.copyFileSync(saved, to);
            if (fs.existsSync(saved + '.json')) try { fs.copyFileSync(saved + '.json', to + '.json'); } catch {}
            saved = to;
          } catch (e) { console.error('Chưa chép được về thư mục xuất đã chọn: ' + e.message); }
        }
        console.log('✓ Xuất xong (máy xuất hộ ' + j.worker + ')');
        console.log('SAVED ' + saved);
        process.exit(0);
      }
      if (j.status === 'failed' || j.status === 'cancelled') { console.error(`Máy xuất hộ ${j.worker || helper.host} báo lỗi (mã ${j.exitCode}).\n${(j.log || '').slice(-1500)}`); process.exit(1); }
    }
  }
}
const activityRun=registerRenderRun(PROJECT,{quality,managed:args.includes('--auto-export')||!!batch});
let activityTerminal=false;
const finishActivity=(status)=>{activityRun.update({status});activityTerminal=true;};
process.once('exit',code=>{if(!activityTerminal)try{activityRun.update({status:'interrupted'});}catch{}});
let renderLock;
const waitingController=new AbortController(),stopWaiting=()=>waitingController.abort(new Error('Đã hủy chờ render.'));
process.on('SIGINT',stopWaiting);process.on('SIGTERM',stopWaiting);
try{renderLock=await waitForRenderLock(ROOT,{projectDir:PROJECT,kind:'ai-cli'},{signal:waitingController.signal,validate:()=>{if(expectedRevision)assertProjectRevision(path.join(PROJECT,'project.json'),expectedRevision);},onWait:()=>console.log('Đang chờ lượt render trên máy; chưa tạo bản chụp hoặc sửa trạng thái xuất của dự án.')});}catch(error){finishActivity(waitingController.signal.aborted?'cancelled':'failed');console.error(error.message);process.exit(waitingController.signal.aborted?2:1);}
activityRun.update({status:'running'});
process.removeListener('SIGINT',stopWaiting);process.removeListener('SIGTERM',stopWaiting);

const st = { running: true, byAi: true, quality, progress: 0, ok: null, log: "", pid: process.pid, startedAt: Date.now(), jobDir: prev.jobDir || null, channels: prev.channels || [], ...(prev.target ? { target: prev.target } : {}) };
if(batch)Object.assign(st,{batchTaskId:batch.taskId,batchItem:batch.item,jobDir:null,channels:[]});
// giữ cờ cancel phần mềm vừa ghi (không ghi đè mất khi cập nhật tiến độ)
const save = () => { if (!st.cancel && readJson(STATUS)?.cancel) st.cancel = true; fs.mkdirSync(path.dirname(STATUS), { recursive: true }); fs.writeFileSync(STATUS, JSON.stringify(st, null, 2)); activityRun.update({progress:st.progress}); };
// Start a new cancellation scope; do not inherit a completed run's cancel flag.
fs.mkdirSync(path.dirname(STATUS),{recursive:true});fs.writeFileSync(STATUS,JSON.stringify(st,null,2));

let snapshot;
try{if(args.includes('--auto-export')){const review=plateReviewStatus(PROJECT,readJson(path.join(PROJECT,'project.json')),expectedRevision);if(!review.approved)throw new Error(review.reason);}
snapshot=await createRenderSnapshot(PROJECT,{quality,...(expectedRevision?{revision:expectedRevision}:{})});if(args.includes('--auto-export'))assertReviewedSnapshot(PROJECT,readJson(path.join(PROJECT,'project.json')),expectedRevision,snapshot.manifest);st.snapshotId=snapshot.manifest.id;st.revision=snapshot.manifest.revision;save();}
catch(error){renderLock.release();st.running=false;st.ok=false;st.log='Không tạo được bản chụp render: '+error.message;st.finishedAt=Date.now();save();finishActivity('failed');console.error(st.log);process.exit(1);}
if(readJson(STATUS)?.cancel){renderLock.release();st.running=false;st.ok=false;st.cancelled=true;st.log='Đã hủy trong lúc chuẩn bị render.';st.finishedAt=Date.now();save();finishActivity('cancelled');process.exit(2);}

const slug = path.basename(PROJECT);
const base = destName ? path.basename(destName, path.extname(destName)) : quality === "draft" ? `${slug}-nhap` : `${slug}-final`;
const intoRenders = path.resolve(destination || path.join(PROJECT, "renders")) === path.resolve(PROJECT, "renders");
fs.mkdirSync(path.join(PROJECT, "renders"), { recursive: true });
// file cũ đang mở (Windows khoá) → lưu sang tên -2, -3…
let name = `${base}.mp4`;
for (let k = 2; ; k++) {
  const f = path.join(PROJECT, "renders", name);
  if ((!fs.existsSync(f) && !fs.existsSync(f + ".json")) || (overwrite && intoRenders && k === 2)) break;
  name = `${base}-${k}.mp4`;
}
const out = `renders/${name}`;
st.output = out; save();

const launch=hyperframesCommand(ROOT,["render", "--quality", quality === "draft" ? "draft" : "high", "--fps", "30", "--gpu", "--sdr", "--output", out]); // --gpu: tự dò NVENC/QSV/AMF · --sdr: ép xuất H.264 Rec.709 chuẩn, tránh hdr_layered làm tối hình & đen viền chữ
st.launcher=launch.source;save();
const child = spawnShellSafe(spawn, launch.command, launch.args, {
  cwd: snapshot.directory, shell: launch.shell, env: renderEnvironment(ROOT), detached: process.platform !== "win32",windowsHide:true,
});
// dừng cả cây tiến trình (npx → hyperframes → Chrome / ffmpeg)
renderLock.child(child.pid);
const killTree = () => {
  try {
    if (process.platform === "win32") execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: "ignore" });
    else process.kill(-child.pid, "SIGKILL");
  } catch {}
};
// người dùng bấm "Huỷ" trong editor → phần mềm ghi cancel: true vào render.json
let cancelled = false;
const watch = setInterval(() => {
  if (readJson(STATUS)?.cancel && !cancelled) { cancelled = true; killTree(); }
}, 800);
process.on("SIGINT", () => { cancelled = true; killTree(); });
let lastSave = 0, lastPct = -1, sawComplete = false;
const onData = (d) => {
  const s = d.toString().replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
  // hyperframes in "Render complete" sau khi đã ghép + kiểm file; có máy thoát bằng mã Ctrl+C (0xC000013A) ngay sau đó
  if (/Render complete/i.test(s)) sawComplete = true;
  st.log = (st.log + s).slice(-6000);
  const m = s.match(/(\d{1,3}(?:\.\d+)?)\s*%/g);
  if (m) st.progress = Math.min(99, parseFloat(m[m.length - 1]));
  if (Date.now() - lastSave > 700) { lastSave = Date.now(); save(); }
  const pct = Math.floor(st.progress / 10) * 10;
  if (pct !== lastPct) { lastPct = pct; console.log(`… ${pct}%`); }
};
child.stdout.on("data", onData);
child.stderr.on("data", onData);
child.on("error",error=>{renderLock.release();clearInterval(watch);st.running=false;st.ok=false;st.log=error.message;save();});
child.on("close", (code, signal) => {
  clearInterval(watch);
  // No awaits in finalization: keep the lock until this callback finishes.
  process.once('exit',()=>renderLock.release());
  const src = path.join(snapshot.directory, out);
  st.running = false;
  st.exitCode=code;st.exitSignal=signal;
  if (cancelled) {
    st.ok = false; st.cancelled = true; st.log = "Người dùng đã huỷ xuất video."; st.finishedAt = Date.now(); save();finishActivity('cancelled');
    try { fs.rmSync(src, { force: true }); } catch {}
    console.log("✗ ĐÃ HUỶ — người dùng bấm Huỷ trong editor. KHÔNG chạy lại; báo: node editor/tools/ai-inbox.mjs --fail <việc> \"Người dùng huỷ xuất video\"");
    process.exit(2);
  }
  // Mã thoát khác 0 sau "Render complete" vẫn nhận nếu file có mặt: finalizeRenderArtifact dưới đây kiểm lại kích thước, thời lượng, âm thanh trước khi lưu.
  st.ok = fs.existsSync(src) && (code === 0 || sawComplete);
  if (st.ok && code !== 0) st.exitNote = `Tiến trình render thoát với mã ${code ?? signal} sau khi báo hoàn tất; đã kiểm lại file trước khi nhận.`;
  if (st.ok) {
    // Bước kiểm file + chuẩn hóa âm lượng chạy đồng bộ có thể mất vài phút: báo trước để editor hiện "đang hoàn tất" thay vì đứng ở 99%.
    st.running = true; st.finalizing = true; st.ok = null; st.progress = 99; save();
    try{Object.assign(st,finalizeRenderArtifact({snapshot,projectDir:PROJECT,output:out,destination,destName,overwrite,quality,batch,renderJobDir:st.jobDir}));st.progress=100;st.ok=true;}
    catch(error){st.ok=false;st.log+='\nKhông xác minh/lưu được bản xuất: '+error.message;}
    st.running = false; st.finalizing = false;
  }
  st.finishedAt = Date.now();
  save();
  finishActivity(st.ok?'succeeded':'failed');
  if (st.ok) { console.log("✓ Xuất xong"); console.log("SAVED " + st.saved); }
  else { console.error("✗ Xuất lỗi:\n" + st.log.slice(-1500)); process.exit(1); }
});
