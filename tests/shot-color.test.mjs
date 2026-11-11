import {runApiEditor} from '../src/services/api-editor.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {analyzeRgb,suggestShotColor,shotColorRequest,analyzeShotColor} from '../src/services/shot-color.mjs';
test('histogram advice is bounded and does not force white balance on colored paint',()=>{
 const flat=(r,g,b)=>analyzeRgb(Buffer.from(Array.from({length:1000},()=>[r,g,b]).flat()));
 assert.equal(suggestShotColor([flat(30,30,30),flat(30,30,30),flat(30,30,30)]).color.brightness,.18);
 assert.ok(suggestShotColor([flat(210,210,210)]).color.brightness<0);
 const red=suggestShotColor([flat(180,20,20)]);assert.equal(red.color.temperature,undefined);assert.equal(red.color.saturation,undefined);assert.match(red.warnings.join(' '),/trung tính/);
 const clips=suggestShotColor([flat(255,255,255)]);assert.match(clips.warnings.join(' '),/cháy sáng/);
 assert.throws(()=>analyzeRgb(Buffer.from([1,2])));
 const project={source:{video:'inputs/source.mp4'},segments:[{id:'s',in:2,out:6,speed:2}],brolls:[{id:'b',src:'inputs/b.mp4',at:3,dur:4,speed:2,mediaStart:1}]};
 assert.deepEqual(shotColorRequest(project,{kind:'segments',id:'s'}),{src:'inputs/source.mp4',from:2,duration:4});
 assert.equal(shotColorRequest(project,{kind:'brolls',id:'b'}).duration,3);assert.throws(()=>shotColorRequest(project,{kind:'segments',id:'missing'}));
});
test('local frame analysis reads actual media without changing project/source and honors cancellation/revision validation',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shot-color-'));try{
  fs.mkdirSync(path.join(dir,'inputs'));const file=path.join(dir,'inputs/dark.mp4');execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=0x303030:s=320x180:d=1','-pix_fmt','yuv420p','-y',file]);const bytes=fs.readFileSync(file);
  const p={source:{video:'inputs/dark.mp4'},segments:[{id:'s',in:0,out:1}],audio:{}},before=JSON.stringify(p);
  const result=await analyzeShotColor(dir,p,{kind:'segments',id:'s'});assert.equal(result.samples.length,3);assert.equal(result.color.brightness,.18);assert.match(result.samples[0].image,/^data:image\/bmp;base64,Qk/);assert.equal(JSON.stringify(p),before);assert.deepEqual(fs.readFileSync(file),bytes);
  await assert.rejects(analyzeShotColor(dir,p,{kind:'segments',id:'s'},{validate:()=>{throw new Error('revision changed');}}),/revision/);
  await assert.rejects(analyzeShotColor(dir,{...p,segments:[{id:'s',in:0,out:2}]},{kind:'segments',id:'s'}),/thời lượng/);
  await assert.rejects(analyzeShotColor(dir,p,{kind:'segments',id:'s'},{signal:AbortSignal.abort()}));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

 test('API worker analyzes source metrics then patches requested color without copying preview image into context',async()=>{
 const project={source:{video:'inputs/raw.mp4',duration:1},segments:[{id:'s',in:0,out:1}]};let step=0;
 const result=await runApiEditor({project,instruction:'Làm màu nhẹ đoạn s',config:{model:'fixture',baseUrl:'https://gateway.example/v1'},colorContext:async(p,args)=>{assert.equal(p.segments[0].id,args.id);return {color:{brightness:.1},warnings:[],samples:[{at:.5,stats:{median:.2},image:'PRIVATE_IMAGE_BYTES'}]};},fetcher:async(url,options)=>{
  const body=JSON.parse(options.body);assert.ok(body.tools.some(t=>t.function.name==='analyze_shot_color'));assert.ok(!JSON.stringify(body).includes('PRIVATE_IMAGE_BYTES'));step++;
  const tool=(name,args)=>({finish_reason:'tool_calls',message:{tool_calls:[{id:'t'+step,type:'function',function:{name,arguments:JSON.stringify(args)}}]}});
  return Response.json({choices:[step===1?tool('analyze_shot_color',{kind:'segments',id:'s'}):step===2?tool('set_edit_fields',{fields:{segments:[{id:'s',in:0,out:1,color:{brightness:.1}}]}}):{finish_reason:'stop',message:{content:'Đã chỉnh màu'}}]});
 }});assert.equal(result.project.segments[0].color.brightness,.1);assert.equal(project.segments[0].color,undefined);
 });
