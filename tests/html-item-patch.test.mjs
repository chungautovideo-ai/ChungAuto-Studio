import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {readHTMLItem,patchHTMLItem} from '../src/services/html-item-patch.mjs';
import {runApiEditor,applyEditorFields} from '../src/services/api-editor.mjs';
const fixture=()=>({title:'Keep',texts:[{id:'same',title:'Native',at:0,dur:2}],blocks:[{id:'same',group:'chu',name:'Lợi ích',at:0,dur:2,html:'<div class="title">Nâng cấp</div><p class="sub">Giữ nguyên</p>',css:'.title{color:gold}',fields:[{sel:'.title',label:'Tiêu đề'},{sel:'.sub'}],anim:[{sel:'.sub',at:0,dur:1,to:{opacity:1}}]},{id:'other',html:'<b>Keep</b>'}]});

test('HTML patch changes declared text and metadata only, rejects stale/invalid updates atomically',async()=>{
 const p=fixture(),before=JSON.stringify(p),read=await readHTMLItem(p,{id:'same'});
 assert.equal(read.fields[0].value,'Nâng cấp');assert.equal(Object.hasOwn(read,'html'),false);
 const changed=await patchHTMLItem(p,{id:'same',version:read.version,values:{0:'An tâm & vững lái'},properties:{at:1,x:25,hidden:false}});
 assert.match(changed.project.blocks[0].html,/An tâm &amp; vững lái/);assert.match(changed.project.blocks[0].html,/Giữ nguyên/);
 assert.deepEqual(changed.project.blocks[0].anim,p.blocks[0].anim);assert.equal(changed.project.blocks[0].css,p.blocks[0].css);
 assert.deepEqual(changed.project.texts,p.texts);assert.deepEqual(changed.project.blocks[1],p.blocks[1]);assert.equal(JSON.stringify(p),before);
 for(const bad of [{values:{0:'<script>'}},{values:{99:'x'}},{values:{'00':'x'}},{values:{}},{properties:{html:'x'}},{properties:{dur:-1}},{properties:{hidden:1}},{properties:{scale:100}}])await assert.rejects(patchHTMLItem(p,{id:'same',version:read.version,...bad}));
 await assert.rejects(patchHTMLItem(changed.project,{id:'same',version:read.version,values:{0:'Stale'}}),/đổi/);
 await assert.rejects(readHTMLItem({...p,blocks:[p.blocks[0],p.blocks[0]]},{id:'same'}),/trùng/);
 assert.throws(()=>applyEditorFields(p,{blocks:[]}),/hỗ trợ/);
 const nofields=await readHTMLItem(p,{id:'other'});assert.deepEqual(nofields.fields,[]);
 assert.equal((await patchHTMLItem(p,{id:'other',version:nofields.version,properties:{hidden:true}})).project.blocks[1].hidden,true);
 await assert.rejects(patchHTMLItem(p,{id:'other',version:nofields.version,values:{0:'Unknown'}}));
});

test('word text regeneration preserves sibling animations and rejects missing selectors',async()=>{
 const p=fixture();p.blocks[0].fields[0].words=true;p.blocks[0].anim.push({sel:'.title .w:nth-child(1)',at:0,dur:1,to:{opacity:1}});
 const read=await readHTMLItem(p,{id:'same'}),out=await patchHTMLItem(p,{id:'same',version:read.version,values:{0:'An tâm lái'}});
 assert.equal(out.project.blocks[0].anim.length,4);assert.deepEqual(out.project.blocks[0].anim[0],p.blocks[0].anim[0]);assert.match(out.project.blocks[0].html,/<span class="w">An<\/span>/);
 p.blocks[0].fields[0].sel='.missing';await assert.rejects(readHTMLItem(p,{id:'same'}),/preset/);
});

test('HTTP gateway reads compact HTML fields and patches correct block while preserving same-ID text',async()=>{
 const p=fixture();let step=0;
 const gateway=http.createServer(async(req,res)=>{
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);step++;
  assert.ok(body.tools.some(t=>t.function.name==='patch_html_item'));
  const tool=(name,args)=>({id:'tool'+step,type:'function',function:{name,arguments:JSON.stringify(args)}});let message;
  if(step===1)message={tool_calls:[tool('read_html_item',{id:'same'})]};
  else if(step===2){const read=JSON.parse(body.messages.find(m=>m.tool_call_id==='tool1').content);assert.equal(read.fields[0].value,'Nâng cấp');assert.equal(Object.hasOwn(read,'html'),false);message={tool_calls:[tool('patch_html_item',{id:'same',version:read.version,values:{0:'An tâm mỗi chuyến đi'}})]};}
  else{assert.equal(JSON.parse(body.messages.find(m=>m.tool_call_id==='tool2').content).ok,true);message={content:'Done'};}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{finish_reason:message.tool_calls?'tool_calls':'stop',message}]}));
 });
 await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
 try{const out=await runApiEditor({config:{baseUrl:'http://127.0.0.1:'+gateway.address().port+'/v1',model:'offline-fixture'},project:p,instruction:'Sửa chữ đang chọn',context:{selectedItem:{group:'blocks',id:'same'}}});assert.match(out.project.blocks[0].html,/An tâm mỗi chuyến đi/);assert.deepEqual(out.project.texts,p.texts);assert.deepEqual(out.project.blocks[1],p.blocks[1]);assert.equal(step,3);}
 finally{await new Promise(r=>gateway.close(r));}
});
