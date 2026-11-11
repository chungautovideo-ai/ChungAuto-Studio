#!/usr/bin/env node
import "./lib/threadpool.mjs";
import {consumeCompletionHandoff} from '../src/services/cli-completion-handoff.mjs';
import {createEditorJobSources} from '../src/services/editor-job-sources.mjs';
import {personPointSuggestions} from '../src/services/person-point-suggestions.mjs';
import {personRuntimeStatus} from '../src/services/person-runtime.mjs';
import {packageTemplate,installTemplatePackage,parseTemplatePackage} from '../src/services/template-package.mjs';
import {probeMediaMetadata} from '../src/services/media-metadata.mjs';
import {applyPersonAdjustment} from '../src/services/person-adjustments.mjs';
import {personExposureReport} from '../src/services/person-exposure-report.mjs';
import {measureSelectedPersonExposure} from '../src/services/selected-person-exposure.mjs';
import {trackPersonSelection,personTrackingStatus} from '../src/services/person-tracking.mjs';
import {parseAgentLoginStatus} from '../src/services/agent-login-status.mjs';
import {classifyAgentRunFailure} from '../src/services/agent-run-failure.mjs';
import {prepareCodexWorkerRuntime} from '../src/services/codex-worker-runtime.mjs';
import {readLutLibrary,attachLibraryLut} from '../src/services/lut-library.mjs';
import {createApiColorNormalization} from '../src/services/api-color-normalization.mjs';
import {readFaceTracks,saveFaceTracks,faceSourceManifest} from '../src/services/face-tracks.mjs';
import {normalizeColor,normalizeColorBatch,importColorLut,listColorLuts} from '../src/services/color-normalization.mjs';
import {shotColorRequest} from '../src/services/shot-color.mjs';
import {analyzeShotColor} from '../src/services/shot-color.mjs';
import {plateReviewStatus,approvePlateReview} from '../src/services/plate-review.mjs';
import {createApiPlatePrivacy} from '../src/services/api-plate-privacy.mjs';
import {createPlatePrivacy} from '../src/services/plate-privacy.mjs';
import {suggestPlateRegions} from '../src/services/plate-suggestions.mjs';
import {normalizeAutomotiveOptions,automotiveInstructions} from './lib/automotive-options.js';
import {pinAutomotiveJob,enforceAutomotiveJob} from '../src/services/automotive-job.mjs';
import {createRemotionJobs} from '../src/services/remotion-jobs.mjs';
import {createPosterTasks} from '../src/services/poster-tasks.mjs';
import {readSessionContact} from '../src/services/session-contact.mjs';

import {readRenderRuns} from '../src/services/render-run-registry.mjs';
import {projectActivity,projectResourceActivity} from '../src/services/activity.mjs';
import {asrLockStatus} from '../src/services/asr-lock.mjs';
import {renderEnvironment} from '../src/services/render-environment.mjs';
import {resolveCompletionOutput} from '../src/services/completion-output.mjs';
import {createIntakeTasks} from '../src/services/intake-tasks.mjs';
import {createBatchEditDispatch} from '../src/services/batch-edit-dispatch.mjs';
import {cancelStagedJob,stagedJobVersion} from '../src/services/staged-job-control.mjs';
import {sameSubmittedJob,ownsWorkingJob} from '../src/services/job-ownership.mjs';
import {assertClaimOwner,reserveProjectJob,projectJobAvailable,retireTerminalProjectJob} from '../src/services/session-job-claims.mjs';
import {createBackgroundDispatch} from '../src/services/background-dispatch.mjs';
import {prepareFirstBuildTranscript} from '../src/services/first-build-transcript.mjs';
import {inspectPrimaryMedia} from '../src/services/primary-media.mjs';
import {transcribeProject} from '../src/services/project-transcription.mjs';
import {timelineSourceCache} from '../src/services/timeline-source-cache.mjs';
import {createProjectVariant} from '../src/services/project-variants.mjs';
import {createVariantTasks} from '../src/services/variant-tasks.mjs';
import {createRenderTasks} from '../src/services/render-tasks.mjs';
import {publishDrafts,snapshotPublishDrafts,refreshPublishDraftReview} from '../src/services/publish-drafts.mjs';
import {listPublishFinals,createPublishPack,resolvePublishPack,listPublishPacks} from '../src/services/publish-pack.mjs';
import {createPublishDrafter} from '../src/services/publish-drafting.mjs';
import {pinScheduledVideo,resolveScheduledVideo} from '../src/services/scheduled-media.mjs';
import {listPublishCovers,resolvePublishCover,verifyPublishCovers} from '../src/services/publish-covers.mjs';
import {scheduleDispatch,scheduleJobState} from '../src/services/schedule-dispatch.mjs';
import {createBrandDefaults,pinJobBrand,applyJobBrand} from '../src/services/brand-defaults.mjs';
import {verifyArtifactAsync} from '../src/services/artifact-integrity.mjs';
import {templateDetails,templateReference} from '../src/services/template-details.mjs';
import {snapshotTemplate,readTemplateSnapshot} from '../src/services/template-snapshots.mjs';
import {kiemDoHoa as checkApiGraphics} from './tools/kiem-do-hoa.mjs';
import {createApiUsageStore} from '../src/services/api-usage.mjs';
import {createApiPresets} from '../src/services/api-presets.mjs';
import {createEditorContext} from '../src/services/editor-context.mjs';
import {runApiEditor} from '../src/services/api-editor.mjs';
import {resolveEditSelection} from '../src/services/editor-item-patch.mjs';
import {streamMedia} from '../src/services/media-stream.mjs';
import {searchSourceTree} from '../src/services/source-search.mjs';
import {createSourceAnnotations} from '../src/services/source-annotations.mjs';
import {createNewsTasks} from '../src/services/news-tasks.mjs';
import {createNewsDrafter} from '../src/services/news-drafting.mjs';
import {discoverModels} from '../src/services/model-catalog.mjs';
// Editor chỉnh tay cho project video. Không cần cài thêm thư viện (Node 20+).
//
//   node editor/server.mjs <projectDir> [--port 5173] [--open]
//   node editor/server.mjs --home [--open]      # mở màn hình chọn / tạo dự án

import http from "node:http";
import {createCompletionPolicyStore,normalizeCompletion} from '../src/services/completion-policy.mjs';
import {updateCompletionExport} from '../src/services/completion-results.mjs';
import {candidateReview,markCandidateConflict} from '../src/services/candidate-review.mjs';
import {createNasProject} from '../src/services/nas-projects.mjs';
import {createNarrationProject} from '../src/services/narration-projects.mjs';
import {inspectBrollMedia} from '../src/services/broll-media.mjs';
import {importProjectImage} from '../src/services/image-project-intake.mjs';
import {recognizeNarration} from '../src/services/narration-asr.mjs';
import {sourceMediaInfo} from '../src/services/source-media-info.mjs';
import {createSourcePreview} from '../src/services/source-preview.mjs';
import {waitForRenderLock,renderLockStatus} from '../src/services/render-lock.mjs';
import {createRenderSnapshot} from '../src/services/render-snapshots.mjs';
import {finalizeRenderArtifactAsync} from '../src/services/render-finalization-async.mjs';
import {createEditorImages} from '../src/services/editor-images.mjs';
import {useJobImages} from '../src/services/job-images.mjs';
import {saveCover,readCoverComposition} from '../src/services/covers.mjs';
import {createConnectionStore,createTelegramStore} from '../src/services/connections.mjs';
import {createImageService} from '../src/services/images.mjs';
import {listReviseJobs,activeReviseJob} from '../src/services/revise-jobs.mjs';
import {normalizeExecution,cliModelArgs} from '../src/services/ai-execution.mjs';
import {inspectChatSources} from '../src/services/chat-sources.mjs';
import {copySourceSurvey} from '../src/services/source-survey.mjs';
import {prepareRevisionResult,applyRevisionResult} from '../src/services/revision-results.mjs';
import { createTaskStore } from '../src/services/tasks.mjs';
import { projectRevision, assertProjectRevision, commitProject, ProjectConflict } from '../src/services/project-revisions.mjs';
import { PROJECT_FILE_EXT, writeProjectFile, inspectProjectFile, restoreProjectFile, linkedProjectFile, setLinkedProjectFile, writeRecovery, readRecovery, clearRecovery, exportFileName } from '../src/services/project-file.mjs';
import { createStorageService,resolveContained } from "../src/services/storage.mjs";
import { createMobileIntake } from "./lib/mobile-intake.mjs";
import { createCatalogService } from "../src/services/catalogs.mjs";
import { createSkillLibrary } from "../src/services/skill-library.mjs";
import { listCapcutProjects, learnCapcutStyle } from "../src/services/capcut-style.mjs";
import {createNewsService} from '../src/services/news.mjs';
import {readNewsArticle} from '../src/services/news-ingest.mjs';
import {attachVoiceResult,voiceAssetContext} from '../src/services/voice-intake.mjs';
import { createWorkspaceStore } from "../src/services/workspaces.mjs";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync, exec, execSync,execFile, execFileSync } from "node:child_process";
import { spawnShellSafe } from "../src/services/unc-spawn.mjs";
import { shouldOffload, submitJob, readJob, cancelJob, localGpu, onlineWorkers } from "../src/services/render-farm.mjs";
import { fileURLToPath } from "node:url";
import { buildProject, buildHtml, previewHtml, previewParts, presetParts, SFX_KINDS } from "./lib/build.mjs";
import { kitMusicList, kitMusicFile, kitSfxLibrary } from "./lib/kit-music.mjs";
import { TEXT_ANIMS, TEXT_STYLES } from "./lib/text-effects.js";
import { unzip } from "./lib/zip.mjs";
import { linkMo, moLink } from "./lib/mo-link.mjs";
import { giongApi } from "./lib/giong-api.mjs";
import { HF } from "./lib/hf.mjs";
import {hyperframesCommand} from '../src/services/hyperframes-command.mjs';
import { makeVoice, voiceReady, voiceFile } from "./lib/voice-clean.mjs";
import { whisperStatus, installWhisper, transcribe } from "./lib/whisper.mjs";
import { prepareTools, installFfmpeg } from "./lib/system.mjs";
import { groupCaptionLines } from "./lib/brand.js";
import crypto from "node:crypto";
import {createModelRoutingStore} from '../src/services/model-routing.mjs';
import {previewMigration} from '../src/services/migration-preview.mjs';
import {importAievImage} from '../src/services/image-migration.mjs';
import {importVekProject,importAievProject,importStudioProject} from '../src/services/migration-import.mjs';

const KIT = path.dirname(fileURLToPath(import.meta.url));
// macOS: mở bằng bấm đúp có thể thiếu PATH của Homebrew → ffmpeg / ffprobe / whisper-cli không tìm thấy
if (process.platform === "darwin") for (const p of ["/opt/homebrew/bin", "/usr/local/bin"]) if (!String(process.env.PATH).split(":").includes(p)) process.env.PATH = `${p}:${process.env.PATH}`;
const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const PORT = Number(flag("--port", 5180));
const ROOT = path.resolve(KIT, "..");
// FFmpeg/FFprobe kèm app đứng đầu PATH: HyperFrames khi xuất video cần chúng, máy không cài FFmpeg riêng vẫn xuất được.
{ const ff = path.join(ROOT, "tools", "ffmpeg"); if (fs.existsSync(path.join(ff, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")) && !String(process.env.PATH).split(path.delimiter).includes(ff)) process.env.PATH = `${ff}${path.delimiter}${process.env.PATH}`; }
const completionPolicies=createCompletionPolicyStore(ROOT);
const workspaceStore = createWorkspaceStore(ROOT);
const brandDefaults=createBrandDefaults(ROOT);
const taskStore = createTaskStore(ROOT);
const variantTasks=createVariantTasks({root:ROOT,workspaceStore,tasks:taskStore});
const renderTasks=createRenderTasks({root:ROOT,workspaceStore,tasks:taskStore});
const connectionStore=createConnectionStore(ROOT);
const llmConnectionStore=createConnectionStore(ROOT,{kind:"llm"});
const telegramStore=createTelegramStore(ROOT);
const imageService=createImageService(ROOT,{connections:connectionStore});
const posterTasks=createPosterTasks({root:ROOT,tasks:taskStore,images:imageService,workspaceStore});
const catalogs = createCatalogService(ROOT);
const skillLibrary = createSkillLibrary(ROOT);
const news=createNewsService(ROOT);
const apiUsage=createApiUsageStore(ROOT);
const modelRouting=createModelRoutingStore(ROOT);
const draftPublish=createPublishDrafter({root:ROOT,routing:modelRouting,connections:llmConnectionStore,fetcherFor:workspaceId=>apiUsage.fetcher(workspaceId,'publish-draft')});
const draftNews=createNewsDrafter({news,routing:modelRouting,connections:llmConnectionStore,fetcherFor:workspaceId=>apiUsage.fetcher(workspaceId,'news-draft')});
const newsTasks=createNewsTasks({tasks:taskStore,news,routing:modelRouting,connections:llmConnectionStore,draft:draftNews});
const storageService = createStorageService(ROOT,workspaceStore);
const intakeTasks=createIntakeTasks({root:ROOT,workspaceStore,storage:storageService,tasks:taskStore});
const remotionJobs=createRemotionJobs({root:ROOT});
const batchEditDispatch=createBatchEditDispatch({root:ROOT,workspaceStore,tasks:taskStore,stage:stageFirstBuild});
const mobileIntake = createMobileIntake({root:ROOT});
prepareTools(ROOT); // ffmpeg / ffprobe phần mềm đã tải (tools/ffmpeg), Homebrew trên macOS
const WORKSPACE = path.join(ROOT, "workspace", "content");
// Dự án đang mở (đổi được lúc chạy từ màn hình chọn dự án).
let PROJECT = null, PJ = null;
function setProject(dir) {
  const d = path.resolve(dir);
  if (!fs.existsSync(path.join(d, "project.json"))) throw new Error(`Không thấy project.json trong ${d}`);
  PROJECT = d;
  PJ = path.join(d, "project.json");
  lastProject = null;
  memo.clear();
}
const argDir = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--port");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".m4v": "video/mp4",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".aac": "audio/aac",
  ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".wasm": "application/wasm",
};
const MEDIA = /\.(mp4|mov|webm|m4v|png|jpe?g|webp|gif|mp3|wav|m4a|aac)$/i;

// Trình phát xem trước của HyperFrames. Máy khách cài bằng bộ cài tự động chỉ có HyperFrames trong bộ nhớ đệm của npx
// (npx hyperframes …), không có bản cài chung → tìm cả ở đó (Windows %LOCALAPPDATA%/npm-cache, macOS ~/.npm), lấy bản mới nhất.
const PLAYER_FILE = "hyperframes/dist/hyperframes-player.global.js";
function findPlayer() {
  const cands = [path.join(ROOT, "node_modules", PLAYER_FILE), path.join(KIT, "node_modules", PLAYER_FILE)];
  // npm cache có thể đã đổi chỗ (npm_config_cache hoặc dòng cache= trong ~/.npmrc, vd D:\AI\npm-cache) — npx đặt trình phát ở đó.
  let npmrcCache = null;
  try { npmrcCache = /^\s*cache\s*=\s*(.+?)\s*$/m.exec(fs.readFileSync(path.join(os.homedir(), ".npmrc"), "utf8"))?.[1] || null; } catch {}
  const caches = new Set([process.env.npm_config_cache, npmrcCache, path.join(os.homedir(), ".npm"), process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "npm-cache")].filter(Boolean));
  const ver = (f) => { try { return JSON.parse(fs.readFileSync(path.join(path.dirname(path.dirname(f)), "package.json"), "utf8")).version.split(".").map(Number); } catch { return [0]; } };
  const npx = [];
  for (const c of caches) {
    const d = path.join(c, "_npx");
    if (fs.existsSync(d)) for (const h of fs.readdirSync(d)) {
      const nm = path.join(d, h, "node_modules");
      npx.push(path.join(nm, PLAYER_FILE));
      // npx bị ngắt giữa lúc thay bản (vd huỷ xuất video): npm để bản cũ ở thư mục .hyperframes-xxxx
      try { for (const b of fs.readdirSync(nm)) if (b.startsWith(".hyperframes-")) npx.push(path.join(nm, b, "dist", path.basename(PLAYER_FILE))); } catch {}
    }
  }
  npx.filter((p) => fs.existsSync(p)).sort((a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; }).forEach((p) => cands.push(p));
  const co = cands.find((p) => fs.existsSync(p));
  if (co) return co;
  // gọi npm là chặn cả phần mềm (npm chậm hoặc treo thì trình duyệt báo hết thời gian chờ): chỉ khi các chỗ trên không có
  try { const g = path.join(execSync("npm root -g", { encoding: "utf8", timeout: 4000, windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).trim(), PLAYER_FILE); if (fs.existsSync(g)) return g; } catch {}
  console.warn("⚠ Tìm trình phát ở:", [...caches].map((c) => path.join(c, "_npx") + (fs.existsSync(path.join(c, "_npx")) ? " (có)" : " (không có)")).join(" | "), "· ứng viên:", npx.length);
}
let PLAYER = findPlayer();
// Runtime HyperFrames: chèn vào trang xem trước để player phát được (đồng bộ video/âm thanh).
// Lúc render, CLI tự chèn runtime riêng nên index.html không chứa thẻ này.
const runtimeOf = (pl) => pl && [path.join(path.dirname(pl), "hyperframe.runtime.iife.js")].find((p) => fs.existsSync(p));
let RUNTIME = runtimeOf(PLAYER);
if (!PLAYER) console.warn("⚠ Chưa thấy trình phát HyperFrames — sẽ tìm lại khi mở xem trước (chạy: npx hyperframes browser ensure).");
// Chưa có lúc khởi động (vd bộ cài chạy sau) → tìm lại khi trang xem trước cần
let timPlayerLuc = Date.now();
function ensurePlayer() { if ((!PLAYER || !fs.existsSync(PLAYER)) && Date.now() - timPlayerLuc > 30000) { timPlayerLuc = Date.now(); PLAYER = findPlayer(); RUNTIME = runtimeOf(PLAYER); } return PLAYER; }

// Chặn đường dẫn thoát ra ngoài thư mục gốc.
function safeJoin(root, rel) {
  const p = path.resolve(root, "." + path.posix.normalize("/" + decodeURIComponent(rel)));
  return p === root || p.startsWith(root + path.sep) ? p : null;
}

function sendFile(req, res, file, noCache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "Not found");
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": noCache ? "no-store" : "max-age=60" };
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) return send(res, 416, "");
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, "Content-Length": st.size });
    fs.createReadStream(file).pipe(res);
  });
}

function send(res, code, body, type = "text/plain; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
// Ổ đĩa: dung lượng trống của ổ chứa phần mềm (byte) — statfs (Node ≥ 18.15), không có thì đọc df / wmic
function diskSpace() {
  try { const st = fs.statfsSync(ROOT); return { free: st.bavail * st.bsize, total: st.blocks * st.bsize }; } catch {}
  try {
    if (process.platform === "win32") {
      const d = path.parse(ROOT).root.replace(/\\$/, "");
      const o = execSync(`wmic logicaldisk where "DeviceID='${d}'" get FreeSpace,Size /value`, { encoding: "utf8" });
      return { free: Number(/FreeSpace=(\d+)/.exec(o)?.[1]) || 0, total: Number(/Size=(\d+)/.exec(o)?.[1]) || 0 };
    }
    const l = execSync(`df -k "${ROOT}"`, { encoding: "utf8" }).trim().split("\n").pop().split(/\s+/);
    return { free: Number(l[3]) * 1024, total: Number(l[1]) * 1024 };
  } catch { return { free: 0, total: 0 }; }
}
const gb = (n) => (n / 1073741824).toFixed(n > 10 * 1073741824 ? 0 : 1).replace(".", ",") + " GB";
// lỗi hết chỗ ổ đĩa (ENOSPC) → câu dễ hiểu cho người dùng, mọi API dùng chung
const isNoSpace = (msg) => /ENOSPC|no space left on device|not enough space|There is not enough space/i.test(String(msg || ""));
const noSpaceMsg = () => `Ổ đĩa đã đầy (còn ${gb(diskSpace().free)}). Xoá bớt dự án cũ ở mục "Dọn dung lượng" (menu trái) hoặc dọn Thùng rác của máy rồi thử lại.`;
const json = (res, body, code = 200) => {
  if (body && body.error && isNoSpace(body.error)) body = { ...body, error: noSpaceMsg(), noSpace: true };
  return send(res, code, body, "application/json; charset=utf-8");
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// ---------- Bản xem trước nhẹ (proxy) cho video nặng (máy quay 4K, bitrate cao, khung khoá thưa) ----------
// Chỉ dùng khi XEM TRƯỚC trong editor (tua / nhảy đoạn cắt mượt, hình không đứng); xuất video vẫn dùng file gốc.
// <dự án>/work/proxy/<tên>.mp4: cao 960, H.264 khung khoá mỗi 0,5s, faststart.
const proxyJobs = new Map(); // file gốc → "running" | "failed"
// dung lượng 1 thư mục (byte, đệ quy)
function dirSize(d) {
  let n = 0;
  try { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); n += e.isDirectory() ? dirSize(f) : (() => { try { return fs.statSync(f).size; } catch { return 0; } })(); } } catch {}
  return n;
}
// file tạm xoá được: video tải về khi phân tích kênh (giữ ảnh thumbnail / tấm khung / lời thoại của báo cáo) + work/tmp
function tamFiles(dir) {
  const out = [], pd = path.join(dir, "work", "posts");
  try { for (const f of fs.readdirSync(pd)) if (/\.(mp4|webm|mov|m4v|mkv)$/i.test(f)) out.push(path.join(pd, f)); } catch {}
  if (fs.existsSync(path.join(dir, "work", "tmp"))) out.push(path.join(dir, "work", "tmp"));
  return out;
}
function dungLuongOf(dir) {
  const pj = readJson(path.join(dir, "project.json"));
  const parts = { inputs: dirSize(path.join(dir, "inputs")), renders: dirSize(path.join(dir, "renders")), proxy: dirSize(path.join(dir, "work", "proxy")),
    history: dirSize(path.join(dir, ".history")), tam: tamFiles(dir).reduce((a, f) => a + (fs.statSync(f).isDirectory() ? dirSize(f) : fs.statSync(f).size), 0) };
  const total = dirSize(dir);
  return { dir: relDir(dir), title: pj?.title || path.basename(dir), kind: path.basename(path.dirname(dir)).startsWith("_") ? path.basename(path.dirname(dir)) : "project",
    project: !!pj, total, parts: { ...parts, khac: Math.max(0, total - Object.values(parts).reduce((a, b) => a + b, 0)) },
    updated: (() => { try { return fs.statSync(pj ? path.join(dir, "project.json") : dir).mtimeMs; } catch { return 0; } })() };
}
function dungLuong() {
  const out = [];
  if (!fs.existsSync(WORKSPACE)) return out;
  for (const day of fs.readdirSync(WORKSPACE)) {
    const dd = path.join(WORKSPACE, day);
    try { if (!fs.statSync(dd).isDirectory()) continue; } catch { continue; }
    for (const name of fs.readdirSync(dd)) { const d = path.join(dd, name); try { if (fs.statSync(d).isDirectory()) out.push(dungLuongOf(d)); } catch {} }
  }
  return out.sort((a, b) => b.total - a.total);
}
const proxyOf = (proj, rel) => path.join(proj, "work", "proxy", rel.replace(/^inputs\//, "").replace(/[\\/]/g, "_").replace(/\.[^.]+$/, "") + (/\.webm$/i.test(rel) ? ".webm" : ".mp4")); // tách nền giữ .webm (VP9 có alpha)
function proxyReady(proj, rel) {
  const src = path.join(proj, rel), px = proxyOf(proj, rel);
  try { return fs.statSync(px).mtimeMs >= fs.statSync(src).mtimeMs && fs.statSync(px).size > 0; } catch { return false; }
}
// video cần proxy: không phải lớp tách nền (webm trong suốt), lớn hơn 1080p hoặc nặng (> 6 Mbps) hoặc khung khoá thưa
function needProxy(file) {
  if (/\.webm$/i.test(file)) { // lớp tách nền: giải mã VP9 + alpha cỡ 1080×1920 rất nặng → cần khi cao hơn 960
    try { return Number(execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${file}"`, { encoding: "utf8" })) > 960; } catch { return false; }
  }
  try {
    const j = JSON.parse(execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name:format=bit_rate,duration -of json "${file}"`, { encoding: "utf8" }));
    const st = j.streams?.[0] || {}, br = Number(j.format?.bit_rate) || 0;
    return Math.max(st.width || 0, st.height || 0) > 1920 || br > 6e6 || !/^h264$/.test(st.codec_name || "") || Number(j.format?.duration) > 60;
  } catch { return false; }
}
// đã đo needProxy (ffprobe) → nhớ theo file + thời điểm sửa
const needCache = new Map();
function needProxyCached(file) {
  let k = file;
  try { k += ":" + fs.statSync(file).mtimeMs; } catch {}
  if (!needCache.has(k)) needCache.set(k, needProxy(file));
  return needCache.get(k);
}
// force: "Xem nhẹ" — tạo bản 540p cho mọi video (kể cả video vốn nhẹ)
function queueProxies(proj, { force = false } = {}) {
  const vids = (() => {
    const out = [], d = path.join(proj, "inputs");
    const scan = (sub = "") => {
      const cur = sub ? path.join(d, sub) : d;
      try {
        for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
          const rel = sub ? `${sub}/${ent.name}` : ent.name;
          if (ent.isDirectory()) scan(rel);
          else if (/\.(mp4|mov|m4v|mkv)$/i.test(ent.name)) out.push(`inputs/${rel}`);
        }
      } catch {}
    };
    scan();
    return out;
  })();
  const matte = readJson(path.join(proj, "project.json"))?.camera?.matte; // lớp tách nền — làm trước (nặng nhất khi xem)
  if (/\.webm$/i.test(matte || "") && !/^(\/|[a-z]:|\.\.)/i.test(matte) && fs.existsSync(path.join(proj, matte))) vids.unshift(matte);
  const todo = vids.filter((rel) => !proxyReady(proj, rel) && !proxyJobs.has(path.join(proj, rel)));
  const next = () => {
    const rel = todo.shift();
    if (!rel) return;
    const src = path.join(proj, rel), px = proxyOf(proj, rel);
    if (!force && !needProxyCached(src)) return next();
    proxyJobs.set(src, "running");
    fs.mkdirSync(path.dirname(px), { recursive: true });
    // Tên tạm riêng từng lượt: server khởi động lại giữa chừng (hoặc tiến trình khác) không ghi chồng cùng file → proxy hỏng (lỗi NAL).
    const tmp = px.replace(/\.(mp4|webm)$/, `.tmp-${process.pid}-${Date.now()}.$1`);
    const ff = spawn("ffmpeg", /\.webm$/i.test(px)
      // tách nền: 540×960, VP9 giữ alpha, khung khoá mỗi 0,5s
      ? ["-v", "error", "-y", "-c:v", "libvpx-vp9", "-i", src, "-vf", "scale=-2:'min(960,ih)'", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
        "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1", "-b:v", "0", "-crf", "38", "-g", "15", "-an", tmp]
      : ["-v", "error", "-y", "-i", src, "-vf", "scale=-2:'min(960,ih)'", "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-tune", "fastdecode",
      "-g", "15", "-keyint_min", "15", "-sc_threshold", "0", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", tmp], { stdio: "ignore" });
    ff.on("close", (code) => {
      if (code === 0) { try { fs.renameSync(tmp, px); proxyJobs.delete(src); } catch { proxyJobs.set(src, "failed"); } }
      else { proxyJobs.set(src, "failed"); fs.rmSync(tmp, { force: true }); }
      next();
    });
    ff.on("error", () => { proxyJobs.set(src, "failed"); next(); });
  };
  next();
}
// index.html xem trước: video trong inputs/ → bản proxy nếu đã có
function useProxies(html, { lite = false } = {}) {
  const matte = PJ && readJson(PJ)?.camera?.matte;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`src="(inputs\\/[^"]+\\.(?:mp4|mov|m4v|mkv)${/\.webm$/i.test(matte || "") ? `|${esc(matte)}` : ""})"`, "gi");
  return html.replace(re, (m, rel) => {
    const r = rel.replace(/&amp;/g, "&");
    // xem thường: chỉ thay video vốn nặng (bản 540p tạo cho "Xem nhẹ" không làm mờ chế độ thường)
    return proxyReady(PROJECT, r) && (lite || needProxyCached(path.join(PROJECT, r))) ? `src="${path.relative(PROJECT, proxyOf(PROJECT, r)).replace(/\\/g, "/")}"` : m;
  });
}

// Xem trước nhẹ: index.html có 1 <video> + 1 <audio> CHO MỖI ĐOẠN CẮT (video dài = hàng trăm thẻ cùng đọc 1 file → nạp chậm, giật).
// Bản xem trước gộp video lại còn 1 video + 1 lớp tách nền (luôn TẮT TIẾNG), tự nhảy tới đúng đoạn theo thời gian của player.
// Giọng nói giữ nguyên các đoạn <audio> cho runtime HyperFrames phát: video có tiếng do mã tự phát trong khung xem trước
// bị trình duyệt chặn (Safari / macOS…) → mất giọng, chỉ còn nhạc. Xuất video vẫn dùng index.html gốc.
function previewLite(html) {
  // The lite A/B player removes per-source video elements and their transforms.
  // Beauty needs those identities/geometry; retain the regular player (proxies
  // are still substituted) until the lite player carries equivalent metadata.
  if(html.includes('<!--beauty-->'))return html;
  // Mỗi đoạn nằm trong khung riêng (source-frame-N, có lọc màu / khung riêng từng cảnh): gộp về 1 video sẽ đặt nó vào khung đầu,
  // các khung sau trống → màn đen sau đoạn 1. Giữ trình phát thường (vẫn dùng proxy).
  // shortcut: video rất dài kiểu này sẽ nạp nhiều thẻ video hơn; muốn nhẹ thì cho trình phát gộp biết vị trí từng khung.
  if(html.includes('id="source-frame-1"'))return html;
  const attr = (tag, k) => (new RegExp(`${k}="([^"]*)"`).exec(tag) || [])[1];
  const segs = [], tags = { v: [], m: [] };
  html = html.replace(/<video id="([vm])(\d+)"[^>]*><\/video>\s*/g, (tag, k) => {
    tags[k].push(tag);
    if (k === "v") segs.push([+attr(tag, "data-start"), +attr(tag, "data-duration"), +attr(tag, "data-media-start"), +(attr(tag, "data-playback-rate") || 1)]);
    return k === "v" && tags.v.length === 1 ? "<!--PV-->" : k === "m" && tags.m.length === 1 ? "<!--PM-->" : "";
  });
  if (segs.length < 2) return html.replace("<!--PV-->", tags.v[0] || "").replace("<!--PM-->", tags.m[0] || "");
  // video nằm trong shadow DOM: runtime HyperFrames không thấy → không tự đồng bộ nó theo thời gian thẳng
  html = html.replace("<!--PV-->", `<div id="pvHost" class="talk" data-src="${attr(tags.v[0], "src")}"></div>`)
    .replace("<!--PM-->", tags.m.length ? `<div id="pmHost" style="position:absolute;inset:0" data-src="${attr(tags.m[0], "src")}"></div>` : "");
  // 2 video luân phiên (A/B) cho mỗi lớp: đoạn i dùng video i%2, video còn lại tua SẴN tới đầu đoạn kế tiếp → tới điểm cắt chỉ việc đổi,
  // cắt đúng khung như video xuất (không khựng / lộ khung đoạn cũ do phải tua lúc đang phát)
  const js = `<script>(function(){var S=${JSON.stringify(segs)};
  function mk(id,css){var h=document.getElementById(id);if(!h)return null;var sh=h.attachShadow({mode:"open"}),src=h.getAttribute("data-src"),out=[];
    for(var k=0;k<2;k++){var e=document.createElement("video");e.src=src;e.playsInline=true;e.preload="auto";e.muted=true;
      e.style.cssText="position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;"+css+(k?"visibility:hidden;":"");sh.appendChild(e);out.push(e);}
    return out;}
  var V=mk("pvHost",document.body.classList.contains("wide")?"object-position:50% var(--face-y,36%)":"object-position:var(--face-x,50%) 50%"),M=mk("pmHost","object-position:var(--face-x,50%) var(--face-y)");
  if(!V)return;window.__pv=V[0];window.__pm=M&&M[0];
  function seg(t){for(var i=0;i<S.length;i++)if(t<S[i][0]+S[i][1]||i===S.length-1)return i;return 0;}
  function src(i,t){var s=S[i];return s[2]+Math.max(0,Math.min(t-s[0],s[1]-0.001))*s[3];}
  function show(L,i){if(!L)return;L[i%2].style.visibility="visible";L[(i+1)%2].style.visibility="hidden";}
  function run(el,want,playing,tol){if(playing){if(Math.abs(el.currentTime-want)>tol)el.currentTime=want;if(el.paused){var p=el.play();p&&p.catch&&p.catch(function(){});}}
    else{if(!el.paused)el.pause();if(Math.abs(el.currentTime-want)>0.02)el.currentTime=want;}}
  function park(el,want){if(!el.paused)el.pause();if(Math.abs(el.currentTime-want)>0.03)el.currentTime=want;} // video chờ: đứng sẵn ở đầu đoạn kế
  function layer(L,i,t,pl,tol){if(!L)return;var a=L[i%2],b=L[(i+1)%2];if(a.playbackRate!==S[i][3])a.playbackRate=S[i][3];run(a,src(i,t),pl,tol);if(i+1<S.length)park(b,S[i+1][2]);show(L,i);window.__pv=V[i%2];}
  function loop(){var P=window.__player;if(P&&P.getTime){var t=P.getTime(),pl=!!(P.isPlaying&&P.isPlaying()),i=seg(t);layer(V,i,t,pl,0.3);layer(M,i,t,pl,0.2);}requestAnimationFrame(loop);}
  requestAnimationFrame(loop);})();</script>`;
  return html.replace("</body>", js + "\n</body>");
}

function listMedia() {
  const out = [];
  for (const dir of ["inputs", "assets"]) {
    const walk = (d) => {
      const abs = path.join(PROJECT, d);
      if (!fs.existsSync(abs)) return;
      for (const f of fs.readdirSync(abs, { withFileTypes: true })) {
        const rel = `${d}/${f.name}`;
        if (f.isDirectory()) walk(rel);
        else if (MEDIA.test(f.name)) out.push(rel);
      }
    };
    walk(dir);
  }
  return out;
}

function requestProject(req) {
  if(!PROJECT||req.contentosProject!==PROJECT||req.headers['x-contentos-project']!==relDir(PROJECT))throw new ProjectConflict('Dự án đã đổi hoặc yêu cầu thiếu định danh dự án. Mở lại đúng dự án.','PROJECT_CONTEXT_CONFLICT');
  assertProjectRevision(PJ,req.headers['x-contentos-revision']);
}
function saveProject(project,req,res) {
  requestProject(req);
  const saved=commitProject(PJ,project,req.headers['x-contentos-revision']);
  req.headers['x-contentos-revision']=saved.revision;
  res.setHeader('X-ContentOS-Revision',saved.revision);
  lastProject=saved.project;
  clearRecovery(PROJECT);
  buildProject(PROJECT,saved.project);
  // Đã gắn file .cosproj (Lưu thành…) → Lưu cập nhật luôn file đó; lỗi ghi file ngoài không làm hỏng bản lưu chính.
  const projectFile=linkedProjectFile(PROJECT);
  if(!projectFile)return {};
  try{writeProjectFile(projectFile,{projectDir:PROJECT,project:saved.project,revision:saved.revision});return {projectFile};}
  catch(error){return {projectFile,projectFileError:'Đã lưu dự án nhưng chưa ghi được file '+path.basename(projectFile)+': '+error.message};}
}

// ---------- Render ----------
let job = null, renderChild = null;
// dừng cả cây tiến trình dựng (npx → hyperframes → Chrome / ffmpeg)
function killTree(pid) {
  try { if (process.platform === "win32") execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" }); else process.kill(pid, "SIGKILL"); } catch {}
}
// trạng thái xuất video do AI chạy (editor/tools/xuat-video.mjs ghi)
const RENDER_FILE = () => path.join(PROJECT, "work", "render.json");
const renderDead = (st) => { if (!st?.running || st.waitingAi || !st.pid) return false; try { process.kill(st.pid, 0); return false; } catch { return true; } };
let lastProject = null; // bản mới nhất từ editor (kể cả chưa lưu) — dùng cho ảnh thẻ
// target: {dir,name,overwrite} người dùng chọn trong hộp Xuất; không có → thư mục xuất đã nhớ + tên tự đặt
// Máy không GPU + có máy xuất hộ trực tuyến: gửi việc qua hàng chờ trên NAS, theo dõi tiến độ, xong chép về thư mục xuất của máy này.
function startRemoteRender(quality,target,helper){
  const renderProject=PROJECT,revision=projectRevision(path.join(renderProject,'project.json'));
  const fjob=submitJob(ROOT,{projectDir:renderProject,quality,revision});
  const state=job={projectDir:renderProject,revision,running:true,quality,output:null,progress:0,ok:null,startedAt:Date.now(),remote:{host:helper.host,gpu:helper.gpu,id:fjob.id},log:`Gửi sang máy xuất hộ ${helper.host} (${helper.gpu}).`};
  const timer=setInterval(()=>{
    const j=readJob(ROOT,fjob.id);if(!j)return;
    if(state.cancelled&&!j.cancelRequested)cancelJob(ROOT,fjob.id);
    state.progress=j.progress||0;state.log=(j.status==='queued'?`Đang chờ máy ${helper.host} nhận việc…`:`Máy ${j.worker||helper.host} đang xuất hộ…`)+'\n'+(j.log||'');
    if(j.status==='queued'&&Date.now()-j.createdAt>180000){cancelJob(ROOT,fjob.id);clearInterval(timer);state.running=false;state.ok=false;state.log=`Máy xuất hộ ${helper.host} không nhận việc sau 3 phút. Bấm Xuất lại (máy này sẽ tự xuất nếu không còn máy xuất hộ).`;return;}
    if(!['done','failed','cancelled'].includes(j.status))return;
    clearInterval(timer);state.running=false;
    if(j.status!=='done'){state.ok=false;if(j.status==='cancelled')state.cancelled=true;state.log+=`\nMáy xuất hộ ${j.worker||helper.host} báo lỗi (mã ${j.exitCode}).`;return;}
    let saved=path.join(ROOT,j.saved);const dest=normWinDir(target?.dir?path.resolve(normWinDir(target.dir)):exportDir());
    if(dest&&path.resolve(dest)!==path.resolve(renderProject,'renders'))try{
      fs.mkdirSync(dest,{recursive:true});
      const wanted=target?.name?exportFileName(target.name,path.basename(renderProject)):path.basename(saved);
      const base=path.basename(wanted,path.extname(wanted)),replace=!!(target?.name&&target.overwrite);
      let to=path.join(dest,wanted);
      if(!replace)for(let k=2;fs.existsSync(to);k++)to=path.join(dest,`${base}-${k}.mp4`);
      fs.copyFileSync(saved,to);
      if(fs.existsSync(saved+'.json'))try{fs.copyFileSync(saved+'.json',to+'.json');}catch{}
      saved=to;
    }catch(error){state.log+='\nĐã xuất xong trên máy xuất hộ nhưng chưa chép được về thư mục xuất: '+error.message;}
    Object.assign(state,{ok:true,progress:100,saved,output:saved});
  },2000);
  return state;
}
async function startRender(quality,target=null) {
  if (job && job.running) {
    if(job.projectDir!==PROJECT)throw new ProjectConflict('Máy đang xuất dự án khác. Đợi lượt đó hoàn tất.','RENDER_BUSY');
    return job;
  }
  const helper=shouldOffload(ROOT,readJson(path.join(ROOT,'workspace','settings.json'))||{});
  if(helper)return startRemoteRender(quality,target,helper);
  const renderProject=PROJECT, destination=normWinDir(target?.dir?path.resolve(normWinDir(target.dir)):exportDir());
  const destName=target?.name?exportFileName(target.name,path.basename(renderProject)):'', overwrite=!!(destName&&target.overwrite);
  const intoRenders=path.resolve(destination||path.join(renderProject,'renders'))===path.resolve(renderProject,'renders');
  const revision=projectRevision(path.join(renderProject,'project.json'));
  const state = job = { projectDir:renderProject, revision, running:true,waitingResource:true,preparing:true,quality,output:null,log:'Đang chờ lượt render trên máy.',progress:0,ok:null,startedAt:Date.now() };
  let renderLock;
  void (async()=>{
  try{renderLock=await waitForRenderLock(ROOT,{projectDir:renderProject,kind:'editor'},{validate:()=>{if(state.cancelled)throw new Error('Đã hủy chờ render.');assertProjectRevision(path.join(renderProject,'project.json'),revision);}});state.waitingResource=false;state.log='Đang chụp bản dựng và tư liệu.';}
  catch(error){state.running=false;state.preparing=false;state.waitingResource=false;state.ok=false;state.log=error.message;return state;}
  let snapshot;
  try{snapshot=await createRenderSnapshot(renderProject,{revision:state.revision,quality});state.snapshotId=snapshot.manifest.id;state.preparing=false;}catch(error){renderLock.release();state.running=false;state.ok=false;state.preparing=false;state.log=error.message;return state;}
  if(state.cancelled){renderLock.release();state.running=false;state.ok=false;state.log='Đã hủy trong lúc chuẩn bị bản chụp render.';return state;}
  const slug = path.basename(renderProject);
  const base = destName ? path.basename(destName, path.extname(destName)) : quality === "draft" ? `${slug}-nhap` : `${slug}-final`;
  fs.mkdirSync(path.join(renderProject, "renders"), { recursive: true });
  // Giữ bản xuất cũ; mỗi lượt lưu tên mới -2, -3… (trừ khi người dùng đã đồng ý ghi đè đúng file trong renders/)
  let name = `${base}.mp4`;
  for (let k = 2; ; k++) {
    const f = path.join(renderProject, "renders", name);
    if((!fs.existsSync(f)&&!fs.existsSync(f+".json"))||(overwrite&&intoRenders&&k===2))break;
    name = `${base}-${k}.mp4`;
  }
  const out = `renders/${name}`;
  const q = quality === "draft" ? "draft" : "high";
  const launch=hyperframesCommand(ROOT,["render", "--quality", q, "--fps", "30", "--gpu", "--sdr", "--output", out]); // --gpu: tự dò NVENC/QSV/AMF · --sdr: ép xuất H.264 Rec.709 chuẩn, tránh hdr_layered làm tối hình & đen viền chữ
  state.launcher=launch.source;
  const child = spawnShellSafe(spawn, launch.command, launch.args, {
    cwd: snapshot.directory, shell: launch.shell, env: renderEnvironment(ROOT),windowsHide:true,
  });
  state.output=out;state.log='';
  renderLock.child(child.pid);
  renderChild = child;
  let sawComplete = false;
  const onData = (d) => {
    const s = d.toString().replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
    if (/Render complete/i.test(s)) sawComplete = true; // có máy thoát mã Ctrl+C (0xC000013A) ngay sau khi hyperframes báo xong
    state.log = (state.log + s).slice(-6000);
    const m = s.match(/(\d{1,3}(?:\.\d+)?)\s*%/g);
    if (m) state.progress = Math.min(100, parseFloat(m[m.length - 1]));
  };
  child.stdout.on("data", onData);
  child.stderr.on("data", onData);
  child.on('error',error=>{renderLock.release();state.running=false;state.ok=false;state.log='Không khởi chạy được render: '+error.message;});
  child.on("close", async (code) => {
    state.exitCode=code;
    try {
    if(renderChild===child)renderChild = null;
    if (state.cancelled) return;
    // Mã thoát khác 0 sau "Render complete" vẫn nhận nếu file có mặt; finalizeRenderArtifactAsync kiểm lại file trước khi lưu.
    state.ok = fs.existsSync(path.join(snapshot.directory, out)) && (code === 0 || sawComplete);
    if (state.ok && code !== 0) state.exitNote = `Tiến trình render thoát với mã ${code} sau khi báo hoàn tất; đã kiểm lại file trước khi nhận.`;
    if (state.ok) {
      try{state.finalizing=true;state.ok=null;Object.assign(state,await finalizeRenderArtifactAsync({snapshot,projectDir:renderProject,output:out,destination,destName,overwrite,quality}));state.ok=true;state.progress=100;}
      catch(error){state.ok=false;state.log+='\nKhông xác minh/lưu được bản xuất: '+error.message;}
    }
    }finally{
      state.finalizing=false;state.running=false;
      renderLock.release();
      const result={snapshotId:state.snapshotId,revision:state.revision,projectDir:renderProject,quality:state.quality,ok:state.ok,cancelled:!!state.cancelled,output:state.saved||null,probe:state.probe||null,...(state.ok?{bytes:state.bytes,sha256:state.sha256,loudnorm:state.loudnorm,warnings:state.warnings||[],...(state.audioLoudness?{audioLoudness:state.audioLoudness}:{}),...(state.audioHeadroom?{audioHeadroom:state.audioHeadroom}:{})}:{}),finishedAt:new Date().toISOString()};
      // xuất lỗi: giữ log + máy để tra nguyên nhân (UI chỉ hiện mã thoát; nhiều máy dùng chung app trên NAS)
      if(!state.ok&&!state.cancelled)try{fs.writeFileSync(path.join(snapshot.directory,'render.log'),`máy: ${os.hostname()} · ${new Date().toISOString()}\n${state.log||''}\n`);}catch{}
      try{fs.writeFileSync(path.join(snapshot.directory,'result.json'),JSON.stringify(result,null,2)+'\n');if(state.ok)fs.writeFileSync(path.join(renderProject,out)+'.json',JSON.stringify(result,null,2)+'\n');}catch(error){state.metadataError='Không lưu được thông tin phiên bản bản xuất: '+error.message;}
    }
  });
  })().catch(error=>{renderLock?.release();state.running=false;state.preparing=false;state.waitingResource=false;state.ok=false;state.log=error.message;});
  return state;
}


// Đã bỏ "Tự xuất khi AI dựng xong": AI dựng xong luôn chờ người dùng kiểm tra rồi bấm Xuất.
// Map giữ lại vì màn Hoạt động còn đọc (luôn rỗng).
const completionExports=new Map();
// ---------- Thư mục lưu video xuất (người dùng tự chọn, nhớ cho mọi dự án) ----------
const SETTINGS = path.join(ROOT, "workspace", "settings.json");
const settings = () => readJson(SETTINGS) || {};
const saveSettings = (o) => { fs.mkdirSync(path.dirname(SETTINGS), { recursive: true }); fs.writeFileSync(SETTINGS, JSON.stringify({ ...settings(), ...o }, null, 2)); };
const exportDir = () => settings().exportDir || "";
// hộp chọn thư mục của hệ điều hành (chạy trên máy người dùng)
// chạy không chặn máy chủ (hộp thoại có thể mở lâu); script ghi ra file .ps1 UTF-8 để giữ đúng tiếng Việt
const normWinDir = (d) => { const s = String(d || "").trim(); return /^[a-zA-Z]:$/.test(s) ? s + "\\" : s; };
const nearestExistingDir = (d) => {
  let cur = normWinDir(d);
  while (cur) {
    try { if (fs.existsSync(cur) && fs.statSync(cur).isDirectory()) return cur; } catch {}
    const parent = path.dirname(cur);
    if (!parent || parent === cur) break;
    cur = parent;
  }
  return os.homedir();
};
const psq = (s) => `'${String(s).replace(/'/g, "''")}'`;
function pickFolder(start) {
  return new Promise((resolve) => {
    let cmd, argv, ps1, outFile;
    if (process.platform === "win32") {
      const id = crypto.randomUUID();
      ps1 = path.join(os.tmpdir(), `vek-chon-thu-muc-${id}.ps1`);
      outFile = path.join(os.tmpdir(), `vek-chon-thu-muc-${id}.txt`);
      const initDir = start ? nearestExistingDir(start) : "";
      fs.writeFileSync(ps1, "\ufeff" + [
        "Add-Type -AssemblyName System.Windows.Forms",
        "$d = New-Object System.Windows.Forms.FolderBrowserDialog",
        "$d.Description = 'Chọn thư mục lưu video xuất'",
        "$d.ShowNewFolderButton = $true",
        initDir ? `$d.SelectedPath = ${psq(initDir)}` : "",
        "$f = New-Object System.Windows.Forms.Form -Property @{TopMost=$true; ShowInTaskbar=$true; Opacity=0; StartPosition='CenterScreen'; Size='1,1'}",
        "$f.Show(); $f.Activate()",
        `if ($d.ShowDialog($f) -eq 'OK') { [IO.File]::WriteAllText(${psq(outFile)}, $d.SelectedPath, [Text.UTF8Encoding]::new($false)) }`,
      ].join("\r\n"), "utf8");
      cmd = "powershell"; argv = ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", ps1];
    } else if (process.platform === "darwin") {
      cmd = "osascript"; argv = ["-e", 'POSIX path of (choose folder with prompt "Chọn thư mục lưu video xuất")'];
    } else return resolve("");
    let out = "";
    const done = (v) => {
      let res = v;
      if (outFile && fs.existsSync(outFile)) { try { res = fs.readFileSync(outFile, "utf8").trim(); } catch {} }
      if (ps1) fs.rmSync(ps1, { force: true });
      if (outFile) fs.rmSync(outFile, { force: true });
      resolve(res);
    };
    const c = spawn(cmd, argv, { windowsHide: false });
    c.stdout.on("data", (d) => (out += d));
    c.on("error", () => done(""));
    c.on("close", () => done(out.trim().split(/\r?\n/).pop()?.trim() || ""));
  });
}
// Hộp Lưu/Mở file của hệ điều hành (ghi kết quả ra file tạm UTF-8 để giữ nguyên đường dẫn tiếng Việt/ổ mạng khi chạy nền). Hủy → "".
function pickFile({ save = false, title, start = "", name = "", filter = "", ext = "" }) {
  return new Promise((resolve) => {
    let cmd, argv, ps1, outFile;
    if (process.platform === "win32") {
      const id = crypto.randomUUID();
      ps1 = path.join(os.tmpdir(), `vek-chon-file-${id}.ps1`);
      outFile = path.join(os.tmpdir(), `vek-chon-file-${id}.txt`);
      const initDir = nearestExistingDir(start);
      fs.writeFileSync(ps1, "\ufeff" + [
        "Add-Type -AssemblyName System.Windows.Forms",
        `$d = New-Object System.Windows.Forms.${save ? "SaveFileDialog" : "OpenFileDialog"}`,
        `$d.Title = ${psq(title)}`,
        `$d.InitialDirectory = ${psq(initDir)}`,
        "$d.RestoreDirectory = $true",
        name ? `$d.FileName = ${psq(name)}` : "",
        filter ? `$d.Filter = ${psq(filter)}` : "",
        ext ? `$d.DefaultExt = ${psq(ext)}; $d.AddExtension = $true` : "",
        save ? "$d.OverwritePrompt = $false" : "$d.CheckFileExists = $true", // ghi đè: app tự hỏi một lần lúc thực hiện
        "$f = New-Object System.Windows.Forms.Form -Property @{TopMost=$true; ShowInTaskbar=$true; Opacity=0; StartPosition='CenterScreen'; Size='1,1'}",
        "$f.Show(); $f.Activate()",
        `if ($d.ShowDialog($f) -eq 'OK') { [IO.File]::WriteAllText(${psq(outFile)}, $d.FileName, [Text.UTF8Encoding]::new($false)) }`,
      ].join("\r\n"), "utf8");
      cmd = "powershell"; argv = ["-NoProfile", "-STA", "-ExecutionPolicy", "Bypass", "-File", ps1];
    } else if (process.platform === "darwin") {
      cmd = "osascript"; argv = ["-e", save ? `POSIX path of (choose file name with prompt ${JSON.stringify(title)} default name ${JSON.stringify(name || "untitled")})` : `POSIX path of (choose file with prompt ${JSON.stringify(title)})`];
    } else return resolve("");
    let out = "";
    const done = (v) => {
      let res = v;
      if (outFile && fs.existsSync(outFile)) { try { res = fs.readFileSync(outFile, "utf8").trim(); } catch {} }
      if (ps1) fs.rmSync(ps1, { force: true });
      if (outFile) fs.rmSync(outFile, { force: true });
      resolve(res);
    };
    const c = spawn(cmd, argv, { windowsHide: false });
    c.stdout.on("data", (d) => (out += d));
    c.on("error", () => done(""));
    c.on("close", () => done(out.trim().split(/\r?\n/).pop()?.trim() || ""));
  });
}
// mở thư mục chứa file (chọn sẵn file) trong Explorer / Finder
function revealFile(file) {
  if (process.platform === "win32") spawn("explorer.exe", [`/select,${file}`], { detached: true, stdio: "ignore" }).unref();
  else if (process.platform === "darwin") spawn("open", ["-R", file], { detached: true, stdio: "ignore" }).unref();
  else spawn("xdg-open", [path.dirname(file)], { detached: true, stdio: "ignore" }).unref();
}

// ---------- Thumbnail cho thẻ (cache trong .editor-cache/) ----------
const thumbJobs = new Map();
function thumb(req, res, q) {
  const src = safeJoin(PROJECT, q.get("src") || "");
  if (!src || !fs.existsSync(src)) return send(res, 404, "");
  if (/\.(png|jpe?g|webp|gif)$/i.test(src)) return sendFile(req, res, src);
  const t = Math.max(0, Number(q.get("t")) || 0).toFixed(2);
  const dir = path.join(PROJECT, ".editor-cache");
  fs.mkdirSync(dir, { recursive: true });
  // ?w= bề ngang ảnh (mặc định 360 — ảnh nhỏ cho thẻ; ảnh bìa lấy khung đầy đủ tới 1920)
  const w = Math.min(1920, Math.max(120, Number(q.get("w")) || 360));
  const key = `${path.basename(src).replace(/\W/g, "_")}-${t}${w !== 360 ? "-w" + w : ""}.jpg`;
  const out = path.join(dir, key);
  if (fs.existsSync(out)) return sendFile(req, res, out);
  let jobP = thumbJobs.get(key);
  if (!jobP) {
    jobP = new Promise((resolve) => {
      const grab = (seek) => spawn("ffmpeg", ["-v", "error", "-y", ...seek, "-i", src, "-frames:v", "1", "-vf", `scale=${w}:-2`, "-q:v", w > 360 ? "2" : "5", out]);
      const done = () => { thumbJobs.delete(key); resolve(); };
      const c = grab(["-ss", t]);
      c.on("close", () => {
        if (fs.existsSync(out)) return done();
        // thời điểm ở sát / quá cuối video: không có khung nào → lấy khung cuối
        const last = grab(["-sseof", "-1"]);
        last.on("close", done); last.on("error", done);
      });
      c.on("error", done);
    });
    thumbJobs.set(key, jobP);
  }
  jobP.then(() => (fs.existsSync(out) ? sendFile(req, res, out) : send(res, 404, "")));
}

// ---------- Filmstrip + waveform cho timeline (tính 1 lần, cache theo mtime video) ----------
const TILE_W = 54, TILE_H = 96, COLS = 20;
const memo = new Map();
function sourceFile() {
  const pj = JSON.parse(fs.readFileSync(PJ, "utf8"));
  const f = safeJoin(PROJECT, pj.source?.video || "");
  if (!f || !fs.existsSync(f)) throw new Error("Không thấy video gốc");
  return { file: f, duration: Number(pj.source?.duration) || 0 };
}
function once(key, fn) {
  if (!memo.has(key)) memo.set(key, fn().catch((e) => { memo.delete(key); throw e; }));
  return memo.get(key);
}
function run(cmd, argv) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, argv);
    const out = [];
    c.stdout.on("data", (d) => out.push(d));
    c.on("error", reject);
    c.on("close", (code) => (code === 0 ? resolve(Buffer.concat(out)) : reject(new Error(`${cmd} exit ${code}`))));
  });
}
async function strip() {
  const { file, duration } = sourceFile();
  const tag = `${fs.statSync(file).mtimeMs | 0}`;
  return once(`strip-${tag}`, async () => {
    const dir = path.join(PROJECT, ".editor-cache");
    fs.mkdirSync(dir, { recursive: true });
    const img = path.join(dir, `strip-${tag}.jpg`);
    const fps = Math.min(2, 400 / Math.max(duration, 1));
    const frames = Math.ceil(duration * fps) + 1;
    const rows = Math.ceil(frames / COLS);
    if (!fs.existsSync(img)) {
      await run("ffmpeg", ["-v", "error", "-y", "-i", file, "-vf",
        `fps=${fps},scale=${TILE_W}:${TILE_H}:force_original_aspect_ratio=increase,crop=${TILE_W}:${TILE_H},tile=${COLS}x${rows}`,
        "-frames:v", "1", "-q:v", "4", img]);
    }
    return { url: `/p/.editor-cache/strip-${tag}.jpg`, fps, cols: COLS, rows, tw: TILE_W, th: TILE_H };
  });
}
async function wave() { return wavePeaks(sourceFile().file); }
// Đỉnh âm thanh 20/giây của một file (giọng gốc, nhạc nền, thuyết minh) cho waveform trên timeline.
async function wavePeaks(file) {
  const tag = `${file}:${fs.statSync(file).mtimeMs | 0}`;
  return once(`wave-${tag}`, async () => {
    const rate = 4000, per = 20; // 20 đỉnh mỗi giây
    const pcm = await run("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(rate), "-f", "s16le", "-"]);
    const n = Math.floor(pcm.length / 2), step = rate / per, peaks = [];
    for (let i = 0; i < n; i += step) {
      let m = 0;
      for (let j = i; j < Math.min(n, i + step); j++) m = Math.max(m, Math.abs(pcm.readInt16LE(j * 2)));
      peaks.push(Math.round((m / 32768) * 100) / 100);
    }
    return { per, peaks };
  });
}

// ---------- .env của kit (ANTHROPIC_API_KEY cho "Nhờ AI sửa") ----------
for (const envFile of [path.join(KIT, "..", ".env"), path.join(KIT, ".env")]) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---------- Tải file lên (kéo thả vào app) → inputs/ ----------
const UPLOAD_OK = /\.(mp4|mov|webm|m4v|png|jpe?g|webp|gif|mp3|wav|m4a|aac)$/i;
function upload(req, res, q) {
  const raw = path.basename(String(q.get("name") || "file")).normalize("NFC");
  if (!UPLOAD_OK.test(raw)) return json(res, { ok: false, error: "Chỉ nhận video, ảnh hoặc nhạc." }, 400);
  const ext = path.extname(raw).toLowerCase();
  const base = raw.slice(0, -ext.length).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
  // ?dir=<dự án> (màn Dự án: thêm tư liệu cho việc giao AI), không có thì dự án đang mở
  const proj = q.get("dir") ? safeJoin(ROOT, q.get("dir")) : PROJECT;
  if (!proj || !fs.existsSync(path.join(proj, "project.json"))) return json(res, { ok: false, error: "Không thấy dự án." }, 400);
  const need = (Number(req.headers["content-length"]) || 0) + 536870912, sp = diskSpace(); // file + 0,5 GB dư
  if (sp.free && sp.free < need) { req.resume(); return json(res, { ok: false, noSpace: true, error: noSpaceMsg() }, 507); }
  const dir = path.join(proj, "inputs");
  fs.mkdirSync(dir, { recursive: true });
  let name = `${base}${ext}`, i = 2;
  while (fs.existsSync(path.join(dir, name))) name = `${base}-${i++}${ext}`;
  const dest = path.join(dir, name);
  const out = fs.createWriteStream(dest);
  req.pipe(out);
  out.on("finish", () => json(res, { ok: true, path: `inputs/${name}`, media: proj === PROJECT ? listMedia() : undefined }));
  out.on("error", (e) => { fs.rmSync(dest, { force: true }); json(res, { ok: false, error: String(e.message) }, 500); });
}

// ---------- Brand kit: lưu chung cho mọi project tại editor/brands/ ----------
const BRANDS = path.join(KIT, "brands");
const slug = (s) => String(s || "brand").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/[^\w-]+/g, "-").toLowerCase().slice(0, 50) || "brand";
function listBrands() {
  if (!fs.existsSync(BRANDS)) return [];
  return fs.readdirSync(BRANDS).filter((f) => f.endsWith(".json"))
    .map((f) => { try { return { id: f.slice(0, -5), ...JSON.parse(fs.readFileSync(path.join(BRANDS, f), "utf8")) }; } catch { return null; } })
    .filter(Boolean);
}

// ---------- Lịch sử phiên bản (.history/project-<ms>.json, ghi mỗi lần Lưu) ----------
function listHistory() {
  const dir = path.join(PROJECT, ".history");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^project-\d+\.json$/.test(f)).sort().reverse().map((f) => {
    const p = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); } catch { return {}; } })();
    return {
      file: f, time: Number(f.match(/\d+/)[0]),
      texts: (p.texts || []).length, scenes: (p.scenes || []).length,
      cut: (p.segments || []).filter((s) => s.keep === false).length, captions: !!p.captions?.enabled,
    };
  });
}

// ---------- "Nhờ AI sửa": Claude sửa project.json theo yêu cầu ----------
// Hàm (không phải hằng) để nhạc mới thêm vào thư viện có ngay trong lời dặn, không cần khởi động lại.
const aiSystem = () => `Bạn chỉnh sửa project video của một editor HyperFrames — khung theo trường "format": "9:16" dọc 1080x1920 (mặc định) hoặc "16:9" ngang 1920x1080 (toạ độ x/y, cỡ chữ theo khung đó). Bạn nhận project.json hiện tại và một yêu cầu của người dựng, và trả về project đã sửa.

Cấu trúc project.json:
- segments[]: đoạn lời nói {id, in, out, keep, text, tIn?} — in/out là giây của video gốc; keep:false là đã cắt.
- texts[]: chữ nhấn {id, at, dur, label?, title, sub?, fx: words|slide|mask|marker|type, style?, anim?, x?, y?, scale?, size?, hidden?}. "at" là giây video GỐC. title: 2–6 từ, *từ* để nhấn marker, | để xuống dòng.
  · style: ${TEXT_STYLES.filter((s) => s.id !== "none").map((s) => s.id).join("|")}.
  · anim = hiệu ứng Vào/Ra kiểu CapCut: {in?:{type,dur}, out?:{type,dur}, loop?:{type,speed}}, dur 0.2–2s. in: ${TEXT_ANIMS.in.map((a) => a.id).join("|")}. out: ${TEXT_ANIMS.out.map((a) => a.id).join("|")}. loop: ${TEXT_ANIMS.loop.map((a) => a.id).join("|")}.
  · anim.in THAY hiệu ứng vào của fx → chữ fx marker/mask/type chỉ đặt out. Chữ đã có anim là lựa chọn của người dùng/mẫu: không đổi trừ khi được yêu cầu.
  · Khi được nhờ chọn/làm đa dạng hiệu ứng chữ: hook (chữ đầu, < 3s) in zoom-out/out fade; số liệu, giá in bounce/out zoom-out; cảnh báo (đừng, sai, lỗi) in shake/out drop; câu hỏi in blur/out fade; còn lại xoay các cặp slide-up/fade, zoom-in/zoom-out, slide-left/slide-left, blur/blur, bounce/shrink, slide-right/drop, slide-down/slide-up — hai chữ liền nhau không cùng in. dur: in 0.45/out 0.35 (chữ < 1.5s: 0.3/0.25). loop chỉ cho 1–2 chữ quan trọng nhất.
- zooms[]: {id, at, dur, amount 1.04–1.12}.
- scenes[]: cảnh nền đen {id, type: process|stat|compare|timeline|doc, at, dur, tIn?: fade|slide|zoom|wipe|none, data, layout?}.
  data theo type: process {kicker?, title, steps[]}; stat {kicker?, title, value, prefix?, suffix?, max?, label}; compare {title, beforeLabel, before[], afterLabel, after[]}; timeline {title, items[{time,label}]}; doc {title, docTitle, lines[], highlight[] (chỉ số), result}.
- brolls[]: cảnh trám {id, src, at, dur, mode: split|full|pip, tIn?, x?, y?, scale?}. Chỉ dùng file có sẵn trong project.
- captions: phụ đề {enabled, y, x, scale, maxWords, hideOnScenes} — nội dung từng dòng KHÔNG gửi cho bạn; muốn sửa chữ phụ đề thì trả về captionEdits.
- brand: {fontTitle, fontSub, fontLabel, c1, c2, c3, sub, caption:{style: pill|clean|bold|box, size, color, active, uppercase}}.
- camera: {scale, x, y, faceY, color:{brightness, contrast, saturate, temp -1..1, vignette 0..1}}. transitions: {cut: none|fade|flash|zoom|blur|slide}.
- audio: {voice, music, musicVolume, sfxVolume, sfxLevel, cutSfx?, wordSfx?, sfx[{at, kind, vol?}]}.
  · music: "" (không nhạc) | "kit:<tên>" trong danh sách dưới | đường dẫn file nhạc đã nhập trong project. Chọn theo tâm trạng nội dung; video < 60s ưu tiên bài "ngắn". musicVolume 0.06–0.14 khi có người nói.
  · sfxLevel: "nhieu" (mặc định) | "vua" | "tat" — build TỰ đặt tiếng cho chữ, khối, cảnh, cảnh trám, zoom, chuyển đoạn. Muốn thêm/bớt tiếng thì ưu tiên đổi sfxLevel, hoặc đặt sfx/sfxVol ngay trên từng mục (texts/scenes/brolls/zooms: sfx = tên tiếng | "none"), chỉ dùng audio.sfx khi không có mục nào đúng lúc đó.
  · cutSfx:true = riser + boom ở chuyển đoạn có hiệu ứng (chỉ cho video nhịp mạnh/quảng cáo). wordSfx:true = tiếng theo từ khoá phụ đề.
  · audio.sfx[].at là giây video GỐC (như segments.in). kind PHẢI là một trong: ${SFX_KINDS.filter((k) => !k.startsWith("nas-")).join(", ")}, hoặc tên nas-* ở kho Hay dùng dưới. Tên khác bị bỏ khi dựng.
  · Kho Hay dùng của ChungAuto (nas-*, theo nhóm): ${Object.entries(Object.entries(kitSfxLibrary(KIT)).reduce((g, [k, m]) => ({ ...g, [m.group]: [...(g[m.group] || []), k] }), {})).map(([g, ks]) => `${g}: ${ks.join(", ")}`).join(" | ")}.
  · Tiếng Cười / Phản ứng / Lò xo / Hoạt hình là tiếng meme: chỉ dùng khi video có giọng hài/đời thường, đặt vào khoảng lặng NGAY SAU câu đắt (không đè lên lời), 1–3 lần/phút, không lặp lại một tiếng; KHÔNG dùng cho quảng cáo, tin tức, nội dung nghiêm túc.
  · Không đặt SFX trong 0.6s đầu, không 2 tiếng cách nhau < 0.25s; mỗi tiếng phải có nguyên nhân trên hình (whoosh = chuyển cảnh, pop = chữ/nhãn bật ra, keys/tick = chữ gõ, impact-boom/boom = cao trào, chỉ 1–2 lần/video).
- Nhạc có sẵn (kit): ${kitMusicList(KIT).map((m) => `${m.id} [${m.mood.join("/")}${m.duration ? ", " + Math.round(m.duration) + "s" : ""}${m.short ? ", ngắn" : ""}]`).join("; ")}.

Cắt (segments): đoạn vấp, nói lại, bỏ dở, chỉ có "ờ/à/ừm" → keep:false; khi một câu nói nhiều lần giữ lần SAU CÙNG trọn câu. Không sửa in/out ra ngoài lời nói, không xoá đoạn khỏi mảng.

Quy tắc:
- Chỉ đổi đúng những gì được yêu cầu, giữ nguyên mọi id và mọi trường khác.
- Không tự tạo số liệu, bằng chứng hay kết quả không có trong nội dung lời nói.
- Giữ dấu tiếng Việt đầy đủ.
- Trả lời DUY NHẤT một đối tượng JSON, không kèm chữ nào khác:
  {"summary": "<1–2 câu tiếng Việt: đã đổi gì>", "project": <toàn bộ project đã sửa>, "captionEdits": [{"id": "<id dòng phụ đề>", "text": "<chữ mới>"}]}
  captionEdits có thể là mảng rỗng.`;

function aiPayload(project) {
  const p = structuredClone(project);
  const captionLines = (p.captions?.lines || []).map((l) => ({ id: l.id, text: (l.words || []).map((w) => w.w).join(" ") }));
  if (p.captions) delete p.captions.lines;
  return { p, captionLines };
}
function parseAiJson(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("AI không trả về JSON.");
  return JSON.parse(t.slice(a, b + 1));
}
function whichClaude() {
  try {
    const cmd = process.platform === "win32" ? "where claude" : "command -v claude";
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split(/\r?\n/)[0].trim() || null;
  } catch { return null; }
}
async function askClaude(userText) {
  // 1) Claude Code CLI nếu máy có (dùng gói Claude của người dùng, không cần API key)
  const cli = whichClaude();
  if (cli && !process.env.ANTHROPIC_API_KEY) {
    const out = await new Promise((resolve, reject) => {
      const c = spawn(cli, ["-p", "--output-format", "text"], { shell: process.platform === "win32" });
      const chunks = [];
      c.stdout.on("data", (d) => chunks.push(d));
      c.on("error", reject);
      c.on("close", (code) => (code === 0 ? resolve(Buffer.concat(chunks).toString("utf8")) : reject(new Error(`claude CLI thoát mã ${code}`))));
      c.stdin.end(`${aiSystem()}\n\n${userText}`);
    });
    return { text: out, via: "Claude Code CLI" };
  }
  // 2) Claude API (ANTHROPIC_API_KEY trong .env)
  let Anthropic;
  try { ({ default: Anthropic } = await import("@anthropic-ai/sdk")); }
  catch { throw new Error("Chưa cài thư viện. Chạy: cd editor && npm install"); }
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN)
    throw new Error("Chưa có ANTHROPIC_API_KEY trong file .env của kit (hoặc cài Claude Code CLI).");
  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 64000,
    output_config: { effort: "medium" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: aiSystem(),
    messages: [{ role: "user", content: userText }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("Claude từ chối yêu cầu này.");
  if (msg.stop_reason === "max_tokens") throw new Error("Kết quả quá dài, bị cắt giữa chừng.");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { text, via: msg.model };
}
async function aiEdit(body) {
  const instruction = String(body.instruction || "").trim();
  if (!instruction) throw new Error("Hãy nhập yêu cầu.");
  const { p, captionLines } = aiPayload(body.project);
  const tf = path.join(PROJECT, "work/transcript.json");
  const words = fs.existsSync(tf) ? (JSON.parse(fs.readFileSync(tf, "utf8")).words || []) : [];
  const transcript = words.map((w) => `${Number(w.start).toFixed(1)} ${w.word ?? w.text}`).join(" | ").slice(0, 60000);
  const userText = [
    `Yêu cầu của người dựng: ${instruction}`,
    body.context ? `Mục đang chọn trong editor: ${JSON.stringify(body.context)}` : "",
    templateSkill(body.project?.template?.id) ? `Video đang dùng mẫu "${body.project.template.name}". Làm theo quy tắc của mẫu:\n${templateSkill(body.project.template.id)}` : "",
    `project.json hiện tại:\n${JSON.stringify(p)}`,
    captionLines.length ? `Các dòng phụ đề (id: chữ):\n${captionLines.map((l) => `${l.id}: ${l.text}`).join("\n")}` : "",
    transcript ? `Lời nói (giây gốc + từ):\n${transcript}` : "",
  ].filter(Boolean).join("\n\n");
  const { text, via } = await askClaude(userText);
  const out = parseAiJson(text);
  if (!out.project || typeof out.project !== "object") throw new Error("AI trả về project không hợp lệ.");
  // Ghép lại phụ đề (không gửi cho AI) + áp dụng chỉnh sửa chữ phụ đề.
  const { retimeLine } = await import("./lib/brand.js");
  const orig = body.project.captions?.lines || [];
  out.project.captions = { ...(out.project.captions || {}), lines: orig.map((l) => {
    const ed = (out.captionEdits || []).find((e) => e.id === l.id);
    return ed ? retimeLine(l, ed.text) : l;
  }) };
  return { ok: true, summary: String(out.summary || "Đã cập nhật."), project: out.project, via };
}

// ---------- Thư viện mẫu video ----------
// library/<id>/   : mẫu có sẵn để xem trước (template.json, SKILL.md, preview.mp4, poster.jpg)
// templates/<id>/ : mẫu đã "tải về" (cài) vào phần mềm — dùng được cho mọi project.
// LIBRARY_URL (tuỳ chọn, trong .env): thư viện online — <url>/catalog.json + <url>/<id>/<file>.
const LIBRARY = path.join(KIT, "library");
const TEMPLATES = path.join(KIT, "templates");
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; } };
const LIB_FILES = ["template.json", "SKILL.md", "preview.mp4", "poster.jpg"];
// Xoá thư mục trên ổ mạng (SMB/NAS) hay báo ENOTEMPTY / EBUSY vì ổ chưa kịp cập nhật → để Node tự thử lại vài lần
const RM_NAS = { recursive: true, force: true, maxRetries: 8, retryDelay: 250 };

// ---------- Tài khoản (máy chủ cloud) ----------
// Địa chỉ máy chủ: CLOUD_URL (.env) → version.json updateUrl → LIBRARY_URL.
// Đăng nhập lưu ở editor/.account.json (giữ nguyên khi cập nhật). Mất mạng vẫn dùng được 7 ngày.
const ACCOUNT_FILE = path.join(KIT, ".account.json");
// "free" = gói Basic · "none" = tài khoản chưa kích hoạt gói (khoá cả mẫu Basic)
const RANK = { none: -1, free: 0, pro: 1, premium: 2 };
const cloudBase = () => (process.env.CLOUD_URL || localVersion().updateUrl || process.env.LIBRARY_URL || "").replace(/\/$/, "");
// tài khoản quản trị luôn ở gói cao nhất (kể cả khi máy chủ tài khoản chưa cập nhật)
const adminTop = (u) => (u?.admin ? { ...u, plan: "premium", planName: "Premium", planExpires: null } : u);
const account = () => { const a = readJson(ACCOUNT_FILE); return a?.user ? { ...a, user: adminTop(a.user) } : a; };
const saveAccount = (a) => (a ? fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(a, null, 2)) : fs.rmSync(ACCOUNT_FILE, { force: true }));
async function cloud(p, { method = "GET", body, auth = true, raw = false } = {}) {
  const base = cloudBase();
  if (!base) throw Object.assign(new Error("Chưa cấu hình máy chủ tài khoản (CLOUD_URL)."), { status: 0 });
  const headers = { "Content-Type": "application/json" };
  const tok = account()?.token;
  if (auth && tok) headers.Authorization = "Bearer " + tok;
  const r = await fetch(base + p, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(raw ? 120000 : 8000) });
  if (raw) {
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || "Lỗi tải"), { status: r.status }); }
    return Buffer.from(await r.arrayBuffer());
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "Lỗi máy chủ"), { status: r.status });
  return j;
}
// editor/goi-tai.json: website gắn vào bản tải (gói + email người tải) — màn đăng nhập điền sẵn email, ghi rõ bản này của gói nào
const downloadedFor = () => { const d = readJson(path.join(KIT, "goi-tai.json")); return d?.email ? { plan: d.plan, planName: d.planName, email: d.email, version: d.version } : null; };
async function accountStatus() {
  const base = cloudBase();
  if (!base) return { configured: false, loggedIn: true, user: null }; // chưa cấu hình → không chặn (bản dùng thử nội bộ)
  const a = account();
  if (!a?.token) return { configured: true, loggedIn: false, cloudUrl: base, downloadedFor: downloadedFor() };
  try {
    const j = await cloud("/api/me");
    saveAccount({ ...a, user: j.user, checkedAt: Date.now() });
    if (j.user?.plan !== a.user?.plan) { adminCache = null; versionCache = null; } // đổi gói: bỏ kết quả đã nhớ theo gói cũ
    return { configured: true, loggedIn: true, user: adminTop(j.user), cloudUrl: base, downloadedFor: downloadedFor() };
  } catch (e) {
    if (e.status === 401) { saveAccount(null); return { configured: true, loggedIn: false, cloudUrl: base, expired: true }; }
    const fresh = a.checkedAt && Date.now() - a.checkedAt < 7 * 864e5;
    return { configured: true, loggedIn: !!fresh, offline: true, user: a.user, cloudUrl: base };
  }
}
const currentPlan = () => account()?.user?.plan || (cloudBase() ? "free" : "premium");
// Tài khoản đang đăng nhập trong phần mềm — ghi vào mọi việc giao AI để AI biết đúng người dùng / gói (tải đúng bản, mở đúng tính năng)
const jobAccount = () => { const u = account()?.user; return { email: u?.email || null, plan: currentPlan() }; };

// ---------- Mạng xã hội của người dùng (gói Pro trở lên): lưu kênh trên máy · đăng video qua AI ----------
const SOCIAL_FILE = path.join(ROOT, "workspace", "social.json");
const SOCIAL_PLATFORMS = ["tiktok", "facebook", "instagram", "youtube", "threads", "linkedin", "x", "zalo"];
const socialList = () => readJson(SOCIAL_FILE) || [];
const socialSave = (l) => { fs.mkdirSync(path.dirname(SOCIAL_FILE), { recursive: true }); fs.writeFileSync(SOCIAL_FILE, JSON.stringify(l, null, 2)); };
function publishDraftSnapshot(project,channels){
 if(!project||!channels.length)return null;
 const folder=resolveContained(ROOT,project).file,pj=readJson(path.join(folder,'project.json'));
 const snapshot=snapshotPublishDrafts(ROOT,pj?.workspaceId||'default',project,channels);verifyPublishCovers(folder,pj?.workspaceId||'default',snapshot);return snapshot;
}
async function socialAllowed() {
  try { await accountStatus(); } catch {} // làm mới gói từ máy chủ tài khoản (vừa nâng cấp / hết hạn)
  return RANK[currentPlan()] >= RANK.pro;
}
async function giongAllowed() {
  try { await accountStatus(); } catch {}
  return RANK[currentPlan()] >= RANK.premium;
}
// Tạo việc "đăng video" cho AI (bấm Đăng tự động, hoặc lịch đăng tới giờ)
function makePostJob({ video, channels, project, title, note,publishDraft,publishRevision,scheduledMedia,scheduleId }) {
  const dispatch=scheduleId?scheduleDispatch(ROOT,scheduleId):null,existing=dispatch?.read();if(existing)return existing;
  const dir = path.join(WORKSPACE, "_dang-bai", scheduleId?'schedule-'+scheduleId:new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + slug(path.basename(video, path.extname(video)))+'-'+crypto.randomBytes(4).toString('hex'));
  fs.mkdirSync(path.join(dir, "work"), { recursive: true });
  const jb = { kind: "post", status: "waiting", dir: relDir(dir), video, project: project || null, title: title || "",
    templateName: `Đăng video lên ${channels.map((x) => x.name || x.platform).join(", ")}`, channels,
    note: String(note || "").slice(0, 1500), account: jobAccount(), background: process.env.VEK_AI_BACKGROUND === "1", createdAt: new Date().toISOString() };
  jb.publishDraft=publishDraft!==undefined?structuredClone(publishDraft):publishDraftSnapshot(project,channels);
  if(scheduledMedia)jb.scheduledMedia=structuredClone(scheduledMedia);
  if(jb.publishDraft&&project)jb.publishDraft=refreshPublishDraftReview(jb.publishDraft,publishRevision||projectRevision(path.join(resolveContained(ROOT,project).file,'project.json')));
  if(jb.publishDraft&&project){const folder=resolveContained(ROOT,project).file;verifyPublishCovers(folder,readJson(path.join(folder,'project.json'))?.workspaceId||'default',jb.publishDraft);}
  if(dispatch){const result=dispatch.commit(jb);if(!result.created)return result.job;Object.assign(jb,result.job);}else fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
  if (jb.background) startAgentRunner(dir);
  return jb;
}

// ---------- Tích hợp (gói Pro+): tài khoản công cụ tạo video / ảnh AI (Google Flow, Seedance, Kling…) — workspace/tich-hop.json ----------
// Chỉ lưu tên / email tài khoản, link, gói, ghi chú — KHÔNG lưu mật khẩu: người dùng tự đăng nhập trên trình duyệt, AI dùng phiên đã đăng nhập
const TICH_HOP_FILE = path.join(ROOT, "workspace", "tich-hop.json");
const TICH_HOP_TOOLS = {
  flow: { name: "Google Flow", url: "https://labs.google/fx/tools/flow", kinds: ["video", "image"] },
  seedance: { name: "Seedance (Dreamina)", url: "https://dreamina.capcut.com/ai-tool/video/generate", kinds: ["video", "image"] },
  kling: { name: "Kling AI", url: "https://app.klingai.com/global/", kinds: ["video", "image"] },
  khac: { name: "Công cụ khác", url: "", kinds: ["video", "image"] },
};
const tichHopList = () => readJson(TICH_HOP_FILE) || [];
const tichHopSave = (l) => { fs.mkdirSync(path.dirname(TICH_HOP_FILE), { recursive: true }); fs.writeFileSync(TICH_HOP_FILE, JSON.stringify(l, null, 2)); };

// ---------- Phân tích kênh (gói Pro+): workspace/content/_phan-tich-kenh/<id>/work/{ai-job,ai-progress,posts,report}.json ----------
const PHAN_TICH = path.join(WORKSPACE, "_phan-tich-kenh");
const PLATFORM_HOSTS = [["tiktok", /tiktok\.com/], ["facebook", /(facebook|fb)\.com|fb\.watch/], ["youtube", /youtube\.com|youtu\.be/], ["instagram", /instagram\.com/],
  ["threads", /threads\.(net|com)/], ["linkedin", /linkedin\.com/], ["x", /(^|\.)(x|twitter)\.com/]];
function platformOf(link) {
  let h;
  try { const u = new URL(link); if (!/^https?:$/.test(u.protocol)) return null; h = u.hostname.toLowerCase(); } catch { return null; }
  return (PLATFORM_HOSTS.find(([, re]) => re.test(h)) || [])[0] || null;
}
const phanTichDir = (id) => (id && /^[\w-]+$/.test(id) && fs.existsSync(path.join(PHAN_TICH, id, "work", "ai-job.json")) ? path.join(PHAN_TICH, id) : null);
function phanTichItem(d) {
  const j = readJson(aiJobFile(d)) || {}, pr = readJson(path.join(d, "work", "ai-progress.json")), rep = readJson(path.join(d, "work", "report.json"));
  const ready = j.status === "done" && rep?.checkedAt;
  return { id: path.basename(d), url: j.url, platform: j.platform, handle: j.handle, limit: j.limit, listen: !!j.listen, note: j.note, createdAt: j.createdAt, doneAt: j.doneAt,
    status: ready ? "done" : j.status === "error" ? "error" : j.status === "working" ? "working" : "waiting", error: j.error || null,
    step: j.status === "working" ? pr?.step || "Nhận việc" : null, pct: j.status === "working" ? pr?.pct || 3 : ready ? 100 : 0,
    name: rep?.channel?.name || null, posts: rep?.stats?.posts || null, dir: j.dir };
}
function phanTichList() {
  if (!fs.existsSync(PHAN_TICH)) return [];
  return fs.readdirSync(PHAN_TICH).map((id) => phanTichDir(id)).filter(Boolean).map(phanTichItem).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

// ---------- Lịch đăng bài: workspace/lich-dang.json — tới giờ phần mềm tự giao việc đăng cho AI ----------
// trạng thái: cho (chờ tới giờ) · dang (đã giao AI đăng) · xong · loi · huy
const LICH_FILE = path.join(ROOT, "workspace", "lich-dang.json");
const lichList = () => readJson(LICH_FILE) || [];
const lichSave = (l) => { fs.mkdirSync(path.dirname(LICH_FILE), { recursive: true }); fs.writeFileSync(LICH_FILE, JSON.stringify(l, null, 2)); };
async function lichAdd({ at, channels, project, video, title, note,renderJobDir,revision }) {
  const e = { id: crypto.randomBytes(5).toString("hex"), at: new Date(at).toISOString(), channels, project: project || null, video: video || null,
    title: title || "", note: String(note || "").slice(0, 1500), status: "cho", createdAt: new Date().toISOString() };
  e.publishDraft=publishDraftSnapshot(project,channels);
  e.scheduledMedia=video?await pinScheduledVideo(video):{schemaVersion:1,kind:'awaiting-render',renderJobDir,revision};
  const l = lichList(); l.push(e); lichSave(l);
  return e;
}
// video của mục lịch: file đã chọn, hoặc bản xuất mới nhất của dự án (render.json → output)
function lichVideo(e) {
  if (e.video && fs.existsSync(e.video)) return e.video;
  if (!e.project) return null;
  const r = readJson(path.join(ROOT, e.project, "work", "render.json"));
  const f = r?.output && !r.running ? path.join(ROOT, e.project, r.output) : null;
  return f && fs.existsSync(f) ? f : null;
}
let tickingSchedule=false;
async function lichTick() {
  if(tickingSchedule)return;tickingSchedule=true;
  try{
  const l = lichList(), now = Date.now();
  for (const e of l) {
    const initial=JSON.stringify(e);let changed=false;
    if (e.status === "cho" && Date.parse(e.at) <= now) {
      try{
        const previous=scheduleDispatch(ROOT,e.id).read();
        if(previous){Object.assign(e,scheduleJobState(previous));const current=lichList(),index=current.findIndex(item=>item.id===e.id);if(index>=0&&JSON.stringify(current[index])===initial){current[index]=e;lichSave(current);}continue;}
      }catch(error){e.status='loi';e.error=error.message;const current=lichList(),index=current.findIndex(item=>item.id===e.id);if(index>=0&&JSON.stringify(current[index])===initial){current[index]=e;lichSave(current);}continue;}
      let video;
      try{video=e.scheduledMedia?await resolveScheduledVideo(ROOT,e):lichVideo(e);}catch(error){e.status='loi';e.error='Không xác minh được video đã hẹn: '+error.message;changed=true;}
      const latest=lichList().find(item=>item.id===e.id);if(!latest||JSON.stringify(latest)!==initial)continue;
      if(e.status==='loi'){const current=lichList();current[current.findIndex(item=>item.id===e.id)]=e;lichSave(current);continue;}
      if (!video) { // video chưa xuất xong → chờ thêm; quá 6 giờ thì báo lỗi
        if (now - Date.parse(e.at) > 6 * 3600e3) { e.status = "loi"; e.error = "Chưa có đúng bản video đã hẹn để đăng.";const current=lichList();current[current.findIndex(item=>item.id===e.id)]=e;lichSave(current); }
        continue;
      }
      e.video = video;
      try{e.jobDir = makePostJob({ video, channels: e.channels, project: e.project, title: e.title, note: e.note,publishDraft:e.publishDraft,publishRevision:e.scheduledMedia?.revision,scheduledMedia:e.scheduledMedia,scheduleId:e.id }).dir;}
      catch(error){e.status='loi';e.error='Không chuẩn bị được bộ phát hành: '+error.message;const current=lichList(),index=current.findIndex(item=>item.id===e.id);if(index>=0){current[index]=e;lichSave(current);}continue;}
      e.status = "dang"; e.startedAt = new Date().toISOString(); changed = true;
    } else if (e.status === "dang" && e.jobDir) {
      const j = readJson(aiJobFile(path.join(ROOT, e.jobDir)));
      if (j?.status === "done") { e.status = "xong"; e.postedAt = j.doneAt || new Date().toISOString(); changed = true; }
      else if (j?.status === "error" || j?.status === "cancelled") { e.status = "loi"; e.error = j.error || "Việc đăng đã dừng. Kiểm tra kết quả từng kênh trước khi tạo lượt mới."; changed = true; }
      else if (!j) { e.status = "loi"; e.error = "Không đọc được việc đã giao. Kiểm tra kết quả từng kênh; không tự giao lại."; changed = true; }
    }
    if(changed){const current=lichList(),index=current.findIndex(item=>item.id===e.id);if(index>=0&&JSON.stringify(current[index])===initial){current[index]=e;lichSave(current);}}
  }
  }finally{tickingSchedule=false;}
}
// Kết quả đăng của 1 việc (AI ghi <việc>/work/da-dang.json): [{ platform, name, url, status: ok | loi, note, postedAt }]
function postResults(jobDir) {
  const r = jobDir && readJson(path.join(ROOT, jobDir, "work", "da-dang.json"));
  return (Array.isArray(r) ? r : []).map((x) => ({ platform: String(x.platform || ""), name: String(x.name || ""), url: /^https?:\/\/\S+$/.test(x.url || "") ? x.url : "",
    status: x.status === "loi" ? "loi" : "ok", note: String(x.note || "").slice(0, 200), postedAt: x.postedAt || null }));
}
// Lịch đăng + lịch sử: bài hẹn giờ (lich-dang.json) + bài "Đăng tự động" / "Xuất & đăng" ngay (việc trong _dang-bai, _xuat-video) — kèm ảnh, link bài đã đăng
function lichView() {
  const items = lichList().filter((e) => e.status !== "huy").map((e) => ({ ...e, posted: postResults(e.jobDir), poster: e.project ? `/api/project-poster?dir=${encodeURIComponent(e.project)}` : null }));
  const linked = new Set(items.map((e) => e.jobDir).filter(Boolean));
  for (const box of ["_dang-bai", "_xuat-video"]) {
    const root = path.join(WORKSPACE, box);
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      const d = path.join(root, name), j = readJson(aiJobFile(d)), rel = relDir(d);
      if (!j || linked.has(rel) || !(j.channels || []).length || j.scheduled || (j.scheduleId && items.some(item=>item.id===j.scheduleId))) continue;
      items.push({ id: "viec:" + rel, history: true, at: j.doneAt || j.startedAt || j.createdAt, channels: j.channels, project: j.project || null, video: j.video || null,
        title: j.title || "", note: j.note || "", jobDir: rel, status: j.status === "done" ? "xong" : j.status === "error" ? "loi" : "dang", error: j.error || null,
        postedAt: j.doneAt || null, posted: postResults(rel), poster: j.project ? `/api/project-poster?dir=${encodeURIComponent(j.project)}` : null });
    }
  }
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
setInterval(() => { lichTick().catch(()=>{}); }, 30000).unref();
setTimeout(() => { lichTick().catch(()=>{}); }, 3000).unref();

// ---------- Thư viện mẫu ----------
// Mẫu edit tự tạo từ Kho hiệu ứng: phong cách (font, màu, phụ đề…) lấy theo mẫu gốc nhiều mục nhất,
// presets = đúng các mục đã chọn, SKILL.md dặn AI chỉ dùng các thành phần này (tự chọn cái hợp từng câu nói).
function makeKhoTemplate({ name, ids, all, id }) {
  let kho = [];
  try { kho = JSON.parse(fs.readFileSync(path.join(ROOT, "workspace", "kho-hieu-ung.json"), "utf8")); } catch {}
  const items = all ? kho : kho.filter((x) => (ids || []).includes(x.id));
  if (!items.length) throw new Error("Chưa chọn hiệu ứng nào trong kho.");
  name = String(name || "").trim().slice(0, 60) || "Mẫu của tôi";
  const tid = slug(id || name) || "mau-cua-toi";
  const libTpl = (x) => x && readJson(path.join(TEMPLATES, x, "template.json"));
  // mẫu gốc: theo fromId, hoặc theo tên mẫu đã ghi
  const srcOf = (x) => x.fromId || (fs.existsSync(TEMPLATES) ? fs.readdirSync(TEMPLATES).find((d) => libTpl(d)?.name === x.from) : null);
  const count = {};
  for (const x of items) { const s0 = srcOf(x); if (s0) count[s0] = (count[s0] || 0) + 1; }
  const baseId = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  const base = libTpl(baseId) || {};
  const cssParts = [...new Set([base.brand?.css || "", ...items.map((x) => x.tplCss || "")].filter(Boolean))];
  const group = (x) => (x.kind === "brolls" ? "canhtram" : x.kind === "texts" || x.group === "chu" ? "chu" : "dohoa");
  const presets = items.map((x) => {
    const { savedAt, tplCss, body, from, fromId, ...rest } = x;
    return { ...rest, group: group(x) };
  });
  const n = (g) => presets.filter((x) => x.group === g).length;
  const tpl = {
    id: tid, name, version: 1, tier: "free", mine: true, web: false, order: 0,
    date: new Date().toISOString().slice(0, 10), tags: ["Của tôi"], industries: base.industries || [],
    description: `Mẫu tự tạo từ Kho hiệu ứng — ${n("chu")} chữ · ${n("dohoa")} hiệu ứng · ${n("canhtram")} cảnh trám${base.name ? ` · phong cách ${base.name}` : ""}.`,
    skill: "SKILL.md",
    brand: { ...(base.brand || {}), css: cssParts.join("\n") },
    ...(base.captions ? { captions: base.captions } : {}), ...(base.transitions ? { transitions: base.transitions } : {}),
    ...(base.camera ? { camera: base.camera } : {}), ...(base.audio ? { audio: base.audio } : {}),
    presets,
  };
  const line = (x) => `- **${x.name}**${x.desc ? " — " + x.desc : ""}${x.layer === "behind" ? " · _nằm sau người → cần tách nền_" : ""}${x.kind === "brolls" ? ` · mode \`${x.mode}\`${x.frame ? `, frame \`${x.frame}\`` : ""}, tIn \`${x.tIn}\`` : ""}`;
  const sect = (g, t) => (n(g) ? `\n### ${t}\n${presets.filter((x) => x.group === g).map(line).join("\n")}\n` : "");
  const baseSkill = baseId && fs.existsSync(path.join(TEMPLATES, baseId, "SKILL.md")) ? fs.readFileSync(path.join(TEMPLATES, baseId, "SKILL.md"), "utf8") : "";
  const skill = `# Mẫu tự tạo: ${name}

Người dùng tự chọn các thành phần này trong **Kho hiệu ứng** để làm mẫu. Khi dựng video theo mẫu này:
- **Chỉ dùng các thành phần trong \`presets\` của template.json** (không tự vẽ thêm kiểu khác). AI **tự chọn** thành phần hợp với từng câu nói:
  chữ cho ý chính / con số / câu chốt, hiệu ứng khi câu nói về thứ có hình ảnh (công cụ, bước, lịch, kết quả…), cảnh trám khi người dùng gửi kèm ảnh / video.
- Cách dùng 1 preset: \`kind: "texts"\` → thêm vào \`texts\` (giữ \`text\`: label/title/sub/fx, sửa chữ theo lời); còn lại → khối \`blocks\`
  (copy html / css / anim; \`at\` = giây gốc lúc bắt đầu, \`dur\`; anim \`at\` = giây tính từ lúc khối hiện; sửa chữ trong html theo lời nói,
  chữ \`.w\` sáng dần thì đặt mốc từng từ đúng lúc nói; giữ \`group\` để editor xếp đúng mục). Cảnh trám → \`brolls\` với \`mode\` / \`frame\` / \`tIn\` của preset.
- Thành phần **nằm sau người** (\`layer: "behind"\`) → phải tách nền (\`camera.matte\`) trước khi bàn giao.
- Đổi thành phần đều đặn, không lặp 1 thành phần quá 2 lần liền; mỗi khối 2–5s, chữ không đè mặt.
${sect("chu", "Chữ")}${sect("dohoa", "Hiệu ứng")}${sect("canhtram", "Cảnh trám")}
${baseSkill ? `\n---\n## Phong cách nền (mẫu gốc: ${base.name})\nÁp nhịp dựng, âm thanh, phụ đề theo quy tắc dưới — nhưng thành phần chỉ lấy trong danh sách trên.\n\n${baseSkill.replace(/^# .*\n/, "")}` : ""}`;
  const dir = path.join(TEMPLATES, tid);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "template.json"), JSON.stringify(tpl, null, 2) + "\n");
  fs.writeFileSync(path.join(dir, "SKILL.md"), skill);
  if (baseId && fs.existsSync(path.join(TEMPLATES, baseId, "poster.jpg"))) fs.copyFileSync(path.join(TEMPLATES, baseId, "poster.jpg"), path.join(dir, "poster.jpg"));
  return { id: tid, name, count: presets.length };
}
// Thư mục mẫu thường nằm trên ổ mạng (NAS): đọc tuần tự ~100 file mất vài giây ở máy khác → đọc song song + nhớ tạm.
// Cache đổi khi danh sách thư mục đổi (cài / xoá mẫu, kể cả từ máy khác) hoặc sau LIB_TTL.
// shortcut: mẫu bị sửa đè tại chỗ từ máy khác chỉ hiện sau tối đa 60s, cần ngay thì theo dõi mtime từng file.
const LIB_TTL = 60000;
let libCache = null, catCache = null;
const readJsonAsync = (f) => fs.promises.readFile(f, "utf8").then(JSON.parse).catch(() => null);
const existsAsync = (f) => fs.promises.access(f).then(() => true, () => false);
const scanTpls = (root, ids) => Promise.all(ids.map(async (id) => {
  const d = path.join(root, id);
  const [t, poster, preview] = await Promise.all([readJsonAsync(path.join(d, "template.json")), existsAsync(path.join(d, "poster.jpg")), existsAsync(path.join(d, "preview.mp4"))]);
  return t && { id, t, poster, preview };
})).then((list) => list.filter(Boolean));
async function localTpls() {
  const [a, b] = await Promise.all([LIBRARY, TEMPLATES].map((d) => fs.promises.readdir(d).catch(() => [])));
  const key = a.join("|") + "#" + b.join("|");
  if (!libCache || libCache.key !== key || Date.now() - libCache.at > LIB_TTL) libCache = { key, at: Date.now(), p: Promise.all([scanTpls(LIBRARY, a), scanTpls(TEMPLATES, b)]) };
  return libCache.p;
}
function cloudCatalog() {
  if (!catCache || Date.now() - catCache.at > 5 * 60000) { catCache = { at: Date.now(), p: cloud("/api/catalog") }; catCache.p.catch(() => (catCache = null)); }
  return catCache.p;
}
async function libraryItems(localOnly = false) {
  const plan = currentPlan();
  const [lib, tpls] = await localTpls();
  const installedTpl = new Map(tpls.map((x) => [x.id, x.t]));
  const items = lib.map(({ id, t, poster, preview }) => ({ ...t, id, tier: t.tier || "free", source: "local",
    preview: preview ? `/library/${id}/preview.mp4` : null, poster: poster ? `/library/${id}/poster.jpg` : null }));
  if (!localOnly && cloudBase()) {
    try {
      const cat = await cloudCatalog();
      const base = cloudBase();
      for (const t of cat.items || []) {
        const abs = (u) => (u ? new URL(u, base + "/").href : null);
        const i = items.findIndex((x) => x.id === t.id);
        const remote = { ...t, source: "cloud", preview: abs(t.preview), poster: abs(t.poster) };
        // bản trong máy thiếu ảnh / video xem trước (gói tải về không kèm) → dùng của website, không để giá trị trống đè lên
        const local = Object.fromEntries(Object.entries(items[i] || {}).filter(([, v]) => v != null));
        if (i >= 0) items[i] = { ...remote, ...local, tier: t.tier || items[i].tier }; else items.push(remote);
      }
    } catch (e) { console.warn("Không đọc được thư viện online:", e.message); }
  }
  for (const it of items) {
    const inst = installedTpl.get(it.id);
    it.installed = !!inst;
    it.installedVersion = inst?.version || null;
    it.locked = RANK[it.tier || "free"] > RANK[plan];
  }
  // Mẫu tự tạo (chỉ có trong templates/)
  for (const { id, t, poster, preview } of tpls) {
    if (items.some((x) => x.id === id)) continue;
    items.push({ ...t, id, tier: "free", source: "custom", installed: true, installedVersion: t.version || 1, locked: false,
      poster: poster ? `/templates-media/${id}/poster.jpg` : null, preview: preview ? `/templates-media/${id}/preview.mp4` : null });
  }
  // danh sách chỉ cần thông tin để vẽ thẻ; nội dung đầy đủ (presets, css…) đọc qua /api/templates?id= khi áp mẫu
  // gói Basic (tier free) lên đầu, rồi Pro/Premium; mẫu "QA …" (bản thử âm thanh) luôn ở cuối; trong mỗi nhóm giữ order
  const rank = (t) => (/^QA\b/i.test(t.name || "") ? 2 : (t.tier || "free") === "free" ? 0 : 1);
  return items.sort((a, b) => rank(a) - rank(b) || (a.order ?? 99) - (b.order ?? 99))
    .map(({ presets, effects, compatibility, ...it }) => (it.brand?.css ? { ...it, brand: { ...it.brand, css: undefined } } : it));
}
// File của 1 mẫu đã cài: thông số, quy tắc dựng (skill), ảnh bìa, ví dụ dựng đầy đủ cho AI
const TPL_FILES = ["template.json", "SKILL.md", "poster.jpg", "vi-du.mjs"];
async function installTemplate(id) {
  id = slug(id);
  const local = path.join(LIBRARY, id);
  const lt = readJson(path.join(local, "template.json"));
  const dest = path.join(TEMPLATES, id);
  if (lt && RANK[lt.tier || "free"] <= RANK[currentPlan()]) {
    installTemplatePackage(TEMPLATES,packageTemplate(LIBRARY,id).buffer);
    return;
  }
  if (!cloudBase()) throw new Error("Không tìm thấy mẫu.");
  const buf = await cloud(`/api/templates/${encodeURIComponent(id)}/download`, { raw: true });
  const parsed=parseTemplatePackage(buf);if(parsed.length!==1||parsed[0].id!==id)throw new Error('Gói tải về không khớp mẫu đã chọn.');
  installTemplatePackage(TEMPLATES,buf);
}
// Import uses the same reference-aware validation as the CLI installer.
function importTemplateZip(buf){return installTemplatePackage(TEMPLATES,buf).map(item=>item.id);}
// Tải mẫu (.zip) từ website xong → phần mềm đang mở tự cài, không cần giải nén.
// Quét Downloads 4 giây/lần, chỉ file .zip mới (≤ 3 ngày, ≤ 20MB) chứa <id>/template.json; nhớ file đã xử lý.
const DL_DIRS = [path.join(os.homedir(), "Downloads"), path.join(os.homedir(), "OneDrive", "Downloads")];
const DL_SEEN = path.join(ROOT, "workspace", ".imported-zips.json");
const autoInstalled = []; // [{ id, name, at }] — màn hình chính đọc để báo
function scanDownloadedTemplates() {
  const seen = readJson(DL_SEEN) || {};
  let changed = false;
  for (const d of DL_DIRS) {
    let names; try { names = fs.readdirSync(d); } catch { continue; }
    for (const n of names) {
      if (!/\.zip$/i.test(n) || /video-edit-kit/i.test(n)) continue; // bỏ qua gói phần mềm
      const f = path.join(d, n);
      let st; try { st = fs.statSync(f); } catch { continue; }
      const key = `${f}|${st.size}|${Math.round(st.mtimeMs)}`;
      if (seen[key] || st.size > 20e6 || Date.now() - st.mtimeMs > 3 * 864e5) continue;
      seen[key] = Date.now(); changed = true;
      try {
        for (const id of importTemplateZip(fs.readFileSync(f))) {
          const t = readJson(path.join(TEMPLATES, id, "template.json"));
          autoInstalled.push({ id, name: t?.name || id, at: Date.now() });
          console.log(`  ✓ Tự cài mẫu "${t?.name || id}" từ ${n}`);
        }
      } catch {} // không phải file mẫu → bỏ qua
    }
  }
  if (changed) { fs.mkdirSync(path.dirname(DL_SEEN), { recursive: true }); fs.writeFileSync(DL_SEEN, JSON.stringify(seen)); }
}
// (Đã thôi tự cài từ thư mục Downloads — người dùng tải mẫu lên trong phần mềm, AI cài: /api/template-upload)
function templateSkill(id) {
  const f = id && path.join(TEMPLATES, slug(id), "SKILL.md");
  return f && fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
}

// ---------- Giao việc cho AI (Claude Code / Codex đang mở thư mục này) ----------
// <dự án>/work/ai-job.json: { status: waiting|working|done|error, template, templateName, createdAt, … }
// AI nhận việc bằng  node editor/tools/ai-inbox.mjs  (chờ nền hoặc lấy ngay), làm xong đánh dấu done → editor tự mở dự án.
const AI_LISTENER = path.join(ROOT, "workspace", ".ai-listener.json");
const aiJobFile = (dir) => path.join(dir, "work", "ai-job.json");
// Tiến độ việc edit: bước AI báo (ai-inbox --buoc) + đoán thêm từ file dự án (AI quên báo vẫn tiến) → { n, total, pct, step, detail }
const EDIT_STEPS = [["Nhận việc", 5], ["Đọc lời nói", 15], ["Cắt vấp, khoảng lặng", 30], ["Chữ edit, hiệu ứng, zoom theo mẫu", 60],
  ["Phụ đề, tiếng hiệu ứng, nhạc nền", 80], ["Tách nền, kiểm tra", 90], ["Dựng bản xem trước", 97]];
function aiProgress(dir, jb) {
  const p = readJson(path.join(dir, "work", "ai-progress.json")) || {};
  if (jb.kind === "clips" && p.n) return { n: p.n, total: p.total, pct: p.pct, step: p.step, steps: p.steps, detail: p.detail || "" }; // cắt clip: bước do cat-clip.mjs --buoc báo
  if (jb.kind) return p.detail || p.step ? { detail: p.detail || p.step } : null;
  const t0 = Date.parse(jb.startedAt || 0) || 0, mt = (f) => { try { return fs.statSync(path.join(dir, f)).mtimeMs; } catch { return 0; } };
  let n = Math.max(1, Number(p.n) || 1);
  if (fs.existsSync(path.join(dir, "work", "transcript.json"))) n = Math.max(n, 2);
  if (mt("project.json") > t0) {
    const pj = readJson(path.join(dir, "project.json")) || {};
    n = Math.max(n, 3);
    if ((pj.texts || []).length) n = Math.max(n, 4);
    if ((pj.captions?.lines || []).length || (pj.sfx || []).length) n = Math.max(n, 5);
  }
  if (mt("index.html") > t0 && mt("index.html") >= mt("project.json")) n = Math.max(n, 7);
  n = Math.min(n, EDIT_STEPS.length);
  return { n, total: EDIT_STEPS.length, pct: EDIT_STEPS[n - 1][1], step: EDIT_STEPS[n - 1][0], detail: p.detail || "" };
}
// "AI đang bận?" cần quét ~1000 thư mục trên NAS (~1s). Quét ngầm, song song, không chặn máy chủ:
// aiListener() (18 chỗ gọi, đồng bộ) trả kết quả lần quét gần nhất; cũ hơn 5s thì kích 1 lần quét mới chạy nền.
let busyScan = { at: 0, v: null, running: false };
function refreshAiBusy() {
  if (busyScan.running) return;
  busyScan.running = true;
  aiBusyScan().then((v) => { busyScan = { at: Date.now(), v, running: false }; }, () => { busyScan.running = false; });
}
function aiListener() {
  const l = readJson(AI_LISTENER);
  if (l && Date.now() - (l.beat || 0) < 15000) return l; // AI đang chờ việc (nhịp tim 5 giây/lần)
  if (Date.now() - busyScan.at > 5000) refreshAiBusy();
  return busyScan.v; // shortcut: trễ tối đa ~5s + 1 lượt quét; phiên AI vừa nhận việc trong khoảng đó có thể chưa được tính là bận
}
async function aiBusyScan() {
  // AI đang bận làm 1 việc khác (lệnh chờ đã thoát để làm việc) → việc mới xếp hàng, AI làm xong sẽ nhận tiếp
  const days = await fs.promises.readdir(WORKSPACE).catch(() => []);
  const dirs = (await Promise.all(days.map(async (day) => (await fs.promises.readdir(path.join(WORKSPACE, day)).catch(() => [])).map((n) => path.join(WORKSPACE, day, n))))).flat();
  const hits = await Promise.all(dirs.map(async (dir) => {
    const work = path.join(dir, "work"), jb = await readJsonAsync(path.join(work, "ai-job.json"));
    if (!(jb?.status === "working" && !jb.background && Date.now() - Date.parse(jb.startedAt || 0) < 3 * 3600e3)) return null;
    // Phiên chỉ tính là đang bận khi còn liên lạc trong 5 phút (cùng ngưỡng "chưa xác minh" của Hoạt động); phiên im lặng không giữ hàng đợi.
    const [contact, prog] = await Promise.all([readJsonAsync(path.join(work, "session-contact.json")), readJsonAsync(path.join(work, "ai-progress.json"))]);
    const seen = Math.max(contact?.at || 0, prog?.at || 0, Date.parse(jb.startedAt || 0) || 0);
    return Date.now() - seen < 5 * 60e3 ? { agent: jb.agent, busy: true } : null;
  }));
  return hits.find(Boolean) || null;
}
setTimeout(refreshAiBusy, 1000).unref(); // có kết quả sẵn ngay sau khi mở app

// Không có phiên AI nào đang chờ → phần mềm tự chạy Claude Code CLI / Codex CLI ngầm để nhận việc.
// Tìm trong PATH, chỗ cài phổ biến, bản kèm app desktop / VS Code. Ưu tiên AI người dùng dùng gần nhất.
function whichBin(name) {
  try {
    const out = execSync(process.platform === "win32" ? `where ${name}` : `command -v ${name}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const all = out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    return all.find((f) => /\.(exe|cmd)$/i.test(f)) || all[0] || null;
  } catch { return null; }
}
function globDirs(base, re) {
  try { return fs.readdirSync(base).filter((d) => re.test(d)).sort().reverse().map((d) => path.join(base, d)); } catch { return []; }
}
// Tìm file `name` trong `base` sâu tối đa `depth` tầng — lấy bản mới nhất (app desktop để CLI trong thư mục theo phiên bản)
function findNewest(base, name, depth) {
  const hits = [];
  const walk = (d, n) => {
    let es; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const f = path.join(d, e.name);
      if (e.isFile() && e.name === name) hits.push(f);
      else if (e.isDirectory() && n > 0 && !/^(node_modules|\.git|Cache|logs?)$/i.test(e.name)) walk(f, n - 1);
    }
  };
  walk(base, depth);
  return hits.map((f) => ({ f, t: fs.statSync(f).mtimeMs })).sort((a, b) => b.t - a.t)[0]?.f || null;
}
function findAgentBin(agent) {
  const fromPath = whichBin(agent);
  if (fromPath) return fromPath;
  const H = os.homedir(), win = process.platform === "win32", exe = win ? ".exe" : "";
  const A = process.env.APPDATA || "", L = process.env.LOCALAPPDATA || "";
  const c = agent === "claude"
    ? [path.join(H, ".local", "bin", "claude" + exe), path.join(H, ".claude", "local", win ? "claude.cmd" : "claude"),
        path.join(A, "npm", "claude.cmd"), "/opt/homebrew/bin/claude", "/usr/local/bin/claude",
        // CLI kèm app Claude desktop (tab Code): …/Claude-Data/<hồ sơ>/claude-code/<phiên bản>/<mã>/claude.exe · macOS: Application Support/Claude
        // (macOS: không dò Application Support/Claude — chạy CLI kèm app khiến máy hỏi quyền dữ liệu app khác + mật khẩu Keychain)
        () => findNewest(path.join(L, "Claude-Data"), "claude" + exe, 4), () => findNewest(path.join(A, "Claude"), "claude" + exe, 4)]
    : [path.join(A, "npm", "codex.cmd"), "/opt/homebrew/bin/codex", "/usr/local/bin/codex", path.join(H, ".local", "bin", "codex" + exe),
        // CLI kèm app Codex desktop / tiện ích VS Code
        () => findNewest(path.join(L, "OpenAI", "Codex", "bin"), "codex" + exe, 2), "/Applications/Codex.app/Contents/Resources/codex",
        ...[".vscode", ".cursor", ".windsurf"].flatMap((e) => globDirs(path.join(H, e, "extensions"), /^openai\.chatgpt-/))
          .map((d) => () => findNewest(path.join(d, "bin"), "codex" + exe, 2))];
  for (const x of c) { const f = typeof x === "function" ? x() : x; if (f && fs.existsSync(f)) return f; }
  return null;
}
// App AI người dùng đang mở trên máy (Claude desktop / Codex desktop / Antigravity) — dùng đúng phần mềm đó để edit
function runningAgents() {
  try {
    const out = process.platform === "win32" ? execSync("tasklist /FO CSV /NH", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
      : execSync("ps -axo comm", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const a = [];
    if (/"Claude\.exe"|\/Claude\.app\//i.test(out)) a.push("claude");
    if (/"Codex\.exe"|\/Codex\.app\//i.test(out)) a.push("codex");
    if (/"Antigravity\.exe"|\/Antigravity\.app\//i.test(out)) a.push("antigravity");
    return a;
  } catch { return []; }
}
function findAntigravityApp() {
  const fromPath = whichBin("antigravity") || whichBin("agy");
  if (fromPath) return fromPath;
  const H = os.homedir(), L = process.env.LOCALAPPDATA || "";
  const c = [
    path.join(L, "Programs", "antigravity", "Antigravity.exe"),
    path.join(L, "antigravity", "Antigravity.exe"),
    "/Applications/Antigravity.app/Contents/MacOS/Antigravity",
    "/usr/bin/antigravity",
    path.join(H, ".local", "bin", "antigravity"),
  ];
  return c.find((f) => f && fs.existsSync(f)) || null;
}
// AI người dùng đang dùng: ép trong .env > app đang mở (chỉ 1) > AI nhận việc gần nhất > app đang mở đầu tiên > Claude
function preferredAgent() {
  const want = process.env.VEK_AI_AGENT;
  if (want === "claude" || want === "codex") return want;
  const run = runningAgents().filter((a) => a === "claude" || a === "codex"), last = readJson(AI_LISTENER)?.agent;
  if (run.length === 1) return run[0];
  if (last === "claude" || last === "codex") return last;
  return run[0] || "claude";
}
// Tự edit khi đã kết nối AI: việc "Tự chọn AI" (session:auto) mà không có phiên chat nào đang chờ / đang làm
// và máy có Claude / Codex CLI → chạy ngầm CLI ngay. Chọn đích danh phiên Claude/Codex thì vẫn chờ phiên như cũ.
function autoExecution(execution) {
  if (execution?.mode !== "session" || execution.agent !== "auto" || aiListener()) return execution;
  const agent = preferredAgent();
  return findAgentBin(agent) ? normalizeExecution({ mode: "cli", agent }) : execution;
}
// Chỉ dùng đúng AI người dùng đang dùng; AI kia chỉ dùng khi máy không cài AI đó
function pickAgent(skip = [], requested) {
  if(requested&&requested!=='auto'){
    const bin=!skip.includes(requested)&&findAgentBin(requested);
    return bin?{agent:requested,bin}:null;
  }
  const pref = preferredAgent();
  const bin = !skip.includes(pref) && findAgentBin(pref);
  if (bin) return { agent: pref, bin };
  if (skip.includes(pref)) return null; // đã thử AI người dùng dùng mà lỗi → không tự đổi sang AI khác
  const other = pref === "claude" ? "codex" : "claude";
  const ob = !skip.includes(other) && findAgentBin(other);
  return ob ? { agent: other, bin: ob } : null;
}
// Codex chạy lệnh trong hộp cát: không chạy được ffmpeg cài ngoài thư mục phần mềm → đặt bản ffmpeg của phần mềm vào tools/ffmpeg
let ffReady = null;
function ensureKitFfmpeg() {
  const has = ["ffmpeg", "ffprobe"].every((n) => fs.existsSync(path.join(ROOT, "tools", "ffmpeg", n + (process.platform === "win32" ? ".exe" : ""))));
  if (has) return Promise.resolve();
  return (ffReady ||= installFfmpeg(ROOT).catch((e) => { ffReady = null; throw e; }));
}
const AGENT_NAME = { claude: "Claude Code", codex: "Codex", antigravity: "Antigravity" };
const runners = new Map(); // dir → tiến trình AI đang chạy
const dispatchMetadata=(dir,job)=>({dir:path.relative(ROOT,dir).replace(/\\/g,'/'),hash:crypto.createHash('sha256').update(JSON.stringify(job)).digest('hex')});
function startAgentRunner(dir, tried = []) {
  if(tried.length)return launchQueuedAgent(dir,tried);
  if(runners.has(dir))return null;
  const expected=readJson(aiJobFile(dir));
  if(!expected||expected.status!=='waiting')return null;
  return backgroundDispatch.enqueue(dir,()=>{
    const current=readJson(aiJobFile(dir));
    if(!current||current.status!=='waiting'||current.createdAt!==expected.createdAt||current.completionToken!==expected.completionToken)return {skipped:true};
    if(!projectJobAvailable(ROOT,aiJobFile(dir),current))return {busy:true};
    return launchQueuedAgent(dir,tried);
  },dispatchMetadata(dir,expected));
}
function launchQueuedAgent(dir, tried = []) {
  // chỉ gọi cho việc người dùng chọn chạy ngầm — cửa sổ chat đang chờ việc không nhận việc này (ai-inbox bỏ qua background)
  if (runners.has(dir)) return null;
  const pick = pickAgent(tried,readJson(aiJobFile(dir))?.execution?.agent);
  if (!pick) {
    if (!tried.length) setJobError(dir, "Máy chưa có Claude Code / Codex dạng lệnh để chạy ngầm. Bấm “Thử lại” sau khi cài, hoặc huỷ việc rồi chọn “Làm sau (xếp hàng)” để làm trong cửa sổ Claude / Codex.");
    return null;
  }
  const { agent, bin } = pick;
  // chưa đăng nhập CLI → báo ngay kèm nút "Đăng nhập" (không tự đổi sang AI khác)
  const loginStatus=agentLoggedIn(agent, bin);
  if (loginStatus===null) {
    setJobError(dir, `Chưa kiểm tra được trạng thái đăng nhập ${AGENT_NAME[agent]}. Kiểm tra Kết nối AI rồi bấm “Thử lại”.`);
    return {agent,bin,loginUnknown:true};
  }
  if (loginStatus===false) {
    setJobError(dir, `${AGENT_NAME[agent]} trên máy chưa đăng nhập để tự chạy ngầm. Bấm “Đăng nhập ${AGENT_NAME[agent]}”, đăng nhập tài khoản của bạn trong cửa sổ hiện ra (1 lần), rồi bấm “Thử lại”.`, { needLogin: agent });
    return { agent, bin, needLogin: true };
  }
  const expected=readJson(aiJobFile(dir));
  const reservation={agent,pid:0,pending:true};
  runners.set(dir,reservation); // giữ chỗ trong lúc chuẩn bị
  let workerRuntime={bin,configArgs:[],implementation:'configured'};
  const prep = agent === "codex" ? (async()=>{
    if(process.platform==='win32'){
      const desktop=findNewest(path.join(process.env.LOCALAPPDATA||'', 'OpenAI','Codex','bin'),'codex.exe',2);
      workerRuntime=await prepareCodexWorkerRuntime(bin,{cwd:ROOT,env:agentEnv(),fallbackBins:desktop?[desktop]:[]});
      if(workerRuntime.bin!==bin&&agentLoggedIn(agent,workerRuntime.bin)!==true)throw Object.assign(new Error('Chưa kiểm tra được đăng nhập Codex desktop CLI. Kiểm tra Kết nối AI trước khi giao lại.'),{errorCode:'CLI_LOGIN_UNVERIFIED'});
    }
    await ensureKitFfmpeg();
  })() : Promise.resolve();
  prep.then(() => {if(runners.get(dir)!==reservation)return;const current=readJson(aiJobFile(dir));if(current?.status!=='waiting'||!sameSubmittedJob(current,expected)){runners.delete(dir);return;}launchAgent(dir, agent, workerRuntime.bin, tried,expected,workerRuntime);}, (e) => {
    if(runners.get(dir)!==reservation)return;
    runners.delete(dir);
    setJobError(dir, e.errorCode?e.message:`Không chuẩn bị được ffmpeg cho Codex: ${e.message}`,e.errorCode?{errorCode:e.errorCode}:{},expected);
  });
  return { agent, bin };
}
function setJobError(dir, error, extra = {},expected) {
  const jb = readJson(aiJobFile(dir));
  if (!jb || ['done','error','cancelled'].includes(jb.status)) return;
  if(expected&&!sameSubmittedJob(jb,expected))return;
  fs.writeFileSync(aiJobFile(dir), JSON.stringify({ ...jb, status: "error", error, ...extra }, null, 2) + "\n");
}
// Môi trường sạch cho AI chạy ngầm: bỏ biến của phiên Claude Code đang mở phần mềm (nếu có) để CLI dùng đăng nhập riêng
function agentEnv() {
  const env = { ...process.env, PATH: [path.dirname(process.execPath), path.join(ROOT, "tools", "ffmpeg"), process.env.PATH].join(path.delimiter) };
  if (env.CLAUDE_CODE_ENTRYPOINT) delete env.ANTHROPIC_BASE_URL;
  for (const k of Object.keys(env)) if (k === "CLAUDECODE" || k.startsWith("CLAUDE_CODE_")) delete env[k];
  return env;
}
// Đọc cả stdout/stderr; dùng cùng parser với màn Kết nối AI.
function agentLoggedIn(agent, bin) {
  // macOS: lệnh kiểm tra đọc Keychain → máy hỏi mật khẩu. Bỏ kiểm trước, chưa đăng nhập thì nhận ra từ log khi chạy (end() bên dưới)
  if (process.platform === "darwin") return true;
  try {
    const shell=/\.cmd$/i.test(bin);
    const out = spawnSync(shell?`"${bin}"`:bin, agent === 'claude'?['auth','status']:['login','status'], { encoding: "utf8", env: agentEnv(), timeout: 20000, stdio: ["ignore", "pipe", "pipe"], windowsHide: true,shell });
    return parseAgentLoginStatus(agent,{...out,timedOut:out.error?.code==='ETIMEDOUT'});
  } catch { return null; }
}
// Màn hình Kết nối AI: kiểm tra không chặn phần mềm (lệnh của hãng có thể chậm vài giây). true / false / null = không kiểm được
const lenhNen = (cmd, env) => new Promise((ok) => exec(cmd, { encoding: "utf8", env, timeout: 15000, windowsHide: true }, (e, stdout, stderr) => ok({stdout,stderr,status:e?(Number.isInteger(e.code)?e.code:null):0,timedOut:!!e?.killed})));
async function trangThaiAi(agent) {
  if (agent === "antigravity") {
    const app = findAntigravityApp(), dataDir = path.join(os.homedir(), ".gemini", "antigravity");
    const coMay = !!app || fs.existsSync(dataDir);
    if (!coMay) return { id: agent, ten: AGENT_NAME[agent], coMay: false, dangNhap: false };
    const dangNhap = runningAgents().includes("antigravity") || fs.existsSync(path.join(dataDir, "installation_id")) || fs.existsSync(path.join(dataDir, "conversations"));
    return { id: agent, ten: AGENT_NAME[agent], coMay: true, dangNhap: dangNhap ? true : null };
  }
  let bin = null;
  try { bin = findAgentBin(agent); } catch (e) { console.error("ket-noi-ai tìm", agent, e?.message || e); return { id: agent, ten: AGENT_NAME[agent], coMay: true, dangNhap: null }; }
  const h = { id: agent, ten: AGENT_NAME[agent], coMay: !!bin };
  if (!bin) return { ...h, dangNhap: false };
  // macOS: lệnh của hãng đọc Keychain làm máy hỏi mật khẩu → chỉ xem file cấu hình
  if (process.platform === "darwin") {
    const co = agent === "codex" ? fs.existsSync(path.join(os.homedir(), ".codex", "auth.json")) : !!readJson(path.join(os.homedir(), ".claude.json"))?.oauthAccount;
    return { ...h, dangNhap: co ? true : null };
  }
  const out = await lenhNen(`"${bin}" ${agent === "claude" ? "auth status" : "login status"}`, agentEnv());
  return {...h,dangNhap:parseAgentLoginStatus(agent,out)};
}
let aiCache = null;
async function ketNoiAi(moi) {
  // một AI lỗi khi dò (file bị khoá, quyền đọc…) thì chỉ AI đó "chưa kiểm tra được", không hỏng cả màn hình
  const mot = (a) => trangThaiAi(a).catch((e) => { console.error("ket-noi-ai", a, e?.message || e); return { id: a, ten: AGENT_NAME[a], coMay: true, dangNhap: null }; });
  if (moi || !aiCache || Date.now() - aiCache.at > 20000) aiCache = { at: Date.now(), agents: await Promise.all(["claude", "codex", "antigravity"].map(mot)) };
  const l = aiListener();
  return { ok: true, agents: aiCache.agents, phien: l ? { agent: l.agent || null, busy: !!l.busy } : null };
}
// Mở cửa sổ đăng nhập của CLI (người dùng tự đăng nhập — phần mềm không đụng tới mật khẩu / token)
function openAgentLogin(agent) {
  if (agent === "antigravity") {
    const app = findAntigravityApp();
    if (!app) throw new Error(`Máy chưa có ${AGENT_NAME[agent]}.`);
    spawn(app, [ROOT], { detached: true, stdio: "ignore", windowsHide: false }).unref();
    return;
  }
  const bin = findAgentBin(agent);
  if (!bin) throw new Error(`Máy chưa có ${AGENT_NAME[agent]}.`);
  const args = agent === "claude" ? ["auth", "login"] : ["login"];
  if (process.platform === "win32") spawn("cmd.exe", ["/c", "start", `"Dang nhap ${AGENT_NAME[agent]}"`, `"${bin}"`, ...args], { env: agentEnv(), detached: true, shell: true, stdio: "ignore", windowsHide: false }).unref();
  else if (process.platform === "darwin") spawn("osascript", ["-e", `tell application "Terminal" to do script "'${bin}' ${args.join(" ")}"`, "-e", 'tell application "Terminal" to activate'], { detached: true, stdio: "ignore" }).unref();
  else spawn("x-terminal-emulator", ["-e", bin, ...args], { detached: true, stdio: "ignore" }).unref();
}
function launchAgent(dir, agent, bin, tried,expected=readJson(aiJobFile(dir)),workerRuntime={configArgs:[],implementation:'configured'}) {
  if (!runners.has(dir)) return; // đã huỷ trong lúc chuẩn bị
  const t0 = Date.now();
  const prompt = `Có việc dựng video giao từ phần mềm Video Edit Kit (thư mục hiện tại). Chạy đúng 1 lệnh: node editor/tools/ai-inbox.mjs --next --dir ${relDir(dir)} --agent ${agent}
rồi làm ĐÚNG hướng dẫn lệnh đó in ra cho tới hết: không hỏi lại người dùng, không xuất video, không đưa gì lên mạng.
Bắt buộc kết thúc bằng lệnh --done (xong) hoặc --fail kèm lý do ngắn (không làm được).
Nếu --done báo đã bàn giao candidate cho server: kết thúc phiên ngay, không chờ status done hoặc tự --fail. Server chỉ áp dụng sau khi tiến trình worker kết thúc.`;
  // claude: chỉ cho sửa file + chạy node / npx / ffmpeg; codex: hộp cát chỉ ghi trong thư mục này
  const cmds = ["node", "npx", "ffmpeg", "ffprobe"].flatMap((c) => [`Bash(${c}:*)`, `PowerShell(${c}:*)`]);
  const argv = agent === "claude"
    ? ["-p", "--output-format", "stream-json", "--verbose", "--permission-mode", "acceptEdits", "--allowedTools", ["Read", "Edit", "Write", "Glob", "Grep", "Skill", ...cmds].join(",")]
    : [...workerRuntime.configArgs,"exec", "--sandbox", "workspace-write", "--skip-git-repo-check", "-"];
  const execution=readJson(aiJobFile(dir))?.execution;
  if(execution?.model){
    try{
      const help=execSync(`"${bin}" ${agent==='codex'?'exec ':''}--help`,{encoding:'utf8',timeout:10000,windowsHide:true,stdio:['ignore','pipe','ignore']});
      const modelArgs=cliModelArgs(execution,help);
      if(agent==='codex')argv.splice(argv.length-1,0,...modelArgs);else argv.push(...modelArgs);
    }catch(error){runners.delete(dir);setJobError(dir,'Không cấu hình được model đã chọn: '+error.message,{},expected);return;}
  }
  // node của phần mềm + ffmpeg trong thư mục phần mềm đứng đầu PATH (Codex không chạy được ffmpeg cài ngoài)
  const completionNonce=crypto.randomUUID();
  const env = {...agentEnv(),EDITOR_PORT:String(PORT),CONTENTOS_COMPLETION_JOB:path.resolve(dir),CONTENTOS_COMPLETION_NONCE:completionNonce};
  const logFile = path.join(dir, "work", "ai-run.log");
  const log = fs.createWriteStream(logFile, { flags: "a" });
  log.write(`\n=== ${new Date().toISOString()} · ${agent} · ${bin} · sandbox: ${workerRuntime.implementation} · requested model: ${execution?.model||'CLI default'}\n`);
  let c;
  try { c = spawnShellSafe(spawn, bin, argv, { cwd: ROOT, env, shell: /\.cmd$/i.test(bin), windowsHide: true }); }
  catch (e) { log.end(`Không chạy được: ${e.message}\n`); runners.delete(dir); return setJobError(dir, `Không mở được ${AGENT_NAME[agent]}: ${e.message}`,{},expected); }
  c.agent = agent;
  runners.set(dir, c);
  // Tiến độ cho màn hình chờ: bước AI đang làm (lệnh / file đang sửa) → work/ai-progress.json
  const progFile = path.join(dir, "work", "ai-progress.json");
  // giữ số bước / % (AI báo bằng ai-inbox --buoc), chỉ thay dòng chi tiết đang làm
  const setProg = (detail) => { if(runners.get(dir)!==c||!sameSubmittedJob(readJson(aiJobFile(dir)),expected))return;detail = String(detail || "").replace(/\s+/g, " ").trim().slice(0, 140); if (detail) try { fs.writeFileSync(progFile, JSON.stringify({ ...readJson(progFile), detail, at: Date.now() })); } catch {} };
  let buf = "";
  c.stdout.on("data", (d) => {
    buf += d.toString("utf8");
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    for (const ln of lines) {
      if (agent === "claude") {
        // stream-json: mỗi dòng 1 sự kiện → ghi log dễ đọc + bước đang làm
        let ev; try { ev = JSON.parse(ln); } catch { log.write(ln + "\n"); continue; }
        if (ev.type === "assistant") for (const it of ev.message?.content || []) {
          if (it.type === "text" && it.text) log.write(it.text + "\n");
          if (it.type === "tool_use") {
            const x = it.input || {}, what = x.description || x.command || x.file_path || x.pattern || x.skill || "";
            log.write(`→ ${it.name}: ${what}\n`);
            setProg(x.description || (x.file_path ? `${it.name === "Read" ? "Đọc" : "Sửa"} ${path.basename(x.file_path)}` : what));
          }
        } else if (ev.type === "result") log.write(`${ev.result || ""}\n`);
      } else {
        log.write(ln + "\n");
        const m = /-Command\s+["']?(.+?)["']?\s+in\s+\S/.exec(ln) || /^\s*(node|npx|ffmpeg|hyperframes)\s.+/.exec(ln);
        if (m) setProg(m[1].length > 3 ? m[1] : m[0]);
      }
    }
  });
  c.stderr.pipe(log, { end: false });
  c.stdin.end(prompt);
  let ended = false;
  const end = async (msg) => {
    if (ended) return;
    ended = true;
    if(runners.get(dir)!==c||!sameSubmittedJob(readJson(aiJobFile(dir)),expected)){if(runners.get(dir)===c)runners.delete(dir);log.end(`\n=== ${msg} · lượt cũ, không cập nhật việc mới\n`);return;}
    try{
      const applied=await consumeCompletionHandoff(dir,{nonce:completionNonce,complete:async(kind,body)=>{
        const response=await fetch(`http://127.0.0.1:${PORT}/api/ai-${kind}/complete`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,dir:relDir(dir)})});
        const result=await response.json();if(!response.ok)throw Error(result.error||'Không áp dụng được candidate.');
      }});
      if(applied){runners.delete(dir);log.end(`\n=== ${msg} · server đã kiểm và áp candidate\n`);return;}
    }catch(error){runners.delete(dir);log.end(`\n=== Bàn giao lỗi: ${error.message}\n`);setJobError(dir,'Chưa áp candidate: '+error.message,{},expected);return;}
    runners.delete(dir);
    log.end(`\n=== ${msg}\n`);
    const unclaimed = readJson(aiJobFile(dir))?.status === "waiting";
    let why = "";
    try { const lg = fs.readFileSync(logFile, "utf8"); why = lg.slice(lg.lastIndexOf(`· ${agent} ·`)); } catch {}
    const failure=classifyAgentRunFailure(agent,why);
    if(failure.code==='CLI_EXEC_UNAVAILABLE')return setJobError(dir,failure.message,{errorCode:failure.code},expected);
    const auth = failure.code==='CLI_AUTH_REQUIRED';
    // chưa nhận việc mà thoát vì lý do khác đăng nhập (lỗi mở…) → chỉ thử AI kia khi máy không có AI người dùng dùng
    if (unclaimed && !auth && Date.now() - t0 < 120000 && startAgentRunner(dir, [...tried, agent])) return;
    if (auth) return setJobError(dir, agent === "claude"
      ? "Claude Code trên máy chưa đăng nhập để tự chạy. Làm 1 lần: mở Terminal, gõ claude rồi đăng nhập tài khoản Claude của bạn — sau đó bấm AI edit lại. Hoặc mở Claude (tab Code, thư mục phần mềm) và gửi: edit video đang chờ trong phần mềm"
      : "Codex trên máy chưa đăng nhập để tự chạy. Làm 1 lần: mở Terminal, gõ codex login — sau đó bấm AI edit lại. Hoặc mở Codex (thư mục phần mềm) và gửi: edit video đang chờ trong phần mềm");
    const tail = why.trim().split(/\r?\n/).slice(-3).join(" · ").slice(0, 300);
    setJobError(dir, unclaimed ? `${AGENT_NAME[agent]} không nhận được việc (${msg}). ${tail}` : `${AGENT_NAME[agent]} dừng khi chưa xong (${msg}). ${tail}`);
  };
  c.on("error", (e) => end(`không mở được: ${e.message}`));
  c.on("close", (code) => end(`thoát mã ${code}`));
}
const apiEditorRuns=new Map();
const backgroundDispatch=createBackgroundDispatch(ROOT,{activeCount:()=>runners.size+apiEditorRuns.size,onError:(dir,error)=>setJobError(dir,'Không khởi chạy được việc chờ: '+error.message)});
const preservedPending=(dir,state)=>backgroundDispatch.recoverable().some(entry=>entry.id===dir&&entry.state==='pending'&&entry.metadata?.hash===dispatchMetadata(dir,state).hash);
// API requests cannot be safely replayed after process restart.
const apiReviseRoot=path.join(WORKSPACE,'_sua-video');
if(fs.existsSync(apiReviseRoot))for(const entry of fs.readdirSync(apiReviseRoot,{withFileTypes:true})){
 if(!entry.isDirectory()||entry.isSymbolicLink())continue;const dir=path.join(apiReviseRoot,entry.name),file=aiJobFile(dir),state=readJson(file);
 if(state?.execution?.mode==='api'&&['waiting','working'].includes(state.status)&&!preservedPending(dir,state))fs.writeFileSync(file,JSON.stringify({...state,status:'error',errorCode:'API_INTERRUPTED',error:'Worker API đã gián đoạn khi server khởi động lại. Kiểm tra bản dựng và candidate; không tự gọi lại API.',doneAt:new Date().toISOString()},null,2)+'\n');
}

if(fs.existsSync(WORKSPACE))for(const day of fs.readdirSync(WORKSPACE,{withFileTypes:true})){
 if(!day.isDirectory()||day.isSymbolicLink()||day.name.startsWith('_'))continue;
 for(const project of fs.readdirSync(path.join(WORKSPACE,day.name),{withFileTypes:true})){
  if(!project.isDirectory()||project.isSymbolicLink())continue;const dir=path.join(WORKSPACE,day.name,project.name),file=aiJobFile(dir),state=readJson(file);
  if(state?.execution?.mode==='api'&&['waiting','working'].includes(state.status)&&!preservedPending(dir,state))fs.writeFileSync(file,JSON.stringify({...state,status:'error',errorCode:'API_INTERRUPTED',error:'Worker API gián đoạn khi khởi động lại; kiểm tra candidate, không tự gọi lại.',doneAt:new Date().toISOString()},null,2)+'\n');
 }
}

function startApiEditor(dir,jb){
 return backgroundDispatch.enqueue(dir,()=>{
  const current=readJson(aiJobFile(dir));
  if(!current||current.status!=='waiting'||current.createdAt!==jb.createdAt||current.completionToken!==jb.completionToken)return {skipped:true};
  return launchQueuedApiEditor(dir,current);
 },dispatchMetadata(dir,jb));
}
function launchQueuedApiEditor(dir,jb){
 const firstBuild=!!jb.completionToken&&!jb.kind,target=jb.project?safeJoin(ROOT,jb.project):dir;
 const resultDir=firstBuild?path.join(dir,'work/build-candidates',jb.completionToken):dir;
 const baseProject=readJson(path.join(resultDir,'work/base-project.json'));
 const templateId=firstBuild?jb.template:baseProject?.template?.id,templateSource=jb.templateSnapshot?readTemplateSnapshot(path.join(ROOT,jb.templateSnapshot.directory),jb.templateSnapshot).template:templateId?readJson(path.join(TEMPLATES,slug(templateId),'template.json')):null;
 const presetContext=createApiPresets(templateSource);
 if(templateSource)fs.writeFileSync(path.join(resultDir,'work/api-preset-snapshot.json'),JSON.stringify(templateSource,null,2)+'\n');
 const controller=new AbortController(),workspaceId=baseProject?.workspaceId||'default';
 const savedConfig=llmConnectionStore.get(workspaceId),fingerprint=JSON.stringify(savedConfig),config={...savedConfig,...(jb.execution?.model?{model:jb.execution.model}:{})};
 const write=value=>fs.writeFileSync(aiJobFile(dir),JSON.stringify(value,null,2)+'\n');
  const validate=()=>{const state=readJson(aiJobFile(dir));if(apiEditorRuns.get(dir)!==controller||!ownsWorkingJob(state,jb)||JSON.stringify(llmConnectionStore.get(workspaceId))!==fingerprint)throw new Error('Công việc hoặc kết nối đã đổi.');};
 const claim={id:crypto.randomUUID(),mode:'api',agent:'gateway',sessionId:crypto.randomUUID(),claimedAt:new Date().toISOString()};
 if(!reserveProjectJob(ROOT,aiJobFile(dir),jb,claim))return {ok:true,mode:'api',running:false,busy:true,reason:'Dự án đang được phiên hoặc worker khác xử lý; việc vẫn chờ, chưa gọi API.'};
 jb={...jb,claimedBy:claim};
 apiEditorRuns.set(dir,controller);write({...jb,status:'working',startedAt:new Date().toISOString()});
 Promise.resolve().then(async()=>{
  if(firstBuild){
   const candidate=readJson(path.join(resultDir,'work/candidate-project.json'));
   const preparation=await prepareFirstBuildTranscript(ROOT,target,{project:candidate,language:jb.transcriptLanguage||'vi',ready:whisperStatus(ROOT).ready,signal:controller.signal,validate:()=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);},onProgress:progress=>{validate();write({...readJson(aiJobFile(dir)),apiProgress:{...progress,phase:'Nhận lời thoại: '+progress.phase}});}});
   validate();write({...readJson(aiJobFile(dir)),transcriptPreparation:preparation});
  }
  const mediaContext=createEditorContext(target,{validate,project:readJson(path.join(resultDir,'work/candidate-project.json')),artifactDir:path.join(resultDir,'work/api-frame-survey')});
  const imageContext=createEditorImages({workspaceId,workspaceStore,imageService,storageService,projectDir:target,root:ROOT,mediaContext,validate:()=>{validate();controller.signal.throwIfAborted();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);}});
  const plateContext=createApiPlatePrivacy(ROOT,target,{signal:controller.signal,validate:()=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();}});
  return runApiEditor({jobSourceContext:jb.sources?.length?createEditorJobSources({root:ROOT,projectDir:target,sources:jb.sources,workspaceId,workspaceStore,storageService,mediaContext,validate:()=>{validate();controller.signal.throwIfAborted();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);}}):null,selectedPersonContext:firstBuild?null:(candidate,request)=>measureSelectedPersonExposure(target,candidate,request,{signal:controller.signal,validate:()=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();}}),personAdjustmentContext:firstBuild?null:(candidate,request)=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();const adjusted=applyPersonAdjustment(target,candidate,request);validate();return adjusted;},templateReferenceContext:jb.templateSnapshot?name=>{validate();const pinned=readTemplateSnapshot(path.join(ROOT,jb.templateSnapshot.directory),jb.templateSnapshot);if(!Object.hasOwn(pinned.references,name))throw new Error('Tham chiếu không có trong bản mẫu của việc.');return {path:name,content:pinned.references[name],readOnly:true};}:null,personContext:candidate=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();return personExposureReport(target,candidate);},normalizationContext:createApiColorNormalization(target,{signal:controller.signal,validate:()=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();}}),colorContext:(candidate,request)=>analyzeShotColor(target,candidate,request,{signal:controller.signal,validate:()=>{validate();assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);mediaContext.validate();}}),plateContext,fetcher:apiUsage.fetcher(workspaceId,firstBuild?'first-build':'revise'),presetContext,mediaContext,imageContext,config,project:readJson(path.join(resultDir,'work/candidate-project.json')),instruction:jb.instruction||jb.note||'Dựng video từ nguồn, lời thoại và mẫu đã chọn.',context:{selectedItem:jb.selectedItem,brandSnapshot:jb.brandSnapshot,creativeBrief:jb.creativeBrief,newsBrief:jb.newsBrief,template:firstBuild?readJson(path.join(resultDir,'work/api-template.json')):jb.templateSnapshot?{id:jb.templateSnapshot.id,references:jb.templateSnapshot.references||[]}:null,trim:jb.trim,fx:jb.fx,sfxLevel:jb.sfxLevel,automotiveOptions:jb.automotiveOptions,automotiveInstructions:automotiveInstructions(jb.automotiveOptions)},signal:controller.signal,validate,onStep:progress=>{validate();write({...readJson(aiJobFile(dir)),apiProgress:progress});}});}).then(result=>{
  validate();fs.writeFileSync(path.join(resultDir,'work/candidate-project.json'),JSON.stringify(result.project,null,2)+'\n');
  let saved;
  try{saved=applyRevisionResult(target,resultDir,jb.baseRevision,{build:candidate=>{if(firstBuild)Object.assign(candidate,enforceAutomotiveJob(candidate,jb,resultDir));if(firstBuild||candidate.blocks?.some(b=>b.apiPreset)){const checked=checkApiGraphics(target,{project:candidate});if(checked.loi.length)throw new Error(checked.loi.join(' · '));}fs.writeFileSync(path.join(resultDir,'index.html'),buildHtml(candidate,target));}});}catch(error){markCandidateConflict(aiJobFile(dir),readJson(aiJobFile(dir)),error);throw error;}
  try{buildProject(target,saved.project);}catch(error){write({...readJson(aiJobFile(dir)),status:'error',appliedRevision:saved.revision,error:'Đã lưu bản sửa nhưng build preview lỗi: '+error.message,doneAt:new Date().toISOString()});throw error;}const completed={...readJson(aiJobFile(dir)),...(firstBuild?{openDir:relDir(target)}:{}),status:'done',summary:result.summary,apiUsage:result.usage,apiModel:result.model,apiVisualEvidence:result.visualEvidence,appliedRevision:saved.revision,doneAt:new Date().toISOString(),completionState:'awaiting-review'};
  write(completed);if(target===PROJECT)lastProject=null;
 }).catch(error=>{const state=readJson(aiJobFile(dir));if(apiEditorRuns.get(dir)===controller&&ownsWorkingJob(state,jb))write({...state,status:'error',error:error.message,doneAt:new Date().toISOString()});}).finally(()=>{if(apiEditorRuns.get(dir)===controller)apiEditorRuns.delete(dir);});
 return {ok:true,mode:'api',running:true};
}
function stopAgentRunner(dir) {
  backgroundDispatch.remove(dir);
  apiEditorRuns.get(dir)?.abort();
  const c = runners.get(dir);
  if (!c) return;
  runners.delete(dir);
  if (!c.pid) return; // còn đang chuẩn bị, chưa mở AI
  try { process.platform === "win32" ? execSync(`taskkill /pid ${c.pid} /T /F`, { stdio: "ignore" }) : c.kill("SIGTERM"); } catch {}
}
// Quản trị: công cụ editor/admin/ chỉ có ở máy admin (không đóng gói) + tài khoản phải là admin (hỏi thẳng máy chủ, nhớ 10 phút)
let adminCache = null;
async function adminStatus() {
  // "Tạo mẫu từ video": gói Pro trở lên (mẫu riêng trong máy) · admin thêm quyền làm mẫu thư viện cho website
  const tools = fs.existsSync(path.join(KIT, "admin", "analyze-ref.mjs"));
  if (adminCache && Date.now() - adminCache.at < 600000 && adminCache.v.tools === tools) return adminCache.v;
  let v = { admin: false, allowed: false, tools, plan: currentPlan(), reason: "Đăng nhập tài khoản gói Pro trở lên để dùng." };
  if (cloudBase() && account()?.token) {
    try {
      const u = adminTop((await cloud("/api/me")).user);
      const allowed = !!u?.admin || RANK[u?.plan] >= RANK.pro;
      v = { admin: !!u?.admin, allowed, tools, email: u?.email, plan: u?.plan || "free",
        reason: allowed ? "" : `Tính năng dành cho gói Pro trở lên — tài khoản ${u?.email} đang ở gói ${({ none: "CHƯA KÍCH HOẠT", free: "BASIC" })[u?.plan || "free"] || String(u?.plan).toUpperCase()}.` };
    } catch (e) { v = { ...v, reason: e.status === 401 ? "Phiên đăng nhập hết hạn." : "Không kết nối được máy chủ để xác minh gói." }; }
  } else if (!cloudBase()) v = { ...v, allowed: tools, reason: "" }; // bản nội bộ chưa cấu hình máy chủ tài khoản
  adminCache = { at: Date.now(), v };
  return v;
}
function installedTemplates() {
  if (!fs.existsSync(TEMPLATES)) return [];
  return fs.readdirSync(TEMPLATES).map((id) => {
    const t = readJson(path.join(TEMPLATES, id, "template.json"));
    return t && { id, name: t.name || id, description: t.description || "", industries: t.industries || [],
      poster: fs.existsSync(path.join(TEMPLATES, id, "poster.jpg")) ? `/api/template-poster?id=${encodeURIComponent(id)}` : null };
  }).filter(Boolean);
}

// ---------- Dự án: danh sách / tạo mới ----------
// project.json có thể lớn (lời thoại từng từ) và nằm trên NAS: đọc + băm lại hàng trăm file mỗi lần mở màn chính rất chậm ở máy khác
// → nhớ phần tóm tắt theo mtime + kích thước file
const projInfoCache = new Map();
async function projectInfo(pj) {
  const st = await fs.promises.stat(pj), key = `${st.mtimeMs}:${st.size}`, hit = projInfoCache.get(pj);
  if (hit?.key === key) return hit;
  const p = (await readJsonAsync(pj)) || {};
  const v = { key, mtimeMs: st.mtimeMs, revision: projectRevision(pj), p: { workspaceId: p.workspaceId, title: p.title, duration: p.source?.duration, format: p.format,
    variant: p.contentos?.variant, template: p.template?.name, pendingIntake: p.contentos?.pendingIntake, clipOf: p.clipOf?.k } };
  projInfoCache.set(pj, v);
  return v;
}
// Quét hàng trăm thư mục trên NAS vẫn mất ~1s dù song song → trả ngay bản đã quét, làm mới ngầm khi cũ hơn 2s.
// shortcut: dự án do tiến trình ngoài (AI worker) tạo / đổi trạng thái hiện chậm thêm 1 lượt tải; cần tức thì thì theo dõi thư mục bằng fs.watch.
let projLast = null, projScan = null, projAt = 0, projGen = 0;
function listProjects() {
  if (!projScan || Date.now() - projAt > 2000) {
    projAt = Date.now();
    const gen = projGen; // lượt quét bắt đầu trước một thao tác ghi thì không được ghi đè kết quả mới
    projScan = scanProjects().then((v) => { if (gen === projGen) projLast = v; return v; }, (e) => { projScan = null; throw e; });
  }
  return projLast ? Promise.resolve(projLast.map((x) => ({ ...x, current: path.resolve(ROOT, x.dir) === PROJECT }))) : projScan;
}
function dropProjList() { projGen++; projLast = null; projScan = null; }
// đọc song song mọi dự án (mỗi dự án ~4 lần hỏi ổ mạng; tuần tự thì hàng trăm dự án mất vài giây)
async function scanProjects() {
  const days = (await fs.promises.readdir(WORKSPACE, { withFileTypes: true }).catch(() => [])).filter((d) => d.isDirectory()).map((d) => d.name);
  const dirs = (await Promise.all(days.map(async (day) => (await fs.promises.readdir(path.join(WORKSPACE, day)).catch(() => [])).map((name) => [day, name])))).flat();
  const out = await Promise.all(dirs.map(async ([day, name]) => {
    const dir = path.join(WORKSPACE, day, name);
    const info = await projectInfo(path.join(dir, "project.json")).catch(() => null); // không có project.json
    if (!info || info.p.pendingIntake) return null;
    const p = info.p;
    const [renders, jb, clips] = await Promise.all([fs.promises.readdir(path.join(dir, "renders")).then((l) => l.filter((x) => x.endsWith(".mp4")), () => []),
      readJsonAsync(aiJobFile(dir)), existsAsync(path.join(dir, "work", "clips-made.json"))]);
    return { workspaceId: p.workspaceId || "default", dir: path.relative(ROOT, dir).replace(/\\/g, "/"), name, day, title: p.title || name,
      duration: Number(p.duration) || 0, format: p.format === "16:9" ? "16:9" : "9:16", updated: info.mtimeMs,
      revision: info.revision, variant: p.variant || null, template: p.template || null, renders: renders.length, current: dir === PROJECT,
      ai: jb?.status || null, aiPct: jb?.status === "working" ? aiProgress(dir, jb)?.pct ?? null : null, clips, clipOf: p.clipOf || null };
  }));
  return out.filter(Boolean).sort((a, b) => b.updated - a.updated);
}
function newProject(req, res, q) {
  const context = workspaceStore.active();
  const raw = path.basename(String(q.get("file") || "video.mp4"));
  const ext = path.extname(raw).toLowerCase();
  // chỉ có giọng đọc (mẫu faceless): tạo video nền đen kèm giọng để nhận giọng/AI edit chạy như video thường
  const voiceOnly = /^\.(mp3|m4a|wav|aac|ogg|flac)$/.test(ext);
  if (!voiceOnly && !/^\.(mp4|mov|m4v|webm)$/.test(ext)) return json(res, { ok: false, error: "Chỉ nhận video .mp4 .mov .m4v .webm hoặc giọng đọc .mp3 .m4a .wav .aac .ogg .flac" }, 400);
  // cần chỗ cho video + bản xem trước nhẹ + bản xuất (~2 lần dung lượng video) + 1 GB dư
  const need = (Number(req.headers["content-length"]) || 0) * 2 + 1073741824, sp = diskSpace();
  if (sp.free && sp.free < need) {
    req.resume();
    return json(res, { ok: false, noSpace: true, error: `Ổ đĩa không đủ chỗ: video này cần khoảng ${gb(need)}, máy còn ${gb(sp.free)}. Xoá bớt dự án cũ ở mục "Dọn dung lượng" (menu trái) hoặc dọn Thùng rác rồi thử lại.` }, 507);
  }
  const id = slug(q.get("name") || raw.slice(0, -ext.length)) || "video";
  const day = new Date().toISOString().slice(0, 10);
  let dir = path.join(WORKSPACE, day, id), i = 2;
  while (fs.existsSync(dir)) dir = path.join(WORKSPACE, day, `${id}-${i++}`);
  fs.mkdirSync(path.join(dir, "inputs"), { recursive: true });
  fs.mkdirSync(path.join(dir, "work"), { recursive: true });
  const upload = path.join(dir, "inputs", voiceOnly ? `voice${ext}` : `raw${ext}`);
  const dest = voiceOnly ? path.join(dir, "inputs", "raw.mp4") : upload;
  const ws = fs.createWriteStream(upload);
  req.pipe(ws);
  ws.on("error", (e) => { fs.rmSync(dir, RM_NAS); json(res, { ok: false, error: String(e.message) }, 500); });
  ws.on("finish", () => {
    if (voiceOnly) {
      const wide = q.get("format") === "16:9", size = wide ? "1920x1080" : "1080x1920";
      try {
        const aDur = Math.round((Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${upload}"`, { encoding: "utf8" }).trim()) || 0) * 1000) / 1000;
        const durArgs = aDur > 0 ? ["-af", `apad=whole_dur=${aDur}`, "-t", String(aDur)] : ["-fflags", "+shortest", "-max_interleave_delta", "0", "-shortest"];
        execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `color=c=black:s=${size}:r=30`, "-i", upload, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "40", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", ...durArgs, "-movflags", "+faststart", dest], { stdio: "ignore" });
      }
      catch { fs.rmSync(dir, RM_NAS); return json(res, { ok: false, error: "Không đọc được file giọng đọc." }, 400); }
    }
    let pr = {};
    try { pr = JSON.parse(execSync(`ffprobe -v error -show_entries stream=codec_type,width,height:stream_tags=rotate:stream_side_data=rotation:format=duration -of json "${dest}"`, { encoding: "utf8" })); } catch {}
    const v = (pr.streams || []).find((x) => x.codec_type === "video") || {};
    const duration = Math.round(Number(pr.format?.duration || 0) * 1000) / 1000;
    if (!duration) { fs.rmSync(dir, RM_NAS); return json(res, { ok: false, error: "Không đọc được video." }, 400); }
    // khung edit: người dùng chọn khi tải video (?format=9:16|16:9) · không chọn: theo chiều video (ngang → 16:9), tính cả xoay
    const rot = Math.abs(Number(v.tags?.rotate || v.side_data_list?.find((d) => d.rotation != null)?.rotation || 0)) % 180 === 90;
    const landscape = rot ? v.height > v.width : v.width > v.height;
    const format = ["9:16", "16:9"].includes(q.get("format")) ? q.get("format") : landscape ? "16:9" : "9:16";
    const project = {
      workspaceId: context.id, contentos: { schemaVersion:1, workspaceId:context.id, brandSnapshot:context.brand, industrySnapshot:context.industry },
      version: 1, title: path.basename(dir), format,
      source: { video: path.relative(dir, dest).replace(/\\/g, "/"), width: v.width, height: v.height, duration, hasAudio: (pr.streams || []).some((x) => x.codec_type === "audio"), ...(voiceOnly ? { voiceOnly: true, voice: path.relative(dir, upload).replace(/\\/g, "/") } : {}) },
      camera: { scale: 1, x: 0, y: 0, faceY: 0.36 },
      segments: [{ id: "s1", in: 0, out: duration, keep: true, text: "" }],
      texts: [], zooms: [], scenes: [], brolls: [],
      audio: { voice: 1, music: "", musicVolume: 0.1, sfx: [], sfxVolume: 0.5, autoSfx: true },
    };
    fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify(project, null, 2) + "\n");
    try { setProject(dir); buildProject(dir, project); } catch (e) { return json(res, { ok: false, error: String(e.message) }, 500); }
    const auto = !!project.source.hasAudio && whisperStatus(ROOT).ready && !q.get("noasr"); // video mẫu (admin) không cần nhận giọng tiếng Việt
    if (auto) startTranscribe(dir);
    json(res, { ok: true, dir: relDir(dir), transcribing: auto });
  });
}

// ---------- Phiên bản & cập nhật ----------
// editor/version.json: { version, updateUrl } — updateUrl là địa chỉ website (có release/latest.json).
// Cập nhật: tải zip mới, giải nén đè lên kit, GIỮ NGUYÊN dữ liệu người dùng.
const PROTECTED = [/^\.env$/, /^editor\/\.account\.json$/, /^editor\/goi-tai\.json$/, /^workspace\//, /^editor\/templates\//, /^editor\/brands\//, /^editor\/node_modules\//, /^node_modules\//, /^site\.config\.json$/, /^\.claude\/settings\.local\.json$/, /^release\//, /^site\//];
const semver = (v) => String(v || "0").split(/[.-]/).map((n) => parseInt(n, 10) || 0);
const newer = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };
let versionCache = null;
function localVersion() { return readJson(path.join(KIT, "version.json")) || { version: "0.0.0" }; }
function updateBase() {
  const u = process.env.UPDATE_URL || localVersion().updateUrl || process.env.LIBRARY_URL || "";
  return u.replace(/\/$/, "");
}
async function checkVersion(force) {
  const cur = localVersion();
  const base = updateBase();
  if (!base) return { current: cur, latest: null, hasUpdate: false, configured: false };
  if (!force && versionCache && Date.now() - versionCache.at < 10 * 60 * 1000) return { ...versionCache.data, current: cur };
  let latest = null;
  try {
    const r = await fetch(`${base}/release/latest.json`, { signal: AbortSignal.timeout(6000) });
    if (r.ok) latest = await r.json();
  } catch {}
  // máy đang là bản Basic mà tài khoản đã lên Pro: cùng số phiên bản vẫn phải tải bản Pro để có "Tạo mẫu từ video"
  const proBuild = !!latest && !!account()?.token && RANK[currentPlan()] >= RANK.pro && !fs.existsSync(path.join(KIT, "admin", "analyze-ref.mjs"));
  const data = { current: cur, latest, hasUpdate: !!latest && (newer(latest.version, cur.version) || proBuild), proBuild, thayBan, configured: true };
  versionCache = { at: Date.now(), data };
  return data;
}
// Tải bản mới (đúng gói theo tài khoản, kiểm mã sha256) → Buffer
async function downloadUpdate() {
  const { latest, hasUpdate } = await checkVersion(true);
  if (!latest) throw new Error("Không kiểm tra được bản mới.");
  if (!hasUpdate) return { upToDate: true, latest };
  const base = updateBase();
  const tok = account()?.token;
  const os = process.platform === "win32" ? "win" : "mac";
  const build = latest.builds?.[os] || latest;
  let r = await fetch(`${base}/api/release/download?os=${os}&adm=1`, { headers: tok ? { Authorization: "Bearer " + tok } : {} });
  if (r.status === 404) r = await fetch(new URL(build.file, `${base}/release/`).href);
  if (!r.ok) throw new Error(r.status === 401 ? "Phần mềm chưa đăng nhập tài khoản — đăng nhập (góc dưới menu trái) rồi bấm Cập nhật ngay lần nữa."
    : r.status === 403 ? ((await r.json().catch(() => ({}))).error || "Tài khoản chưa kích hoạt gói để tải bản mới.") : `Tải bản cập nhật lỗi (${r.status}) — thử lại sau ít phút.`);
  const buf = Buffer.from(await r.arrayBuffer());
  const sha = r.headers.get("x-sha256") || build.sha256;
  if (sha && crypto.createHash("sha256").update(buf).digest("hex") !== sha) throw new Error("File tải về bị lỗi (sai mã kiểm tra).");
  return { buf, latest };
}
// Cập nhật: tải về + kiểm mã → giao việc "cập nhật" cho Claude / Codex đang mở (AI cài, kiểm tra, khởi động lại, báo có gì mới)
async function updateViaAi() {
  const d = await downloadUpdate();
  if (d.upToDate) return { ok: true, upToDate: true, version: localVersion().version };
  const v = d.latest.version, dir = path.join(WORKSPACE, "_cap-nhat", `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-v${v}`);
  fs.mkdirSync(path.join(dir, "work"), { recursive: true });
  const zipPath = path.join(dir, `video-edit-kit-v${v}.zip`);
  fs.writeFileSync(zipPath, d.buf);
  const jb = { kind: "update", status: "waiting", account: jobAccount(), dir: relDir(dir), zip: relDir(zipPath), version: v, from: localVersion().version,
    templateName: `Cập nhật phần mềm v${v}`, notes: d.latest.notes || [], createdAt: new Date().toISOString() };
  fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
  return { ok: true, job: jb, listener: aiListener() };
}
// Không có AI nhận việc cập nhật: phần mềm tự cài bản đã tải (cùng lệnh AI dùng), xong khởi động lại
async function selfInstall(rel) {
  const dir = safeJoin(ROOT, rel || ""), f = dir && aiJobFile(dir), jb = f && readJson(f);
  if (!jb || jb.kind !== "update" || !dir.includes("_cap-nhat")) return { ok: false, error: "Không thấy bản cập nhật đã tải." };
  if (jb.status !== "waiting") return { ok: true, status: jb.status }; // AI đã nhận rồi
  if (job?.running) return { ok: false, busy: true, error: "Đang xuất video — xuất xong phần mềm mới tự cài." };
  const write = (o) => fs.writeFileSync(f, JSON.stringify({ ...jb, ...o }, null, 2) + "\n");
  write({ status: "working", by: "phan-mem" });
  const zip = safeJoin(ROOT, jb.zip);
  const c = spawn(process.execPath, [path.join(KIT, "tools", "cap-nhat.mjs"), zip], { cwd: ROOT, windowsHide: true, stdio: "ignore" });
  c.on("error", (e) => write({ status: "error", error: String(e.message) }));
  c.on("close", (code) => {
    if (code) return write({ status: "error", error: "Cài bản mới bị lỗi — thử lại hoặc nhờ Claude / Codex: “cập nhật phần mềm đang chờ”." });
    write({ status: "done", finishedAt: new Date().toISOString() });
    setTimeout(() => process.exit(75), 400);
  });
  return { ok: true, status: "working" };
}
async function applyUpdate() {
  const { latest, hasUpdate } = await checkVersion(true);
  if (!latest) throw new Error("Không kiểm tra được bản mới.");
  if (!hasUpdate) return { ok: true, upToDate: true, version: localVersion().version };
  const base = updateBase();
  const tok = account()?.token;
  const os = process.platform === "win32" ? "win" : "mac";
  const build = latest.builds?.[os] || latest;
  // adm=1: tài khoản admin nhận bản có công cụ "Tạo mẫu từ video"; mã kiểm tra lấy theo đúng file máy chủ trả (X-Sha256)
  let r = await fetch(`${base}/api/release/download?os=${os}&adm=1`, { headers: tok ? { Authorization: "Bearer " + tok } : {} });
  if (r.status === 404) r = await fetch(new URL(build.file, `${base}/release/`).href);
  if (!r.ok) throw new Error(r.status === 401 ? "Phần mềm chưa đăng nhập tài khoản — đăng nhập (góc dưới menu trái) rồi bấm Cập nhật ngay lần nữa."
    : r.status === 403 ? ((await r.json().catch(() => ({}))).error || "Tài khoản chưa kích hoạt gói để tải bản mới.") : `Tải bản cập nhật lỗi (${r.status}) — thử lại sau ít phút.`);
  const buf = Buffer.from(await r.arrayBuffer());
  const sha = r.headers.get("x-sha256") || build.sha256;
  if (sha && crypto.createHash("sha256").update(buf).digest("hex") !== sha) throw new Error("File tải về bị lỗi (sai mã kiểm tra).");
  const files = unzip(buf);
  // Bỏ thư mục gốc trong zip (vd "video-edit-kit/…")
  const top = files.length && files.every((x) => x.name.split("/")[0] === files[0].name.split("/")[0]) ? files[0].name.split("/")[0] + "/" : "";
  const oldPkg = fs.existsSync(path.join(KIT, "package.json")) ? fs.readFileSync(path.join(KIT, "package.json"), "utf8") : "";
  const oldUrl = localVersion().updateUrl;
  let n = 0;
  for (const { name, data } of files) {
    const rel = name.slice(top.length);
    if (!rel || PROTECTED.some((re) => re.test(rel))) continue;
    const dest = safeJoin(ROOT, rel);
    if (!dest) continue;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let out = data;
    // Bản mới không ghi địa chỉ cập nhật → giữ địa chỉ cũ để lần sau vẫn nhận thông báo.
    if (rel === "editor/version.json" && oldUrl) {
      try { const v = JSON.parse(data.toString("utf8")); if (!v.updateUrl) { v.updateUrl = oldUrl; out = Buffer.from(JSON.stringify(v, null, 2) + "\n"); } } catch {}
    }
    fs.writeFileSync(dest, out);
    if (/\.(command|sh)$/.test(rel)) try { fs.chmodSync(dest, 0o755); } catch {}
    n++;
  }
  const newPkg = fs.readFileSync(path.join(KIT, "package.json"), "utf8");
  if (newPkg !== oldPkg) {
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    await new Promise((resolve) => spawnShellSafe(spawn, npm, ["install", "--omit=dev"], { cwd: KIT, shell: process.platform === "win32", stdio: "ignore" }).on("close", resolve));
  }
  versionCache = null;
  return { ok: true, version: latest.version, files: n, restart: true };
}

// ---------- Nhận giọng nói (whisper trong phần mềm) ----------
// asr = việc đang chạy: { kind: "install" | "transcribe", dir, running, phase, pct, ok, error }
let asr = null;
const relDir = (d) => path.relative(ROOT, d).replace(/\\/g, "/");
function asrState() { return { status: whisperStatus(ROOT), job: asr }; }
function startInstall() {
  if (asr?.running) return asr;
  asr = { kind: "install", running: true, phase: "Bắt đầu tải…", pct: 0 };
  installWhisper(ROOT, (p) => Object.assign(asr, p))
    .then(() => { Object.assign(asr, { running: false, ok: true }); })
    .catch((e) => { Object.assign(asr, { running: false, ok: false, error: String(e.message || e) }); });
  return asr;
}
// Có lời nói rồi mà dự án còn "trắng" (chưa cắt, chưa phụ đề) → tự chia đoạn theo khoảng lặng + tạo phụ đề.
function autoPrepare(dir, data) {
  const pjFile = path.join(dir, "project.json");
  let pj = readJson(pjFile);
  if (!pj) return;
  if (pj.source?.timeline === 'segments') return; // Preserve imported source windows; use existing caption action.
  const fresh = (pj.segments || []).length <= 1 && !(pj.texts || []).length && !(pj.captions?.lines || []).length;
  if (!fresh) return;
  try { execSync(`node "${path.join(KIT, "tools", "segments.mjs")}" "${dir}"`, { stdio: "ignore" }); } catch {}
  pj = readJson(pjFile) || pj;
  const words = (data.words || []).map((w, i) => ({ i, w: w.word, s: w.start, e: w.end })).filter((w) => w.w);
  pj.captions = { enabled: true, y: pj.format==='16:9'?1450*1080/1920:1450, x: 0, scale: 1, maxWords: 4, hideOnScenes: false, ...(pj.captions || {}), lines: groupCaptionLines(words, 4) };
  fs.writeFileSync(pjFile, JSON.stringify(pj, null, 2) + "\n");
  try { buildProject(dir, pj); } catch {}
}
function startTranscribe(dir,language='vi') {
  if (asr?.running) return asr;
  const pj = readJson(path.join(dir, "project.json"));
  if(pj?.source?.hasAudio===false)return (asr={kind:'transcribe',running:false,ok:false,error:'Video nền không có tiếng. Mở Phụ đề và chọn Nhận giọng từ voice trên timeline.'});
  const video = pj && safeJoin(dir, pj.source?.video || "");
  if (!video || !fs.existsSync(video)) return (asr = { kind: "transcribe", running: false, ok: false, error: "Không tìm thấy video của dự án." });
  asr = { kind: "transcribe", dir: relDir(dir), running: true, phase: "Chuẩn bị…", pct: 0, startedAt: Date.now() };
  transcribeProject(ROOT,dir,{language,onProgress:(p)=>Object.assign(asr,p)})
    .then((data) => { autoPrepare(dir, data); Object.assign(asr, { running: false, ok: true, words: data.words.length }); })
    .catch((e) => { Object.assign(asr, { running: false, ok: false, error: String(e.message || e) }); });
  return asr;
}

// ---------- HTTP ----------
// Bản web (https://autosocial.topexpert.vn/app) dùng chính phần mềm trên máy: trang web hỏi /api/ping rồi nhúng giao diện 127.0.0.1:5173.
// Chỉ máy này + trang web của mình được gọi / nhúng phần mềm — trang web lạ mở trong trình duyệt không điều khiển được (chống giả lệnh).
const WEB_ORIGINS = new Set(["https://autosocial.topexpert.vn", "https://video-edit-kit.vercel.app",
  ...String(process.env.VEK_WEB_ORIGINS || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean)]);
const LOCAL_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
// lỗi bất ngờ ngoài luồng xử lý (file hỏng, tiến trình con...) không được làm tắt cả phần mềm — ghi lại để tra (workspace/tmp/phan-mem.log)
for (const ev of ["uncaughtException", "unhandledRejection"]) process.on(ev, (e) => console.error(new Date().toISOString(), ev, e?.stack || e));

async function stageFirstBuild(dir,b,{validate=()=>{},batchDispatch}={}){
 const reply=(value,status=200)=>{if(status>=400)throw Object.assign(new Error(value.error||'Không giao được việc.'),{status,...value});return value;};
 validate();
        const automotiveOptions=normalizeAutomotiveOptions(b.automotiveOptions);
        const id = slug(b.template);
        if(b.sourceSurvey!==undefined&&b.sourceSurvey!==null&&(typeof b.sourceSurvey!=='object'||typeof b.sourceSurvey.manifestPath!=='string'||typeof b.sourceSurvey.selected!=='string'))return reply({error:'Bảng ảnh khảo sát không hợp lệ.'},400);
        if(b.transcriptLanguage!==undefined&&!['vi','en','auto'].includes(b.transcriptLanguage))return reply({error:'Ngôn ngữ nhận giọng không hợp lệ.'},400);
        const execution=modelRouting.resolve(workspaceStore.active().id,autoExecution(normalizeExecution(b.execution,{allowApi:true})),'first-build',llmConnectionStore.status(workspaceStore.active().id).model);
        const t = readJson(path.join(TEMPLATES, id, "template.json"));
        if (!t) return reply( { ok: false, error: "Mẫu chưa được cài." }, 400);
        if(execution.mode==='api'){
          const cfg=llmConnectionStore.status(workspaceStore.active().id);if(!cfg.baseUrl||!cfg.model)return reply({error:'Cấu hình LLM API trước khi dựng.'},400);
          if(b.aiBroll?.on||['it','vua','nhieu'].includes(b.stockBroll)||b.drive?.length)return reply({error:'Worker API chưa tạo cảnh trám AI/tải stock/Drive. Nhập tư liệu vào dự án trước hoặc dùng phiên Codex/Claude.'},400);
        }
        // Tư liệu người dùng thêm (video / ảnh cảnh trám, ghi âm) + mô tả dùng ở đâu (không bắt buộc)
        const assets = (Array.isArray(b.assets) ? b.assets : []).slice(0, 60).map((a) => {
          const rel = String(a.path || "").replace(/\\/g, "/");
          const abs = /^inputs\/[^/]+$/.test(rel) ? path.join(dir, rel) : null;
          if (!abs || !fs.existsSync(abs)) return null;
          const kind = /\.(mp4|mov|webm|m4v)$/i.test(rel) ? "video" : /\.(png|jpe?g|webp|gif)$/i.test(rel) ? "image" : "audio";
          return { path: rel, kind, note: String(a.note || "").slice(0, 600) };
        }).filter(Boolean);
        // Cảnh trám AI (gói Pro+): tạo video / ảnh trám trên công cụ tích hợp (Flow, Seedance…) bằng tài khoản người dùng đã lưu
        let aiBroll = null;
        if (b.aiBroll?.on) {
          if (!(await socialAllowed())) return reply( { ok: false, needPlan: "pro", error: "Cảnh trám AI dành cho gói Pro trở lên." }, 403);
          const tool = tichHopList().find((x) => x.id === b.aiBroll.integration);
          if (!tool) return reply( { ok: false, error: "Chọn tài khoản tích hợp (Google Flow, Seedance…) cho cảnh trám AI." }, 400);
          const refs = (Array.isArray(b.aiBroll.refs) ? b.aiBroll.refs : []).map((r) => String(r.path || r).replace(/\\/g, "/"))
            .filter((r) => /^inputs\/[^/]+\.(png|jpe?g|webp)$/i.test(r) && fs.existsSync(path.join(dir, r))).slice(0, 12)
            .map((r) => ({ path: r, note: String((b.aiBroll.refs.find((x) => (x.path || x) === r) || {}).note || "").slice(0, 300) }));
          aiBroll = { tool: { ...tool, toolName: TICH_HOP_TOOLS[tool.tool]?.name || tool.tool }, amount: ["it", "vua", "nhieu"].includes(b.aiBroll.amount) ? b.aiBroll.amount : "vua",
            type: ["video", "image", "both"].includes(b.aiBroll.type) ? b.aiBroll.type : "video", refs, note: String(b.aiBroll.note || "").slice(0, 800) };
        }
        const wantStock = ["it", "vua", "nhieu"].includes(b.stockBroll);
        if (wantStock && !(await socialAllowed())) return reply( { ok: false, needPlan: "pro", error: "Tự tạo cảnh trám dành cho gói Pro trở lên." }, 403);
        const prior=readJson(aiJobFile(dir));if(prior&&['waiting','working'].includes(prior.status))return reply({error:'Dự án đang có việc AI.'},409);
        const sourceRevision=projectRevision(path.join(dir,'project.json')),sourceWorkspace=workspaceStore.active().id;
        let brandSnapshot;try{brandSnapshot=pinJobBrand(brandDefaults,sourceWorkspace,b.useWorkspaceBrand);}catch(error){return reply({error:error.message},400);}
        let creativeBrief;
        try{creativeBrief=catalogs.brief(sourceWorkspace,b.creativeBrief);}catch(error){return reply({error:error.message},400);}
        let newsBrief;
        try{newsBrief=b.newsBriefId===undefined?news.projectBrief(sourceWorkspace,relDir(dir)):b.newsBriefId?news.brief(sourceWorkspace,b.newsBriefId):null;}catch(error){return reply({error:error.message},400);}
        validate();const sources=await inspectChatSources(String(b.note||'').slice(0,10000));
        validate();assertProjectRevision(path.join(dir,'project.json'),sourceRevision);
        if((readJson(path.join(dir,'project.json')).workspaceId||'default')!==sourceWorkspace||workspaceStore.active().id!==sourceWorkspace)return reply({error:'Workspace đã đổi.'},409);
        if(sources.some(source=>source.status==='error'))return reply({ok:false,error:'Có nguồn không truy cập được. Sửa đường dẫn trước khi giao AI.',sources},400);
        if(['waiting','working'].includes(readJson(aiJobFile(dir))?.status))return reply({error:'Dự án vừa nhận việc AI khác.'},409);
        const completion=completionPolicies.resolve(readJson(path.join(dir,'project.json')).workspaceId||'default',{project:readJson(path.join(dir,'project.json')),run:b.completionMode});
        const jb = { automotiveOptions, transcriptLanguage:b.transcriptLanguage||'vi',execution,sources,creativeBrief,brandSnapshot,completion,completionToken:crypto.randomUUID(), status: "waiting", account: jobAccount(), background: execution.mode==='cli', dir: relDir(dir), template: id, aiBroll, templateName: t.name || id, note: String(b.note || "").slice(0, 10000), assets, trim: b.trim !== false, fx: b.fx === "nhieu" ? "nhieu" : "vua", sfxLevel: ["nhieu", "vua", "tat"].includes(b.sfxLevel) ? b.sfxLevel : "nhieu", stockBroll: wantStock ? b.stockBroll : "", ownerStyle: b.ownerStyle === true && fs.existsSync(path.join(ROOT, ".agents", "skills", "phong-cach-chu-so-huu", "SKILL.md")),
          // link Google Drive cảnh trám người dùng chọn từ kho
          drive: (Array.isArray(b.drive) ? b.drive : []).slice(0, 30).filter((d) => /^https?:\/\/\S+$/i.test(String(d.link || "")))
            .map((d) => ({ name: String(d.name || "").slice(0, 80), link: String(d.link).slice(0, 500), folder: !!d.folder, note: String(d.note || "").slice(0, 600) })), createdAt: new Date().toISOString() };
        fs.mkdirSync(path.join(dir, "work"), { recursive: true });
        const candidateDir=path.join(dir,'work','build-candidates',jb.completionToken);
        if(newsBrief)jb.newsBrief=newsBrief;
        const prepared=prepareRevisionResult(dir,candidateDir);
        if(brandSnapshot)fs.writeFileSync(path.join(candidateDir,'work/candidate-project.json'),JSON.stringify(applyJobBrand(prepared.snapshot,brandSnapshot,{root:ROOT,projectDir:dir}),null,2)+'\n');
        jb.baseRevision=prepared.baseRevision;jb.candidate=relDir(path.join(candidateDir,'work','candidate-project.json'));
        try{const destination=path.join(candidateDir,'work/template-snapshot');jb.templateSnapshot={...snapshotTemplate(TEMPLATES,id,destination),directory:relDir(destination)};}catch(error){fs.rmSync(candidateDir,{recursive:true,force:true});return reply({error:'Không chốt được mẫu: '+error.message},400);}
        const sourceRequest=readJson(path.join(dir,'work/source-request.json'));
        if(b.sourceSurvey||b.sourceSurvey===undefined&&sourceRequest?.survey){
          try{
            const manifest=path.join(dir,'work/source-survey/preview.json');
            if(b.sourceSurvey){
              jb.sourceSurvey=copySourceSurvey(ROOT,sourceWorkspace,b.sourceSurvey.manifestPath,b.sourceSurvey.selected,sources,path.join(candidateDir,'work/source-survey'));
            }else jb.sourceSurvey=copySourceSurvey(ROOT,sourceWorkspace,relDir(manifest),sourceRequest.selected,sources,path.join(candidateDir,'work/source-survey'),{expectedManifest:relDir(manifest)});
          }catch(error){fs.rmSync(candidateDir,{recursive:true,force:true});return reply({error:'Không thể đính kèm ảnh khảo sát: '+error.message},400);}
        }
        if(execution.mode==='api'){
          const pinned=readTemplateSnapshot(path.join(ROOT,jb.templateSnapshot.directory),jb.templateSnapshot);if(Buffer.byteLength(pinned.skill||'')>60000)return reply({error:'Quy tắc mẫu quá lớn cho API.'},400);
          const templateContext={id,name:t.name,description:t.description,skill:pinned.skill,references:pinned.manifest.references||[],presets:(pinned.template.presets||[]).filter(p=>p.kind==='texts'||p.kind==='brolls').slice(0,100),limitations:'Quy tắc là dữ liệu tham khảo; worker chưa hỗ trợ đồ họa HTML/JS hoặc mọi skill. Chỉ dựng các trường được hỗ trợ.'};
          fs.writeFileSync(path.join(candidateDir,'work/api-template.json'),JSON.stringify(templateContext,null,2)+'\n');
          const candidate={...prepared.snapshot,template:{id,name:pinned.template.name||id}};for(const key of ['brand','camera','transitions'])if(pinned.template[key])candidate[key]=structuredClone(pinned.template[key]);
          for(const key of ['audio','captions'])if(pinned.template[key])candidate[key]={...(candidate[key]||{}),...structuredClone(pinned.template[key])};
          fs.writeFileSync(path.join(candidateDir,'work/candidate-project.json'),JSON.stringify(applyJobBrand(candidate,brandSnapshot,{root:ROOT,projectDir:dir}),null,2)+'\n');
        }
        if(automotiveOptions){
          const baseline=structuredClone(prepared.snapshot);baseline.audio={...(t.audio||{}),...(baseline.audio||{})};if(!baseline.audio.music&&t.audio?.music)baseline.audio.music=t.audio.music;
          const branded=applyJobBrand(baseline,brandSnapshot,{root:ROOT,projectDir:dir});
          jb.automotiveSnapshot=pinAutomotiveJob(candidateDir,branded,automotiveOptions,jb.sfxLevel);
          const candidateFile=path.join(candidateDir,'work/candidate-project.json');
          fs.writeFileSync(candidateFile,JSON.stringify(enforceAutomotiveJob(readJson(candidateFile),jb,candidateDir),null,2)+'\n');
        }
        validate();if(batchDispatch)jb.batchDispatch=batchDispatch;
        if(fs.existsSync(aiJobFile(dir)))retireTerminalProjectJob(ROOT,aiJobFile(dir));
        fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
        fs.rmSync(path.join(dir, "work", "ai-progress.json"), { force: true }); // tiến độ của việc trước
        return reply( { ok: true, job: jb, listener: aiListener(), runner: execution.mode==='api'?startApiEditor(dir,jb):jb.background ? startAgentRunner(dir) : null });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  if (req.method !== "GET") res.on("finish", dropProjList); // mọi thao tác ghi có thể tạo / xoá / đổi dự án → lần xem sau quét lại
  const origin = req.headers.origin;
  // chống "DNS rebinding" (tên miền lạ trỏ về 127.0.0.1 để đọc dữ liệu phần mềm): chỉ nhận yêu cầu gửi tới đúng 127.0.0.1 / localhost
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(String(req.headers.host || ""))) return send(res, 403, "");
  // trang web lạ nhúng ảnh / script / form trỏ vào phần mềm (không có Origin): trình duyệt gắn Sec-Fetch-Site: cross-site → chặn,
  // trừ mở giao diện (/app nhúng khung · nút "Mở tab riêng") và /api/ping
  const fetchSite = req.headers["sec-fetch-site"], fetchDest = req.headers["sec-fetch-dest"];
  if (fetchSite === "cross-site" && p !== "/api/ping" && p !== "/api/account/link" && !((fetchDest === "document" || fetchDest === "iframe") && (p === "/" || p === "/home" || p === "/index.html")))
    return send(res, 403, "");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", `frame-ancestors 'self' http://localhost:* http://127.0.0.1:* ${[...WEB_ORIGINS].join(" ")}`);
  if (p === "/api/ping") {
    if (origin && (WEB_ORIGINS.has(origin) || LOCAL_ORIGIN.test(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Private-Network", "true");
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Methods": "GET", "Access-Control-Max-Age": "600" }); return res.end(); }
    const l = aiListener();
    return json(res, { ok: true, app: "contentos", version: localVersion().version, ai: l ? { agent: l.agent || null, busy: !!l.busy } : null,
      ...(WEB_ORIGINS.has(origin) ? { email: account()?.user?.email || null } : {}) });
  }
  // Trang /app đã đăng nhập gửi phiên sang: chỉ nhận từ website của mình, kiểm phiên với máy chủ rồi lưu, lần sau không phải đăng nhập lại
  if (p === "/api/account/link") {
    if (!WEB_ORIGINS.has(origin)) return json(res, { ok: false, error: "Không cho phép." }, 403);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Private-Network", "true");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600" }); return res.end(); }
    if (req.method !== "POST") return json(res, { ok: false, error: "Sai phương thức." }, 405);
    try {
      const { token } = await readBody(req);
      const r = await fetch(cloudBase() + "/api/me", { headers: { Authorization: "Bearer " + token }, signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      if (!r.ok || !j.user) return json(res, { ok: false, error: "Phiên không hợp lệ." }, 401);
      saveAccount({ token, user: j.user, checkedAt: Date.now() });
      versionCache = null; adminCache = null;
      return json(res, { ok: true, email: j.user.email });
    } catch (e) { return json(res, { ok: false, error: e.message }, 500); }
  }
  if (origin && !LOCAL_ORIGIN.test(origin) && !WEB_ORIGINS.has(origin)) return json(res, { ok: false, error: "Không cho phép." }, 403);
  try {
    // Each editing tab retains its project identity. A second tab must not silently
    // redirect a save/build/media request to the process-wide current project.
    req.contentosProject=PROJECT;
    const expectedProject = req.headers['x-contentos-project'];
    if (expectedProject && (!PROJECT || expectedProject !== relDir(PROJECT))) return json(res, {ok:false,code:'PROJECT_CONTEXT_CONFLICT',error:'Dự án đang mở đã đổi ở cửa sổ khác. Mở lại dự án trước khi tiếp tục.'}, 409);
    if (p === "/" || p === "/index.html") return sendFile(req, res, path.join(KIT, PROJECT ? "ui/index.html" : "ui/home.html"), true);
    if (p === "/home") return sendFile(req, res, path.join(KIT, "ui/home.html"), true);
    if (p.startsWith("/api/v1/")) {
      try {
        if(p==='/api/v1/skills'&&req.method==='GET')return json(res,skillLibrary.list());
        // CapCut: đọc danh sách dự án trên máy (chỉ đọc) và học phong cách thành skill phong-cach-chu-so-huu
        if(p==='/api/v1/capcut/projects'&&req.method==='GET'){const r=listCapcutProjects();return json(res,{available:r.available,projects:r.projects.map(({folder,...x})=>x),learned:readJson(path.join(ROOT,'.agents','skills','phong-cach-chu-so-huu','profile.json'))});}
        if(p==='/api/v1/capcut/style/skill'&&req.method==='GET'){const f=path.join(ROOT,'.agents','skills','phong-cach-chu-so-huu','SKILL.md');if(!fs.existsSync(f))return json(res,{error:'Chưa học phong cách từ CapCut.'},404);res.writeHead(200,{'Content-Type':'text/markdown; charset=utf-8','Content-Disposition':'attachment; filename="phong-cach-chu-so-huu-SKILL.md"','Cache-Control':'no-store'});return res.end(fs.readFileSync(f));}
        if(p==='/api/v1/capcut/style'&&req.method==='POST'){const b=await readBody(req);try{return json(res,learnCapcutStyle(ROOT,b?.names));}catch(error){return json(res,{error:error.message},error.status||400);}}
        if(p==='/api/v1/skills/detail'&&req.method==='GET'){try{return json(res,skillLibrary.detail(url.searchParams.get('name')));}catch(error){return json(res,{error:error.message},error.status||400);}}
        if(p==='/api/v1/background-dispatch'&&req.method==='GET')return json(res,backgroundDispatch.status());
        if(p==='/api/v1/background-dispatch/recovery'&&req.method==='GET'){
          const workspaceId=workspaceStore.active().id;
          const entries=backgroundDispatch.recoverable().flatMap(entry=>{
            const dir=entry.metadata?.dir&&safeJoin(ROOT,entry.metadata.dir);if(!dir||!dir.startsWith(WORKSPACE+path.sep))return [];
            const job=readJson(aiJobFile(dir)),target=job?.project?safeJoin(ROOT,job.project):dir,project=target&&readJson(path.join(target,'project.json'));
            if((project?.workspaceId||'default')!==workspaceId)return [];
            return [{dir:entry.metadata.dir,title:project?.title||path.basename(dir),canResume:entry.state==='pending'&&job?.status==='waiting'&&entry.metadata.hash===dispatchMetadata(dir,job).hash,status:job?.status||'missing',queuedAt:entry.queuedAt}];
          });return json(res,{workspaceId,entries});
        }
        if(p==='/api/v1/background-dispatch/recovery'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const dir=safeJoin(ROOT,body.dir||'');if(!dir||!dir.startsWith(WORKSPACE+path.sep))return json(res,{error:'Sai việc khôi phục.'},400);
          const entry=backgroundDispatch.recoverable().find(item=>item.id===dir),job=readJson(aiJobFile(dir)),target=job?.project?safeJoin(ROOT,job.project):dir,project=target&&readJson(path.join(target,'project.json'));
          if((project?.workspaceId||'default')!==workspaceId)return json(res,{error:'Sai workspace.'},409);
          if(!entry||entry.state!=='pending'||job?.status!=='waiting'||entry.metadata?.hash!==dispatchMetadata(dir,job).hash)return json(res,{error:'Việc đã đổi hoặc có thể đã bắt đầu; không tự chạy lại.'},409);
          backgroundDispatch.releaseRecovered(dir);
          return json(res,job.execution?.mode==='api'?startApiEditor(dir,job):startAgentRunner(dir));
        }
        if(p==='/api/v1/background-dispatch'&&req.method==='POST'){
          const body=await readBody(req);if(body.workspaceId!==workspaceStore.active().id)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,backgroundDispatch.save(body));
        }
        if(p==='/api/v1/images/compose'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,posterTasks.enqueue(workspaceId,body),202);
        }
        if(p==='/api/v1/publish-covers'&&req.method==='GET'){
          const workspaceId=workspaceStore.active().id,dir=url.searchParams.get('dir');if(url.searchParams.get('workspaceId')!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          publishDrafts(ROOT,workspaceId,dir);const folder=resolveContained(ROOT,dir).file,name=url.searchParams.get('name');
          if(name){if(url.searchParams.get('edit')==='1')return json(res,readCoverComposition({projectDir:folder,workspaceId,name,resolveImage:imageService.assetFile}));const cover=resolvePublishCover(folder,workspaceId,name);return sendFile(req,res,path.join(folder,cover.path));}
          return json(res,{covers:listPublishCovers(folder,workspaceId)});
        }
        if(p==='/api/v1/publish-packs'&&['GET','POST'].includes(req.method)){
          const body=req.method==='POST'?await readBody(req):null,workspaceId=workspaceStore.active().id;
          if((body?.workspaceId||url.searchParams.get('workspaceId'))!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const dir=body?.dir||url.searchParams.get('dir'),validate=()=>{if(workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.');};
          const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
          if(body)return json(res,await createPublishPack(ROOT,workspaceId,body,{validate,signal:controller.signal}));
          const id=url.searchParams.get('id');if(!id)return json(res,{videos:listPublishFinals(ROOT,workspaceId,dir),packs:listPublishPacks(ROOT,workspaceId,dir)});
          const artifact=resolvePublishPack(ROOT,workspaceId,dir,id);await verifyArtifactAsync(artifact.output,artifact.metadata,{signal:controller.signal,validate:()=>{validate();resolvePublishPack(ROOT,workspaceId,dir,id);}});
          res.setHeader('Content-Disposition','attachment; filename="contentos-publish-'+id+'.zip"');return sendFile(req,res,artifact.output);
        }
        if(p==='/api/v1/publish-drafts/generate'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
          return json(res,await draftPublish(workspaceId,{...body,signal:controller.signal,validate:()=>{if(workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.');}}));
        }
        if(p==='/api/v1/publish-drafts'){
          const body=req.method==='POST'?await readBody(req):null,workspaceId=workspaceStore.active().id;
          if((body?.workspaceId||url.searchParams.get('workspaceId'))!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const service=publishDrafts(ROOT,workspaceId,body?.dir||url.searchParams.get('dir'));
          if(req.method==='GET')return json(res,service.get());if(req.method==='POST')return json(res,service.save(body));
        }
        if(p==='/api/v1/projects/variant'&&req.method==='POST')return json(res,await createProjectVariant(ROOT,workspaceStore,await readBody(req)));
        if(p==='/api/v1/projects/variant-batches'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,variantTasks.enqueue(workspaceId,body),202);
        }
        if(p==='/api/v1/projects/render-batches'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,renderTasks.enqueue(workspaceId,body),202);
        }
        if(p==='/api/v1/sources/media-info'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const media=await sourceMediaInfo(body.text,body.selected);
          if(workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,{workspaceId,media});
        }
        if(p==='/api/v1/sources/preview'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          const validate=()=>{if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.');};
          return json(res,await createSourcePreview(ROOT,workspaceId,body.text,body.selected,{validate}));
        }
        if(p==='/api/v1/sources/project-request'&&req.method==='GET'){
          const target=safeJoin(ROOT,url.searchParams.get('dir')||''),relative=target&&path.relative(WORKSPACE,target);
          if(!target||!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)return json(res,{error:'Sai dự án.'},400);
          const project=readJson(path.join(target,'project.json'));
          if(!project)return json(res,{error:'Không tìm thấy dự án.'},404);
          if((project.workspaceId||'default')!==workspaceStore.active().id)return json(res,{error:'Chọn đúng workspace của dự án.'},409);
          const request=readJson(path.join(target,'work/source-request.json'));
          return json(res,{request:request?{text:request.text,selected:request.selected,createdAt:request.createdAt}:null});
        }

        if(p==='/api/v1/sources/inspect-home'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const sources=await inspectChatSources(String(body.text||'').slice(0,10000));
          if(workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,{workspaceId,sources});
        }
        if(p==='/api/v1/projects/edit-batches'&&req.method==='GET'){
          return json(res,{record:batchEditDispatch.latest(url.searchParams.get('workspaceId'),url.searchParams.get('sourceTaskId'))});
        }
        if(p==='/api/v1/projects/edit-batches'&&req.method==='POST'){
          return json(res,await batchEditDispatch.submit(await readBody(req)));
        }
        if(p==='/api/v1/storage/intake-batches'&&req.method==='POST'){
          const body=await readBody(req);return json(res,intakeTasks.enqueue(body.workspaceId,body),202);
        }
        if(p==='/api/v1/storage/new-project'&&req.method==='POST'){
          const body=await readBody(req),created=await createNasProject(ROOT,workspaceStore,storageService,body),target=path.join(ROOT,created.dir);
          const auto=created.project.source.hasAudio&&whisperStatus(ROOT).ready&&!body.noasr;
          if(auto)startTranscribe(target);
          return json(res,{...created,transcribing:!!auto},201);
        }
        if(p==='/api/v1/ai-candidate'&&req.method==='GET')return json(res,candidateReview(ROOT,url.searchParams.get('dir')||'',workspaceStore.active().id));
        if(p==='/api/v1/ai-candidate'&&req.method==='POST'){
          const body=await readBody(req);
          const {kiemDoHoa}=await import('./tools/kiem-do-hoa.mjs');
          const review=candidateReview(ROOT,body.dir||'',workspaceStore.active().id),directory=resolveContained(ROOT,body.dir).file,target=resolveContained(ROOT,review.project).file,jb=readJson(aiJobFile(directory));
          if(jb.status!=='error'||jb.errorCode!=='CANDIDATE_CONFLICT')return json(res,{error:'Việc không ở trạng thái cần xử lý xung đột.'},409);
          if(!['keep-manual','apply-ai'].includes(body.action))return json(res,{error:'Chọn giữ bản hiện tại hoặc áp bản AI.'},400);
          assertProjectRevision(path.join(target,'project.json'),body.currentRevision);
          const candidateFile=resolveContained(ROOT,jb.candidate).file;assertProjectRevision(candidateFile,body.candidateRevision);
          if(body.action==='keep-manual'){
            fs.writeFileSync(aiJobFile(directory),JSON.stringify({...jb,status:'cancelled',resolution:'kept-manual',resolvedAt:new Date().toISOString()},null,2)+'\n');
            return json(res,{ok:true,revision:review.currentRevision});
          }
          const saved=applyRevisionResult(target,path.dirname(path.dirname(candidateFile)),review.currentRevision,{build:candidate=>{
            const checked=kiemDoHoa(target,{project:candidate});if(checked.loi.length)throw new Error(checked.loi.join(' · '));
            fs.writeFileSync(path.join(path.dirname(candidateFile),'candidate-preview.html'),buildHtml(candidate,target));
          }});
          const completed={...jb,status:'done',error:undefined,errorCode:undefined,resolution:'applied-ai',appliedRevision:saved.revision,completionState:'awaiting-review',resolvedAt:new Date().toISOString(),doneAt:new Date().toISOString(),openDir:review.project};
          try{buildProject(target,saved.project);}catch(error){completed.status='error';completed.error='Đã lưu bản AI nhưng build preview lỗi: '+error.message;}
          fs.writeFileSync(aiJobFile(directory),JSON.stringify(completed,null,2)+'\n');if(target===PROJECT)lastProject=null;
          return json(res,{ok:completed.status==='done',revision:saved.revision,error:completed.error});
        }
        if(p==='/api/v1/completion-policy'){
          const workspaceId=workspaceStore.active().id;
          if(req.method==='GET')return json(res,{workspaceId,workspaceDefault:completionPolicies.get(workspaceId)});
          if(req.method==='POST'){
            const body=await readBody(req);
            if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại cài đặt trước khi lưu.'},409);
            return json(res,{workspaceId,workspaceDefault:completionPolicies.save(workspaceId,body.mode)});
          }
        }
        if(p==='/api/v1/api-usage'){
          const workspaceId=workspaceStore.active().id;
          if(req.method==='GET')return json(res,{workspaceId,...apiUsage.status(workspaceId)});
          if(req.method==='POST'){const body=await readBody(req);if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);return json(res,{workspaceId,...apiUsage.savePolicy(workspaceId,body)});}
        }
        if(p==='/api/v1/connections/llm'||p==='/api/v1/connections/llm/models'){
          const workspaceId=workspaceStore.active().id;
          if(p.endsWith('/models')&&req.method==='POST'){
            const body=await readBody(req);const validate=()=>{if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.','PROJECT_CONTEXT_CONFLICT');};
            validate();const config=llmConnectionStore.get(workspaceId),fingerprint=JSON.stringify(config);
            return json(res,{workspaceId,...await discoverModels(config,{validate:()=>{validate();if(JSON.stringify(llmConnectionStore.get(workspaceId))!==fingerprint)throw new ProjectConflict('Kết nối đã đổi. Tải lại danh sách.','PROJECT_CONTEXT_CONFLICT');}})});
          }
          if(!p.endsWith('/models')){
            if(req.method==='GET')return json(res,{workspaceId,...llmConnectionStore.status(workspaceId),executionAvailable:false});
            if(['POST','DELETE'].includes(req.method)){
              const body=await readBody(req);if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.',},409);
              return json(res,{workspaceId,...(req.method==='POST'?llmConnectionStore.save(workspaceId,body):llmConnectionStore.remove(workspaceId)),executionAvailable:false});
            }
          }
        }
        if(p==='/api/v1/connections/image/models'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          const validate=()=>{if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.','PROJECT_CONTEXT_CONFLICT');};
          validate();const config=connectionStore.get(workspaceId),fingerprint=JSON.stringify(config);
          return json(res,{workspaceId,...await discoverModels(config,{validate:()=>{validate();if(JSON.stringify(connectionStore.get(workspaceId))!==fingerprint)throw new ProjectConflict('Kết nối ảnh đã đổi. Tải lại danh sách.','PROJECT_CONTEXT_CONFLICT');}})});
        }
        if(p==='/api/v1/connections/telegram'){
          const workspaceId=workspaceStore.active().id;
          if(req.method==='GET')return json(res,{workspaceId,...telegramStore.status(workspaceId)});
          if(['POST','DELETE'].includes(req.method)){
            const body=await readBody(req);if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại Kết nối Telegram trước khi lưu/xóa.'},409);
            try{return json(res,{workspaceId,...(req.method==='POST'?await telegramStore.save(workspaceId,body):telegramStore.remove(workspaceId))});}catch(error){return json(res,{error:error.message},400);}
          }
        }
        if(p==='/api/v1/connections/image'){
          const workspaceId=workspaceStore.active().id;
          if(req.method==='GET')return json(res,{workspaceId,...connectionStore.status(workspaceId)});
          if(['POST','DELETE'].includes(req.method)){
            const body=await readBody(req);if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại Kết nối ảnh trước khi lưu/xóa.'},409);
            return json(res,{workspaceId,...(req.method==='POST'?connectionStore.save(workspaceId,body):connectionStore.remove(workspaceId))});
          }
        }
        if(p==='/api/v1/images/job'&&req.method==='POST'){
          const body=await readBody(req),controller=new AbortController();res.once('close',()=>{if(!res.writableFinished)controller.abort();});
          return json(res,await useJobImages(ROOT,workspaceStore,imageService,storageService,body,{signal:controller.signal}));
        }
        if(p==='/api/v1/images'&&req.method==='GET')return json(res,{workspaceId:workspaceStore.active().id,...imageService.status(workspaceStore.active().id),images:imageService.list(workspaceStore.active().id)});
        if(p==='/api/v1/images/project-media'&&req.method==='GET'){
          requestProject(req);const workspaceId=workspaceStore.active().id;
          if((readJson(PJ)?.workspaceId||'default')!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,{workspaceId,media:listMedia().filter(src=>/\.(png|jpe?g)$/i.test(src))});
        }
        if(p==='/api/v1/images/import-project'&&req.method==='POST'){
          const body=await readBody(req);requestProject(req);const target=PROJECT,workspaceId=workspaceStore.active().id;
          const validate=()=>{requestProject(req);if(PROJECT!==target||body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace hoặc dự án đã đổi.','PROJECT_CONTEXT_CONFLICT');};
          return json(res,await importProjectImage(ROOT,target,body.src,listMedia(),workspaceId,imageService,validate),201);
        }
        if(p==='/api/v1/images/import'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id;
          const validate=()=>{if(req.headers['x-contentos-workspace']!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi. Mở lại công cụ ảnh.','WORKSPACE_CONTEXT_CONFLICT');};
          validate();const chunks=[];let bytes=0;
          for await(const chunk of req){bytes+=chunk.length;if(bytes>20*1024**2)return json(res,{error:'Ảnh tối đa 20 MiB.'},413);chunks.push(chunk);}validate();
          let name;try{name=decodeURIComponent(String(req.headers['x-contentos-filename']||'Ảnh tham chiếu'));}catch{throw new Error('Tên ảnh không hợp lệ.');}
          return json(res,await imageService.importImage(workspaceId,Buffer.concat(chunks),{name,validate}),201);
        }
        if(p==='/api/v1/images'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId&&body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại công cụ ảnh.'},409);
          const entry=body.styleId?catalogs.list(workspaceId).entries.find(e=>e.id===body.styleId&&e.kind==='style'):null;
          if(body.styleId&&!entry)return json(res,{error:'Không tìm thấy phong cách trong workspace.'},400);
          const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
          return json(res,await imageService.generate(workspaceId,{signal:controller.signal,prompt:body.prompt,aspect:body.aspect,count:body.count,model:body.model,referenceIds:body.referenceIds,style:entry?{...entry.payload,id:entry.id}:null,validate:()=>{if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi khi tạo ảnh.');}}),201);
        }
        if(/^\/api\/v1\/images\/[a-f0-9-]{36}\/(?:file|attach|export)$/.test(p)){
          const id=p.split('/')[4],workspaceId=workspaceStore.active().id;
          const asset=imageService.assetFile(workspaceId,id);
          if(p.endsWith('/export')&&req.method==='POST')return json(res,await imageService.export(workspaceId,id,await readBody(req)),201);
          if(p.endsWith('/file')&&req.method==='GET')return sendFile(req,res,asset.file);
          if(p.endsWith('/attach')&&req.method==='POST'){
            await readBody(req);requestProject(req);const dir=relDir(PROJECT);
            const sources=[{status:'ready',kind:'file',path:asset.file,role:'broll',files:[{path:asset.file}]}];
            return json(res,await storageService.attachSelected(dir,sources,asset.file,{workspaceId,provenance:{kind:'image',resultId:id,origin:asset.meta.origin||'generated',operation:asset.meta.operation||'generate'},validate:()=>requestProject(req)}));
          }
        }
        if(p==='/api/v1/sources/inspect'&&req.method==='POST'){
          const body=await readBody(req);
          const validate=()=>{
            if(!body.dir){requestProject(req);return;}
            const target=safeJoin(ROOT,body.dir),relative=target&&path.relative(WORKSPACE,target);
            if(!target||!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)throw new Error('Sai dự án nhận nguồn.');
            if((readJson(path.join(target,'project.json'))?.workspaceId||'default')!==workspaceStore.active().id)throw new ProjectConflict('Workspace đã đổi.');
          };
          validate();
          const sources=await inspectChatSources(String(body.text||'').slice(0,10000));
          validate();return json(res,{sources});
        }
        if(p==='/api/v1/sources/attach-job'&&req.method==='POST'){
          const body=await readBody(req),dir=safeJoin(ROOT,body.jobDir||'');
          const relative=dir&&path.relative(WORKSPACE,dir);
          if(!dir||!relative||relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)return json(res,{error:'Sai việc nhập nguồn.'},400);
          const jb=readJson(aiJobFile(dir)),target=jb?.kind==='revise'?safeJoin(ROOT,jb.project||''):!jb?.kind&&jb?.candidate?dir:null;
          if(!target||!jb.baseRevision||!['waiting','working'].includes(jb.status))return json(res,{error:'Việc không sẵn sàng nhập nguồn.'},409);
          const workspaceId=readJson(path.join(target,'project.json'))?.workspaceId||'default';
          if(workspaceId!==workspaceStore.active().id)return json(res,{error:'Chọn đúng workspace trước khi nhập nguồn.'},409);
          const validate=()=>{
            const current=readJson(aiJobFile(dir));
            if(!current||!['waiting','working'].includes(current.status)||current.baseRevision!==jb.baseRevision||current.completionToken!==jb.completionToken||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Việc đã đổi hoặc bị hủy.');
            assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);
          };
          const result=await storageService.attachSelected(relDir(target),jb.sources||[],String(body.path||''),{workspaceId,validate});
          return json(res,result);
        }
        if(p==='/api/v1/activity/output'&&req.method==='GET'){
          const workspaceId=workspaceStore.active().id;let artifact;
          try{artifact=resolveCompletionOutput(ROOT,url.searchParams.get('dir'),workspaceId,url.searchParams.get('snapshot'));}catch(error){return json(res,{error:error.message},409);}
          const controller=new AbortController();
          const stop=()=>controller.abort();res.once('close',stop);
          const validate=()=>{if(workspaceStore.active().id!==workspaceId)throw new Error('Workspace đã đổi khi tải.');artifact.validate();};
          try{await verifyArtifactAsync(artifact.output,artifact.metadata,{signal:controller.signal,validate});validate();}
          catch(error){if(!res.destroyed)return json(res,{error:error.message},error.status||409);return;}
          finally{res.removeListener('close',stop);}
          return sendFile(req,res,artifact.output);
        }
        if(p==='/api/v1/activity'&&req.method==='GET'){
          const workspaceId=workspaceStore.active().id,projects=(await listProjects()).filter(x=>x.workspaceId===workspaceId),jobs=[];
          const append=(directory,project,title)=>{const jb=readJson(aiJobFile(directory));if(!jb?.status)return;jobs.push({...jb,sessionContact:readSessionContact(aiJobFile(directory),jb),actionVersion:stagedJobVersion(jb),workspaceId,dir:relDir(directory),project,title});};
          for(const project of projects){const directory=resolveContained(ROOT,project.dir).file;append(directory,project.dir,project.title);}
          const reviseFolder=path.join(ROOT,'workspace/content/_sua-video');if(fs.existsSync(reviseFolder))for(const entry of fs.readdirSync(reviseFolder,{withFileTypes:true})){if(!entry.isDirectory()||entry.isSymbolicLink())continue;const directory=resolveContained(reviseFolder,entry.name).file,jb=readJson(aiJobFile(directory)),project=projects.find(p=>p.dir===jb?.project);if(project)append(directory,project.dir,'Sửa · '+project.title);}
          const active=(kind,id)=>{if(kind==='native-still')return posterTasks.isRunning(id);if(kind==='remotion-scene')return remotionJobs.isRunning(id);if(kind==='intake-batch')return intakeTasks.isRunning(id);if(kind==='render-batch')return renderTasks.isRunning(id);if(kind==='variant-batch')return variantTasks.isRunning(id);if(kind==='news-draft')return newsTasks.isRunning(id);if(kind==='completion-export'){const directory=path.resolve(ROOT,id),worker=completionExports.get(directory),current=readJson(aiJobFile(directory));if(worker?.pid&&worker.pid===current?.exportPid)try{process.kill(worker.pid,0);return true;}catch{}return false;}if(kind==='legacy'){const directory=path.resolve(ROOT,id);if(apiEditorRuns.has(directory))return true;const worker=runners.get(directory);if(worker?.pid)try{process.kill(worker.pid,0);return true;}catch{}return false;}return false;};
          const activity=projectActivity({workspaceId,renderRuns:readRenderRuns(ROOT,projects),renderOwner:renderLockStatus(ROOT),tasks:[...taskStore.list(workspaceId),...remotionJobs.list(workspaceId)],jobs,isActive:active,exportWaiting:dir=>{const owner=renderLockStatus(ROOT),worker=completionExports.get(path.resolve(ROOT,dir));return !!owner&&owner.pid!==worker?.pid;},waitingReason:dir=>backgroundDispatch.waitingReason(path.resolve(ROOT,dir))});
          return json(res,{...activity,resources:{...projectResourceActivity({root:ROOT,projects,render:renderLockStatus(ROOT),asr:asrLockStatus(ROOT)}),personTracking:personTrackingStatus(ROOT)}});
        }
        if(p==='/api/v1/tasks'&&req.method==='GET')return json(res,{workspaceId:workspaceStore.active().id,tasks:taskStore.list(workspaceStore.active().id)});
        if(p==='/api/v1/activity/cancel-job'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          if(typeof body.dir!=='string'||!body.dir.startsWith('workspace/content/'))return json(res,{error:'Sai đường dẫn công việc.'},400);
          const directory=resolveContained(WORKSPACE,String(body.dir||'').replace(/^workspace\/content\//,'' )).file;
          const job=readJson(aiJobFile(directory)),project=job?.project?safeJoin(ROOT,job.project):directory;
          const allowed=(await listProjects()).some(item=>item.workspaceId===workspaceId&&path.resolve(ROOT,item.dir)===project);
          if(!allowed)return json(res,{error:'Không thấy dự án trong workspace hiện tại.'},404);
          if(directory!==project&&!/^workspace\/content\/_sua-video\/[^/]+$/.test(body.dir))return json(res,{error:'Không phải việc sửa được hỗ trợ.'},400);
          cancelStagedJob(aiJobFile(directory),body.version);
          stopAgentRunner(directory);
          return json(res,{ok:true,status:'cancelled',sessionMayStillRun:job.execution?.mode==='session'});
        }
        if(p==='/api/v1/brand-default/apply'&&req.method==='POST'){
          const body=await readBody(req);requestProject(req);const workspaceId=workspaceStore.active().id,saved=brandDefaults.get(workspaceId);
          if(body.workspaceId!==workspaceId||body.version!==saved.version||!saved.brand)return json(res,{error:'Nhận diện hoặc workspace đã đổi. Tải lại trước khi áp dụng.'},409);
          const applied=applyJobBrand(readJson(PJ),saved,{root:ROOT,projectDir:PROJECT});
          return json(res,{workspaceId,version:saved.version,brand:applied.brand,watermark:applied.watermark||null});
        }
        if(p==='/api/v1/brand-default'){
          const workspaceId=workspaceStore.active().id;
          if(req.method==='GET')return json(res,brandDefaults.get(workspaceId));
          if(req.method==='POST'){const body=await readBody(req);if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);if(body.watermark)requestProject(req);return json(res,brandDefaults.save(workspaceId,body,{projectDir:PROJECT}));}
        }
        if(/^\/api\/v1\/tasks\/[a-zA-Z0-9-]+\/output$/.test(p)&&req.method==='GET'){
          const task=taskStore.get(p.split('/')[4],workspaceStore.active().id),index=Number(url.searchParams.get('index'));
          if(task.kind!=='render-batch'||!url.searchParams.has('index')||!Number.isInteger(index)||index<0||index>=task.snapshot.items.length)return json(res,{error:'Sai bản xuất.'},400);
          const result=(task.result?.items||task.checkpoint?.completed||[]).find(item=>item.index===index);if(!result)return json(res,{error:'Bản xuất chưa hoàn tất.'},404);
          const directory=resolveContained(ROOT,task.snapshot.items[index].dir).file,output=resolveContained(path.join(directory,'renders'),path.basename(result.output)).file;
          const metadata=readJson(output+'.json');if(metadata?.batchTaskId!==task.id||metadata.batchItem!==index||metadata.revision!==task.snapshot.items[index].revision||!metadata.ok)return json(res,{error:'Bản xuất không khớp lô.'},409);
          const downloadWorkspace=workspaceStore.active().id,controller=new AbortController(),stop=()=>controller.abort();res.once('close',stop);
          const validate=()=>{if(workspaceStore.active().id!==downloadWorkspace)throw new Error('Workspace đã đổi trong lúc kiểm tra file.');const current=taskStore.get(task.id,downloadWorkspace),selected=(current.result?.items||current.checkpoint?.completed||[]).find(item=>item.index===index);if(!selected||selected.output!==result.output||JSON.stringify(current.snapshot.items[index])!==JSON.stringify(task.snapshot.items[index])||JSON.stringify(readJson(output+'.json'))!==JSON.stringify(metadata))throw new Error('Bản xuất hoặc công việc đã thay đổi.');};
          try{await verifyArtifactAsync(output,metadata,{signal:controller.signal,validate:()=>{if(workspaceStore.active().id!==downloadWorkspace)throw new Error('Workspace đã đổi trong lúc kiểm tra file.');}});validate();}catch(error){if(!res.destroyed)return json(res,{error:error.message},error.status||409);return;}finally{res.removeListener('close',stop);}
          return sendFile(req,res,output);
        }
        if(p==='/api/v1/tasks'&&req.method==='POST'){
          const body=await readBody(req);requestProject(req);
          if(!['edit','revise'].includes(body.kind||'revise'))return json(res,{error:'Dùng điểm giao việc đúng loại.'},400);
          const snapshot=JSON.parse(fs.readFileSync(PJ,'utf8'));
          if(snapshot.workspaceId!==workspaceStore.active().id)return json(res,{error:'Chọn đúng workspace của dự án trước khi giao việc.'},409);
          return json(res,taskStore.enqueue({workspaceId:snapshot.workspaceId,project:relDir(PROJECT),revision:projectRevision(PJ),snapshot,instruction:String(body.instruction||'').slice(0,10000),kind:body.kind||'revise',idempotencyKey:body.idempotencyKey}),201);
        }
        if(/^\/api\/v1\/tasks\/[a-zA-Z0-9-]+(?:\/(?:cancel|retry))?$/.test(p)){
          const parts=p.split('/'),id=parts[4],workspaceId=workspaceStore.active().id;
          if(req.method==='GET'&&!parts[5])return json(res,taskStore.get(id,workspaceId));
          if(req.method==='POST'&&req.headers['x-contentos-workspace']&&req.headers['x-contentos-workspace']!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          if(req.method==='POST'&&parts[5]==='cancel'){const kind=taskStore.get(id,workspaceId).kind;return json(res,kind==='intake-batch'?intakeTasks.cancel(id,workspaceId):kind==='render-batch'?renderTasks.cancel(id,workspaceId):kind==='variant-batch'?variantTasks.cancel(id,workspaceId):kind==='native-still'?posterTasks.cancel(id,workspaceId):kind==='news-draft'?newsTasks.cancel(id,workspaceId):taskStore.cancel(id,workspaceId));}
          if(req.method==='POST'&&parts[5]==='retry'){const kind=taskStore.get(id,workspaceId).kind;if(['news-draft','native-still'].includes(kind))return json(res,{error:'Chọn nguồn và cấu hình đã kiểm tra để tạo lượt mới; không tự gửi lại.'},409);return json(res,kind==='intake-batch'?intakeTasks.resume(id,workspaceId):kind==='render-batch'?renderTasks.resume(id,workspaceId):kind==='variant-batch'?variantTasks.resume(id,workspaceId):taskStore.retry(id,workspaceId));}
        }
        if(p==='/api/v1/storage/search'&&req.method==='POST'){
          const body=await readBody(req),workspace=workspaceStore.active();
          if(body.workspaceId!==workspace.id||!workspace.nasRoot)return json(res,{error:'Workspace hoặc kho nguồn đã đổi.'},409);
          const controller=new AbortController(),stop=()=>controller.abort();res.once('close',stop);
          try{const result=await searchSourceTree(workspace.nasRoot,body.relative||'',{query:body.query,kind:body.kind,tag:body.tag,rights:body.rights,readAnnotation:file=>createSourceAnnotations(ROOT).read(workspace.id,file),signal:controller.signal,validate:()=>{const active=workspaceStore.active();if(active.id!==workspace.id||active.nasRoot!==workspace.nasRoot)throw new Error('Workspace hoặc kho nguồn đã đổi.');}});if(!res.destroyed)return json(res,{workspaceId:workspace.id,...result});}
          finally{res.removeListener('close',stop);}return;
        }
        if(p==='/api/v1/storage/diagnose'&&req.method==='GET'){const {diagnoseNas}=await import('../src/services/nas-check.mjs');return json(res,{...await diagnoseNas(workspaceStore.active().nasRoot),player:!!ensurePlayer()});}
        if(p==='/api/v1/storage/browse'&&req.method==='GET')return json(res,storageService.browse(url.searchParams.get('relative')||'',url.searchParams.get('offset'),{query:url.searchParams.get('query')||'',kind:url.searchParams.get('kind')||'all',tag:url.searchParams.get('tag')||'',rights:url.searchParams.get('rights')||'all'}));
        if(p==='/api/v1/storage/preview'&&['GET','HEAD'].includes(req.method)){
          const relative=url.searchParams.get('relative'),workspaceId=url.searchParams.get('workspaceId'),file=storageService.previewSource(relative,workspaceId);
          await streamMedia(req,res,file,{validate:()=>{if(storageService.previewSource(relative,workspaceId)!==file)throw new Error('Nguồn đã đổi.');}});return;
        }
        if(p==='/api/v1/storage/verify-source'&&req.method==='POST'){
          const body=await readBody(req),controller=new AbortController(),stop=()=>controller.abort();res.once('close',stop);
          try{const result=await storageService.verifyProjectSource(body.dir,body.path,{workspaceId:body.workspaceId,signal:controller.signal});if(!res.destroyed)return json(res,result);}
          finally{res.removeListener('close',stop);}return;
        }
        if(p==='/api/v1/storage/project-sources'&&req.method==='GET')return json(res,storageService.projectSources(url.searchParams.get('dir'),{workspaceId:url.searchParams.get('workspaceId'),offset:url.searchParams.get('offset')}));
        if(p==='/api/v1/storage/annotations'&&['GET','POST'].includes(req.method)){
          const body=req.method==='POST'?await readBody(req):null;
          return json(res,storageService.annotations(body?.relative||url.searchParams.get('relative'),body?.workspaceId||url.searchParams.get('workspaceId'),body));
        }
        if(p==='/api/v1/storage/media-info'&&req.method==='POST'){const body=await readBody(req);return json(res,await storageService.mediaInfo(body.relative,{workspaceId:body.workspaceId}));}
        if(p==='/api/v1/storage/attach'&&req.method==='POST'){const body=await readBody(req);return json(res,await storageService.attach(body.dir,body.relative,{workspaceId:body.workspaceId}));}
        if (p === "/api/v1/mobile/sessions" && req.method === "POST") return json(res,await mobileIntake.create((await readBody(req)).dir, workspaceStore.active().id),201);
        if(p==='/api/v1/mobile/history'&&req.method==='GET')return json(res,{files:mobileIntake.history(url.searchParams.get('dir'),workspaceStore.active().id)});
        if(p==='/api/v1/mobile/verify'&&req.method==='POST'){const workspaceId=workspaceStore.active().id,body=await readBody(req);return json(res,await mobileIntake.verify(body.dir,workspaceId,body.id,{validate:()=>{if(res.destroyed||workspaceStore.active().id!==workspaceId)throw new Error('Kết nối hoặc workspace đã đổi.');}}));}
        if (/^\/api\/v1\/mobile\/sessions\/[a-zA-Z0-9-]+$/.test(p)) {
          const id=p.split('/').at(-1);
          if(req.method==='DELETE'){mobileIntake.revoke(id);return json(res,{ok:true});}
          if(req.method==='GET')return json(res,mobileIntake.status(id,workspaceStore.active().id));
        }
    if(p==='/api/v1/templates/reference'&&req.method==='GET'){
      try{return json(res,templateReference(TEMPLATES,url.searchParams.get('id'),url.searchParams.get('path')));}catch(error){return json(res,{error:error.message},400);}
    }
    if(p==='/api/v1/templates/package'&&req.method==='GET'){
      try{const id=url.searchParams.get('id'),packed=packageTemplate(TEMPLATES,id);res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="'+id+'.zip"','Content-Length':packed.buffer.length});return res.end(packed.buffer);}catch(error){return json(res,{error:error.message},400);}
    }
    if(p==='/api/v1/templates/details'&&req.method==='GET'){
      try{return json(res,templateDetails(TEMPLATES,url.searchParams.get('id')));}catch(error){return json(res,{error:error.message},400);}
    }
        if(p==='/api/v1/model-routing'&&req.method==='GET'){const workspaceId=workspaceStore.active().id;return json(res,{workspaceId,...modelRouting.status(workspaceId)});}
        if(p==='/api/v1/model-routing'&&req.method==='POST'){
          const body=await readBody(req),workspaceId=workspaceStore.active().id;
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại kết nối.'},409);
          return json(res,{workspaceId,...modelRouting.save(workspaceId,body)});
        }
        if (p === '/api/v1/migration/preview' && req.method === 'GET') return json(res,previewMigration(ROOT,workspaceStore.active().id,{cursor:url.searchParams.get('imageCursor')||undefined}));
        if(p==='/api/v1/migration/import-aiev-image'&&req.method==='POST'){
          const body=await readBody(req),controller=new AbortController();res.once('close',()=>{if(!res.writableFinished)controller.abort();});
          return json(res,await importAievImage(ROOT,workspaceStore,imageService,body,{signal:controller.signal}),201);
        }
        if (['/api/v1/migration/import-vek','/api/v1/migration/import-aiev','/api/v1/migration/import-studio'].includes(p) && req.method === 'POST') {
          const body=await readBody(req),controller=new AbortController();
          res.once('close',()=>{if(!res.writableFinished)controller.abort();});
          const importer=p.endsWith('import-studio')?importStudioProject:p.endsWith('import-aiev')?importAievProject:importVekProject;
          return json(res,await importer(ROOT,workspaceStore,body,{signal:controller.signal}));
        }
        if (p === "/api/v1/catalogs/preview" && req.method === "GET") return json(res,catalogs.plan(workspaceStore.active().id));
        if(p==='/api/v1/news/draft-tasks'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id,body=await readBody(req);
          if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,newsTasks.enqueue(workspaceId,body),202);
        }
        if(p==='/api/v1/news/draft'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id,body=await readBody(req),controller=new AbortController();
          const validate=()=>{if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)throw new ProjectConflict('Workspace đã đổi.','PROJECT_CONTEXT_CONFLICT');};
          res.once('close',()=>{if(!res.writableEnded)controller.abort();});
          return json(res,{entry:await draftNews(workspaceId,{id:body.id,instruction:body.instruction,validate,signal:controller.signal})},201);
        }
        if(p==='/api/v1/news'&&req.method==='GET'){const workspaceId=workspaceStore.active().id;return json(res,{...news.list(workspaceId),workspaceId});}
        if(p==='/api/v1/news/project'&&req.method==='GET'){
          const dir=url.searchParams.get('dir')||'',workspaceId=workspaceStore.active().id,brief=news.projectBrief(workspaceId,dir);
          return json(res,{brief,workspaceId,revision:projectRevision(path.join(ROOT,dir,'project.json'))});
        }
        if(p==='/api/v1/news/project'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id,body=await readBody(req);
          if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          try{const target=resolveContained(ROOT,body.dir).file;assertProjectRevision(path.join(target,'project.json'),body.revision);return json(res,{brief:news.bindProject(workspaceId,body.dir,body.id,body.expectedId)});}catch(error){return json(res,{error:error.message},error.status||400);}
        }
        if(p==='/api/v1/news/read'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id,body=await readBody(req);
          if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const result=await readNewsArticle(ROOT,body);
          if(workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          const id=crypto.randomUUID(),folder=path.join(ROOT,'workspace/contentos/news-articles',workspaceId);fs.mkdirSync(folder,{recursive:true});
          fs.writeFileSync(path.join(folder,id+'.json'),JSON.stringify({...result,id,workspaceId,createdAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
          return json(res,{...result,id,workspaceId});
        }
        if(p==='/api/v1/news'&&req.method==='POST'){
          const workspaceId=workspaceStore.active().id,body=await readBody(req);
          if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại bản tin.'},409);
          try{return json(res,{entry:news.save(workspaceId,body)},201);}catch(error){return json(res,{error:error.message},error.status||400);}
        }
        if (p === "/api/v1/catalogs/local" && req.method === "GET") {const workspaceId=workspaceStore.active().id;return json(res,{...catalogs.list(workspaceId),workspaceId});}
        if (p === '/api/v1/catalogs/local' && req.method === 'POST') {
          const workspaceId=workspaceStore.active().id,body=await readBody(req);
          if(body.workspaceId!==workspaceId||workspaceStore.active().id!==workspaceId)return json(res,{error:'Workspace đã đổi. Mở lại thư viện.'},409);
          try{return json(res,catalogs.save(workspaceId,body),201);}catch(error){return json(res,{error:error.message},error.status||400);}
        }
        if (p === "/api/v1/catalogs/import" && req.method === "POST") {
          const selection=await readBody(req);
          return json(res,catalogs.import(workspaceStore.active().id,selection));
        }
        if (p === "/api/v1/workspaces" && req.method === "GET") return json(res, workspaceStore.list());
        if (p === "/api/v1/workspaces" && req.method === "POST") return json(res, workspaceStore.create(await readBody(req)), 201);
        if (p === "/api/v1/workspaces/active" && req.method === "POST") return json(res, workspaceStore.select((await readBody(req)).id));
        if (/^\/api\/v1\/workspaces\/[^/]+$/.test(p) && req.method === "PATCH") return json(res, workspaceStore.update(decodeURIComponent(p.split("/").at(-1)), await readBody(req)));
        if (p === "/api/v1/capabilities" && req.method === "GET") {
          const features = readJson(path.join(ROOT, "config/features.json")) || [];
          return json(res, { featureCount:features.length, features, modules:[
            {name:"Editor VEK + HyperFrames", status:"Code nền đã giữ · đang kiểm hồi quy",description:"Home, mẫu trực quan, preview, timeline và Nhờ AI sửa; điều kiện gói nguồn vẫn áp dụng."},
            {name:"Workspace / thương hiệu",status:"Đã triển khai local",description:"Tạo/chọn workspace, lưu cấu hình; dự án mới ghim workspace, danh sách lọc theo workspace."},
            {name:"AIEV",status:"Catalog phong cách/prompt đã có importer; các module khác chưa tích hợp",description:"Đã có QR gửi tư liệu LAN và importer catalog. Internet/owner remote, ảnh, scene, QC, dịch và phần còn lại A01–A42 đang tích hợp."},
            {name:"Nhận source điện thoại / kho chung",status:"Đã triển khai · kiểm thử synthetic",description:"QR giới hạn dự án, nhận/kiểm file vào editor; duyệt kho cấu hình và sao chép local. Chưa kiểm WiFi điện thoại/NAS thực tế."},
            {name:"Studio",status:"Chưa tích hợp",description:"DAM, tin tức, catalog, analytics và các nhóm S01–S60 còn trong kế hoạch."}
          ]});
        }
        return json(res, {error:"Endpoint không tồn tại."}, 404);
      } catch(e) { return json(res, {error:e.message,...(e.code?{code:e.code}:{})}, e.status||400); }
    }
    if (p === "/api/update" || p.startsWith("/api/update/")) return json(res, {ok:false,error:"Bản ContentOS phát triển dùng cập nhật riêng; không ghi đè bằng gói VEK."}, 409);
    if (p === "/api/chay-nen") return req.method === 'GET' ? json(res, {ok:true,on:false,msg:'Dùng launcher ContentOS; chưa bật tự chạy khi đăng nhập.'}) : json(res, {ok:false,error:"Chạy nền riêng ContentOS chưa cấu hình; dùng launcher bản phát triển."}, 409);
    if (p === "/api/projects" && req.method === "GET") return json(res, { current: PROJECT && path.relative(ROOT, PROJECT), projects: await (async () => { const ws = workspaceStore.active().id; return (await listProjects()).filter(x => x.workspaceId === ws); })() });
    if (p === "/api/open" && req.method === "POST") {
      const b = await readBody(req);
      const dir = safeJoin(ROOT, b.dir || "");
      if (!dir) return json(res, { ok: false, error: "Đường dẫn không hợp lệ." }, 400);
      try { setProject(dir); return json(res, { ok: true }); } catch (e) { return json(res, { ok: false, error: String(e.message) }, 400); }
    }
    if (p === "/api/new-project" && req.method === "POST") return newProject(req, res, url.searchParams);
    // làm rõ giọng: tạo work/voice-<mức>.wav cho dự án đang mở (ffmpeg, vài giây) — editor đặt audio.clean rồi dựng lại
    if (p === "/api/voice-clean" && req.method === "POST") {
      const b = await readBody(req), pj = PROJECT && readJson(path.join(PROJECT, "project.json"));
      if (!pj?.source?.video) return json(res, { ok: false, error: "Chưa mở dự án." }, 400);
      if (!b.level) return json(res, { ok: true });
      try {
        if (!voiceReady(PROJECT, pj.source.video, b.level)) await makeVoice(PROJECT, pj.source.video, b.level);
        return json(res, { ok: true, file: voiceFile(b.level) });
      } catch (e) { return json(res, { ok: false, error: `Không làm rõ giọng được: ${e.message}` }, 500); }
    }
    // đổi khung edit của dự án (bước thiết lập trước khi AI edit): 9:16 dọc · 16:9 ngang
    if (p === "/api/project-format" && req.method === "POST") {
      const b = await readBody(req), dir = safeJoin(ROOT, b.dir || ""), f = dir && path.join(dir, "project.json"), pj = f && readJson(f);
      if (!pj || !["9:16", "16:9"].includes(b.format)) return json(res, { ok: false, error: "Không thấy dự án." }, 400);
      pj.format = b.format;
      fs.writeFileSync(f, JSON.stringify(pj, null, 2) + "\n");
      try { buildProject(dir, pj); } catch {}
      if (PROJECT === dir) { lastProject = null; memo.clear(); }
      return json(res, { ok: true, format: pj.format });
    }
    if (p === "/api/admin/status" && req.method === "GET") return json(res, await adminStatus());
    if (p === "/api/installed-templates" && req.method === "GET") return json(res, { items: installedTemplates(), listener: aiListener() });
    // Mở cửa sổ đăng nhập Claude Code / Codex (người dùng tự đăng nhập)
    // Luôn chạy nền: người dùng tự bật / tắt (tự chạy khi bật máy, không phụ thuộc cửa sổ AI / Terminal)
    if (p === "/api/chay-nen") {
      const tool = path.join(KIT, "tools", "chay-nen.mjs");
      const arg = req.method === "POST" ? ((await readBody(req))?.on ? "--bat" : "--tat") : null;
      try {
        const out = execSync(`"${process.execPath}" "${tool}" ${arg || ""}`, { encoding: "utf8", timeout: 20000 });
        return json(res, { ok: true, on: /BẬT/.test(out), msg: out.trim() });
      } catch (e) { return json(res, { ok: false, error: String(e.stdout || "").trim() || String(e.message).slice(0, 300) }, 500); }
    }
    if (p === "/api/ket-noi-ai") return json(res, await ketNoiAi(url.searchParams.get("moi") === "1"));
    if (p === "/api/ai-login" && req.method === "POST") {
      const b = await readBody(req);
      try { openAgentLogin(["codex", "antigravity"].includes(b.agent) ? b.agent : "claude"); return json(res, { ok: true }); }
      catch (e) { return json(res, { ok: false, error: e.message }, 400); }
    }
    // mẫu vừa tự cài từ file .zip trong Downloads (sau mốc ?since=)
    if (p === "/api/auto-installed" && req.method === "GET") {
      const since = Number(url.searchParams.get("since")) || 0;
      return json(res, { now: Date.now(), items: autoInstalled.filter((x) => x.at > since) });
    }
    if (p === "/api/template-poster") {
      const f = path.join(TEMPLATES, slug(url.searchParams.get("id")), "poster.jpg");
      return fs.existsSync(f) ? sendFile(req, res, f) : send(res, 404, "");
    }
    if (p === "/api/ai-job") {
      const b = req.method === "POST" ? await readBody(req) : {};
      const dir = safeJoin(ROOT, b.dir || url.searchParams.get("dir") || "");
      const isInstall = dir && ["install", "update", "post", "render", "revise"].includes(readJson(aiJobFile(dir))?.kind);
      if (!dir || (!fs.existsSync(path.join(dir, "project.json")) && !isInstall)) return json(res, { ok: false, error: "Không thấy dự án." }, 400);
      if (req.method === "POST" && b.kind === "template") {
        // Tạo mẫu từ video mẫu — gói Pro trở lên; người dùng thường = mẫu riêng trong máy, admin = mẫu thư viện
        const st = await adminStatus();
        if (!st.tools) return json(res, { ok: false, error: "Phần mềm chưa có công cụ Tạo mẫu từ video — tải lại phần mềm trên website bằng tài khoản Pro." }, 400);
        if (!st.allowed) return json(res, { ok: false, needPlan: "pro", error: st.reason || "Tính năng dành cho gói Pro trở lên." }, 403);
        const test = b.testDir ? safeJoin(ROOT, b.testDir) : null;
        const jb = { kind: "template", status: "waiting", personal: !st.admin, account: jobAccount(), background: b.background === true, dir: relDir(dir), templateName: String(b.name || "").slice(0, 80) || path.basename(dir),
          industry: String(b.industry || "").slice(0, 60), tier: ["free", "pro", "premium"].includes(b.tier) ? b.tier : "pro",
          testDir: test && fs.existsSync(path.join(test, "project.json")) ? relDir(test) : null,
          note: String(b.note || "").slice(0, 2000), createdAt: new Date().toISOString() };
        fs.mkdirSync(path.join(dir, "work"), { recursive: true });
        fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
        return json(res, { ok: true, job: jb, listener: aiListener(), runner: jb.background ? startAgentRunner(dir) : null });
      }
      // Cắt clip ngắn: 1 video dài → nhiều clip (mỗi clip 1 dự án), caption từng nền tảng, edit từng clip theo mẫu nếu bật
      if (req.method === "POST" && b.kind === "clips") {
        const tid = b.editEach && b.template ? slug(b.template) : null;
        if (tid && !fs.existsSync(path.join(TEMPLATES, tid, "template.json"))) return json(res, { ok: false, error: "Mẫu chưa được cài." }, 400);
        const jb = { kind: "clips", status: "waiting", account: jobAccount(), background: b.background === true || process.env.VEK_AI_BACKGROUND === "1", dir: relDir(dir),
          templateName: "Cắt clip ngắn", count: ["auto", "3", "5", "10"].includes(String(b.count)) ? String(b.count) : "auto",
          sec: Math.max(10, Math.min(180, Math.round(Number(b.sec) || ({ ngan: 22, vua: 45, dai: 75 })[b.len] || 45))), formats: (Array.isArray(b.formats) ? b.formats : ["9:16"]).filter((f) => ["9:16", "16:9"].includes(f)).slice(0, 2),
          editEach: !!tid, template: tid, fx: b.fx === "nhieu" ? "nhieu" : "vua", note: String(b.note || "").slice(0, 1500), createdAt: new Date().toISOString() };
        if (!jb.formats.length) jb.formats = ["9:16"];
        fs.mkdirSync(path.join(dir, "work"), { recursive: true });
        fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
        fs.rmSync(path.join(dir, "work", "ai-progress.json"), { force: true });
        return json(res, { ok: true, job: jb, listener: aiListener(), runner: jb.background ? startAgentRunner(dir) : null });
      }
      if (req.method === "POST") return json(res,await stageFirstBuild(dir,b));
      if (req.method === "DELETE") {
        const current=readJson(aiJobFile(dir));
        if(current?.baseRevision&&(current.kind==='revise'||current.execution?.mode==='api')){
          if(!['waiting','working'].includes(current.status))return json(res,{error:'Công việc đã kết thúc; không thể hủy.'},409);
          stopAgentRunner(dir);fs.writeFileSync(aiJobFile(dir),JSON.stringify({...current,status:'cancelled',doneAt:new Date().toISOString()},null,2)+'\n');
        }else{stopAgentRunner(dir);fs.rmSync(aiJobFile(dir), { force: true });}
        return json(res,{ok:true});
      }
      // Thử lại việc bị lỗi (vd: vừa đăng nhập xong AI)
      if (req.method === "PUT") {
        const jb = readJson(aiJobFile(dir));
        if (!jb) return json(res, { ok: false, error: "Không có việc." }, 400);
        if(jb.execution?.mode==='api')return json(res,{error:'Tạo lượt API mới từ thiết lập hoặc chat; không tự thử lại yêu cầu có thể tính phí.'},409);
        if(jb.errorCode==='CANDIDATE_CONFLICT')return json(res,{ok:false,error:'Đối chiếu bản AI trước khi giao lại việc; bản gốc đã có chỉnh sửa mới.'},409);
        if(jb.kind==='revise'&&jb.baseRevision){
          const target=safeJoin(ROOT,jb.project||'');
          if(!target)return json(res,{error:'Sai dự án.'},400);
          assertProjectRevision(path.join(target,'project.json'),jb.baseRevision);
        }
        // ?bg=1: người dùng chọn "Chạy ngầm" (không mở khung chat)
        const { error, needLogin, ...rest } = jb;
        const background = url.searchParams.get("bg") === "1" || !!jb.background;
        const execution=rest.execution&&background?normalizeExecution({...rest.execution,mode:'cli',agent:['auto','antigravity'].includes(rest.execution.agent)?preferredAgent():rest.execution.agent}):rest.execution;
        fs.writeFileSync(aiJobFile(dir), JSON.stringify({ ...rest, execution, background, status: "waiting" }, null, 2) + "\n");
        return json(res, { ok: true, runner: background ? startAgentRunner(dir) : null });
      }
      const cur = readJson(aiJobFile(dir));
      // Việc "Tự chọn AI" chờ quá 20s mà không phiên chat nào nhận, máy đã có CLI → tự chuyển sang chạy ngầm (như bấm "Chạy ngầm").
      if (cur?.status === "waiting" && !cur.background && Date.now() - Date.parse(cur.createdAt || 0) > 20000) {
        const auto = autoExecution(cur.execution);
        if (auto?.mode === "cli") { cur.execution = auto; cur.background = true; fs.writeFileSync(aiJobFile(dir), JSON.stringify(cur, null, 2) + "\n"); }
      }
      if (cur?.status === "waiting" && cur.background && !runners.has(dir)) startAgentRunner(dir); // việc chạy ngầm còn chờ (mở lại phần mềm)
      const run = runners.get(dir);
      const prog = cur?.status === "working" ? aiProgress(dir, cur) : null;
      return json(res, { ok: true, job: cur, listener: aiListener(), runner: run ? { agent: run.agent } : null, progress: prog });
    }
    // Xoá 1 dự án: chỉ thư mục workspace/content/<ngày>/<dự án> — không đụng skill, mẫu, brand
    // Dọn dung lượng: dung lượng trống + từng dự án theo phần (video gốc · bản xuất · bản xem trước nhẹ · lịch sử chỉnh · phân tích / tạm)
    if (p === "/api/dung-luong" && req.method === "GET") {
      const sp = diskSpace();
      if (url.searchParams.get("quick")) return json(res, { ok: true, ...sp });
      return json(res, { ok: true, ...sp, items: dungLuong() });
    }
    if (p === "/api/dung-luong" && req.method === "POST") {
      const b = await readBody(req);
      const dir = safeJoin(ROOT, b.dir || "");
      const rel = dir && path.relative(WORKSPACE, dir);
      if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).length !== 2) return json(res, { ok: false, error: "Không phải thư mục dự án." }, 400);
      if ((job?.running && PROJECT === dir) || (asr?.running && asr.dir === relDir(dir))) return json(res, { ok: false, error: "Dự án đang xuất video / nhận giọng — đợi xong rồi dọn." }, 409);
      if (b.part === "all") { // xoá cả thư mục (dự án / thư mục cũ)
        fs.rmSync(dir, RM_NAS);
        try { const day = path.dirname(dir); if (!fs.readdirSync(day).length) fs.rmdirSync(day); } catch {}
        if (PROJECT === dir) { PROJECT = null; PJ = null; lastProject = null; memo.clear(); }
        return json(res, { ok: true, ...diskSpace() });
      }
      const parts = { renders: ["renders"], proxy: [path.join("work", "proxy")], history: [".history"], tam: [] }[b.part];
      if (!parts) return json(res, { ok: false, error: "Phần không hợp lệ." }, 400);
      for (const x of parts) fs.rmSync(path.join(dir, x), RM_NAS);
      if (b.part === "tam") for (const f of tamFiles(dir)) fs.rmSync(f, RM_NAS);
      return json(res, { ok: true, ...diskSpace(), item: dungLuongOf(dir) });
    }
    // đổi tên hiển thị của dự án (title trong project.json; thư mục giữ nguyên để không gãy đường dẫn việc AI / bản xuất)
    if (p === "/api/rename-project" && req.method === "POST") {
      const b = await readBody(req);
      const dir = safeJoin(ROOT, b.dir || ""), title = String(b.title || "").trim().slice(0, 120);
      const rel = dir && path.relative(WORKSPACE, dir), pj = dir && path.join(dir, "project.json");
      if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).length !== 2 || !fs.existsSync(pj))
        return json(res, { ok: false, error: "Không phải thư mục dự án." }, 400);
      if (!title) return json(res, { ok: false, error: "Tên không được để trống." }, 400);
      try { commitProject(pj, { ...readJson(pj), title }, projectRevision(pj)); }
      catch (e) { return json(res, { ok: false, error: "Không đổi được tên: " + e.message }, 409); }
      if (PROJECT === dir) lastProject = null;
      return json(res, { ok: true, title });
    }
    if (p === "/api/delete-project" && req.method === "POST") {
      const b = await readBody(req);
      const dir = safeJoin(ROOT, b.dir || "");
      const rel = dir && path.relative(WORKSPACE, dir);
      if (!rel || rel.startsWith("..") || path.isAbsolute(rel) || rel.split(path.sep).length !== 2 || !fs.existsSync(path.join(dir, "project.json")))
        return json(res, { ok: false, error: "Không phải thư mục dự án." }, 400);
      const busy = (job?.running && PROJECT === dir) || (asr?.running && asr.dir === relDir(dir));
      if (busy) return json(res, { ok: false, error: "Dự án đang xuất video / nhận giọng — đợi xong rồi xoá." }, 409);
      fs.rmSync(dir, RM_NAS);
      const day = path.dirname(dir);
      try { if (!fs.readdirSync(day).length) fs.rmdirSync(day); } catch {}
      if (PROJECT === dir) { PROJECT = null; PJ = null; lastProject = null; memo.clear(); }
      return json(res, { ok: true });
    }
    if (p === "/api/project-poster") {
      const dir = safeJoin(ROOT, url.searchParams.get("dir") || "");
      const pj = dir && readJson(path.join(dir, "project.json"));
      const src = pj && safeJoin(dir, pj.source?.video || "");
      if (!src || !fs.existsSync(src)) return send(res, 404, "");
      const out = path.join(dir, ".editor-cache", "poster.jpg");
      if (fs.existsSync(out)) return sendFile(req, res, out);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      const c = spawn("ffmpeg", ["-v", "error", "-y", "-ss", "1", "-i", src, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "5", out]);
      return c.on("close", () => (fs.existsSync(out) ? sendFile(req, res, out) : send(res, 404, "")));
    }
    if (p === "/api/version" && req.method === "GET") return json(res, await checkVersion(url.searchParams.has("force")));
    if (p === "/api/update" && req.method === "POST" && url.searchParams.get("ai")) {
      try { return json(res, await updateViaAi()); }
      catch (e) { return json(res, { ok: false, error: String(e.message || e) }, 500); }
    }
    if (p === "/api/update/self" && req.method === "POST") return json(res, await selfInstall((await readBody(req)).dir));
    // AI cập nhật xong → khởi động lại máy chủ (Mo-Editor tự chạy lại khi thoát mã 75)
    if (p === "/api/restart" && req.method === "POST") { json(res, { ok: true }); setTimeout(() => process.exit(75), 400); return; }
    if (p === "/api/update" && req.method === "POST") {
      try { const r = await applyUpdate(); json(res, r); if (r.ok) setTimeout(() => process.exit(75), 600); }
      catch (e) { json(res, { ok: false, error: String(e.message || e) }, 500); }
      return;
    }
    if (p === "/api/account" && req.method === "GET") return json(res, await accountStatus());
    if (/^\/api\/account\/(login|register)$/.test(p) && req.method === "POST") {
      const b = await readBody(req);
      try {
        const j = await cloud(`/api/auth/${p.endsWith("register") ? "register" : "login"}`, { method: "POST", auth: false, body: { email: b.email, password: b.password, name: b.name, app: true } });
        saveAccount({ token: j.token, user: j.user, checkedAt: Date.now() });
        versionCache = null; adminCache = null;
        return json(res, { ok: true, user: j.user });
      } catch (e) { return json(res, { ok: false, error: e.message }, e.status || 500); }
    }
    if (p === "/api/account/logout" && req.method === "POST") {
      try { await cloud("/api/auth/logout", { method: "POST", body: {} }); } catch {}
      saveAccount(null); adminCache = null;
      return json(res, { ok: true });
    }
    // Thêm tư liệu từ màn Dự án (chưa mở dự án nào): tải thẳng vào dự án được chỉ định
    if (p === "/api/upload" && req.method === "POST" && url.searchParams.get("dir")) return upload(req, res, url.searchParams);
    if (p === "/api/template-upload" && req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const buf = Buffer.concat(chunks);
      let names = [];
      try {
        for (const { name, data } of unzip(buf)) if (/(^|\/)template\.json$/.test(name.replace(/\\/g, "/")))
          try { names.push(JSON.parse(data.toString("utf8").replace(/^\uFEFF/, "")).name); } catch {}
      } catch { return json(res, { ok: false, error: "File .zip lỗi — tải lại mẫu trên website." }, 400); }
      names = names.filter(Boolean);
      if (!names.length) return json(res, { ok: false, error: "File này không phải mẫu edit (không có template.json)." }, 400);
      const fname = path.basename(url.searchParams.get("name") || "mau.zip").replace(/[^\w.\-]+/g, "_");
      const dir = path.join(WORKSPACE, "_cai-mau", new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + slug(names[0]));
      fs.mkdirSync(path.join(dir, "work"), { recursive: true });
      fs.writeFileSync(path.join(dir, fname), buf);
      const jb = { kind: "install", status: "waiting", account: jobAccount(), dir: relDir(dir), zip: relDir(path.join(dir, fname)), templateName: names.join(", "), createdAt: new Date().toISOString() };
      fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
      return json(res, { ok: true, job: jb, listener: aiListener() });
    }
    if(p==='/api/person-tracking/runtime'&&req.method==='GET'){const result=await personRuntimeStatus(ROOT,{refresh:url.searchParams.get('refresh')==='1'});return json(res,{ready:result.ready,info:result.info||null,detail:result.detail||'SAM2 CUDA local sẵn sàng.',help:result.help||null});}
    if(p==='/api/person-tracking'&&req.method==='GET')return json(res,personTrackingStatus(ROOT));
    if (!PROJECT && p.startsWith("/api/") && !/^\/api\/(library|templates|brands|kho|social|lich-dang|phan-tich|tich-hop|clips|giong|completion-policy|ai-build|kit-music|kit-sfx|project-file\/)/.test(p)) return json(res, { ok: false, home: true, error: "Chưa mở dự án." }, 409);
    if (p.startsWith("/ui/")) {
      const f = safeJoin(path.join(KIT, "ui"), p.slice(4));
      return f ? sendFile(req, res, f, true) : send(res, 403, "");
    }
    if (p === "/api/kit-music") return json(res, kitMusicList(KIT));
    if (p === "/api/kit-sfx") return json(res, kitSfxLibrary(KIT));
    if (/^\/kit-music\/[\w-]+\.(wav|mp3|m4a)$/i.test(p)) { // nghe thử nhạc có sẵn trước khi chọn
      const f = path.join(KIT, "assets", "music", path.basename(p));
      return fs.existsSync(f) ? sendFile(req, res, f) : send(res, 404, "");
    }
    if (/^\/kit-sfx\/[\w-]+\.wav$/.test(p)) { // nghe thử âm thanh trong editor
      const f = path.join(KIT, "assets", "sfx", path.basename(p));
      return fs.existsSync(f) ? sendFile(req, res, f) : send(res, 404, "");
    }
    if (p.startsWith("/vendor/")) { // MediaPipe (quét điểm mặt cho Làm đẹp) chạy trong trình duyệt
      const f = safeJoin(path.join(KIT, "vendor"), p.slice(8));
      return f ? sendFile(req, res, f) : send(res, 403, "");
    }
    if (p === "/lib/plate-regions.js" || p === "/lib/color-management.js" || p === "/lib/primary-speech.js" || p === "/lib/end-card.js" || p === "/lib/primary-privacy.js" || p === "/lib/cover-composition.js" || p === "/lib/primary-sequence.js" || p === "/lib/primary-clips.js" || p === "/lib/source-transcript.js" || p === "/lib/source-audio.js" || p === "/lib/segment-trim.js" || p === "/lib/source-zoom.js" || p === "/lib/source-color.js" || p === "/lib/automotive-options.js" || p === "/lib/timemap.js" || p === "/lib/brand.js" || p === "/lib/template.js" || p === '/lib/broll-assembly.js' || p === '/lib/narration-captions.js' || p === '/lib/batch-data.mjs' || p === '/lib/timeline-ops.js' || p === '/lib/text-effects.js') return sendFile(req, res, path.join(KIT, p.slice(1)), true);
    if (p.startsWith("/hf/") || p === "/p/index.html") ensurePlayer();
    if (p === "/hf/player.js") return ensurePlayer() ? sendFile(req, res, PLAYER) : send(res, 404, "player missing");
    if (p === "/hf/runtime.js") return RUNTIME ? sendFile(req, res, RUNTIME) : send(res, 404, "runtime missing");
    if (p === "/p/index.html" && RUNTIME) {
      // ?lite=1 "Xem nhẹ" (máy yếu): luôn dùng bản video 540p kể cả video nhẹ; bộ lọc, làm đẹp, chữ, hiệu ứng giữ nguyên — bản xuất không đổi
      const lite = url.searchParams.get("lite") === "1";
      if (lite) queueProxies(PROJECT, { force: true });
      const html0 = useProxies(previewLite(fs.readFileSync(path.join(PROJECT, "index.html"), "utf8")), { lite });
      const html = html0.replace("</body>", `  <script src="/hf/runtime.js"></script>
</body>`);
      return send(res, 200, html, "text/html; charset=utf-8");
    }
    if (p.startsWith("/p/")) {
      if (!PROJECT) return send(res, 404, ""); // chưa mở dự án (vd tab cũ sau khi khởi động lại)
      const f = safeJoin(PROJECT, p.slice(3));
      return f ? sendFile(req, res, f, p.endsWith(".html")) : send(res, 403, "");
    }

    if (p === "/api/project" && req.method === "GET") {
      const project = JSON.parse(fs.readFileSync(PJ, "utf8"));
      const tf = path.join(PROJECT, "work/transcript.json");
      const transcript = fs.existsSync(tf) ? JSON.parse(fs.readFileSync(tf, "utf8")) : null;
      queueProxies(PROJECT); // tạo bản xem trước nhẹ cho video nặng (chạy nền, xong thì lần tải xem trước sau dùng)
      const rec = readRecovery(PROJECT), { workspaceId: _w, contentos: _c, ...plain } = project;
      const recovery = rec && JSON.stringify(rec.project) !== JSON.stringify(plain) && JSON.stringify(rec.project) !== JSON.stringify(project) ? { savedAt: rec.savedAt } : null;
      return json(res, { project, revision:projectRevision(PJ), transcript, name: path.basename(PROJECT), dir: relDir(PROJECT), media: listMedia(), projectFile: linkedProjectFile(PROJECT), recovery });
    }
    // Tự lưu bản khôi phục khi còn chỉnh sửa chưa lưu (work/recovery.json) · đọc lại để khôi phục · bỏ
    if (p === "/api/project-recovery") {
      if (req.method === "GET") { requestProject(req); return json(res, { recovery: readRecovery(PROJECT) }); }
      const b = req.method === "PUT" ? await readBody(req) : null;
      if (!PROJECT || req.headers['x-contentos-project'] !== relDir(PROJECT)) throw new ProjectConflict('Dự án đã đổi. Mở lại đúng dự án.', 'PROJECT_CONTEXT_CONFLICT');
      if (req.method === "PUT") { if (!Array.isArray(b?.segments)) return json(res, { ok: false, error: "Bản khôi phục không hợp lệ." }, 400); writeRecovery(PROJECT, b, req.headers['x-contentos-revision']); return json(res, { ok: true }); }
      if (req.method === "DELETE") { clearRecovery(PROJECT); return json(res, { ok: true }); }
    }
    // File dự án .cosproj: Lưu thành… (chọn nơi lưu) · mở (chọn file → kiểm media → khôi phục)
    if (p === "/api/project-file/save-as" && req.method === "POST") {
      const b = await readBody(req);
      requestProject(req);
      const cur = linkedProjectFile(PROJECT), title = readJson(PJ)?.title || path.basename(PROJECT);
      const file = await pickFile({ save: true, title: "Lưu dự án thành", start: cur ? path.dirname(cur) : exportDir(), name: (cur ? path.basename(cur) : slug(title) + PROJECT_FILE_EXT), filter: `Dự án ContentOS (*${PROJECT_FILE_EXT})|*${PROJECT_FILE_EXT}`, ext: PROJECT_FILE_EXT.slice(1) });
      if (!file) return json(res, { ok: true, cancelled: true });
      const target = file.toLowerCase().endsWith(PROJECT_FILE_EXT) ? file : file + PROJECT_FILE_EXT;
      if (b.project) saveProject(b.project, req, res); else requestProject(req);
      writeProjectFile(target, { projectDir: PROJECT, project: readJson(PJ), revision: projectRevision(PJ) });
      setLinkedProjectFile(PROJECT, target);
      return json(res, { ok: true, file: target });
    }
    if (p === "/api/project-file/pick" && req.method === "POST") {
      const b = await readBody(req);
      if (b.media) { // chọn lại một file media bị thiếu
        const ext = path.extname(String(b.media)).slice(1);
        const file = await pickFile({ title: "Chọn lại file " + path.basename(String(b.media)), start: b.start ? path.dirname(String(b.start)) : "", filter: ext ? `${ext.toUpperCase()} (*.${ext})|*.${ext}|Tất cả file (*.*)|*.*` : "" });
        return json(res, file ? { ok: true, file } : { ok: false, cancelled: true });
      }
      const cur = PROJECT ? linkedProjectFile(PROJECT) : "";
      const file = await pickFile({ title: "Mở dự án", start: cur ? path.dirname(cur) : exportDir(), filter: `Dự án ContentOS (*${PROJECT_FILE_EXT})|*${PROJECT_FILE_EXT}` });
      return json(res, file ? { ok: true, file } : { ok: false, cancelled: true });
    }
    if (p === "/api/project-file/inspect" && req.method === "POST") {
      const b = await readBody(req), plan = inspectProjectFile(String(b.file || ""), { workspaceRoot: WORKSPACE, relinks: b.relinks || {} });
      return json(res, { ok: true, name: plan.doc.name, savedAt: plan.doc.savedAt, title: plan.doc.project.title, inWorkspace: !!plan.projectDir, missing: plan.missing, media: plan.media.length, newerOnDisk: plan.newerOnDisk });
    }
    if (p === "/api/project-file/open" && req.method === "POST") {
      const b = await readBody(req), file = String(b.file || "");
      if ((job?.running && job.projectDir === PROJECT) || (PROJECT && readJson(RENDER_FILE())?.running && !renderDead(readJson(RENDER_FILE())))) return json(res, { ok: false, error: "Đang xuất video dự án hiện tại — đợi xong rồi mở dự án khác." }, 409);
      const ws = workspaceStore.active().id;
      const newDir = () => { const day = new Date().toISOString().slice(0, 10), id = slug(path.basename(file, PROJECT_FILE_EXT)) || "du-an"; let d = path.join(WORKSPACE, day, id), i = 2; while (fs.existsSync(d)) d = path.join(WORKSPACE, day, `${id}-${i++}`); fs.mkdirSync(d, { recursive: true }); return d; };
      try {
        const r = restoreProjectFile(file, { workspaceRoot: WORKSPACE, newDir, workspaceId: ws, relinks: b.relinks || {}, keepDisk: !!b.keepDisk });
        setProject(r.dir); setLinkedProjectFile(r.dir, file); clearRecovery(r.dir);
        buildProject(r.dir, readJson(PJ));
        return json(res, { ok: true, dir: relDir(r.dir), imported: r.imported, copied: r.copied });
      } catch (e) { return json(res, { ok: false, error: e.message, code: e.code, missing: e.missing }, e.status || 400); }
    }
    // số bản xem trước nhẹ còn đang tạo cho dự án đang mở — editor hỏi định kỳ, hết thì tải lại xem trước
    if (p === "/api/proxy-status") {
      const n = PROJECT ? [...proxyJobs].filter(([src, st]) => st === "running" && src.startsWith(PROJECT + path.sep)).length : 0;
      return json(res, { pending: n });
    }
    if (p === "/api/project" && req.method === "PUT") {
      const next = await readBody(req);
      return json(res, { ok: true, ...saveProject(next,req,res) });
    }
    // điểm mặt đã quét (Làm đẹp): editor quét trong trình duyệt rồi gửi lên, bản dựng chèn vào video
    if(p==='/lib/person-mask-edits.js')return sendFile(req,res,path.join(KIT,'lib/person-mask-edits.js'),true);
    if(p==='/lib/person-source-adjustments.js')return sendFile(req,res,path.join(KIT,'lib/person-source-adjustments.js'),true);
    if(p==='/lib/component-list.js')return sendFile(req,res,path.join(KIT,'lib/component-list.js'),true);
    if(p==='/lib/person-exposure.js')return sendFile(req,res,path.join(KIT,'lib/person-exposure.js'),true);
    if(p==='/lib/person-selection.js')return sendFile(req,res,path.join(KIT,'lib/person-selection.js'),true);
    if(p==='/lib/person-selection-scope.js'||p==='/lib/broll-transition.js')return sendFile(req,res,path.join(KIT,p.slice(1)),true);
    if (p === "/api/face") {
      requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ);
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');};
      if (req.method === "PUT") {
        const d = await readBody(req);
        const {tracks,...status}=saveFaceTracks(target,project,d,{validate});return json(res,{ok:true,...status,bodySourceDetails:tracks.filter(t=>t.skin).map(t=>({src:t.src,sha256:t.fingerprint.sha256,exposure:t.exposure}))});
      }
      if(req.method!=='GET')return json(res,{error:'Không có tác vụ mặt này.'},405);
      if(url.searchParams.get('sources')==='1')return json(res,{ok:true,sources:faceSourceManifest(target,project)});
      if(url.searchParams.has('sample')){
        const src=url.searchParams.get('sample'),time=Number(url.searchParams.get('time'));
        if(!Number.isFinite(time)||time<0)throw new Error('Mốc xem vùng không hợp lệ.');
        const track=readFaceTracks(target,project).tracks.find(t=>t.src===src&&t.skin);
        if(!track)throw new Error('Nguồn chưa có mặt nạ khớp; quét lại trước khi sửa vùng.');
        const index=Math.floor(time*track.fps),runs=track.skin.f[index];
        if(!runs)throw new Error('Mốc này nằm ngoài dữ liệu quét.');
        return json(res,{ok:true,src,sha256:track.fingerprint.sha256,fps:track.fps,duration:track.f.length/track.fps,w:track.skin.w,h:track.skin.h,runs});
      }
      const {tracks,...status}=readFaceTracks(target,project);return json(res,{ok:true,...status,bodySourceDetails:tracks.filter(t=>t.skin).map(t=>({src:t.src,sha256:t.fingerprint.sha256,exposure:t.exposure})),matchedSources:tracks.length});
    }
    if (p === "/api/build" && req.method === "POST") {
      const next = await readBody(req);
      requestProject(req);
      lastProject=next;
      buildProject(PROJECT, next);
      return json(res, { ok: true });
    }
    if (p === "/api/media") return json(res, listMedia());
    if(p==='/api/primary-media-preview'&&['GET','HEAD'].includes(req.method)){
      const target=PROJECT,src=url.searchParams.get('src'),workspace=url.searchParams.get('workspaceId');
      const validate=()=>{if(PROJECT!==target||url.searchParams.get('dir')!==relDir(target)||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');assertProjectRevision(path.join(target,'project.json'),url.searchParams.get('revision'));if(!listMedia().includes(src)||!/\.(mp4|mov|m4v|webm)$/i.test(src))throw new Error('Chọn video trong tư liệu dự án.');};
      validate();const {file}=resolveContained(target,src);await streamMedia(req,res,file,{validate});return;
    }
    if(p==='/api/primary-media-info'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=JSON.parse(fs.readFileSync(PJ,'utf8'));
      return json(res,{ok:true,assets:await inspectPrimaryMedia(target,project,body.selected,listMedia(),{validate:()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');}})});
    }
    if(p==='/api/plate-review'&&['GET','POST'].includes(req.method)){
      requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ),revision=req.headers['x-contentos-revision'];
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');};
      const status=req.method==='POST'?approvePlateReview(target,project,revision,{confirmed:(await readBody(req)).confirmed,validate}):plateReviewStatus(target,project,revision);
      return json(res,{ok:true,...status});
    }
    if(p==='/api/person-exposure/selected'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ),revision=req.headers['x-contentos-revision'];
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');assertProjectRevision(path.join(target,'project.json'),revision);};
      return json(res,{ok:true,...await measureSelectedPersonExposure(target,project,body,{validate,signal:controller.signal})});
    }
    if(p.startsWith('/api/color-normalization')&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ);
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');};
      if(p==='/api/color-normalization/info'){const selected=shotColorRequest(project,body);return json(res,{ok:true,metadata:await probeMediaMetadata(resolveContained(target,selected.src).file,{validate}),luts:listColorLuts(target),library:readLutLibrary(ROOT).items.map(({sources,...item})=>item)});}
      if(p==='/api/color-normalization/library'){const lut=await attachLibraryLut(ROOT,target,body.id,body);validate();return json(res,{ok:true,lut});}
      if(p==='/api/color-normalization/luts'){const lut=await importColorLut(target,body.text,body);validate();return json(res,{ok:true,lut});}
      if(p==='/api/color-normalization/batch')return json(res,{ok:true,...await normalizeColorBatch(target,project,body,{validate,signal:controller.signal})});
      if(p==='/api/color-normalization')return json(res,{ok:true,result:await normalizeColor(target,project,body,{validate,signal:controller.signal})});
      return json(res,{error:'Không có tác vụ màu này.'},404);
    }
    if(p==='/api/shot-color'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ);
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');};
      return json(res,{ok:true,result:await analyzeShotColor(target,project,body,{validate,signal:controller.signal})});
    }
    if(p==='/api/person-tracking/suggest-points'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,project=readJson(PJ);if(project.workspaceId!==workspaceStore.active().id||!req.headers['x-contentos-revision'])throw new Error('Sai workspace hoặc thiếu revision.');assertProjectRevision(path.join(target,'project.json'),req.headers['x-contentos-revision']);const result=personPointSuggestions(target,project,body);requestProject(req);assertProjectRevision(path.join(target,'project.json'),req.headers['x-contentos-revision']);return json(res,{ok:true,result});
    }
    if(p==='/api/person-tracking'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ),revision=req.headers['x-contentos-revision'];
      if(project.workspaceId!==workspace||!revision)throw new Error('Sai workspace hoặc thiếu revision.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');assertProjectRevision(path.join(target,'project.json'),revision);};
      return json(res,{ok:true,result:await trackPersonSelection(ROOT,target,project,body,{validate,signal:controller.signal})});
    }
    if(p==='/api/plate-privacy/suggest'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ),revision=req.headers['x-contentos-revision'];
      if(project.workspaceId!==workspace||!revision)throw new Error('Sai workspace hoặc thiếu revision.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');assertProjectRevision(path.join(target,'project.json'),revision);};
      return json(res,{ok:true,result:await suggestPlateRegions(ROOT,target,project,body,{validate,signal:controller.signal})});
    }
    if(p==='/api/plate-privacy'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspace=workspaceStore.active().id,project=readJson(PJ);
      if(project.workspaceId!==workspace)throw new Error('Sai workspace.');
      const controller=new AbortController();res.once('close',()=>{if(!res.writableEnded)controller.abort();});
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspace)throw new Error('Dự án hoặc workspace đã đổi.');};
      return json(res,{ok:true,result:await createPlatePrivacy(ROOT,target,project,body,{validate,signal:controller.signal})});
    }
    if(p==='/api/remotion-scenes'&&req.method==='GET'){requestProject(req);return json(res,{job:remotionJobs.latest(workspaceStore.active().id,relDir(PROJECT))});}
    if(p==='/api/remotion-scenes'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const workspaceId=workspaceStore.active().id,project=readJson(PJ);if(project.workspaceId!==workspaceId)throw new Error('Sai workspace.');
      return json(res,remotionJobs.start({workspaceId,project:relDir(PROJECT),revision:req.headers['x-contentos-revision'],scene:{...body.scene,format:project.format||'9:16'}}),202);
    }
    if(p.startsWith('/api/remotion-scenes/')&&['GET','DELETE'].includes(req.method)){
      requestProject(req);const id=p.slice('/api/remotion-scenes/'.length);return json(res,req.method==='DELETE'?remotionJobs.cancel(id,workspaceStore.active().id,relDir(PROJECT)):remotionJobs.get(id,workspaceStore.active().id,relDir(PROJECT)));
    }
    if(p==='/api/broll-media-info'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT;
      const assets=await inspectBrollMedia(target,body.selected,listMedia(),{validate:()=>{requestProject(req);if(PROJECT!==target)throw new Error('Dự án đã đổi.');}});
      return json(res,{ok:true,assets});
    }
    if(p==='/api/audio-info'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);
      if(typeof body.src!=='string'||!listMedia().includes(body.src)||!/\.(mp3|wav|m4a|aac)$/i.test(body.src))throw new Error('Chọn audio trong tư liệu dự án.');
      const {file}=resolveContained(PROJECT,body.src);
      const stdout=await new Promise((resolve,reject)=>execFile('ffprobe',['-v','error','-select_streams','a:0','-show_entries','stream=codec_type:format=duration','-of','json',file],{windowsHide:true,timeout:20000,maxBuffer:1024*1024},(error,out)=>error?reject(new Error('Không đọc được audio.')):resolve(out)));
      requestProject(req);const info=JSON.parse(stdout),duration=Number(info.format?.duration);
      if(!info.streams?.length||!Number.isFinite(duration)||duration<=0)throw new Error('Audio không hợp lệ.');
      const voice=voiceAssetContext(PROJECT,body.src,news.projectBrief(workspaceStore.active().id,relDir(PROJECT)));
      return json(res,{ok:true,duration,voice});
    }
    if (p === "/api/thumb") return thumb(req, res, url.searchParams);
    // ảnh bìa (editor vẽ khung hình + chữ tiêu đề trên canvas) → <dự án>/renders/anh-bia-<n>.jpg
    if (p === "/api/cover" && req.method === "POST") {
      if (!PROJECT) return json(res, { ok: false, error: "Chưa mở dự án." }, 400);
      requestProject(req);
      const metadata=JSON.parse(decodeURIComponent(req.headers['x-contentos-cover']||''));
      const result=await saveCover({projectDir:PROJECT,stream:req,metadata,revision:req.headers['x-contentos-revision'],validate:()=>requestProject(req),resolveImage:imageService.assetFile});
      return json(res,{ok:true,path:path.relative(ROOT,result.file).replace(/\\/g,'/'),name:result.name});
    }
    // Thành phần có sẵn của mẫu edit dự án đang dùng (chữ, nhãn, đồ hoạ…) — hiện thành thẻ xem trước trong editor
    if (p === "/api/presets") {
      const proj = lastProject || JSON.parse(fs.readFileSync(PJ, "utf8"));
      let tpl = null;
      try { tpl = JSON.parse(fs.readFileSync(path.join(TEMPLATES, slug(proj.template?.id || ""), "template.json"), "utf8")); } catch {}
      const face = `/api/thumb?src=${encodeURIComponent(proj.source?.video || "")}&t=2.0`;
      return json(res, { template: tpl ? { id: tpl.id, name: tpl.name } : null, ...presetParts(proj, tpl?.presets || [], face) });
    }
    // Thêm vào kho từ các mẫu edit đã tải: danh sách mẫu có thành phần · thành phần của 1 mẫu (kèm ảnh xem trước)
    if (p === "/api/kho/mau" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        const list = [];
        for (const d of fs.existsSync(TEMPLATES) ? fs.readdirSync(TEMPLATES) : []) {
          const t = readJson(path.join(TEMPLATES, d, "template.json"));
          if (!t) continue;
          const c = (g) => (t.presets || []).filter((x) => x.group === g).length;
          list.push({ id: d, name: t.name, chu: c("chu"), dohoa: c("dohoa"), canhtram: c("canhtram") });
        }
        return json(res, { items: list });
      }
      const t = readJson(path.join(TEMPLATES, slug(id), "template.json"));
      if (!t) return json(res, { ok: false, error: "Mẫu chưa được tải về." }, 404);
      // thẻ "nền người" (hiệu ứng phủ lên video) vẽ trên ảnh poster của mẫu
      const face = fs.existsSync(path.join(TEMPLATES, slug(id), "poster.jpg")) ? `/api/template-poster?id=${encodeURIComponent(slug(id))}` : "";
      return json(res, { template: { id: slug(id), name: t.name }, ...presetParts({ brand: t.brand, format: t.format }, t.presets || [], face) });
    }
    // Kênh mạng xã hội của người dùng
    if (p === "/api/social" && req.method === "GET") {
      const allowed = await socialAllowed();
      return json(res, { allowed, plan: currentPlan(), account: jobAccount(), channels: allowed ? socialList() : [] });
    }
    if (p === "/api/social" && (req.method === "POST" || req.method === "DELETE")) {
      if (!(await socialAllowed())) return json(res, { ok: false, needPlan: "pro", error: "Tính năng Mạng xã hội dành cho gói Pro trở lên." }, 403);
      let list = socialList();
      if (req.method === "DELETE") { list = list.filter((x) => x.id !== url.searchParams.get("id")); socialSave(list); return json(res, { ok: true, channels: list }); }
      const b = await readBody(req), str = (v, n) => String(v ?? "").trim().slice(0, n);
      if (!SOCIAL_PLATFORMS.includes(b?.platform)) return json(res, { ok: false, error: "Chọn nền tảng." }, 400);
      const ch = { id: b.id || "mxh-" + Date.now().toString(36), platform: b.platform, name: str(b.name, 80), url: str(b.url, 300),
        audience: str(b.audience, 400), tone: str(b.tone, 400), hashtags: str(b.hashtags, 300), cta: str(b.cta, 300), auto: b.auto !== false };
      if (!ch.name && !ch.url) return json(res, { ok: false, error: "Nhập tên kênh hoặc link kênh." }, 400);
      const i = list.findIndex((x) => x.id === ch.id);
      if (i >= 0) list[i] = ch; else list.push(ch);
      socialSave(list);
      return json(res, { ok: true, channels: list });
    }
    // Đăng tự động: AI viết content đúng tiêu chí từng kênh theo nội dung video rồi tự đăng
    if (p === "/api/social/post" && req.method === "POST") {
      if (!(await socialAllowed())) return json(res, { ok: false, needPlan: "pro", error: "Đăng tự động dành cho gói Pro trở lên." }, 403);
      const b = await readBody(req);
      const video = b?.file ? path.resolve(PROJECT || ROOT, String(b.file)) : "";
      if (!video || !fs.existsSync(video) || !/\.(mp4|mov)$/i.test(video)) return json(res, { ok: false, error: "Không thấy file video đã xuất." }, 400);
      const chans = socialList().filter((x) => (b.channels || []).includes(x.id));
      if (!chans.length) return json(res, { ok: false, error: "Chọn ít nhất 1 kênh." }, 400);
      const proj = PROJECT ? relDir(PROJECT) : null, title = PROJECT ? readJson(PJ)?.title || path.basename(PROJECT) : "";
      // hẹn giờ → vào lịch đăng, tới giờ phần mềm tự giao việc cho AI
      const at = b.scheduleAt ? Date.parse(b.scheduleAt) : NaN;
      if (at && at > Date.now() + 60e3) return json(res, { ok: true, scheduled: await lichAdd({ at, channels: chans, project: proj, video, title, note: b.note }) });
      const jb = makePostJob({ video, channels: chans, project: proj, title, note: b.note });
      return json(res, { ok: true, job: jb, listener: aiListener() });
    }
    // Phân tích kênh mạng xã hội (gói Pro+): dán link kênh → việc cho AI → báo cáo work/report.json
    // kết quả cắt clip của 1 video dài: danh sách dự án clip + trạng thái edit / xuất + caption
    if (p === "/api/clips" && req.method === "GET") {
      const d = safeJoin(ROOT, url.searchParams.get("dir") || "");
      const made = d && readJson(path.join(d, "work", "clips-made.json"));
      if (!made) return json(res, { ok: false, error: "Chưa có clip." }, 404);
      const plan = readJson(path.join(d, "work", "clips.json")) || [];
      const items = made.clips.map((c) => {
        const cd = path.join(ROOT, c.dir), j = readJson(aiJobFile(cd)), r = readJson(path.join(cd, "work", "render.json")), info = plan.find((x) => x.k === c.k) || {};
        return { ...c, exists: fs.existsSync(cd), hook: info.hook || "", score: info.score ?? null, reason: info.reason || "", captions: info.captions || {},
          ai: j ? j.status : null, rendered: r?.output && !r.running ? r.output : null };
      });
      return json(res, { ok: true, items, title: readJson(path.join(d, "project.json"))?.title || path.basename(d) });
    }
    if (p === "/api/tich-hop" && req.method === "GET") return json(res, { ok: true, allowed: await socialAllowed(), tools: TICH_HOP_TOOLS, items: tichHopList() });
    if (p === "/api/tich-hop" && (req.method === "POST" || req.method === "DELETE")) {
      if (!(await socialAllowed())) return json(res, { ok: false, needPlan: "pro", error: "Tích hợp dành cho gói Pro trở lên." }, 403);
      let l = tichHopList();
      if (req.method === "DELETE") { l = l.filter((x) => x.id !== url.searchParams.get("id")); tichHopSave(l); return json(res, { ok: true, items: l }); }
      const b = await readBody(req);
      if (!TICH_HOP_TOOLS[b.tool]) return json(res, { ok: false, error: "Chọn công cụ." }, 400);
      if (/mật khẩu|password|pass\s*:/i.test(String(b.note || ""))) return json(res, { ok: false, error: "Không lưu mật khẩu ở đây — hãy đăng nhập sẵn trên trình duyệt." }, 400);
      const link = String(b.url || TICH_HOP_TOOLS[b.tool].url).trim();
      if (link && !/^https?:\/\/\S+$/i.test(link)) return json(res, { ok: false, error: "Link không hợp lệ." }, 400);
      const e = { id: b.id || crypto.randomBytes(4).toString("hex"), tool: b.tool, name: String(b.name || TICH_HOP_TOOLS[b.tool].name).slice(0, 60),
        account: String(b.account || "").slice(0, 120), url: link, plan: String(b.plan || "").slice(0, 40), note: String(b.note || "").slice(0, 500), updatedAt: new Date().toISOString() };
      const i = l.findIndex((x) => x.id === e.id);
      if (i >= 0) l[i] = e; else l.push(e);
      tichHopSave(l);
      return json(res, { ok: true, items: l, item: e });
    }
    // ảnh trong báo cáo: work/posts/<n>-anh.jpg (khung / ảnh bìa từng bài) · <n>-khung.jpg (tấm 12 khung)
    // Giọng nói AI: chỉ gói Premium, gọi ElevenLabs / Vbee bằng khoá của người dùng
    if (p === "/api/giong" || p.startsWith("/api/giong/")) {
      const workspaceId=workspaceStore.active().id;
      const coQuyen = await giongAllowed();
      const validateVoiceWorkspace=()=>{if(workspaceStore.active().id!==workspaceId||(req.headers['x-contentos-workspace']&&req.headers['x-contentos-workspace']!==workspaceId))throw new ProjectConflict('Workspace đã đổi. Mở lại công cụ giọng nói.','WORKSPACE_CONTEXT_CONFLICT');};
      validateVoiceWorkspace();
      const giong=giongApi({root:ROOT,workspaceId,configStore:connectionStore.voiceConfig(workspaceId)});
      if (p === "/api/giong" && req.method === "GET") return json(res, coQuyen ? { ok: true, allowed: true, workspaceId, ...giong.trangThai() } : { ok: true, allowed: false, workspaceId, account: jobAccount() });
      if (!coQuyen) return json(res, { ok: false, error: "Tính năng dành cho gói Premium." }, 403);
      const voiceBody=async()=>{const body=await readBody(req);validateVoiceWorkspace();return body;};
      try {
        if(p==='/api/giong/new-project'&&req.method==='POST'){
          const body=await voiceBody();if(body.workspaceId!==workspaceId)return json(res,{error:'Workspace đã đổi.'},409);
          return json(res,await createNarrationProject(ROOT,workspaceStore,storageService,news,body),201);
        }
        if(p==='/api/giong/attach'&&req.method==='POST'){
          const body=await readBody(req);validateVoiceWorkspace();requestProject(req);
          return json(res,await attachVoiceResult(ROOT,storageService,news,{workspaceId,dir:relDir(PROJECT),id:String(body.id||''),expectedNewsId:body.expectedNewsId,validate:()=>{validateVoiceWorkspace();requestProject(req);}}));
        }
        if (p === "/api/giong/ket-noi" && req.method === "POST") return json(res, { ok: true, giong: await giong.ketNoi(await voiceBody()) });
        if (p === "/api/giong/ket-noi" && req.method === "DELETE") { giong.boKetNoi(String(url.searchParams.get("ncc") || "")); return json(res, { ok: true }); }
        if (p === "/api/giong/voices") return json(res, { ok: true, giong: await giong.danhSach(String(url.searchParams.get("ncc") || "")) });
        if (p === "/api/giong/tao" && req.method === "POST") {
          const body=await voiceBody();let narration;
          if(body.newsBriefId){const brief=news.brief(workspaceId,body.newsBriefId);if(brief.hash!==body.newsBriefHash||String(body.text||'').trim()!==brief.payload.script.trim())return json(res,{error:'Lời đọc không khớp kịch bản đã duyệt. Mở lại bản tin hoặc tạo audio không gắn bản duyệt.'},400);
            narration={workspaceId,scriptId:brief.id,version:brief.version,scriptHash:brief.hash,textHash:crypto.createHash('sha256').update(brief.payload.script.trim()).digest('hex')};}
          return json(res,{ok:true,kq:await giong.tao({...body,narration})});
        }
        if (p === "/api/giong/sao-chep" && req.method === "POST") {
          if (url.searchParams.get("dongY") !== "1") return json(res, { ok: false, error: "Cần xác nhận quyền dùng giọng." }, 400);
          const ch = []; let n = 0;
          for await (const c of req) { n += c.length; if (n > 500e6) return json(res, { ok: false, error: "File quá lớn, dùng đoạn ngắn hơn." }, 413); ch.push(c); }
          return json(res, { ok: true, ma: await giong.saoChep(Buffer.concat(ch), url.searchParams.get("ten")) });
        }
        if (p === "/api/giong/file") { const f = giong.fileKq(String(url.searchParams.get("id") || "")); return f && fs.existsSync(f) ? sendFile(req, res, f) : send(res, 404, ""); }
      } catch (e) { return json(res, { ok: false, error: e.message }, 400); }
      return send(res, 404, "");
    }
    if (p === "/api/phan-tich/file") {
      const d = phanTichDir(url.searchParams.get("id")), f = String(url.searchParams.get("f") || "");
      if (!d || !/^posts\/\d+-(anh|khung)\.jpg$/.test(f)) return send(res, 404, "");
      return sendFile(req, res, path.join(d, "work", f));
    }
    if (p === "/api/phan-tich" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (id) {
        const d = phanTichDir(id);
        const rep = d && readJson(path.join(d, "work", "report.json"));
        return rep ? json(res, { ok: true, item: phanTichItem(d), report: rep }) : json(res, { ok: false, error: "Chưa có báo cáo." }, 404);
      }
      return json(res, { ok: true, allowed: await socialAllowed(), items: phanTichList(), listener: aiListener() });
    }
    if (p === "/api/phan-tich" && req.method === "POST") {
      if (!(await socialAllowed())) return json(res, { ok: false, needPlan: "pro", error: "Phân tích kênh dành cho gói Pro trở lên." }, 403);
      const b = await readBody(req);
      const link = String(b?.url || "").trim();
      const platform = platformOf(link);
      if (!platform) return json(res, { ok: false, error: "Dán link kênh TikTok, Facebook, YouTube, Instagram, Threads, LinkedIn hoặc X." }, 400);
      const name = (/@([\w.-]+)/.exec(link) || [])[1] || new URL(link).pathname.split("/").filter(Boolean).pop() || platform;
      const dir = path.join(WORKSPACE, "_phan-tich-kenh", new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + slug(name));
      fs.mkdirSync(path.join(dir, "work"), { recursive: true });
      const jb = { kind: "analyze", status: "waiting", dir: relDir(dir), url: link, platform, handle: name, limit: [10, 20, 30, 50].includes(Number(b.limit)) ? Number(b.limit) : 30,
        templateName: `Phân tích kênh ${name}`, listen: !!b.listen, note: String(b.note || "").slice(0, 1500), account: jobAccount(), background: process.env.VEK_AI_BACKGROUND === "1", createdAt: new Date().toISOString() };
      fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
      if (jb.background) startAgentRunner(dir);
      return json(res, { ok: true, item: phanTichItem(dir), listener: aiListener() });
    }
    if (p === "/api/phan-tich" && req.method === "DELETE") {
      const d = phanTichDir(url.searchParams.get("id"));
      if (!d) return json(res, { ok: false, error: "Không thấy báo cáo." }, 404);
      stopAgentRunner(d);
      fs.rmSync(d, RM_NAS);
      return json(res, { ok: true });
    }
    // Lịch đăng bài: xem · huỷ · đổi giờ · đăng ngay
    if (p === "/api/lich-dang" && req.method === "GET") {
      await lichTick();
      return json(res, { ok: true, items: lichView(), listener: aiListener() });
    }
    if (p === "/api/lich-dang" && (req.method === "POST" || req.method === "DELETE")) {
      if (!(await socialAllowed())) return json(res, { ok: false, needPlan: "pro", error: "Lịch đăng bài dành cho gói Pro trở lên." }, 403);
      const b = req.method === "POST" ? await readBody(req) : { id: url.searchParams.get("id") };
      const l = lichList(), e = l.find((x) => x.id === b.id);
      if (!e) return json(res, { ok: false, error: "Không thấy lịch này." }, 404);
      if(req.method==='POST'&&(b.now||b.at)){
        try{if(e.jobDir||scheduleDispatch(ROOT,e.id).read())return json(res,{ok:false,error:'Lịch này đã giao việc. Kiểm tra kết quả từng kênh trước khi tạo lịch mới; đổi giờ không chạy lại việc cũ.'},409);}
        catch(error){return json(res,{ok:false,error:error.message},409);}
      }
      if (req.method === "DELETE") {
        if (e.status === "dang") return json(res, { ok: false, error: "AI đang đăng bài này — không huỷ được nữa." }, 409);
        e.status = "huy";
      } else if (b.now) { if (e.status !== "cho") return json(res, { ok: false, error: "Bài này không còn chờ đăng." }, 409); e.at = new Date().toISOString(); }
      else if (b.at) { if (e.status !== "cho" && e.status !== "loi") return json(res, { ok: false, error: "Bài này không đổi giờ được." }, 409); e.at = new Date(b.at).toISOString(); e.status = "cho"; delete e.error; }
      lichSave(l);
      await lichTick();
      return json(res, { ok: true, items: lichView() });
    }
    // Tạo mẫu edit của người dùng từ các mục trong kho → editor/templates/<id>/ (chỉ trên máy, AI dựng theo các thành phần đã chọn)
    if (req.method !== "GET" && /^\/api\/(library\/|templates(\/|$)|kho\/template$)/.test(p)) libCache = null; // mẫu sắp đổi → đọc lại danh sách
    if (p === "/api/kho/template" && req.method === "POST") {
      const b = await readBody(req);
      try { return json(res, { ok: true, ...makeKhoTemplate(b) }); }
      catch (e) { return json(res, { ok: false, error: e.message }, 400); }
    }
    // Kho cảnh trám: link Google Drive (file / thư mục) người dùng lưu cảnh trám AI — { id, name, link }
    if (p === "/api/kho/links") {
      const F = path.join(ROOT, "workspace", "kho-canh-tram.json");
      let list = readJson(F) || [];
      const save = () => { fs.mkdirSync(path.dirname(F), { recursive: true }); fs.writeFileSync(F, JSON.stringify(list, null, 1)); };
      if (req.method === "POST") {
        const b = await readBody(req), link = String(b?.link || "").trim();
        if (!/^https?:\/\/\S+$/i.test(link)) return json(res, { ok: false, error: "Dán link bắt đầu bằng https://" }, 400);
        const it = { id: b.id || "lk-" + Date.now().toString(36), name: String(b.name || "").trim().slice(0, 80) || "Cảnh trám", link: link.slice(0, 500),
          folder: /\/folders\/|[?&]folder/i.test(link), savedAt: new Date().toISOString() };
        const i = list.findIndex((x) => x.id === it.id);
        if (i >= 0) list[i] = it; else list.unshift(it);
        save();
        return json(res, { ok: true, links: list });
      }
      if (req.method === "DELETE") { list = list.filter((x) => x.id !== url.searchParams.get("id")); save(); return json(res, { ok: true, links: list }); }
      return json(res, { ok: true, links: list });
    }
    // Lấy 1 file Drive (link chia sẻ "ai có link đều xem được") về inputs/ của dự án đang mở → dùng làm cảnh trám
    if (p === "/api/kho/links/fetch" && req.method === "POST") {
      const b = await readBody(req), link = String(b?.link || "");
      if (!PROJECT) return json(res, { ok: false, error: "Mở một dự án trước." }, 400);
      if (/\/folders\//.test(link)) return json(res, { ok: false, folder: true, error: "Đây là link thư mục — mở thư mục, tải file cần dùng về máy rồi bấm “Từ máy tính”." }, 400);
      const id = (/\/d\/([\w-]{10,})/.exec(link) || /[?&]id=([\w-]{10,})/.exec(link) || [])[1];
      if (!id || !/google\.com/.test(link)) return json(res, { ok: false, error: "Chỉ lấy tự động được link file Google Drive — link khác hãy mở rồi tải về máy." }, 400);
      try {
        const r = await fetch(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`, { redirect: "follow", signal: AbortSignal.timeout(600000) });
        const type = r.headers.get("content-type") || "";
        if (!r.ok || /text\/html/i.test(type)) return json(res, { ok: false, error: "Không tải được — đặt quyền chia sẻ file là “Bất kỳ ai có đường liên kết”." }, 400);
        const cd = r.headers.get("content-disposition") || "";
        const fname = decodeURIComponent((/filename\*=UTF-8''([^;]+)/i.exec(cd) || /filename="?([^";]+)"?/i.exec(cd) || [, `${slug(b.name || "canh-tram")}.mp4`])[1]).normalize("NFC");
        if (!UPLOAD_OK.test(fname)) return json(res, { ok: false, error: "File không phải video / ảnh." }, 400);
        const ext = path.extname(fname).toLowerCase(), base = slug(b.name || fname.slice(0, -ext.length)) || "canh-tram";
        const dir = path.join(PROJECT, "inputs");
        fs.mkdirSync(dir, { recursive: true });
        let name = `${base}${ext}`;
        for (let i = 2; fs.existsSync(path.join(dir, name)); i++) name = `${base}-${i}${ext}`;
        const out = fs.createWriteStream(path.join(dir, name)), rd = r.body.getReader();
        for (;;) { const { done, value } = await rd.read(); if (done) break; if (!out.write(value)) await new Promise((ok) => out.once("drain", ok)); }
        await new Promise((ok, no) => { out.end(ok); out.on("error", no); });
        return json(res, { ok: true, path: `inputs/${name}`, media: listMedia() });
      } catch (e) { return json(res, { ok: false, error: "Tải từ Drive lỗi: " + e.message }, 500); }
    }
    // Kho hiệu ứng của người dùng (dùng chung mọi dự án): chữ / đồ hoạ / kiểu cảnh trám tự làm rồi lưu lại
    if (p === "/api/kho") {
      const KHO = path.join(ROOT, "workspace", "kho-hieu-ung.json");
      let kho = [];
      try { kho = JSON.parse(fs.readFileSync(KHO, "utf8")); } catch {}
      const save = () => { fs.mkdirSync(path.dirname(KHO), { recursive: true }); fs.writeFileSync(KHO, JSON.stringify(kho, null, 1)); };
      if (req.method === "POST" && url.searchParams.get("batch")) { // tích nhiều thành phần của 1 mẫu cùng lúc
        const b = await readBody(req), t = readJson(path.join(TEMPLATES, slug(b?.tpl || ""), "template.json"));
        if (!t) return json(res, { ok: false, error: "Mẫu chưa được tải về." }, 404);
        const pick = (t.presets || []).filter((x) => (b.ids || []).includes(x.id));
        const now = Date.now();
        pick.forEach((x, i) => kho.unshift({ ...x, kind: x.kind || "blocks", group: x.group === "chu" ? "chu" : x.group === "canhtram" ? "canhtram" : "dohoa", from: t.name, fromId: slug(b.tpl), tplCss: t.brand?.css || "", brand: x.kind === "texts" ? t.brand : undefined,
          id: "kho-" + (now + i).toString(36), savedAt: new Date().toISOString() }));
        save();
        return json(res, { ok: true, added: pick.length });
      }
      if (req.method === "POST") {
        const it = await readBody(req);
        if (!it || !["blocks", "brolls"].includes(it.kind)) return json(res, { ok: false, error: "Mục không hợp lệ." }, 400);
        it.id = "kho-" + Date.now().toString(36);
        it.savedAt = new Date().toISOString();
        kho.unshift(it); save();
        return json(res, { ok: true, id: it.id });
      }
      if (req.method === "DELETE") { kho = kho.filter((x) => x.id !== url.searchParams.get("id")); save(); return json(res, { ok: true }); }
      if (req.method === "PUT") { // đổi tên
        const b = await readBody(req), it = kho.find((x) => x.id === url.searchParams.get("id"));
        if (it && b?.name) { it.name = String(b.name).slice(0, 80); save(); }
        return json(res, { ok: !!it });
      }
      // GET: kèm ảnh xem trước dựng bằng CSS của dự án đang mở (+ CSS mẫu gốc lưu cùng mục, nếu khác mẫu)
      // màn hình ngoài (chưa mở dự án nào) → xem trước bằng CSS mẫu gốc lưu cùng mỗi mục
      let proj = PROJECT ? lastProject : null;
      if (!proj && PJ) try { proj = JSON.parse(fs.readFileSync(PJ, "utf8")); } catch {}
      proj = proj || {};
      const css = proj.brand?.css || "";
      const blocks = kho.filter((x) => x.kind !== "brolls").map((x) => ({ ...x, css: (x.css || "") + (x.tplCss && x.tplCss !== css ? "\n" + x.tplCss : "") }));
      const face = `/api/thumb?src=${encodeURIComponent(proj.source?.video || "")}&t=2.0`;
      const parts = presetParts(proj, blocks, face);
      return json(res, { ...parts, items: [...parts.items, ...kho.filter((x) => x.kind === "brolls")] });
    }
    if (p === "/api/preview") {
      const proj = lastProject || JSON.parse(fs.readFileSync(PJ, "utf8"));
      const kind = url.searchParams.get("kind"), id = url.searchParams.get("id");
      const it = (proj[kind] || []).find((x) => x.id === id);
      const bg = kind === "texts" && it ? `/api/thumb?src=${encodeURIComponent(proj.source?.video || "")}&t=${(Math.max(0, (Number(it.at) || 0) + 0.4)).toFixed(1)}` : null;
      if (url.searchParams.get("format") === "json") {
        const parts = previewParts(proj, kind, id, bg);
        return parts ? json(res, parts) : send(res, 404, "");
      }
      const html = previewHtml(proj, kind, id, bg);
      return html ? send(res, 200, html, "text/html; charset=utf-8") : send(res, 404, "");
    }
    if (p.startsWith("/library/")) {
      const f = safeJoin(LIBRARY, p.slice(9));
      return f && LIB_FILES.includes(path.basename(f)) ? sendFile(req, res, f) : send(res, 404, "");
    }
    if (p.startsWith("/templates-media/")) {
      const f = safeJoin(TEMPLATES, p.slice(17));
      return f && ["poster.jpg","preview.mp4"].includes(path.basename(f)) ? sendFile(req, res, f) : send(res, 404, "");
    }
    if (p === "/api/library" && req.method === "GET") return json(res, await libraryItems(url.searchParams.has("local")));
    if (p === "/api/library/install" && req.method === "POST") {
      try { await installTemplate(url.searchParams.get("id")); return json(res, { ok: true, items: await libraryItems() }); }
      catch (e) { return json(res, { ok: false, error: String(e.message) }, 400); }
    }
    // Nhập mẫu .zip đã tải trên website (đăng nhập ở website, phần mềm không cần tài khoản)
    if (p === "/api/library/import" && req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try {
        const ok = importTemplateZip(Buffer.concat(chunks));
        if (!ok.length) return json(res, { ok: false, error: "File .zip không chứa mẫu edit (template.json)." }, 400);
        return json(res, { ok: true, imported: ok, items: await libraryItems() });
      } catch (e) { return json(res, { ok: false, error: "File .zip lỗi: " + e.message }, 400); }
    }
    if (p === "/api/library/install" && req.method === "DELETE") {
      const tdir = path.join(TEMPLATES, slug(url.searchParams.get("id")));
      try { fs.rmSync(tdir, RM_NAS); }
      catch (e) {
        // NAS: file đang được máy khác mở (vd đang phát video xem trước) chỉ bị "chờ xoá", tự mất khi máy kia nhả file.
        // Mẫu đã mất template.json thì không còn hiện trong app → coi như đã xoá.
        if (fs.existsSync(path.join(tdir, "template.json"))) throw e;
      }
      return json(res, { ok: true, items: await libraryItems() });
    }
    // đổi tên mẫu đã cài trên máy (chỉ tên hiển thị; id / thư mục giữ nguyên để job và dự án cũ vẫn trỏ đúng)
    if (p === "/api/templates/rename" && req.method === "POST") {
      const b = await readBody(req), id = slug(b?.id || ""), name = String(b?.name || "").trim().slice(0, 80);
      const f = id && path.join(TEMPLATES, id, "template.json"), t = f && readJson(f);
      if (!t) return json(res, { ok: false, error: "Không thấy mẫu trên máy." }, 404);
      if (!name) return json(res, { ok: false, error: "Tên không được để trống." }, 400);
      const tmp = `${f}.${process.pid}-${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify({ ...t, name }, null, 2) + "\n");
      fs.renameSync(tmp, f);
      return json(res, { ok: true, name });
    }
    if (p === "/api/templates" && req.method === "GET") {
      const id = slug(url.searchParams.get("id"));
      const t = readJson(path.join(TEMPLATES, id, "template.json"));
      if (!t) return json(res, { ok: false, error: "Mẫu chưa được tải về." }, 404);
      return json(res, { template: { ...t, id }, skill: templateSkill(id) });
    }
    if (p === "/api/templates" && req.method === "POST") {
      const b = await readBody(req);
      requestProject(req);
      const {saveEditTemplate}=await import('../src/services/save-edit-template.mjs');
      const {id,folder:dir,template:t}=saveEditTemplate(TEMPLATES,b);
      // Ảnh bìa: khung hình đầu của video gốc
      const srcVid = safeJoin(PROJECT, b.project?.source?.video || "");
      if (srcVid && fs.existsSync(srcVid)) spawn("ffmpeg", ["-v", "error", "-y", "-ss", "1", "-i", srcVid, "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "4", path.join(dir, "poster.jpg")]);
      return json(res, { ok: true, id, version:t.version, items: await libraryItems() });
    }
    if (p === "/api/upload" && req.method === "POST") return upload(req, res, url.searchParams);
    if (p === "/api/brands" && req.method === "GET") return json(res, listBrands());
    if (p === "/api/brands" && req.method === "POST") {
      const b = await readBody(req);
      fs.mkdirSync(BRANDS, { recursive: true });
      const id = slug(b.name);
      fs.writeFileSync(path.join(BRANDS, `${id}.json`), JSON.stringify({ ...b, id: undefined }, null, 2) + "\n");
      return json(res, { ok: true, id, brands: listBrands() });
    }
    if (p === "/api/brands" && req.method === "DELETE") {
      const f = path.join(BRANDS, `${slug(url.searchParams.get("id"))}.json`);
      if (fs.existsSync(f)) fs.rmSync(f);
      return json(res, { ok: true, brands: listBrands() });
    }
    if (p === "/api/history" && req.method === "GET") {
      const f = url.searchParams.get("file");
      if (!f) return json(res, listHistory());
      if (!/^project-\d+\.json$/.test(f)) return send(res, 400, "");
      return json(res, JSON.parse(fs.readFileSync(path.join(PROJECT, ".history", f), "utf8")));
    }
    // Nhờ AI sửa: giao cho Claude / Codex đang mở (như AI edit), xong editor tự nạp lại dự án
    if(p==='/api/completion-policy'&&req.method==='GET'){
      const selected=url.searchParams.get('dir'),directory=selected?safeJoin(ROOT,selected):PROJECT;
      if(!selected)requestProject(req);
      if(!directory||!directory.startsWith(WORKSPACE+path.sep)||path.relative(WORKSPACE,directory).split(path.sep).length!==2)return json(res,{error:'Sai dự án.'},400);
      const project=readJson(path.join(directory,'project.json'));if(!project)return json(res,{error:'Không thấy dự án.'},404);
      const workspaceId=project.workspaceId||'default';return json(res,{workspaceId,workspaceDefault:completionPolicies.get(workspaceId),effective:completionPolicies.resolve(workspaceId,{project})});
    }
    if(p==='/api/completion-policy'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const workspaceId=readJson(PJ).workspaceId||'default';
      if(body.workspaceId!==workspaceId)throw new ProjectConflict('Workspace đã đổi.','WORKSPACE_CONTEXT_CONFLICT');
      return json(res,{ok:true,workspaceId,workspaceDefault:completionPolicies.save(workspaceId,body.mode)});
    }
    if(p==='/api/ai-build/complete'&&req.method==='POST'){
      const body=await readBody(req),dir=safeJoin(ROOT,body.dir||'');
      if(!dir||!dir.startsWith(WORKSPACE+path.sep)||path.relative(WORKSPACE,dir).split(path.sep).length!==2)return json(res,{error:'Sai dự án dựng.'},400);
      const jb=readJson(aiJobFile(dir));
      if(!jb||jb.kind||!jb.completionToken||jb.completionToken!==body.token||!['waiting','working'].includes(jb.status))return json(res,{error:'Việc dựng không sẵn sàng hoàn tất.'},409);
      assertClaimOwner(jb,body.claimId);
      const file=path.join(dir,'project.json');
      try{assertProjectRevision(file,jb.candidate?jb.baseRevision:body.revision);}catch(error){markCandidateConflict(aiJobFile(dir),jb,error);throw error;}
      assertProjectRevision(file,body.revision);
      const {kiemDoHoa}=await import('./tools/kiem-do-hoa.mjs');
      const currentJob=readJson(aiJobFile(dir));
      if(currentJob?.completionToken!==jb.completionToken||!['waiting','working'].includes(currentJob?.status))return json(res,{error:'Việc dựng đã đổi hoặc bị hủy.'},409);
      assertClaimOwner(currentJob,body.claimId);
      let saved;
      if(jb.candidate&&jb.baseRevision){
        const candidateFile=path.join(dir,'work','build-candidates',jb.completionToken,'work','candidate-project.json');
        if(relDir(candidateFile)!==jb.candidate)return json(res,{error:'Sai bản làm việc AI.'},409);
        saved=applyRevisionResult(dir,path.dirname(path.dirname(candidateFile)),jb.baseRevision,{build:candidate=>{
          Object.assign(candidate,enforceAutomotiveJob(candidate,jb,path.dirname(path.dirname(candidateFile))));
          const checked=kiemDoHoa(dir,{project:candidate});if(checked.loi.length)throw new Error(checked.loi.join(' · '));
          const html=buildHtml(candidate,dir);fs.writeFileSync(path.join(path.dirname(candidateFile),'candidate-preview.html'),html);
        }});
      }else{
        const checked=kiemDoHoa(dir);if(checked.loi.length)return json(res,{error:checked.loi.join(' · ')},400);
        buildProject(dir);assertProjectRevision(file,body.revision);saved={revision:body.revision};
      }
      try{buildProject(dir);}catch(error){fs.writeFileSync(aiJobFile(dir),JSON.stringify({...jb,status:'error',appliedRevision:saved.revision,error:'Đã lưu bản dựng nhưng build preview lỗi: '+error.message},null,2)+'\n');throw error;}
      if(dir===PROJECT)lastProject=null;
      const completed={...jb,status:'done',appliedRevision:saved.revision,summary:String(body.summary||'').slice(0,2000),openDir:relDir(dir),doneAt:new Date().toISOString(),completionState:'awaiting-review'};
      fs.writeFileSync(aiJobFile(dir),JSON.stringify(completed,null,2)+'\n');
            return json(res,{ok:true,revision:saved.revision});
    }
    if(p==='/api/ai-revise/history'&&req.method==='GET'){
      requestProject(req);
      const jobs=listReviseJobs(ROOT,relDir(PROJECT));
      return json(res,{jobs:jobs.slice(0,30),active:activeReviseJob(jobs)||null});
    }
    if (p === '/api/ai-revise/complete' && req.method === 'POST') {
      const body=await readBody(req),dir=safeJoin(ROOT,body.dir||'');
      if(!dir||!dir.startsWith(path.join(WORKSPACE,'_sua-video')+path.sep))return json(res,{error:'Sai thư mục việc sửa.'},400);
      const jb=readJson(aiJobFile(dir));
      if(!jb?.baseRevision||!jb.project||!['waiting','working'].includes(jb.status))return json(res,{error:'Việc sửa không sẵn sàng áp dụng.'},409);
      assertClaimOwner(jb,body.claimId);
      const target=safeJoin(ROOT,jb.project);
      if(!target)return json(res,{error:'Sai dự án đích.'},400);
      let saved;
      try{saved=applyRevisionResult(target,dir,jb.baseRevision,{build:candidate=>fs.writeFileSync(path.join(dir,'index.html'),buildHtml(candidate,target))});}catch(error){markCandidateConflict(aiJobFile(dir),jb,error);throw error;}
      // Never leave a committed result looking like unapplied work on failure.
      try{buildProject(target,saved.project);}catch(error){
        fs.writeFileSync(aiJobFile(dir),JSON.stringify({...jb,status:'error',appliedRevision:saved.revision,error:'Đã lưu bản sửa nhưng build preview lỗi: '+error.message,doneAt:new Date().toISOString()},null,2)+'\n');
        if(target===PROJECT)lastProject=null;
        throw error;
      }
      const completed={...jb,status:'done',appliedRevision:saved.revision,summary:String(body.summary||'').slice(0,2000),doneAt:new Date().toISOString(),completionState:'awaiting-review'};
      fs.writeFileSync(aiJobFile(dir),JSON.stringify(completed,null,2)+'\n');
            if(target===PROJECT)lastProject=null;
      return json(res,{ok:true,revision:saved.revision});
    }
    if (p === "/api/ai-revise" && req.method === "POST") {
      const b = await readBody(req), instruction = String(b.instruction || "").trim();
      const execution=modelRouting.resolve(workspaceStore.active().id,autoExecution(normalizeExecution(b.execution,{allowApi:true})),'revise',llmConnectionStore.status(workspaceStore.active().id).model);
      if(execution.mode==='api'){const cfg=llmConnectionStore.status(workspaceStore.active().id);if(!cfg.baseUrl||!cfg.model)return json(res,{error:'Cấu hình kết nối LLM API trước khi sửa.'},400);}
      const requestedCompletion=b.completionMode;
      if(requestedCompletion!==undefined)normalizeCompletion(requestedCompletion);
      if(instruction.length>10000)return json(res,{ok:false,error:'Yêu cầu tối đa 10.000 ký tự; hãy rút gọn hoặc chia việc.'},400);
      if (!instruction) return json(res, { ok: false, error: "Hãy nhập yêu cầu." }, 400);
      if (!PROJECT) return json(res, { ok: false, error: "Chưa mở dự án." }, 400);
      requestProject(req);
      const existing=activeReviseJob(listReviseJobs(ROOT,relDir(PROJECT)));
      if(existing)return json(res,{ok:false,code:'AI_JOB_ACTIVE',error:'Dự án đang có một yêu cầu AI. Theo dõi hoặc hủy yêu cầu đó trước khi gửi tiếp.',job:existing},409);
      const creativeWorkspace=workspaceStore.active().id;
      if((readJson(PJ)?.workspaceId||'default')!==creativeWorkspace)return json(res,{error:'Chọn đúng workspace của dự án.'},409);
      let brandSnapshot;try{brandSnapshot=pinJobBrand(brandDefaults,creativeWorkspace,b.useWorkspaceBrand);}catch(error){return json(res,{error:error.message},400);}
      let creativeBrief;
      try{creativeBrief=catalogs.brief(creativeWorkspace,b.creativeBrief);}catch(error){return json(res,{error:error.message},400);}
      let newsBrief;
      try{newsBrief=b.newsBriefId===undefined?news.projectBrief(creativeWorkspace,relDir(PROJECT)):b.newsBriefId?news.brief(creativeWorkspace,b.newsBriefId):null;}catch(error){return json(res,{error:error.message},400);}
      const sources=await inspectChatSources(instruction);
      requestProject(req);
      if(workspaceStore.active().id!==creativeWorkspace)return json(res,{error:'Workspace đã đổi.'},409);
      const competing=activeReviseJob(listReviseJobs(ROOT,relDir(PROJECT)));
      if(competing)return json(res,{ok:false,code:'AI_JOB_ACTIVE',error:'Một cửa sổ khác vừa giao việc AI cho dự án này.',job:competing},409);
      if(sources.some(s=>s.status==='error'))return json(res,{ok:false,error:'Có nguồn không truy cập được. Kiểm tra đường dẫn trước khi giao AI.',sources},400);
      try{resolveEditSelection(b.project||readJson(PJ),b.context);}catch(error){return json(res,{error:error.message},400);}
      if (b.project) saveProject(b.project,req,res);
      else requestProject(req);
      const dir = path.join(WORKSPACE, "_sua-video", new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0,8) + '-' + slug(path.basename(PROJECT)));
      fs.mkdirSync(path.join(dir, "work"), { recursive: true });
      const prepared=prepareRevisionResult(PROJECT,dir);
      if(brandSnapshot)fs.writeFileSync(path.join(dir,'work/candidate-project.json'),JSON.stringify(applyJobBrand(prepared.snapshot,brandSnapshot,{root:ROOT,projectDir:PROJECT}),null,2)+'\n');
      let selectedItem;
      try{selectedItem=resolveEditSelection(prepared.snapshot,b.context);}catch(error){fs.rmSync(dir,{recursive:true,force:true});return json(res,{error:error.message},400);}
      const completion=completionPolicies.resolve(prepared.snapshot.workspaceId||'default',{project:prepared.snapshot,run:requestedCompletion});
      const jb = { kind: "revise", status: "waiting", account: jobAccount(), execution, background: execution.mode==='cli', dir: relDir(dir), project: relDir(PROJECT),
        baseRevision:prepared.baseRevision,candidate:relDir(path.join(dir,'work','candidate-project.json')),
        sources,creativeBrief,newsBrief,brandSnapshot,completion,selectedItem,
        templateName: "Sửa video: " + instruction.slice(0, 60), instruction, context: b.context || null, template: b.project?.template?.id || "", createdAt: new Date().toISOString() };
      const selectedTemplate=prepared.snapshot.template?.id;
      if(selectedTemplate){try{const destination=path.join(dir,'work/template-snapshot');jb.templateSnapshot={...snapshotTemplate(TEMPLATES,selectedTemplate,destination),directory:relDir(destination)};}catch(error){fs.rmSync(dir,{recursive:true,force:true});return json(res,{error:'Không chốt được mẫu: '+error.message},400);}}
      fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
      return json(res, { ok: true, job: jb, listener: aiListener(), runner: execution.mode==='api'?startApiEditor(dir,jb):jb.background ? startAgentRunner(dir) : null });
    }
    if (p === "/api/ai" && req.method === "POST") {
      try { return json(res, await aiEdit(await readBody(req))); }
      catch (e) { return json(res, { ok: false, error: String(e.message || e) }, 400); }
    }
    if (p === '/api/timeline-source') {
      requestProject(req);const target=PROJECT,workspaceId=workspaceStore.active().id,project=JSON.parse(fs.readFileSync(PJ,'utf8'));
      const result=await timelineSourceCache(target,project,url.searchParams.get('src'),{validate:()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspaceId)throw new Error('Dự án hoặc workspace đã đổi.');}});
      return json(res,result);
    }
    if (p === "/api/strip") return json(res, await strip());
    if (p === "/api/wave") return json(res, await wave());
    if (p === "/api/wave-file") {
      const src = url.searchParams.get("src") || "";
      const file = /^kit:[\w-]+$/i.test(src) ? path.join(KIT, "assets", "music", kitMusicFile(KIT, src.slice(4))) : PROJECT && safeJoin(PROJECT, src);
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, { error: "Không thấy file âm thanh." }, 404);
      return json(res, await wavePeaks(file));
    }
    if (p === "/api/render" && req.method === "POST") {
      const body = await readBody(req);
      if (body.project) saveProject(body.project,req,res);
      else requestProject(req);
      const target = body.target?.dir ? { dir: normWinDir(String(body.target.dir).replace(/^["']+|["']+$/g, "")), name: String(body.target.name || ""), overwrite: !!body.target.overwrite } : null;
      if (target && !path.isAbsolute(target.dir)) return json(res, { ok: false, error: "Thư mục lưu cần là đường dẫn đầy đủ." }, 400);
      if (target) saveSettings({ exportDir: path.resolve(target.dir) === path.resolve(PROJECT, "renders") ? "" : target.dir }); // nhớ nơi lưu cho lần sau
      return json(res, await startRender(body.quality === "final" ? "final" : "draft", target));
    }
    // Hộp Xuất: chọn nơi lưu + tên file (hộp Lưu của Windows) · kiểm file đã có để hỏi ghi đè
    if (p === "/api/export-target" && req.method === "POST") {
      const b = await readBody(req);
      const rawDir = normWinDir(String(b.dir || "").replace(/^["']+|["']+$/g, ""));
      const rawName = String(b.name || "").trim().replace(/^["']+|["']+$/g, "");
      if (b.pickFolder) {
        const folder = await pickFolder(rawDir || exportDir() || (PROJECT ? path.join(PROJECT, "renders") : os.homedir()));
        if (!folder) return json(res, { ok: true, cancelled: true });
        const pickedDir = normWinDir(folder);
        saveSettings({ exportDir: PROJECT && path.resolve(pickedDir) === path.resolve(PROJECT, "renders") ? "" : pickedDir });
        const name = exportFileName(rawName, PROJECT ? path.basename(PROJECT) : "video");
        const file = path.join(pickedDir, name);
        return json(res, { ok: true, dir: pickedDir, name, path: file, exists: fs.existsSync(file) });
      }
      if (b.pick) {
        const file = await pickFile({ save: true, title: "Xuất video thành", start: rawDir, name: exportFileName(rawName, PROJECT ? path.basename(PROJECT) : "video"), filter: "Video MP4 (*.mp4)|*.mp4", ext: "mp4" });
        if (!file) return json(res, { ok: true, cancelled: true });
        const pickedDir = normWinDir(path.dirname(file)), pickedName = exportFileName(path.basename(file));
        saveSettings({ exportDir: PROJECT && path.resolve(pickedDir) === path.resolve(PROJECT, "renders") ? "" : pickedDir });
        const full = path.join(pickedDir, pickedName);
        return json(res, { ok: true, dir: pickedDir, name: pickedName, path: full, exists: fs.existsSync(full) });
      }
      let dir = rawDir, nameIn = rawName;
      // Nếu người dùng dán cả đường dẫn đầy đủ vào ô Tên file hoặc Lưu vào (kể cả đuôi .mp4 / .mp4.json) → tự tách thư mục & tên file
      if (/[\\/]/.test(nameIn) && path.isAbsolute(normWinDir(nameIn))) {
        const normName = normWinDir(nameIn);
        try {
          if (fs.existsSync(normName) && fs.statSync(normName).isDirectory()) { dir = normName; nameIn = ""; }
          else { dir = normWinDir(path.dirname(normName)); nameIn = path.basename(normName); }
        } catch { dir = normWinDir(path.dirname(normName)); nameIn = path.basename(normName); }
      }
      if (/\.(?:mp4(?:\.json)?|mov)$/i.test(dir)) {
        try {
          if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
            if (!nameIn) nameIn = path.basename(dir);
            dir = normWinDir(path.dirname(dir));
          }
        } catch {
          if (!nameIn) nameIn = path.basename(dir);
          dir = normWinDir(path.dirname(dir));
        }
      }
      const name = exportFileName(nameIn, PROJECT ? path.basename(PROJECT) : "video");
      if (!path.isAbsolute(dir)) return json(res, { ok: false, error: "Chưa chọn thư mục lưu hợp lệ (cần đường dẫn đầy đủ như D:\\... hoặc \\\\NAS\\...)." }, 400);
      saveSettings({ exportDir: PROJECT && path.resolve(dir) === path.resolve(PROJECT, "renders") ? "" : dir });
      const file = path.join(dir, name);
      return json(res, { ok: true, dir, name, path: file, exists: fs.existsSync(file) });
    }
    // Xuất video giao cho AI (editor/tools/xuat-video.mjs) — tải lại trang / tắt trình duyệt vẫn không mất;
    // có chọn kênh mạng xã hội (gói Pro+) thì AI xuất xong đăng luôn
    if (p === "/api/render-ai" && req.method === "POST") {
      const b = await readBody(req);
      if (b.project) saveProject(b.project,req,res);
      const cur = readJson(RENDER_FILE());
      if (cur?.running && !renderDead(cur)) return json(res, { ok: false, error: "Đang xuất video — đợi xong rồi xuất tiếp." }, 409);
      const quality = b.quality === "draft" ? "draft" : "final";
      let chans = (b.channels || []).length && (await socialAllowed()) ? socialList().filter((x) => b.channels.includes(x.id)) : [];
      requestProject(req);
      const target = b.target?.dir && path.isAbsolute(normWinDir(String(b.target.dir)))
        ? { dir: normWinDir(String(b.target.dir)), name: exportFileName(b.target.name, path.basename(PROJECT)), overwrite: !!b.target.overwrite }
        : null;
      if (target) saveSettings({ exportDir: path.resolve(target.dir) === path.resolve(PROJECT, "renders") ? "" : target.dir });
      // Hẹn giờ gắn đúng việc xuất/revision; tới giờ không lấy bản xuất mới nhất khác.
      const at = b.scheduleAt ? Date.parse(b.scheduleAt) : NaN;
      let scheduled = null;
      const dir = path.join(WORKSPACE, "_xuat-video", new Date().toISOString().replace(/\D/g, "").slice(0, 14) + "-" + slug(path.basename(PROJECT))+'-'+crypto.randomBytes(4).toString('hex'));
      if (chans.length && at && at > Date.now() + 60e3) {
        scheduled = await lichAdd({ at, channels: chans, project: relDir(PROJECT), title: readJson(PJ)?.title || path.basename(PROJECT), note: b.note,renderJobDir:relDir(dir),revision:projectRevision(PJ) });
        chans = [];
      }
      fs.mkdirSync(path.join(dir, "work"), { recursive: true });
      const jb = { kind: "render", status: "waiting", dir: relDir(dir), project: relDir(PROJECT), quality, title: readJson(PJ)?.title || path.basename(PROJECT),
        exportRevision:projectRevision(PJ), ...(target ? { target } : {}),
        templateName: `Xuất video${chans.length ? " + đăng " + chans.map((x) => x.name || x.platform).join(", ") : scheduled ? " (lịch đăng " + new Date(scheduled.at).toLocaleString("vi-VN") + ")" : ""}`, channels: chans,
        scheduled: scheduled ? { id: scheduled.id, at: scheduled.at, channels: scheduled.channels.map((x) => x.name || x.platform) } : undefined,
        note: String(b.note || "").slice(0, 1500), account: jobAccount(), background: process.env.VEK_AI_BACKGROUND === "1", createdAt: new Date().toISOString() };
      jb.publishDraft=publishDraftSnapshot(jb.project,chans);
      fs.writeFileSync(aiJobFile(dir), JSON.stringify(jb, null, 2) + "\n");
      fs.mkdirSync(path.join(PROJECT, "work"), { recursive: true });
      fs.writeFileSync(RENDER_FILE(), JSON.stringify({ running: true, waitingAi: true, byAi: true, quality, progress: 0, startedAt: Date.now(), jobDir: jb.dir,
        ...(target ? { target } : {}),
        channels: chans.map((x) => x.name || x.platform) }, null, 2));
      return json(res, { ok: true, job: jb, scheduled, listener: aiListener(), runner: jb.background ? startAgentRunner(dir) : null });
    }
    // Gói chỉnh trong CapCut: phần mềm tự làm, không cần AI (editor/tools/goi-capcut.mjs) — tiến độ ở render.json như xuất video
    if (p === "/api/capcut" && req.method === "POST") {
      const b = await readBody(req);
      if (b.project) saveProject(b.project,req,res);
      else requestProject(req);
      const cur = readJson(RENDER_FILE());
      if ((job?.running) || (cur?.running && !renderDead(cur))) return json(res, { ok: false, error: "Đang xuất video — đợi xong rồi xuất tiếp." }, 409);
      fs.mkdirSync(path.join(PROJECT, "work"), { recursive: true });
      fs.writeFileSync(RENDER_FILE(), JSON.stringify({ running: true, capcut: true, quality: "final", progress: 0, startedAt: Date.now() }, null, 2));
      spawn(process.execPath, [path.join(KIT, "tools", "goi-capcut.mjs"), PROJECT, "--chu", b.chu === "sua" ? "sua" : "dep"], { cwd: ROOT, detached: true, windowsHide: true, stdio: "ignore" }).unref();
      return json(res, { ok: true });
    }
    if (p === "/api/render-ai" && req.method === "DELETE") {
      requestProject(req);
      if(job?.projectDir===PROJECT&&job.finalizing)return json(res,{error:"Đang hoàn tất và kiểm bản xuất; chờ bước này kết thúc trước khi thao tác tiếp."},409);
      if(job?.running&&job.projectDir===PROJECT&&job.preparing){job.cancelled=true;return json(res,{ok:true,cancelling:true});}
      // Huỷ xuất video: việc phần mềm tự dựng → dừng ngay; AI đang xuất → báo script tự dừng; đang chờ AI → xoá việc
      if (job?.running && job.projectDir===PROJECT && (renderChild||job.preparing)) {
        job.cancelled = true; job.running = false; job.ok = false; job.log = "Đã huỷ xuất video.";
        if(renderChild)killTree(renderChild.pid);
      }
      const cur = readJson(RENDER_FILE());
      if (cur?.running && !cur.waitingAi && !renderDead(cur)) {
        fs.writeFileSync(RENDER_FILE(), JSON.stringify({ ...cur, cancel: true }, null, 2));
        return json(res, { ok: true, cancelling: true });
      }
      if (cur?.waitingAi && cur.jobDir) { const d = safeJoin(ROOT, cur.jobDir); if (d && d.includes("_xuat-video")) { stopAgentRunner(d); fs.rmSync(d, RM_NAS); } }
      if (cur && (cur.waitingAi || renderDead(cur))) fs.rmSync(RENDER_FILE(), { force: true });
      return json(res, { ok: true });
    }
    if (p === "/api/render" && req.method === "GET") {
      // việc AI xuất (file trạng thái) hoặc việc phần mềm tự dựng (trong bộ nhớ) — lấy cái mới hơn
      let f = PROJECT ? readJson(RENDER_FILE()) : null;
      if (f?.waitingAi && f.jobDir) {
        const aj = readJson(aiJobFile(safeJoin(ROOT, f.jobDir) || ""));
        if (!aj || aj.status === "error") f = { ...f, running: false, waitingAi: false, ok: false, log: aj?.error || "AI không nhận việc xuất video." };
        else { f.aiStatus = aj.status; f.listener = !!aiListener(); }
      } else if (f?.running && renderDead(f)) f = { ...f, running: false, ok: false, log: (f.log || "") + "\nTiến trình xuất bị dừng giữa chừng." };
      const localJob=job?.projectDir===PROJECT?job:null;
      const pick = f && (!localJob || (f.startedAt || 0) >= (localJob.startedAt || 0)) ? f : localJob;
      return json(res, pick || { running: false });
    }
    // thư mục lưu video xuất: xem / chọn lại / về mặc định
    if (p === "/api/export-dir" && req.method === "GET") return json(res, { dir: exportDir(), def: PROJECT ? path.join(PROJECT, "renders") : "" });
    if (p === "/api/export-dir" && req.method === "POST") {
      const b = await readBody(req);
      if (b?.reset) { saveSettings({ exportDir: "" }); return json(res, { ok: true, dir: "" }); }
      const dir = await pickFolder(exportDir() || (PROJECT ? path.join(PROJECT, "renders") : os.homedir()));
      if (dir) saveSettings({ exportDir: dir });
      return json(res, { ok: !!dir, dir: exportDir() });
    }
    // mở thư mục chứa video đã xuất
    if (p === "/api/reveal" && req.method === "POST") {
      const b = await readBody(req), file = String(b?.path || "");
      if (!file || !fs.existsSync(file) || !/\.(mp4|mov|webm)$/i.test(file)) return json(res, { ok: false, error: "Không thấy file." }, 404);
      revealFile(file);
      return json(res, { ok: true });
    }
    if (p === "/api/asr" && req.method === "GET") return json(res, asrState());
    if(p==='/api/asr/narration'&&req.method==='POST'){
      const body=await readBody(req);requestProject(req);const target=PROJECT,workspaceId=workspaceStore.active().id,brief=news.projectBrief(workspaceId,relDir(target));
      if(!whisperStatus(ROOT).ready)return json(res,{error:'Chưa có công cụ nhận giọng local. Kiểm tra cài đặt Whisper.'},400);
      const validate=()=>{requestProject(req);if(PROJECT!==target||workspaceStore.active().id!==workspaceId||(news.projectBrief(workspaceId,relDir(target))?.id||null)!==(brief?.id||null))throw new Error('Dự án hoặc bản tin đã đổi. Nhận giọng lại trong đúng ngữ cảnh.');};
      if(body.stream===true){
        const controller=new AbortController(),disconnect=()=>controller.abort();res.on('close',disconnect);
        res.writeHead(200,{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store'});
        const emit=value=>{if(!res.destroyed&&!res.writableEnded)res.write(JSON.stringify(value)+'\n');};
        try{const result=await recognizeNarration(ROOT,target,body.clipId,{brief,validate,language:body.language||'vi',signal:controller.signal,onProgress:progress=>emit({type:'progress',...progress})});emit({type:'result',result});}
        catch(error){emit({type:'error',error:error.message});}
        finally{res.removeListener('close',disconnect);res.end();}return;
      }
      return json(res,{ok:true,result:await recognizeNarration(ROOT,target,body.clipId,{brief,validate,language:body.language||'vi'})});
    }
    if (p === "/api/asr/install" && req.method === "POST") return json(res, { ok: true, job: startInstall() });
    if (p === "/api/asr" && req.method === "POST") {
      requestProject(req);const body=await readBody(req);requestProject(req);
      const language=body.language??'vi';if(!['vi','en','auto'].includes(language))return json(res,{error:'Ngôn ngữ nhận giọng không hợp lệ.'},400);
      if (!PROJECT) return json(res, { ok: false, error: "Chưa mở dự án." }, 400);
      if (!whisperStatus(ROOT).ready) return json(res, { ok: false, error: "Chưa cài công cụ nhận giọng.", needInstall: true }, 400);
      return json(res, { ok: true, job: startTranscribe(PROJECT,language) });
    }
    send(res, 404, "Not found");
  } catch (e) {
    console.error(e);
    json(res, { ok: false, error: String(e.message || e), code:e.code }, e.status||500);
  }
});

if (argDir && !args.includes("--home")) {
  try { setProject(argDir); } catch (e) { console.error(e.message); process.exit(1); }
}
// Người dùng bấm mở phần mềm: vào bản web bằng Chrome, mất mạng thì mở thẳng địa chỉ trên máy
const moTrinhDuyet = async () => { const local = `http://127.0.0.1:${PORT}/`; moLink(PORT === 5173 ? await linkMo(local) : local); };
// Bản cũ ở thư mục khác đang giữ cổng (thường do "Luôn chạy nền"): bản mới phải thay chỗ, không thì mở ra vẫn là bản cũ
let thayBan = null, thuCong = 0;
async function banCuDangChay() {
  try {
    const j = await (await fetch(`http://127.0.0.1:${PORT}/api/ping`, { signal: AbortSignal.timeout(1500) })).json();
    return j?.app === "autosocial" && newer(localVersion().version, j.version) ? j.version : null;
  } catch { return null; }
}
function pidGiuCong() {
  try {
    if (process.platform === "win32") {
      // chữ trạng thái đổi theo máy: nhận cổng đang nghe bằng địa chỉ đối 0.0.0.0:0
      const dong = execSync("netstat -ano -p tcp", { encoding: "utf8", windowsHide: true }).split(/\r?\n/).find((l) => new RegExp(`:${PORT}\\s+0\\.0\\.0\\.0:0\\s`).test(l));
      return Number(dong?.trim().split(/\s+/).pop()) || null;
    }
    return Number(execSync(`lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t`, { encoding: "utf8" }).trim().split(/\s+/)[0]) || null;
  } catch { return null; }
}
// Cổng có người giữ mà không trả lời (bản treo, bị cửa sổ AI / hộp cát bỏ lại): hỏi 3 lần, đúng là tiến trình node mới được tắt
async function congTreo() {
  for (let i = 0; i < 3; i++) {
    try { await fetch(`http://127.0.0.1:${PORT}/api/ping`, { signal: AbortSignal.timeout(4000) }); return []; }
    catch (e) { if (e?.name !== "TimeoutError") return []; }
  }
  const pid = pidGiuCong();
  if (pid && pid !== process.pid) {
    try {
      const ten = execSync(process.platform === "win32" ? `tasklist /FI "PID eq ${pid}" /FO CSV /NH` : `ps -p ${pid} -o comm=`, { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
      return /node/i.test(ten) ? [pid] : [];
    } catch { return []; }
  }
  // cổng của tiến trình trong hộp cát có thể không hiện trong netstat: tìm theo lệnh chạy phần mềm, chỉ đúng cổng này
  try {
    const out = execSync(process.platform === "win32"
      ? `powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name='node.exe'\\" | ForEach-Object { [string]$_.ProcessId + ' ' + $_.CommandLine }"`
      : "ps -axo pid=,command=", { encoding: "utf8", windowsHide: true, timeout: 10000, stdio: ["ignore", "pipe", "ignore"] });
    return out.split(/\r?\n/).filter((l) => /server\.mjs/.test(l) && (/--port[ =](\d+)/.exec(l)?.[1] || "5173") === String(PORT)).map((l) => parseInt(l, 10)).filter((n) => n && n !== process.pid);
  } catch { return []; }
}
const coChayNen = () => process.platform === "darwin" ? fs.existsSync(path.join(os.homedir(), "Library", "LaunchAgents", "vn.videoeditkit.editor.plist"))
  : fs.existsSync(path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "Video Edit Kit.vbs"));
// Editor đã chạy sẵn (bấm Mo-Editor lần 2) → chỉ mở trình duyệt rồi thoát.
server.on("error", async (e) => {
  if (e.code !== "EADDRINUSE") throw e;
  if (thuCong < 20) {
    const cu = thayBan || (await banCuDangChay());
    if (cu) {
      thayBan = cu; thuCong++;
      const pid = pidGiuCong();
      if (pid && pid !== process.pid) { try { process.kill(pid, "SIGKILL"); console.log(`Đã tắt bản cũ v${cu} để mở bản v${localVersion().version}`); } catch {} }
      setTimeout(() => server.listen(PORT, "127.0.0.1"), 400);
      return;
    }
    const treo = await congTreo();
    if (treo.length) {
      thuCong++;
      try { treo.forEach((pid) => process.kill(pid, "SIGKILL")); console.log("Đã tắt bản phần mềm bị treo để mở lại"); }
      catch { console.log(`Không tắt được bản đang treo (PID ${treo.join(", ")}). Khởi động lại máy rồi mở lại phần mềm.`); process.exit(1); }
      setTimeout(() => server.listen(PORT, "127.0.0.1"), 600);
      return;
    }
  }
  const link = `http://127.0.0.1:${PORT}/`;
  console.log(`Editor đang chạy sẵn: ${link}`);
  if (args.includes("--open")) await moTrinhDuyet();
  process.exit(0);
});
server.on("listening", () => {
  // tự chạy khi bật máy đang trỏ tới thư mục cũ: trỏ sang bản này
  if (thayBan && coChayNen()) { try { spawn(process.execPath, [path.join(KIT, "tools", "chay-nen.mjs"), "--bat"], { detached: true, stdio: "ignore", windowsHide: true }).unref(); } catch {} }
  const link = `http://127.0.0.1:${PORT}/`;
  console.log(`Editor: ${link}\nProject: ${PROJECT || "(chọn ở màn hình dự án)"}`);
  if (args.includes("--open")) moTrinhDuyet();
});
server.listen(PORT, "127.0.0.1");
