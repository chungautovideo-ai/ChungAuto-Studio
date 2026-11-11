import test from 'node:test';import assert from 'node:assert/strict';
import {reorderPrimaryClips} from '../editor/lib/primary-sequence.js';import {makeTimemap} from '../editor/lib/timemap.js';
const project={source:{timeline:'segments',duration:3},segments:[{id:'a',src:'a.mp4',mediaStart:1,in:0,out:2,speed:2,motionZoom:{keys:[{time:0,scale:1},{time:2,scale:2}]}},{id:'b',src:'b.mp4',mediaStart:0,in:2,out:3}],texts:[{id:'t',at:.5,dur:.5}],blocks:[{id:'b',at:2.1,cues:[2.2],follow:[[2.1,1,2,3,4]]}],audio:{music:'bed',musicSpeech:[[.2,.6]],clips:[{id:'v',at:2.2,from:.5,dur:.2}],sfx:[{at:.2}]},captions:{lines:[{id:'c',words:[{w:'A',s:.2,e:.4},{w:'B',s:2.2,e:2.4}]}]}};
test('reorder preserves media clocks/effects/rates and moves source anchors, caption groups and audio',()=>{
 const snapshot=JSON.stringify(project),p=reorderPrimaryClips(project,['b','a']);assert.equal(JSON.stringify(project),snapshot);
 assert.deepEqual(p.segments.map(s=>[s.id,s.in,s.out,s.mediaStart]),[['b',0,1,0],['a',1,3,1]]);assert.deepEqual(p.segments[1].motionZoom,project.segments[0].motionZoom);assert.equal(makeTimemap(p).total,2);
 assert.equal(p.texts[0].at,1.5);assert.ok(Math.abs(p.blocks[0].at-.1)<1e-8);assert.ok(Math.abs(p.blocks[0].cues[0]-.2)<1e-8);assert.ok(Math.abs(p.blocks[0].follow[0][0]-.1)<1e-8);assert.ok(Math.abs(p.audio.clips[0].at-.2)<1e-8);assert.equal(p.audio.clips[0].from,.5);assert.deepEqual(p.audio.musicSpeech,project.audio.musicSpeech);
 assert.deepEqual(p.captions.lines.map(l=>l.words[0].w),['B','A']);assert.equal(new Set(p.captions.lines.map(l=>l.id)).size,2);
});
test('reorder refuses missing/duplicate IDs, invalid intervals and unowned anchors without mutation',()=>{
 for(const ids of [['a'],['a','a'],['a','x']])assert.throws(()=>reorderPrimaryClips(project,ids));
 for(const patch of [{texts:[{at:8}]},{source:{}},{camera:{matte:'x'}},{segments:[{...project.segments[0]}, {...project.segments[1],in:1}]}])assert.throws(()=>reorderPrimaryClips({...project,...patch},['b','a']));
});


test('API reorder tool uses same candidate-only operation and invalidates subsequent transcript reads',async()=>{
 const {runApiEditor}=await import('../src/services/api-editor.mjs');let step=0;const original=JSON.stringify(project);
 const result=await runApiEditor({project,config:{baseUrl:'https://fixture.invalid/v1',model:'fixture'},instruction:'Đổi cảnh B lên trước',mediaContext:{validate(){},transcript(){throw new Error('Must not read stale words');}},fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body);step++;const calls=step===1?[{id:'reorder',type:'function',function:{name:'reorder_primary_clips',arguments:JSON.stringify({ids:['b','a']})}}]:step===2?[{id:'words',type:'function',function:{name:'read_transcript',arguments:'{}'}}]:null;
  if(step>=2)assert.equal(JSON.parse(body.messages.find(m=>m.tool_call_id==='reorder').content).ok,true);
  if(step===3)assert.match(JSON.parse(body.messages.find(m=>m.tool_call_id==='words').content).error,/transcript cũ/);
  return Response.json({choices:[{finish_reason:calls?'tool_calls':'stop',message:calls?{tool_calls:calls}:{content:'Đã đổi thứ tự.'}}]});
 }});assert.equal(JSON.stringify(project),original);assert.deepEqual(result.project.segments.map(s=>s.id),['b','a']);assert.equal(result.project.texts[0].at,1.5);
});
