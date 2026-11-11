import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {TEXT_STYLES,TEXT_ANIMS,cleanTextAnim,textAnimTiming,textStyleOf,FX_IN_END,spreadTextEdit,copyTextStyle} from '../editor/lib/text-effects.js';
import {buildHtml} from '../editor/lib/build.mjs';

test('catalog has enough CapCut-like presets',()=>{
 assert.ok(TEXT_STYLES.filter(s=>s.id!=='none').length>=6);
 assert.ok(TEXT_ANIMS.in.length>=6&&TEXT_ANIMS.out.length>=5&&TEXT_ANIMS.loop.length>=5);
});

test('cleanTextAnim drops unknown types and clamps duration/speed',()=>{
 assert.equal(cleanTextAnim(null),null);assert.equal(cleanTextAnim({in:{type:'nope'}}),null);
 assert.deepEqual(cleanTextAnim({in:{type:'fade',dur:9},out:{type:'drop',dur:0},loop:{type:'pulse',speed:'x'}}),{in:{type:'fade',dur:2},out:{type:'drop',dur:.2},loop:{type:'pulse',speed:1}});
 assert.equal(textStyleOf({style:'neon'}),'neon');assert.equal(textStyleOf({style:'none'}),'');assert.equal(textStyleOf({style:'<x>'}),'');
});

test('timing: out ends at clip end, loop sits between in-end and out-start, overlong in+out shrink',()=>{
 const t=textAnimTiming(3,{in:{type:'zoom-in',dur:.5},out:{type:'fade',dur:.4},loop:{type:'float',speed:1}});
 assert.deepEqual(t.in,{type:'zoom-in',start:0,dur:.5});assert.equal(t.out.start+t.out.dur,3);
 assert.deepEqual([t.loop.start,t.loop.end],[.5,2.6]);
 const s=textAnimTiming(1,{in:{type:'fade',dur:2},out:{type:'fade',dur:2}});
 assert.ok(s.in.dur+s.out.dur<=.9+1e-9);assert.equal(s.out.start+s.out.dur,1);
 const l=textAnimTiming(4,{loop:{type:'pulse'}});assert.equal(l.loop.start,FX_IN_END);assert.equal(l.loop.end,4-.26);
 assert.equal(textAnimTiming(4,{}),null);
});

function build(texts){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-txfx-'));
 try{const html=buildHtml({source:{video:'inputs/a.mp4'},segments:[{in:0,out:6}],audio:{sfx:'tat'},captions:{enabled:false},texts},dir);
  return {html,data:JSON.parse(html.match(/window\.__EDIT__ = (.*);<\/script>/)[1])};}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
}

test('build: style class + data-anim + runtime payload; absent case unchanged',()=>{
 const {html,data}=build([
  {id:'plain',at:0,dur:2,title:'XIN CHÀO',fx:'slide'},
  {id:'fancy',at:2.5,dur:3,title:'ĐÁNH MÁY',fx:'words',style:'neon',anim:{in:{type:'type',dur:1},out:{type:'drop',dur:.5},loop:{type:'pulse',speed:2}}}]);
 const plain=html.match(/<div id="plain"[^>]*>(<div class="tx-box"[^>]*>)/)[1];
 assert.equal(plain,'<div class="tx-box" style="top:1180px;translate:0px -50%;scale:1">');
 assert.match(html,/<div class="tx-box tx-st-neon" data-anim="type drop pulse"/);
 assert.match(html,/id="fancy"[\s\S]*?class="ch gold"/,'Đánh máy splits title into chars');
 assert.deepEqual(data.texts[0],{id:'plain',start:0,dur:2,fx:'slide'});
 assert.deepEqual(data.texts[1].anim,{in:{type:'type',start:0,dur:1},out:{type:'drop',start:2.5,dur:.5},loop:{type:'pulse',start:1,end:2.5,speed:2}});
});

