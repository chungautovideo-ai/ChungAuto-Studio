import test from 'node:test';import assert from 'node:assert/strict';import {applyEditorFields,runApiEditor} from '../src/services/api-editor.mjs';
test('API edits existing logo, requires inspected image for replacement and preserves sibling fields',async()=>{
 const base={title:'keep',texts:[{id:'sibling',title:'KEEP'}],watermark:{file:'inputs/logo.png',position:'top-left',heightPercent:3,marginPercent:4,opacity:.9}};
 const wm={...base.watermark,position:'bottom-right',opacity:.7};assert.deepEqual(applyEditorFields(base,{watermark:wm}).texts,base.texts);assert.equal(applyEditorFields(base,{watermark:null}).watermark,null);
 assert.throws(()=>applyEditorFields(base,{watermark:{...wm,file:'inputs/new.png'}}));assert.equal(applyEditorFields(base,{watermark:{...wm,file:'inputs/new.png'}},{media:[{src:'inputs/new.png',kind:'image'}]}).watermark.file,'inputs/new.png');
 for(const patch of [{file:'../bad.png'},{opacity:2},{heightPercent:40},{html:'bad'}])assert.throws(()=>applyEditorFields(base,{watermark:{...wm,...patch}}));
 let calls=0;const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:base,instruction:'Chuyển logo xuống phải',fetcher:async(_url,options)=>{
 const body=JSON.parse(options.body);calls++;const messages=[{tool_calls:[{id:'read',type:'function',function:{name:'read_project',arguments:JSON.stringify({fields:['watermark']})}}]},{tool_calls:[{id:'write',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{watermark:wm}})}}]},{content:'Đã đổi logo'}];if(calls===2)assert.deepEqual(JSON.parse(body.messages.find(m=>m.tool_call_id==='read').content).project.watermark,base.watermark);return Response.json({choices:[{finish_reason:calls<3?'tool_calls':'stop',message:messages[calls-1]}]});
 }});assert.deepEqual(result.project.watermark,wm);assert.deepEqual(result.project.texts,base.texts);assert.equal(base.watermark.position,'top-left');
});
