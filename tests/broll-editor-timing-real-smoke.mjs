import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {brollEditorTiming} from '../editor/ui/contentos-broll-editor-timing.js';import {brollTimingReport} from '../src/services/broll-timing-report.mjs';
assert.ok(process.argv.includes('--run-local'),'Use --run-local to read saved Q2 QA project.');
const file='workspace/content/2026-11-05/contentos-qa-real-codex-q2-5/project.json',bytes=fs.readFileSync(file),p=JSON.parse(bytes),before=JSON.stringify(p),report=brollTimingReport(p),checks=[];
for(const b of report.items){const actual=brollEditorTiming(p,p.brolls.find(v=>v.id===b.id));assert.equal(actual.start,b.outputStart);assert.equal(actual.end,b.outputEnd);assert.deepEqual(actual.entrance,b.entrance);assert.deepEqual(actual.words.map(w=>w.text),b.speechOverlap.words.map(w=>w.text));checks.push({id:b.id,...actual});}
assert.equal(JSON.stringify(p),before);assert.deepEqual(fs.readFileSync(file),bytes);
const staticFiles=[];for(const name of ['ui/app.js','ui/contentos-broll-timing.js','ui/contentos-broll-editor-timing.js']){const r=await fetch('http://127.0.0.1:5180/'+name);assert.equal(r.status,200);assert.equal(await r.text(),fs.readFileSync('editor/'+name,'utf8'));staticFiles.push(name);}
const evidence={project:file,projectSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),checks,projectUnchanged:true,httpExactBytes:staticFiles,nativeBrowserVerified:false,scope:'Read-only saved Q2 timings against renderer report plus HTTP static. No visual/semantic/audio or pointer/focus/UndoSave acceptance.'};
fs.writeFileSync('docs/BROLL_EDITOR_TIMING_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({items:checks.length,httpExactBytes:staticFiles,projectUnchanged:true}));
