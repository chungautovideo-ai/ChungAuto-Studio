import test from 'node:test';import assert from 'node:assert/strict';
import {runApiEditor} from '../src/services/api-editor.mjs';

test('API OCR suggestions stay read-only, cap processing and never count as delivered visual evidence',async()=>{
 const project={title:'Before',source:{video:'inputs/raw.mp4',duration:1},segments:[{id:'s',in:0,out:1}]};
 let rounds=0,suggestions=0,masks=0;
 const result=await runApiEditor({config:{baseUrl:'https://fixture.example/v1',model:'fixture',supportsVision:true},project,
  mediaContext:{validate(){}},plateContext:{validate(){},suggest:async(candidate,args)=>{assert.equal(candidate.title,'Before');assert.deepEqual(args,{segmentId:'s'});suggestions++;return {readOnly:true,proposals:[{roi:[.1,.1,.2,.1]}]};},apply:async()=>{masks++;throw Error('Must not reach mask without visual evidence');}},
  fetcher:async(_url,options)=>{
   const body=JSON.parse(options.body);rounds++;assert.ok(body.tools.some(t=>t.function.name==='suggest_plate_regions'));
   if(rounds===2){const values=body.messages.filter(m=>m.role==='tool').map(m=>JSON.parse(m.content));assert.equal(values[0].readOnly,true);assert.equal(values[1].readOnly,true);assert.match(values[2].error,/Tối đa2/);assert.match(values[3].error,/sample_media_frames/);assert.match(values[4].error,/đúng một/);}
   const tools=rounds===1?[
    ['suggest_plate_regions',{segmentId:'s'}],['suggest_plate_regions',{segmentId:'s'}],['suggest_plate_regions',{segmentId:'s'}],
    ['mask_primary_plate',{segmentId:'s',roi:[.1,.1,.2,.1]}],['suggest_plate_regions',{segmentId:'s',source:'/arbitrary/file'}]
   ]:rounds===2?[['set_edit_fields',{fields:{title:'After'}}]]:[];
   return Response.json({choices:[{finish_reason:tools.length?'tool_calls':'stop',message:tools.length?{tool_calls:tools.map(([name,args],i)=>({id:`${rounds}-${i}`,function:{name,arguments:JSON.stringify(args)}}))}:{content:'Done'}}]});
  }});
 assert.equal(suggestions,2);assert.equal(masks,0);assert.equal(project.title,'Before');assert.equal(result.project.title,'After');
});

test('non-vision API does not expose or run OCR suggestion tool',async()=>{
 let rounds=0,called=false;
 const result=await runApiEditor({config:{baseUrl:'https://fixture.example/v1',model:'fixture'},project:{title:'Before'},mediaContext:{validate(){}},plateContext:{validate(){},suggest(){called=true;}},fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body);assert.equal(body.tools.some(t=>t.function.name==='suggest_plate_regions'),false);rounds++;
  return Response.json({choices:[{finish_reason:rounds===1?'tool_calls':'stop',message:rounds===1?{tool_calls:[{id:'edit',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'After'}})}}]}:{content:'Done'}}]});
 }});assert.equal(called,false);assert.equal(result.project.title,'After');
});
