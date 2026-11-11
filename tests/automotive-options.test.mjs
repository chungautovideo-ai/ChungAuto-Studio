import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
import path from 'node:path';
import {normalizeAutomotiveOptions,applyAutomotiveOptions} from '../editor/lib/automotive-options.js';
import {pinAutomotiveJob,enforceAutomotiveJob} from '../src/services/automotive-job.mjs';
import {buildHtml} from '../editor/lib/build.mjs';
import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';
import {applyEditorFields} from '../src/services/api-editor.mjs';
const base=()=>({camera:{color:{contrast:.1},beauty:{smooth:.2,bodyWhite:25,personLight:10}},segments:[{id:'a',src:'source.mp4',in:0,out:4,color:{brightness:.1}}],brolls:[{id:'b',src:'b.mp4',at:1,dur:1,color:{tint:.1}}],watermark:{file:'logo.png',hidden:false},audio:{music:'kit:ambient-pad',sfxVolume:.2},texts:[],blocks:[]});
test('strict opt-in policy preserves source and restores pinned choices after agent/template overwrite',()=>{
 assert.equal(normalizeAutomotiveOptions(null),null);
 for(const bad of [[],{color:'auto'},{plate:true},{sfx:1}])assert.throws(()=>normalizeAutomotiveOptions(bad));
 const b=base(),copy=structuredClone(b),candidate=base();candidate.camera={color:{contrast:1},beauty:{smooth:1}};candidate.segments=[{id:'split',src:'source.mp4',in:1,out:2,color:{hue:90}}];candidate.brolls.push({id:'new',src:'new.mp4',color:{hue:90}});candidate.audio.music='wrong';candidate.watermark.file='wrong';
 const p=applyAutomotiveOptions(candidate,{}, {base:b,sfxLevel:'vua'});
 assert.deepEqual(p.camera,b.camera);assert.deepEqual(p.segments[0].color,b.segments[0].color);assert.equal(p.brolls[1].color,undefined);assert.equal(p.audio.music,b.audio.music);assert.deepEqual(p.watermark,b.watermark);assert.deepEqual(b,copy);
});
test('off wins over candidate grade/logo/CTA/music/manual SFX but preserves ordinary words',()=>{
 const b=base();b.texts=[{id:'normal',title:'CTA nhắc trong lời nói'},{role:'cta',id:'end'}];b.blocks=[{preset:'ca-cta'},{apiPreset:{presetId:'ca-cta'}},{preset:'ca-stat'}];b.audio.sfx=[{at:1,file:'ding.wav'}];
 const p=applyAutomotiveOptions(b,{color:'off',watermark:'off',cta:'off',music:'off',sfx:'tat'});
 assert.equal(p.camera.color,undefined);assert.equal(p.segments[0].color,undefined);assert.equal(p.brolls[0].color,undefined);assert.equal(p.watermark.hidden,true);assert.equal(p.audio.music,'');assert.equal(p.audio.sfxVolume,0);assert.equal(p.audio.sfxLevel,'tat');assert.equal(p.texts.length,1);assert.equal(p.blocks.length,1);
});
test('natural is explicit per-shot preset with no unsolicited beauty; B-roll schema/build accept valid grade',()=>{
 const b=base();delete b.camera.beauty;const p=applyAutomotiveOptions(b,{color:'natural'});assert.equal(p.camera.color,undefined);assert.equal(p.camera.beauty,undefined);assert.equal(p.segments[0].color.preset,'tu-nhien');assert.equal(p.brolls[0].color.preset,'tu-nhien');
 const fixture=convertAievProject({width:1080,height:1920,scenes:[{srcVideo:'source.mp4',from:0,to:2}]});fixture.brolls=[{id:'b',src:'b.mp4',at:0,dur:1,color:{preset:'den-trang',tint:.2}}];
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-auto-grade-'));try{const html=buildHtml(fixture,dir);assert.match(html,/filter:contrast\(1.150\) saturate\(0.000\) url\(#broll-color-b\)/);assert.match(html,/feColorMatrix/);assert.doesNotThrow(()=>applyEditorFields(fixture,{brolls:fixture.brolls}));assert.throws(()=>applyEditorFields(fixture,{brolls:[{...fixture.brolls[0],color:{tint:2}}]}));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('completion reads pinned snapshot and rejects modified policy or baseline',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-auto-pin-'));fs.mkdirSync(path.join(dir,'work'));try{const options=normalizeAutomotiveOptions({music:'off',sfx:'tat'}),job={automotiveOptions:options};job.automotiveSnapshot=pinAutomotiveJob(dir,base(),options,'vua');assert.equal(enforceAutomotiveJob(base(),job,dir).audio.music,'');assert.throws(()=>enforceAutomotiveJob(base(),{...job,automotiveOptions:{...options,music:'keep'}},dir));fs.appendFileSync(path.join(dir,'work/automotive-snapshot.json'),' ');assert.throws(()=>enforceAutomotiveJob(base(),job,dir));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('beauty off wins over agent whole-person edits while keep restores pinned body controls',()=>{
 const original=base(),candidate=base();candidate.camera.beauty={bodyWhite:90,personLight:80,bodySmooth:50};
 const kept=applyAutomotiveOptions(candidate,{beauty:'keep'},{base:original});assert.deepEqual(kept.camera.beauty,original.camera.beauty);
 const off=applyAutomotiveOptions(candidate,{beauty:'off'},{base:original});assert.equal(off.camera.beauty,undefined);assert.deepEqual(off.camera.color,original.camera.color);assert.deepEqual(candidate.camera.beauty,{bodyWhite:90,personLight:80,bodySmooth:50});
 assert.throws(()=>normalizeAutomotiveOptions({beauty:'auto'}));
});
test('legacy pinned automotive snapshot without beauty remains valid and preserves prior settings',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-auto-legacy-'));fs.mkdirSync(path.join(dir,'work'));
 try{const options={color:'keep',watermark:'keep',cta:'keep',music:'keep',sfx:'keep'},bytes=JSON.stringify({options,base:base(),sfxLevel:'vua'});fs.writeFileSync(path.join(dir,'work/automotive-snapshot.json'),bytes);
 const job={automotiveOptions:options,automotiveSnapshot:{sha256:crypto.createHash('sha256').update(bytes).digest('hex')}};
 assert.deepEqual(enforceAutomotiveJob(base(),job,dir).camera.beauty,base().camera.beauty);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
