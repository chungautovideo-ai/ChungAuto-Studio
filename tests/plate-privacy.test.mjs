import {primaryPrivacyRequest,applyPrimaryPrivacy,restorePrimaryPrivacy} from '../editor/lib/primary-privacy.js';
import {sourceTranscriptClock} from '../editor/lib/source-transcript.js';
import {makeTimemap} from '../editor/lib/timemap.js';
import {buildHtml} from '../editor/lib/build.mjs';
import {createApiPlatePrivacy} from '../src/services/api-plate-privacy.mjs';
import {runApiEditor} from '../src/services/api-editor.mjs';
import {createEditorContext} from '../src/services/editor-context.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {plateRequest,createPlatePrivacy} from '../src/services/plate-privacy.mjs';import {requireVisionPython} from '../src/services/vision-python.mjs';
import {claimSessionJob} from '../src/services/session-job-claims.mjs';
import {prepareRevisionResult} from '../src/services/revision-results.mjs';
import crypto from 'node:crypto';
test('plate privacy validates source range and ROI, tracks moving region and preserves original',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-plate-'));fs.mkdirSync(path.join(dir,'inputs'));
 const code=`import cv2,numpy as np,sys
out=cv2.VideoWriter(sys.argv[1],cv2.VideoWriter_fourcc(*'mp4v'),30,(320,180))
rng=np.random.default_rng(42);patch=rng.integers(80,255,(40,80,3),dtype=np.uint8)
cv2.putText(patch,'51F-123',(2,25),cv2.FONT_HERSHEY_SIMPLEX,.4,(0,0,0),1)
for i in range(90):
 f=np.full((180,320,3),60,np.uint8);f[70:110,40+i:120+i]=patch;out.write(f)
out.release()
`;
 try{
  execFileSync(requireVisionPython(process.cwd()).command,['-c',code,path.join(dir,'inputs/raw-noaudio.mp4')],{windowsHide:true});
  execFileSync('ffmpeg',['-nostdin','-v','error','-y','-i',path.join(dir,'inputs/raw-noaudio.mp4'),'-f','lavfi','-i','sine=frequency=440:duration=3','-c:v','copy','-c:a','aac',path.join(dir,'inputs/raw.mp4')],{windowsHide:true});
  const project={source:{video:'inputs/raw.mp4'},segments:[{id:'s',in:0,out:3}],brolls:[{id:'b',src:'inputs/raw.mp4',at:0,dur:1,mediaStart:.4}]},request={brollId:'b',roi:[52/320,70/180,80/320,40/180]},before=fs.readFileSync(path.join(dir,'inputs/raw.mp4'));
  for(const roi of [[0,0,0,1],[.9,0,.3,.1],[0,0,NaN,.2]])assert.throws(()=>plateRequest(project,{...request,roi}));
  assert.throws(()=>plateRequest({...project,brolls:[{...project.brolls[0],dur:20}],segments:[{in:0,out:30}]},request));
  const result=await createPlatePrivacy(process.cwd(),dir,project,request);
  assert.equal(result.provenance.requiresVisualReview,true);assert.equal(result.provenance.frames,30);assert.equal(result.provenance.source,'inputs/raw.mp4');assert.deepEqual(fs.readFileSync(path.join(dir,'inputs/raw.mp4')),before);
  const tracks=JSON.parse(fs.readFileSync(path.join(dir,path.dirname(result.path),'tracks.json'))).frames;
  assert.ok(tracks.at(-1).quad[0][0]-tracks[0].quad[0][0]>25,'tracked source moves about29pixels');
  const bytes=execFileSync('ffmpeg',['-nostdin','-v','error','-i',path.join(dir,result.path),'-f','rawvideo','-pix_fmt','rgb24','-'],{windowsHide:true,maxBuffer:20*1024**2});
  for(const i of Array.from({length:30},(_,i)=>i)){const x=52+i,y=70;for(const [dx,dy] of [[5,5],[40,20],[75,35]]){const offset=i*320*180*3+((y+dy)*320+x+dx)*3;assert.ok(bytes[offset]<30&&bytes[offset+1]<30&&bytes[offset+2]<30,'solid mask covers known moving plate');}}
  const primary={source:{video:'inputs/raw.mp4',duration:3,width:320,height:180,hasAudio:true,timeline:'segments'},segments:[{id:'main',src:'inputs/raw.mp4',mediaStart:.4,mediaInfo:{width:320,height:180,duration:3,hasAudio:true},in:10,out:11,speed:2,color:{saturation:.1},transform:{scale:1.1},text:'noi dung'}],texts:[{id:'keep',title:'Keep',at:10,dur:.3}],audio:{voice:1,music:''}};
  const maskedPrimary=await createPlatePrivacy(process.cwd(),dir,primary,{segmentId:'main',roi:request.roi});
  const nextPrimary=applyPrimaryPrivacy(primary,'main',maskedPrimary);
  assert.equal(makeTimemap(nextPrimary).total,.5);assert.equal(sourceTranscriptClock(primary),sourceTranscriptClock(nextPrimary));assert.equal(nextPrimary.segments[0].in,10);assert.equal(nextPrimary.segments[0].out,11);assert.equal(nextPrimary.segments[0].mediaStart,0);assert.deepEqual(nextPrimary.texts,primary.texts);assert.deepEqual(nextPrimary.segments[0].color,primary.segments[0].color);
  const html=buildHtml(nextPrimary,dir);assert.ok(html.includes(maskedPrimary.path));assert.ok(html.includes('data-playback-rate="2"'));assert.ok(html.includes('data-duration="0.5"'));
  assert.deepEqual(restorePrimaryPrivacy(nextPrimary,'main'),primary);
  const trimmed=structuredClone(nextPrimary);trimmed.segments[0].in=10.2;trimmed.segments[0].mediaStart=.2;const restoredTrim=restorePrimaryPrivacy(trimmed,'main');assert.ok(Math.abs(restoredTrim.segments[0].mediaStart-.6)<1e-9);assert.equal(restoredTrim.segments[0].out,11);
  const extended=structuredClone(nextPrimary);extended.segments[0].out=11.2;assert.throws(()=>buildHtml(extended,dir),/khoảng đã xử lý/);
  let primaryStep=0;const primaryApi=await runApiEditor({project:primary,config:{baseUrl:'https://gateway.example/v1',model:'fixture',supportsVision:true},instruction:'Che A-roll',plateContext:createApiPlatePrivacy(process.cwd(),dir),mediaContext:createEditorContext(dir,{project:primary}),fetcher:async(url,options)=>{primaryStep++;const body=JSON.parse(options.body);assert.ok(body.tools.some(t=>t.function.name==='mask_primary_plate'));if(primaryStep===3)return Response.json({choices:[{finish_reason:'stop',message:{content:'Can kiem ban che'}}]});return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'p'+primaryStep,type:'function',function:{name:primaryStep===1?'sample_media_frames':'mask_primary_plate',arguments:JSON.stringify(primaryStep===1?{src:'inputs/raw.mp4',times:[.4]}:{segmentId:'main',roi:request.roi})}}]}}]});}});
  assert.match(primaryApi.project.segments[0].src,/^inputs\/privacy\//);assert.equal(sourceTranscriptClock(primaryApi.project),sourceTranscriptClock(primary));assert.equal(makeTimemap(primaryApi.project).total,.5);
  fs.appendFileSync(path.join(dir,maskedPrimary.path),'changed');assert.throws(()=>buildHtml(nextPrimary,dir),/đã đổi/);
  assert.throws(()=>primaryPrivacyRequest({...primary,camera:{matte:'mask.webm'}},'main'),/matte/);
  const single={source:primary.source,segments:[{id:'main',in:.4,out:1.4}]};delete single.source.timeline;const singleNext=applyPrimaryPrivacy(single,'main',maskedPrimary);assert.deepEqual(restorePrimaryPrivacy(singleNext,'main'),single);
  const cancelled=new AbortController();cancelled.abort();await assert.rejects(()=>createPlatePrivacy(process.cwd(),dir,project,request,{signal:cancelled.signal}));
  await assert.rejects(()=>createPlatePrivacy(process.cwd(),dir,project,{...request,roi:[0,0,.1,.1]}),/thiếu chi tiết|điểm bám/);
  assert.equal(fs.readdirSync(path.join(dir,'inputs/privacy')).length,3,'failed tracker never publishes second result');
  assert.equal(plateRequest({...project,brolls:[{...project.brolls[0],speed:'1.5'}]},request).speed,1.5);
  const plateContext=createApiPlatePrivacy(process.cwd(),dir),mediaContext=createEditorContext(dir,{project});let step=0;
  const quadFor=([x,y,w,h])=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];const call=(name,args,id)=>({id,type:'function',function:{name,arguments:JSON.stringify(args)}});
  const resultApi=await runApiEditor({project,config:{baseUrl:'https://gateway.example/v1',model:'fixture',supportsVision:true},instruction:'Che bien trong canh b',plateContext,mediaContext,
   fetcher:async(url,options)=>{const body=JSON.parse(options.body);step++;
    assert.ok(body.tools.some(t=>t.function.name==='mask_broll_plate'));
    if(step===2){const failures=body.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).filter(m=>m.error);assert.equal(failures.length,1,'cannot place ROI until model receives sampled frame, even in same tool batch');}
    if(step===3){assert.equal(body.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content)).at(-1).requiresVisualReview,true);return Response.json({choices:[{finish_reason:'stop',message:{content:'Da tao ban che, can xem lai toan doan'}}]});}
    return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:step===1?[call('sample_media_frames',{src:'inputs/raw.mp4',times:[.4]},'frame'),call('mask_broll_plate',request,'early')]:[call('mask_broll_plate',{brollId:'b',quads:[quadFor(request.roi),quadFor(request.roi)]},'mask')]}}]});
   }});
  assert.notEqual(resultApi.project.brolls[0].src,project.brolls[0].src);assert.equal(resultApi.project.brolls[0].mediaStart,0);assert.equal(resultApi.project.brolls[0].platePrivacy.originalMediaStart,.4);assert.equal(project.brolls[0].src,'inputs/raw.mp4');assert.deepEqual(fs.readFileSync(path.join(dir,'inputs/raw.mp4')),before);
  assert.equal(resultApi.project.brolls[0].platePrivacy.rois.length,2);assert.equal(resultApi.visualEvidence.length,1);assert.equal(resultApi.visualEvidence[0].time,.4);plateContext.validate();
  fs.appendFileSync(path.join(dir,resultApi.project.brolls[0].src),'changed');assert.throws(()=>plateContext.validate(),/đã đổi/);
  const cliDir=path.join(process.cwd(),'workspace/cache/plate-cli-'+crypto.randomUUID());fs.mkdirSync(path.join(cliDir,'inputs'),{recursive:true});
  try{
   fs.copyFileSync(path.join(dir,'inputs/raw.mp4'),path.join(cliDir,'inputs/raw.mp4'));fs.writeFileSync(path.join(cliDir,'project.json'),JSON.stringify(project));
   const token=crypto.randomUUID(),candidateDir=path.join(cliDir,'work/build-candidates',token),prepared=prepareRevisionResult(cliDir,candidateDir),file=path.join(cliDir,'work/ai-job.json');
   fs.writeFileSync(file,JSON.stringify({status:'waiting',execution:{mode:'session',agent:'codex'},completionToken:token,candidate:path.relative(process.cwd(),path.join(candidateDir,'work/candidate-project.json')),baseRevision:prepared.baseRevision}));
   const claimed=claimSessionJob(file,{root:process.cwd(),agent:'codex',sessionId:'unit-cli'});assert.ok(claimed);
   const output=execFileSync(process.execPath,['editor/tools/che-bien-so.mjs',path.relative(process.cwd(),cliDir),'--claim',claimed.claimedBy.id,'--broll','b','--quads-json',JSON.stringify([quadFor(request.roi),quadFor(request.roi)]),'--apply'],{windowsHide:true,encoding:'utf8'});
   const parsed=JSON.parse(output);assert.equal(parsed.appliedToCandidate,true);assert.equal(parsed.result.provenance.quads.length,2);const candidate=JSON.parse(fs.readFileSync(path.join(candidateDir,'work/candidate-project.json')));assert.equal(candidate.brolls[0].src,parsed.result.path);assert.equal(candidate.brolls[0].mediaStart,0);assert.equal(candidate.brolls[0].platePrivacy.originalMediaStart,.4);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cliDir,'project.json'))),project,'CLI never edits live project');
   const candidateFile=path.join(candidateDir,'work/candidate-project.json');fs.writeFileSync(candidateFile,JSON.stringify(primary));
   const primaryOutput=JSON.parse(execFileSync(process.execPath,['editor/tools/che-bien-so.mjs',path.relative(process.cwd(),cliDir),'--claim',claimed.claimedBy.id,'--segment','main','--roi',request.roi.join(','),'--apply'],{windowsHide:true,encoding:'utf8'}));
   const primaryCandidate=JSON.parse(fs.readFileSync(candidateFile));assert.equal(primaryCandidate.segments[0].src,primaryOutput.result.path);assert.equal(primaryCandidate.segments[0].mediaStart,0);assert.equal(makeTimemap(primaryCandidate).total,.5);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(cliDir,'project.json'))),project);
  }finally{const relative=path.relative(path.join(process.cwd(),'workspace/cache'),fs.realpathSync(cliDir));assert.ok(!relative.startsWith('..')&&!path.isAbsolute(relative));fs.rmSync(cliDir,{recursive:true,force:true});}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
