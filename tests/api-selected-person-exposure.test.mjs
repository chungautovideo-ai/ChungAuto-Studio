import test from 'node:test';import assert from 'node:assert/strict';import {runApiEditor} from '../src/services/api-editor.mjs';
test('API selected-person measurement requires fresh report, caps calls and remains read-only until separate edit',async()=>{
 const sha='a'.repeat(64),src='inputs/a.mp4',project={title:'before'},config={baseUrl:'https://fixture.example/v1',model:'fixture'};let calls=0,measurements=0;
 const tools=[['measure_selected_person_exposure',{src,sha256:sha}],['read_person_exposure',{}],['measure_selected_person_exposure',{src,sha256:sha}],['measure_selected_person_exposure',{src,sha256:sha}],['measure_selected_person_exposure',{src,sha256:sha}],['set_edit_fields',{fields:{title:'after'}}]];
 // Batch report and both measurements after the deliberately invalid first request.
 const fetcher=async(_url,options)=>{calls++;const body=JSON.parse(options.body);if(calls===2)assert.match(JSON.parse(body.messages.at(-1).content).error,/Đọc/);if(calls===3){const responses=body.messages.filter(m=>m.role==='tool').slice(-4).map(m=>JSON.parse(m.content));assert.match(responses[3].error,/Tối đa2/);}
  const chosen=calls===1?tools.slice(0,1):calls===2?tools.slice(1,5):calls===3?tools.slice(5):[];
  return Response.json({choices:[{finish_reason:chosen.length?'tool_calls':'stop',message:chosen.length?{tool_calls:chosen.map(([name,args],i)=>({id:calls+'-'+i,function:{name,arguments:JSON.stringify(args)}}))}:{content:'Done'}}]});
 };
 const result=await runApiEditor({config,project,fetcher,personContext:()=>({sources:[{src,sha256:sha,hasPersonMask:true}]}),selectedPersonContext:(candidate,args)=>{measurements++;assert.equal(candidate.title,'before');assert.equal(args.sha256,sha);return {readOnly:true,suggestion:{available:true,personLight:20}};}});
 assert.equal(measurements,2);assert.equal(result.project.title,'after');assert.equal(project.title,'before');
});
