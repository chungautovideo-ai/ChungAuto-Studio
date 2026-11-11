import test from 'node:test';import assert from 'node:assert/strict';
import {runApiEditor} from '../src/services/api-editor.mjs';
test('API editor reads compact person exposure on candidate without mutating beauty or sending mask data',async()=>{
 const project={title:'Before',camera:{beauty:{bodyWhite:0}},segments:[]};let calls=0,reports=0;
 const result=await runApiEditor({config:{baseUrl:'https://example.test/v1',model:'fixture',apiKey:'fixture'},project,instruction:'Read exposure then change title',personContext:candidate=>{reports++;assert.deepEqual(candidate.camera,project.camera);return {ok:true,readOnly:true,sources:[{src:'inputs/a.mp4',suggestion:{bodyWhite:25}}]};},fetcher:async(url,options)=>{
  const body=JSON.parse(options.body);assert.ok(body.tools.some(t=>t.function.name==='read_person_exposure'));calls++;
  const message=calls===1?{tool_calls:[{id:'exposure',type:'function',function:{name:'read_person_exposure',arguments:'{}'}}]}:calls===2?{tool_calls:[{id:'title',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'After'}})}}]}:{content:'Done'};
  if(calls===2){const tool=body.messages.find(m=>m.role==='tool');assert.equal(JSON.parse(tool.content).readOnly,true);}
  return Response.json({choices:[{finish_reason:calls<3?'tool_calls':'stop',message}]});
 }});
 assert.equal(reports,1);assert.equal(result.project.title,'After');assert.deepEqual(result.project.camera,project.camera);assert.equal(project.title,'Before');
});
