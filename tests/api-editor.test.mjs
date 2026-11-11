import test from 'node:test';import assert from 'node:assert/strict';
import {runApiEditor,applyEditorFields} from '../src/services/api-editor.mjs';
import {normalizeExecution,acceptsJob} from '../src/services/ai-execution.mjs';
test('brief source workflow can inspect multiple assets beyond six rounds while remaining bounded and cancellable',async()=>{
 const config={baseUrl:'https://gateway.example/v1',model:'fixture'},base={title:'Original'},progress=[];let calls=0;
 const tool=(name,args)=>Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:String(calls),function:{name,arguments:JSON.stringify(args)}}]}}]});
 const fetcher=async()=>{calls++;if(calls<=7)return tool('list_job_sources',{query:'scene'+calls});if(calls===8)return tool('set_edit_fields',{fields:{title:'Completed after source survey'}});return Response.json({choices:[{finish_reason:'stop',message:{content:'Done'}}]});};
 const jobSourceContext={list:args=>({files:[],filter:args})};
 const result=await runApiEditor({config,project:base,instruction:'Find sources and edit',jobSourceContext,fetcher,onStep:p=>progress.push(p)});
 assert.equal(result.steps,9);assert.equal(result.project.title,'Completed after source survey');assert.equal(base.title,'Original');assert.equal(progress[0].maxSteps,16);assert.equal(progress.at(-1).remainingSteps,8);
 calls=0;await assert.rejects(runApiEditor({config,project:base,jobSourceContext,fetcher:async(_url,options)=>{calls++;const body=JSON.parse(options.body);if(calls===15)assert.match(body.messages.at(-1).content,/Chỉ còn2lượt/);return tool('list_job_sources',{});}}),/16 lượt/);assert.equal(calls,16);
 const controller=new AbortController();calls=0;await assert.rejects(runApiEditor({config,project:base,jobSourceContext,signal:controller.signal,fetcher:async()=>{calls++;controller.abort();return tool('list_job_sources',{});}}),{name:'AbortError'});assert.equal(calls,1);
});
test('API editor uses bounded tools with existing assets, preserving source and rejecting executable fields',async()=>{
 const base={title:'Original',source:{file:'inputs/source.mp4'},texts:[{id:'t1',title:'Old',at:0,dur:1}],blocks:[{html:'existing'}]};
 for(const fields of [{source:{file:'new'}},{blocks:[{html:'script'}]},{texts:[{html:'bad'}]},{brolls:[{src:'https://evil/asset'}]},{title:'<script>'}])assert.throws(()=>applyEditorFields(base,fields));
 assert.equal(applyEditorFields(base,{title:'New'}).source.file,base.source.file);
 const config={baseUrl:'https://gateway.example/v1',model:'fixture',apiKey:'fixture-key'};let calls=0;
 const fetcher=async(url,options)=>{calls++;assert.equal(options.redirect,'error');assert.equal(options.headers.Authorization,'Bearer fixture-key');const body=JSON.parse(options.body);assert.equal(body.tools.length,7);return Response.json({choices:[calls===1?{finish_reason:'tool_calls',message:{tool_calls:[{id:'read',type:'function',function:{name:'read_project',arguments:'{}'}}]}}:calls===2?{finish_reason:'tool_calls',message:{tool_calls:[{id:'set',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'AI title',texts:[{id:'t1',title:'New',at:0,dur:1}]}})}}]}}:{finish_reason:'stop',message:{content:'Đã sửa tiêu đề.'}}],usage:{total_tokens:10}});};
 const result=await runApiEditor({config,project:base,instruction:'Sửa tiêu đề',fetcher});assert.equal(result.project.title,'AI title');assert.equal(result.project.texts[0].title,'New');assert.deepEqual(result.project.source,base.source);assert.deepEqual(result.project.blocks,base.blocks);assert.equal(result.usage.total_tokens,30);assert.equal(base.title,'Original');
 await assert.rejects(runApiEditor({config,project:base,instruction:'Edit',fetcher:async()=>Response.json({choices:[{finish_reason:'stop',message:{content:'Pretend done'}}]})}),/chưa áp dụng/);
 let tries=0;await assert.rejects(runApiEditor({config,project:base,instruction:'Edit',fetcher:async()=>{tries++;return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'read',function:{name:'read_project',arguments:'{}'}}]}}]});}}),/6 lượt/);assert.equal(tries,6);
 assert.throws(()=>normalizeExecution({mode:'api',agent:'gateway'}));assert.equal(normalizeExecution({mode:'api',agent:'gateway'},{allowApi:true}).mode,'api');assert.equal(acceptsJob({status:'waiting',execution:{mode:'api',agent:'gateway'}},'codex',{explicit:true}),false);
});

