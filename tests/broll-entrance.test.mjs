import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {validateBrollEntrance,brollEntranceDuration} from '../editor/lib/broll-transition.js';
import {buildHtml} from '../editor/lib/build.mjs';import {applyEditorFields} from '../src/services/api-editor.mjs';
import {commitProject,projectRevision} from '../src/services/project-revisions.mjs';
import {brollEntranceControls} from '../editor/ui/contentos-broll-entrance.js';

test('optional entrance keeps legacy defaults and clamps only explicit override in output seconds',()=>{
 assert.equal(brollEntranceDuration({tIn:'fade',dur:.2}),undefined);
 for(const value of [null,'0.1',NaN,Infinity,-.1,2.01])assert.throws(()=>validateBrollEntrance({tInDuration:value}),{status:400});
 assert.equal(brollEntranceDuration({tIn:'fade',dur:.2,tInDuration:1}),.2);
 assert.equal(brollEntranceDuration({tIn:'none',dur:1,tInDuration:1}),0);
 assert.equal(brollEntranceDuration({tIn:'zoom',dur:1,tInDuration:0}),0);
});

test('API and atomic save reject invalid duration before changing project/history',()=>{
 const b={id:'b',src:'inputs/a.mp4',at:0,dur:1},base={brolls:[b]};
 assert.equal(applyEditorFields(base,{brolls:[{...b,tInDuration:.15}]}).brolls[0].tInDuration,.15);
 assert.throws(()=>applyEditorFields(base,{brolls:[{...b,tInDuration:-1}]}));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-broll-save-'));try{const file=path.join(dir,'project.json');fs.writeFileSync(file,JSON.stringify(base));const bytes=fs.readFileSync(file),revision=projectRevision(file);
 assert.throws(()=>commitProject(file,{brolls:[{...b,tInDuration:3}]},revision),{status:400});assert.deepEqual(fs.readFileSync(file),bytes);assert.deepEqual(fs.readdirSync(dir),['project.json']);
 const saved=commitProject(file,{brolls:[{...b,tInDuration:0}]},revision);assert.equal(saved.project.brolls[0].tInDuration,0);assert.equal(JSON.parse(fs.readFileSync(file)).brolls[0].tInDuration,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('built payload preserves legacy, zero, custom and truncated durations; actual runtime forwards GSAP duration',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-broll-build-'));try{
 const project={source:{video:'inputs/a.mp4'},segments:[{in:0,out:2}],audio:{sfx:'tat'},captions:{enabled:false},brolls:[
 {id:'legacy',src:'inputs/a.mp4',at:0,dur:.75,tIn:'fade'},
 {id:'custom',src:'inputs/a.mp4',at:.5,dur:.75,tIn:'slide',tInDuration:.1},
 {id:'cut',src:'inputs/a.mp4',at:1,dur:.5,tIn:'zoom',tInDuration:0},
 {id:'end',src:'inputs/a.mp4',at:1.7,dur:1,tIn:'wipe',tInDuration:1}]};
 const html=buildHtml(project,dir),data=JSON.parse(html.match(/window\.__EDIT__ = (.*);<\/script>/)[1]);
 assert.equal(Object.hasOwn(data.brolls[0],'tInDuration'),false);assert.equal(data.brolls[1].tInDuration,.1);assert.equal(data.brolls[2].tInDuration,0);assert.equal(data.brolls[3].tInDuration,.3);
 // Execute the actual entrance function and B-roll loop with a captured GSAP timeline.
 const runtime=fs.readFileSync('editor/lib/runtime.js','utf8'),start=runtime.indexOf('  function enter('),end=runtime.indexOf('\n  (E.sourceZooms',start),loopStart=runtime.indexOf('  (E.brolls || [])'),loopEnd=runtime.indexOf('  // Cảnh trám toàn',loopStart),calls=[];
 vm.runInNewContext(runtime.slice(start,end)+runtime.slice(loopStart,loopEnd)+'\nenter(document.getElementById("scene"),"slide",0);',{E:data,cam:[],document:{getElementById:id=>({id})},tl:{fromTo:(el,from,to,t)=>calls.push({id:el.id,from,to,t})}});
 assert.deepEqual(calls.map(c=>[c.id,c.to.duration]),[['legacy',.3],['custom',.1],['end',.3],['scene',.45]]);assert.equal(calls.find(c=>c.id==='custom').t,.5);assert.equal(project.brolls[3].tInDuration,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('inspector number, reset and type use one snapshot/change per accepted edit, reject invalid edits',()=>{
 const nodes=[];function h(tag,attrs={},...children){const n={tag,...attrs,children:children.flat(),append(...items){this.children.push(...items);},setCustomValidity(v){this.error=v;},reportValidity(){this.reported=true;}};nodes.push(n);return n;}
 const item={tIn:'fade'},saved=[],changes=[];brollEntranceControls({h,field:(label,node)=>h('label',{},label,node),item,snapshot:()=>saved.push(structuredClone(item)),changed:()=>changes.push(1)});
 const input=nodes.find(n=>n.type==='number'),reset=nodes.find(n=>n.tag==='button'),select=nodes.find(n=>n.tag==='select');
 input.value='.15';input.oninput();assert.equal(item.tInDuration,.15);assert.equal(saved.length,1);
 input.value='3';input.oninput();assert.equal(item.tInDuration,.15);assert.equal(saved.length,1);assert.ok(input.error);
 reset.onclick();assert.equal(Object.hasOwn(item,'tInDuration'),false);assert.equal(input.value,'');assert.equal(saved.length,2);
 input.value='0';input.oninput();assert.equal(item.tInDuration,0);
 select.value='none';select.oninput();assert.equal(input.disabled,true);assert.equal(item.tInDuration,0);assert.equal(changes.length,4);
});
