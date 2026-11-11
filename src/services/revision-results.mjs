import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {commitProject,assertProjectRevision} from './project-revisions.mjs';
import {groupCaptionLines} from '../../editor/lib/brand.js';
import {sourceTranscriptMatches} from '../../editor/lib/source-transcript.js';

// AI edits a candidate file, never the live project. The server applies it only
// against the captured base revision; conflicting candidates remain available.
export function prepareRevisionResult(projectDir,jobDir){
  const file=path.join(projectDir,'project.json');
  const bytes=fs.readFileSync(file),snapshot=JSON.parse(bytes);
  fs.mkdirSync(path.join(jobDir,'work'),{recursive:true});
  fs.writeFileSync(path.join(jobDir,'work','base-project.json'),bytes,{flag:'wx'});
  fs.writeFileSync(path.join(jobDir,'work','candidate-project.json'),bytes,{flag:'wx'});
  return {baseRevision:assertProjectRevision(file,crypto.createHash('sha256').update(bytes).digest('hex')),snapshot};
}

export function applyRevisionResult(projectDir,jobDir,baseRevision,{build}={}){
  const file=path.join(projectDir,'project.json');
  assertProjectRevision(file,baseRevision);
  const candidate=JSON.parse(fs.readFileSync(path.join(jobDir,'work','candidate-project.json'),'utf8'));
  if(!candidate||Array.isArray(candidate)||typeof candidate!=='object'||!candidate.source||typeof candidate.source!=='object')throw new Error('Bản dựng AI thiếu cấu trúc project/source.');
  fillCaptionLines(projectDir,candidate);
  // Caller may generate the composition in the job directory before commit.
  // This checks build structure, not asset readability or final render quality.
  if(build)build(candidate);
  return commitProject(file,candidate,baseRevision);
}

// Mẫu bật phụ đề nhưng AI không tạo dòng → tạo từ lời nói như khi áp mẫu trong editor; không thì bật mà trống.
function fillCaptionLines(projectDir,candidate){
  const c=candidate.captions;
  if(!c?.enabled||c.lines?.length)return;
  let transcript;
  try{transcript=JSON.parse(fs.readFileSync(path.join(projectDir,'work','transcript.json'),'utf8'));}catch{return;}
  if(!sourceTranscriptMatches(candidate,transcript))return;
  const words=(transcript.words||[]).map(w=>({w:String(w.word??w.text??'').trim().normalize('NFC'),s:Number(w.start),e:Number(w.end)})).filter(w=>w.w&&w.e>=w.s);
  if(words.length)c.lines=groupCaptionLines(words,Number(c.maxWords)||4);
}
