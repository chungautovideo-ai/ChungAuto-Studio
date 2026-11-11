import http from 'node:http';
import test from 'node:test';import assert from 'node:assert/strict';import {readEditItem,patchEditItem,resolveEditSelection} from '../src/services/editor-item-patch.mjs';import {applyEditorFields,runApiEditor} from '../src/services/api-editor.mjs';

test('HTML selection preserves authoritative group/id/version for CLI without enabling API block patches',()=>{
 const project={texts:[{id:'same',title:'Native'}],blocks:[{id:'same',group:'chu',name:'HTML',html:'<div>Before</div>'}]};
 const before=JSON.stringify(project),got=resolveEditSelection(project,{selection:{group:'blocks',id:'same'},item:{html:'forged'}});
 assert.equal(got.group,'blocks');assert.equal(got.id,'same');assert.equal(got.supported,true);assert.match(got.version,/^[a-f0-9]{64}$/);
 assert.equal(Object.hasOwn(got,'item'),false);
 assert.deepEqual(resolveEditSelection(project,{tab:'blocks',item:{id:'same',html:'forged'}}),got);
 assert.deepEqual(resolveEditSelection(project,{selection:{group:'blocks',id:'same',version:got.version}}),got);
 assert.throws(()=>resolveEditSelection(project,{selection:{group:'blocks',id:'missing'}}),/không tồn tại/);
 assert.throws(()=>resolveEditSelection({...project,blocks:[...project.blocks,...project.blocks]},{selection:{group:'blocks',id:'same'}}),/trùng/);
 assert.throws(()=>resolveEditSelection(project,{selection:{group:'blocks',id:'same',version:'stale'}}),/đổi/);
 assert.throws(()=>readEditItem(project,{group:'blocks',id:'same'}),/không hợp lệ/);
 assert.equal(JSON.stringify(project),before);
});
test('item patch keeps unrelated edits and rejects stale IDs/versions or invalid changes atomically',()=>{
 const base={title:'Keep',texts:[{id:'a',title:'Before',at:0,dur:1,x:10},{id:'b',title:'Untouched',at:1,dur:2}],blocks:[{html:'keep'}]};
 const read=readEditItem(base,{group:'texts',id:'a'});const patched=patchEditItem(base,{group:'texts',id:'a',version:read.version,changes:{title:'After'}},applyEditorFields);
 assert.equal(patched.project.texts[0].title,'After');assert.equal(patched.project.texts[0].x,10);assert.deepEqual(patched.project.texts[1],base.texts[1]);assert.deepEqual(patched.project.blocks,base.blocks);assert.equal(base.texts[0].title,'Before');assert.notEqual(patched.result.version,read.version);
 assert.throws(()=>patchEditItem(patched.project,{group:'texts',id:'a',version:read.version,changes:{title:'Stale'}},applyEditorFields),/đã đổi/);
 for(const changes of [{id:'b'},{html:'<script>'},{dur:-1},{}])assert.throws(()=>patchEditItem(base,{group:'texts',id:'a',version:read.version,changes},applyEditorFields));
 assert.throws(()=>readEditItem(base,{group:'blocks',id:'a'}));assert.throws(()=>readEditItem(base,{group:'texts',id:'missing'}));assert.throws(()=>readEditItem({...base,texts:[...base.texts,base.texts[0]]},{group:'texts',id:'a'}));
});
test('worker sends only selected item then applies versioned patch without replacing siblings',async()=>{
 let step=0,version;const project={texts:[{id:'a',title:'Before',at:0,dur:1},{id:'b',title:'Keep',at:1,dur:1}]};
 const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project,instruction:'Sửa a',fetcher:async(_url,options)=>{
 const body=JSON.parse(options.body);step++;
 if(step===1)return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'read',type:'function',function:{name:'read_edit_item',arguments:JSON.stringify({group:'texts',id:'a'})}}]}}]});
 if(step===2){const read=JSON.parse(body.messages.find(m=>m.tool_call_id==='read').content);version=read.version;assert.equal(read.item.title,'Before');assert.ok(!JSON.stringify(read).includes('Keep'));return Response.json({choices:[{finish_reason:'tool_calls',message:{tool_calls:[{id:'patch',type:'function',function:{name:'patch_edit_item',arguments:JSON.stringify({group:'texts',id:'a',version,changes:{title:'After'}})}}]}}]});}
 return Response.json({choices:[{finish_reason:'stop',message:{content:'Done'}}]});
 }});assert.equal(result.project.texts[0].title,'After');assert.deepEqual(result.project.texts[1],project.texts[1]);assert.equal(step,3);
});

test('actual HTTP gateway receives item version and patch preserves all sibling data',async()=>{
 const project={title:'Keep',texts:[{id:'a',title:'Before',at:0,dur:1},{id:'b',title:'Keep',at:1,dur:1}],audio:{voice:.8}};let calls=0;
 const gateway=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);calls++;let message;
 if(calls===1)message={tool_calls:[{id:'read-http',type:'function',function:{name:'read_edit_item',arguments:JSON.stringify({group:'texts',id:'a'})}}]};
 else if(calls===2){const read=JSON.parse(body.messages.find(m=>m.tool_call_id==='read-http').content);message={tool_calls:[{id:'patch-http',type:'function',function:{name:'patch_edit_item',arguments:JSON.stringify({group:'texts',id:'a',version:read.version,changes:{title:'HTTP After'}})}}]};}
 else message={content:'Done'};
 res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]}));
 });await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
 try{const result=await runApiEditor({config:{baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'fixture'},project,instruction:'Patch title'});assert.equal(result.project.texts[0].title,'HTTP After');assert.deepEqual(result.project.texts[1],project.texts[1]);assert.deepEqual(result.project.audio,project.audio);assert.equal(calls,3);}finally{gateway.closeAllConnections();await new Promise(r=>gateway.close(r));}
});

test('selection is resolved from candidate and rejects stale or fabricated identity',()=>{
 const project={texts:[{id:'a',title:'Trusted',at:0,dur:1}]};
 const got=resolveEditSelection(project,{tab:'texts',item:{id:'a',title:'Forged'}});
 assert.deepEqual(got,{group:'texts',id:'a',version:readEditItem(project,{group:'texts',id:'a'}).version,supported:true});
 assert.equal(JSON.stringify(got).includes('Forged'),false);
 assert.deepEqual(resolveEditSelection(project,{selection:{group:'texts',id:'a'}}),got);
 assert.equal(resolveEditSelection(project,null),null);
 assert.equal(resolveEditSelection({...project,blocks:[{id:'x'}]},{selection:{group:'blocks',id:'x'}}).supported,true);
 assert.throws(()=>resolveEditSelection(project,{selection:{group:'texts',id:'missing'}}));
 assert.throws(()=>resolveEditSelection(project,{selection:{group:'texts',id:'a',version:'stale'}}),/đổi/);
});


