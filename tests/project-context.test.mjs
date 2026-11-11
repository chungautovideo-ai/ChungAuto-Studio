import test from 'node:test';import assert from 'node:assert/strict';import {selectProjectContext} from '../src/services/project-context.mjs';import {runApiEditor} from '../src/services/api-editor.mjs';
test('scoped project context omits unrelated large graphics without truncating selected groups or mutating project',()=>{
 const project={title:'Original',brand:{css:'x'.repeat(50000)},texts:Array.from({length:500},(_,i)=>({id:'t'+i,title:'Title '+i,at:i,dur:1})),audio:{voice:1}};
 const picked=selectProjectContext(project,{fields:['title','audio']});assert.deepEqual(picked.project,{title:'Original',audio:{voice:1}});assert.equal(picked.partial,true);assert.ok(picked.omittedFields.includes('texts'));assert.ok(JSON.stringify(picked).length<JSON.stringify(project).length/10);
 picked.project.audio.voice=0;assert.equal(project.audio.voice,1);assert.equal(selectProjectContext(project,{fields:['texts']}).project.texts.length,500);assert.equal(selectProjectContext(project).partial,false);
 for(const fields of [[],['unknown'],['title','title'],'title',['__proto__']])assert.throws(()=>selectProjectContext(project,{fields}));
});
test('API scoped read passes selected groups to model and preserves unselected edit data',async()=>{
 const project={title:'Before',blocks:[{html:'<b>retain</b>',css:'.x{}'}],audio:{voice:1},texts:[{id:'t',title:'Keep',at:0,dur:1}]};let step=0;
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project,instruction:'Title only',fetcher:async(_url,options)=>{
 const body=JSON.parse(options.body);step++;const schema=body.tools.find(t=>t.function.name==='read_project').function.parameters;assert.ok(schema.properties.fields.items.enum.includes('audio'));
 if(step===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'read',type:'function',function:{name:'read_project',arguments:JSON.stringify({fields:['title']})}}]}}]});
 const read=JSON.parse(body.messages.find(m=>m.tool_call_id==='read').content);assert.deepEqual(read.project,{title:'Before'});assert.equal(read.partial,true);assert.ok(!JSON.stringify(read.project).includes('retain'));
 if(step===2)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'set',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{title:'After'}})}}]}}]});
 return Response.json({choices:[{finish_reason:'stop',message:{content:'Done'}}]});
 }});assert.equal(result.project.title,'After');assert.deepEqual(result.project.blocks,project.blocks);assert.deepEqual(result.project.texts,project.texts);assert.deepEqual(result.project.audio,project.audio);
});
