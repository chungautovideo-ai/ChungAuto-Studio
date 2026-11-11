import test from 'node:test';import assert from 'node:assert/strict';
import {runApiEditor} from '../src/services/api-editor.mjs';
test('vision editor requires explicit capability, sends labeled source frames and retains evidence without base64 in result',async()=>{
 const base={title:'Original',source:{video:'inputs/base.mp4'}},config={baseUrl:'https://example.com/v1',model:'fixture',supportsVision:true};let calls=0,samples=0;
 const mediaContext={validate(){},async sample(src,times){samples++;assert.equal(src,'inputs/shot.mp4');assert.deepEqual(times,[0]);return {media:{src,kind:'video',duration:2},frames:[{id:'frame',src,time:0,sha256:'hash',dataUrl:'data:image/jpeg;base64,ZmFrZQ=='}]};}};
 const result=await runApiEditor({config,project:base,instruction:'Xem cảnh rồi thêm chữ',mediaContext,fetcher:async(url,options)=>{
  calls++;const body=JSON.parse(options.body);assert.equal(body.tools.length,16);assert.ok(body.tools.some(t=>t.function.name==='append_primary_clips'));assert.ok(body.tools.some(t=>t.function.name==='reorder_primary_clips'));
  if(calls===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'sample',function:{name:'sample_media_frames',arguments:JSON.stringify({src:'inputs/shot.mp4',times:[0]})}}]}}]});
  const imageMessage=body.messages.find(m=>Array.isArray(m.content));assert.equal(imageMessage.content[1].image_url.url,'data:image/jpeg;base64,ZmFrZQ==');assert.match(imageMessage.content[0].text,/inputs\/shot.mp4/);
  return Response.json({choices:[calls===2?{finish_reason:'tool_calls',message:{tool_calls:[{id:'edit',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'Seen frame'}})}}]}}:{finish_reason:'stop',message:{content:'Đã xem frame.'}}]});
 }});assert.equal(samples,1);assert.equal(result.project.title,'Seen frame');assert.equal(result.visualEvidence[0].src,'inputs/shot.mp4');assert.equal(JSON.stringify(result).includes('base64'),false);
 await assert.rejects(runApiEditor({config:{...config,supportsVision:false},project:base,instruction:'Edit',mediaContext,fetcher:async(url,options)=>{assert.equal(JSON.parse(options.body).tools.some(t=>t.function.name==='sample_media_frames'),false);return Response.json({choices:[{finish_reason:'stop',message:{content:'No tool'}}]});}}),/chưa áp dụng/);
 samples=0;await assert.rejects(runApiEditor({config,project:base,instruction:'Sample repeatedly',mediaContext,fetcher:async()=>Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'sample',function:{name:'sample_media_frames',arguments:JSON.stringify({src:'inputs/shot.mp4',times:[0]})}}]}}]})}),/6 lượt/);assert.equal(samples,6);
});

