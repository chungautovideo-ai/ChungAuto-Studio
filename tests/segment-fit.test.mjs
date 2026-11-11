import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {makeTimemap,mergeContiguous} from '../editor/lib/timemap.js';import {buildHtml} from '../editor/lib/build.mjs';import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';import {applyEditorFields} from '../src/services/api-editor.mjs';
test('per-segment fit survives AIEV conversion and prevents merging distinct framing',()=>{
 const p=convertAievProject({width:1080,height:1920,fps:30,scenes:[{srcVideo:'source.mp4',from:0,to:1,fit:'contain'},{srcVideo:'source.mp4',from:1,to:2,fit:'cover'}]});assert.deepEqual(p.segments.map(s=>s.fit),['contain','cover']);assert.equal(mergeContiguous(makeTimemap(p).segs,p).length,2);
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-fit-'));try{
 const html=buildHtml(p,root);assert.match(html,/<video id="v0" class="talk" style="object-fit:contain;object-position:50% 50%;background:#101113;"/);assert.match(html,/<video id="v1" class="talk" style="object-fit:cover/);
 const segments=structuredClone(p.segments);segments[1].fit='contain';assert.equal(mergeContiguous(makeTimemap({...p,segments}).segs,{...p,segments}).length,1);assert.equal(applyEditorFields(p,{segments}).segments[1].fit,'contain');
 segments[0].fit='fill';assert.throws(()=>applyEditorFields(p,{segments}));assert.throws(()=>buildHtml({...p,segments},root));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
 assert.throws(()=>convertAievProject({width:1080,height:1920,scenes:[{srcVideo:'a.mp4',from:0,to:1,fit:'fill'}]}));
});
