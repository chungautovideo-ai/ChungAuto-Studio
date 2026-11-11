#!/usr/bin/env node
// Nhận giọng nói tiếng Việt cho 1 dự án — dùng chung công cụ whisper của phần mềm (Windows / macOS / Linux).
//
//   node editor/tools/transcribe.mjs <projectDir> [--lang vi]      → <projectDir>/work/transcript.json
//   node editor/tools/transcribe.mjs --status                      → kiểm tra đã có công cụ chưa
//   node editor/tools/transcribe.mjs --install                     → tải công cụ (Windows) + model (~550MB). Hỏi người dùng trước!
//
// macOS: cài công cụ bằng  brew install whisper-cpp  rồi chạy --install để tải model.

import fs from "node:fs";
import {sourceTranscriptMatches} from "../lib/source-transcript.js";
import {transcribeProject} from '../../src/services/project-transcription.mjs';
import path from "node:path";
import { fileURLToPath } from "node:url";
import { whisperStatus, installWhisper, transcribe } from "../lib/whisper.mjs";
import { prepareTools } from "../lib/system.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
prepareTools(ROOT);
const args = process.argv.slice(2);
const requestedLanguage=args.includes('--lang')?args[args.indexOf('--lang')+1]:undefined;
if(args.includes('--lang')&&!['vi','en','auto'].includes(requestedLanguage)){console.error('Ngôn ngữ nhận giọng phải là vi, en hoặc auto.');process.exit(2);}
const log = (() => { let last = -10; return (p) => { if (p.pct - last >= 10 || p.pct === 100) { last = p.pct; console.log(`${String(p.pct).padStart(3)}%  ${p.phase}`); } }; })();

if (args.includes("--status")) {
  console.log(JSON.stringify(whisperStatus(ROOT), null, 2));
} else if (args.includes("--install")) {
  try { await installWhisper(ROOT, log); console.log("✓ Đã cài công cụ nhận giọng"); }
  catch (e) { console.error("✗", e.message); process.exit(1); }
} else {
  const dir = path.resolve(args.find((a) => !a.startsWith("--")) || ".");
  const pj = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
  if(args.includes('--check-transcript')){
    let data;try{const file=path.join(dir,'work/transcript.json');if(fs.statSync(file).size>8*1024**2)throw new Error('Transcript quá lớn.');data=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){console.log(JSON.stringify({ready:false,reason:'Transcript thiếu hoặc không đọc được.'}));process.exit(3);}
    const languageMatches=!requestedLanguage||requestedLanguage==='auto'||data.language===requestedLanguage;
    const ready=Array.isArray(data.words)&&sourceTranscriptMatches(pj,data)&&languageMatches;console.log(JSON.stringify({ready,words:ready?data.words.length:0,timeline:pj.source?.timeline||'single',language:data.language||null,reason:ready?'Transcript khớp mốc nguồn và ngôn ngữ yêu cầu.':!languageMatches?'Transcript khác hoặc thiếu ngôn ngữ yêu cầu; cần nhận giọng lại.':'Nguồn hoặc điểm đọc đã đổi; cần nhận giọng lại.'}));process.exit(ready?0:3);
  }
  const st = whisperStatus(ROOT);
  if (!st.ready) {
    console.error(`✗ Chưa có công cụ nhận giọng (${!st.bin ? "thiếu whisper-cli" : "thiếu model"}).`);
    console.error(process.platform === "win32" ? "  Chạy: node editor/tools/transcribe.mjs --install  (tải ~" + st.downloadMB + "MB — hỏi người dùng trước)"
      : "  macOS: brew install whisper-cpp  rồi  node editor/tools/transcribe.mjs --install  (tải model ~550MB)");
    process.exit(2);
  }
  const lang = requestedLanguage || "vi";
  const controller=new AbortController(),cancel=()=>controller.abort(new Error('Đã dừng nhận giọng.'));
  process.on('SIGINT',cancel);process.on('SIGTERM',cancel);
  let data;try{data=await transcribeProject(ROOT,dir,{language:lang,onProgress:p=>{if(p.waitingResource)console.log(p.phase);else log(p);},signal:controller.signal});}finally{process.removeListener('SIGINT',cancel);process.removeListener('SIGTERM',cancel);}
  console.log(`✓ ${data.words.length} từ → ${path.join(dir, "work", "transcript.json")}`);
}
