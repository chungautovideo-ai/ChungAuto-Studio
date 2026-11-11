import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';import {makeTimemap,mergeContiguous} from '../editor/lib/timemap.js';import {buildHtml} from '../editor/lib/build.mjs';import {applyEditorFields} from '../src/services/api-editor.mjs';
test('AIEV scene audio fades remain independently editable through timemap, tags and API',()=>{
 const meta={fps:30,width:1080,height:1920,scenes:[{srcVideo:'source.mp4',from:0,to:1,fadeInSec:.3,fadeOutSec:.2},{srcVideo:'source.mp4',from:1,to:2,fadeInSec:0,fadeOutSec:0}]},p=convertAievProject(meta);p.source.hasAudio=true;
 assert.deepEqual(p.segments.map(s=>[s.audioFadeIn,s.audioFadeOut]),[[.3,.2],[0,0]]);const tm=makeTimemap(p);assert.equal(mergeContiguous(tm.segs,p).length,2);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-segfade-'));try{
 const html=buildHtml(p,dir);assert.match(html,/<audio id="a0"[^>]*data-fade-in="0.3" data-fade-out="0.2"/);assert.match(html,/<audio id="a1"[^>]*data-fade-in="0" data-fade-out="0"/);
 const segments=structuredClone(p.segments);segments[0].audioFadeIn=.4;assert.equal(applyEditorFields(p,{segments}).segments[0].audioFadeIn,.4);
 for(const value of [-1,11,'1']){segments[0].audioFadeIn=value;assert.throws(()=>applyEditorFields(p,{segments}));}
 segments[0].audioFadeIn=.9;assert.throws(()=>applyEditorFields(p,{segments}),/Fade/);assert.throws(()=>buildHtml({...p,segments},dir),/Fade/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 for(const bad of [-1,11,'1',.9])assert.throws(()=>convertAievProject({...meta,scenes:[{...meta.scenes[0],fadeInSec:bad}]}),/Fade/);
});
