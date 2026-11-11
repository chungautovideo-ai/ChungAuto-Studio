import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {brollEditorPhraseSearch} from '../editor/ui/contentos-broll-editor-timing.js';
assert.ok(process.argv.includes('--run-local'),'Pass --run-local for read-only QA and static checks.');
const project='workspace/content/2026-11-05/qa-codex-screen-85251d/project.json',bytes=fs.readFileSync(project),p=JSON.parse(bytes),report=brollEditorPhraseSearch(p,'màn');
assert.equal(report.matches.length,1);assert.equal(report.matches[0].outputStart,15.46);assert.equal(report.matches[0].outputEnd,16.21);assert.equal(report.matches[0].words[0].projectStart,16.06);
const staticFiles=[];for(const name of ['ui/contentos-broll-timing.js','ui/contentos-broll-editor-timing.js','ui/contentos-caption-phrase-search.js','lib/timemap.js','lib/broll-transition.js']){
 const response=await fetch('http://127.0.0.1:5180/'+name,{signal:AbortSignal.timeout(10000)});assert.equal(response.status,200);assert.equal(await response.text(),fs.readFileSync('editor/'+name,'utf8'));staticFiles.push(name);
}
assert.deepEqual(fs.readFileSync(project),bytes);
const evidence={project,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),projectUnchanged:true,phrase:'màn',matches:report.matches,httpExactBytes:staticFiles,nativeBrowserVerified:false,mobileVerified:false,scope:'Saved QA source/output anchor check and production static HTTP bytes only; does not establish browser controls, focus or responsive layout.'};
fs.writeFileSync('docs/BROLL_PHRASE_UI_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
