import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {analyzeShotColor} from '../src/services/shot-color.mjs';
import {normalizeColor} from '../src/services/color-normalization.mjs';
import {applyColorNormalization} from '../editor/lib/color-management.js';
import {runApiEditor} from '../src/services/api-editor.mjs';
import {createApiColorNormalization} from '../src/services/api-color-normalization.mjs';

test('HDR must be normalized before SDR histogram suggestions; derived Rec709 is accepted without touching original',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shot-input-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));
 for(const trc of ['arib-std-b67','smpte2084']){
  const src=`inputs/${trc}.mp4`,file=path.join(dir,src);
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','testsrc2=s=160x96:d=0.5','-c:v','libx264','-x264-params','colorprim=bt2020:transfer='+trc+':colormatrix=bt2020nc','-pix_fmt','yuv420p','-color_primaries','bt2020','-color_trc',trc,'-colorspace','bt2020nc','-color_range','tv','-y',file],{windowsHide:true});
  const original=fs.readFileSync(file),p={source:{video:src},segments:[{id:'s',in:0,out:.5}]},before=structuredClone(p);
  await assert.rejects(analyzeShotColor(dir,p,{kind:'segments',id:'s'}),/HDR.*Rec\.709/);
  const result=await normalizeColor(dir,p,{kind:'segments',id:'s',encoder:'cpu'}),normalized=applyColorNormalization(p,'segments','s',result);
  const report=await analyzeShotColor(dir,normalized,{kind:'segments',id:'s'});assert.equal(report.samples.length,3);assert.ok(Number.isFinite(report.samples[0].stats.median));
  assert.deepEqual(p,before);assert.deepEqual(fs.readFileSync(file),original);
 }
});

test('API worker recovers from HDR analysis error through normalization and reanalysis without exposing frame bytes',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hdr-worker-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'inputs'));
 const src='inputs/hdr.mp4',file=path.join(dir,src);execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','testsrc2=s=160x96:d=0.5','-c:v','libx264','-x264-params','colorprim=bt2020:transfer=arib-std-b67:colormatrix=bt2020nc','-pix_fmt','yuv420p','-color_range','tv','-y',file],{windowsHide:true});
 const original=fs.readFileSync(file),p={source:{video:src},segments:[{id:'s',in:0,out:.5}],texts:[{id:'keep',title:'Giữ chữ cũ'}]},before=structuredClone(p);let steps=0;
 const result=await runApiEditor({project:p,instruction:'Chuẩn hóa HDR rồi gợi ý chỉnh màu, chưa áp grade và không xuất.',config:{model:'fixture',baseUrl:'https://fixture.invalid/v1'},normalizationContext:createApiColorNormalization(dir),colorContext:(candidate,request)=>analyzeShotColor(dir,candidate,request),fetcher:async(url,options)=>{
  const body=JSON.parse(options.body);steps++;assert.ok(!JSON.stringify(body).includes('data:image/'));
  const tool=(name,args)=>({finish_reason:'tool_calls',message:{tool_calls:[{id:'step'+steps,type:'function',function:{name,arguments:JSON.stringify(args)}}]}});
  let choice;
  if(steps===1){assert.match(body.tools.find(t=>t.function.name==='analyze_shot_color').function.description,/normalize_source_color/);choice=tool('analyze_shot_color',{kind:'segments',id:'s'});}
  else if(steps===2){assert.match(JSON.parse(body.messages.find(m=>m.tool_call_id==='step1').content).error,/HDR.*Rec\.709/);choice=tool('normalize_source_color',{kind:'segments',id:'s',encoder:'cpu'});}
  else if(steps===3){const converted=JSON.parse(body.messages.find(m=>m.tool_call_id==='step2').content);assert.equal(converted.ok,true);assert.equal(converted.provenance.input,'hlg');choice=tool('analyze_shot_color',{kind:'segments',id:'s'});}
  else{assert.equal(steps,4);const report=JSON.parse(body.messages.find(m=>m.tool_call_id==='step3').content);assert.equal(report.inputColor.profile,'rec709');assert.equal(report.samples.length,3);assert.equal(report.samples[0].image,undefined);choice={finish_reason:'stop',message:{content:'Đã chuyển709 và đọc gợi ý; chưa áp grade hoặc xuất.'}};}
  return Response.json({choices:[choice]});
 }});
 assert.equal(steps,4);assert.equal(result.project.segments[0].colorNormalization.input,'hlg');assert.equal(result.project.segments[0].color,undefined);assert.deepEqual(result.project.texts,p.texts);assert.deepEqual(p,before);assert.deepEqual(fs.readFileSync(file),original);
});