test('runtime: anim replaces fx entrance, out ends at clip end, loop is an even yoyo inside the window',()=>{
 const runtime=fs.readFileSync('editor/lib/runtime.js','utf8'),a=runtime.indexOf('  // Hoạt ảnh Vào / Ra / Lặp'),b=runtime.indexOf('  // ---------- Kích thước khung');
 const calls=[],el=(name)=>({name}),boxes={};
 const E={texts:[{id:'f',start:10,dur:3,fx:'words',anim:{in:{type:'zoom-in',start:0,dur:.5},out:{type:'fade',start:2.6,dur:.4},loop:{type:'pulse',start:.5,end:2.6,speed:1}}},{id:'p',start:0,dur:2,fx:'slide'}]};
 const $=(sel,root)=>sel==='.tx-shade'||sel==='.tx-title'?el(root.id+sel):sel==='.tx-box'?(boxes[root.id]=el(root.id+'box')):null;
 const rec=(kind)=>(target,x,y,z)=>calls.push({kind,target,x,y,z});
 vm.runInNewContext(runtime.slice(a,b),{E,$,$$:()=>[],document:{getElementById:id=>({id})},tl:{fromTo:rec('fromTo'),to:rec('to'),set:rec('set')}});
 const f=calls.filter(c=>[].concat(c.target).some(t=>t.name.startsWith('f')));
 assert.ok(!f.some(c=>[].concat(c.target).some(t=>t.name==='f.tx-shade')),'fx entrance skipped');
 const inn=f.find(c=>c.kind==='fromTo'&&c.target.name==='fbox');assert.equal(inn.z,10);assert.equal(inn.x.scale,.4);
 const out=f.find(c=>c.kind==='to'&&c.target.name==='fbox');assert.equal(out.y+out.x.duration,13);assert.equal(out.x.opacity,0);
 const loop=f.find(c=>c.kind==='fromTo'&&Array.isArray(c.target));assert.equal(loop.z,10.5);assert.equal((loop.y.repeat+1)%2,0);assert.ok(10.5+(loop.y.repeat+1)*loop.y.duration<=12.6+1e-9);
 const p=calls.filter(c=>[].concat(c.target).some(t=>t.name.startsWith('p')));
 assert.ok(p.some(c=>c.target.name==='p.tx-shade'),'legacy fx path still used');
 assert.ok(p.some(c=>c.kind==='to'&&c.target.name==='pbox'&&c.x.duration===.24),'legacy fade-out kept');
});

test('spreadTextEdit copies only changed style keys to selected texts, never content/time',()=>{
 const before={id:'a',title:'A',at:1,dur:2,style:'neon',x:0};
 const after={id:'a',title:'A2',at:5,dur:3,style:'box',anim:{in:{type:'fade',dur:.5}},x:0};
 const b={id:'b',title:'B',at:9,dur:1,style:'shadow',x:40,fontTitle:'Inter'},c={id:'c',title:'C',style:'neon'};
 assert.deepEqual(spreadTextEdit(before,after,[b,c]).sort(),['anim','style']);
 assert.deepEqual(b,{id:'b',title:'B',at:9,dur:1,style:'box',x:40,fontTitle:'Inter',anim:{in:{type:'fade',dur:.5}}});
 assert.equal(c.title,'C');assert.equal(c.style,'box');
 b.anim.in.type='zoom-in';assert.equal(after.anim.in.type,'fade','deep copy, no shared refs');
 spreadTextEdit({style:'box'},{},[c]);assert.equal('style' in c,false,'removed key is removed on targets');
});

test('copyTextStyle makes every target match the source style but keeps its own text/time',()=>{
 const src={id:'a',title:'A',at:1,style:'neon',fontTitle:'Inter'},t={id:'t',title:'T',at:4,dur:2,style:'box',x:30,hidden:true};
 copyTextStyle(src,[t]);
 assert.deepEqual(t,{id:'t',title:'T',at:4,dur:2,style:'neon',fontTitle:'Inter',hidden:true});
});
