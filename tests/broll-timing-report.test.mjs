import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {brollTimingReport} from '../src/services/broll-timing-report.mjs';import {brollEntranceTiming} from '../editor/lib/broll-transition.js';import {runApiEditor} from '../src/services/api-editor.mjs';
const project=()=>({source:{video:'inputs/raw.mp4'},segments:[{id:'s',in:1,out:5,speed:2}],brolls:[{id:'screen',src:'inputs/screen.mp4',at:2,dur:.4,tIn:'slide',mediaStart:7},{id:'custom',src:'inputs/a.mp4',at:3,dur:.75,tIn:'fade',tInDuration:.1},{id:'hidden',hidden:true,src:'inputs/hidden.mp4',at:2,dur:1,tIn:'fade'}],captions:{enabled:true,lines:[{id:'line',words:[{w:'màn',s:2,e:2.5},{w:'phim',s:2.5,e:3}]}]}});

test('timing report resolves cuts/rate/words and entrance, is bounded and cannot claim visual approval',()=>{
 const p=project(),before=structuredClone(p),report=brollTimingReport(p),b=report.items[0];assert.equal(b.projectAt,2);assert.equal(b.outputStart,.5);assert.equal(b.mediaStart,7);assert.equal(b.entrance.animationDuration,.45);assert.equal(b.entrance.settledDuration,0);assert.deepEqual(b.advisories,['ENTRANCE_COVERS_SHOT','SHORT_INSERT']);assert.deepEqual(b.speechOverlap.words.map(w=>w.text),['màn','phim']);assert.equal(report.items[1].entrance.settledDuration,.65);assert.deepEqual(report.items[1].advisories,[]);assert.equal(report.applied,false);assert.equal(report.visualReviewed,false);assert.equal(report.items.length,2);assert.deepEqual(p,before);
 const cut=brollTimingReport({...p,brolls:[{...p.brolls[0],tInDuration:0}]});assert.equal(cut.items[0].entrance.settledDuration,.4);assert.deepEqual(cut.items[0].advisories,['SHORT_INSERT']);
 const end=brollTimingReport({...p,brolls:[{...p.brolls[0],at:4.6,dur:1,tInDuration:1}]});assert.equal(end.items[0].outputDuration,.2);assert.equal(end.items[0].entrance.animationDuration,.2);
 const many=brollTimingReport({...p,brolls:Array.from({length:101},(_,i)=>({...p.brolls[0],id:'b'+i}))});assert.equal(many.items.length,100);assert.equal(many.total,101);assert.equal(many.truncated,true);
});

test('reported defaults match actual runtime GSAP for every entrance style including unknown fallback',()=>{
 const runtime=fs.readFileSync('editor/lib/runtime.js','utf8'),start=runtime.indexOf('  function enter('),end=runtime.indexOf('\n  (E.sourceZooms',start);
 for(const type of ['slide','zoom','drop','wipe','fade','unknown','toString','none']){const calls=[];vm.runInNewContext(runtime.slice(start,end)+'\nenter({},type,2);',{type,tl:{fromTo:(el,from,to)=>calls.push(to.duration)}});const timing=brollEntranceTiming({tIn:type,start:2,dur:1});assert.equal(timing.animationDuration,calls[0]??0,type);}
});

test('API tool reads changed candidate with advisory only, rejects arguments and preserves user duration',async()=>{
 const p=project(),before=structuredClone(p);let round=0;const tool=(name,args)=>({id:'call'+round,function:{name,arguments:JSON.stringify(args)}});
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:p,instruction:'Kiểm nhịp cảnh trám, giữ lựa chọn đã chốt',fetcher:async(_url,options)=>{const body=JSON.parse(options.body);round++;assert.ok(body.tools.some(t=>t.function.name==='check_broll_timing'));let calls;
 if(round===1)calls=[tool('check_broll_timing',{unexpected:true})];
 if(round===2){assert.match(JSON.parse(body.messages.at(-1).content).error,/không nhận/);calls=[tool('set_edit_fields',{fields:{brolls:p.brolls.map(b=>b.id==='screen'?{...b,tInDuration:0}:b)}})];}
 if(round===3)calls=[tool('check_broll_timing',{})];
 if(round===4){const report=JSON.parse(body.messages.at(-1).content);assert.equal(report.items[0].entrance.animationDuration,0);assert.equal(report.items[0].entrance.settledDuration,.4);assert.deepEqual(report.items[0].advisories,['SHORT_INSERT']);assert.equal(report.visualReviewed,false);}
 return Response.json({choices:[calls?{finish_reason:'tool_calls',message:{tool_calls:calls}}:{finish_reason:'stop',message:{content:'Đã kiểm nhịp; chưa xem hình.'}}]});}});
 assert.equal(round,4);assert.equal(result.project.brolls[0].tInDuration,0);assert.deepEqual(p,before);assert.deepEqual(result.project.segments,p.segments);
});
