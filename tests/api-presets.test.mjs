import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createApiPresets} from '../src/services/api-presets.mjs';import {runApiEditor} from '../src/services/api-editor.mjs';import {buildHtml} from '../editor/lib/build.mjs';
test('API template tools clone installed HTML/animations and fill text fields without accepting arbitrary markup',async()=>{
 const template=JSON.parse(fs.readFileSync(new URL('../editor/templates/cam-hung-xanh/template.json',import.meta.url))),presets=createApiPresets(template),base={source:{video:'inputs/base.mp4',duration:3},segments:[{id:'s1',in:0,out:3}],blocks:[],brand:template.brand};
 const list=presets.list(),item=list.presets.find(p=>p.id==='mo-3d');assert.equal(item.supported,true);assert.equal(item.fields.length,2);
 const input={presetId:item.id,at:0,dur:1.6,values:{0:'Xin chào',1:'ContentOS'},minhHoa:'Xin chào'};
 const candidate=await presets.insert(base,input);assert.equal(base.blocks.length,0);assert.equal(candidate.blocks.length,1);assert.match(candidate.blocks[0].html,/Xin chào/);assert.match(candidate.blocks[0].html,/ContentOS/);assert.doesNotMatch(candidate.blocks[0].html,/rồi sẽ ổn/);assert.deepEqual(candidate.blocks[0].anim,template.presets.find(p=>p.id===item.id).anim);assert.equal(candidate.blocks[0].apiPreset.templateHash,list.hash);assert.match(buildHtml(candidate,'.'),/ContentOS/);
 await assert.rejects(presets.insert(base,{...input,values:{0:'<script>',1:'x'}}),/văn bản/);await assert.rejects(presets.insert(base,{...input,values:{0:'Incomplete'}}),/đủ/);
 const behind=createApiPresets({id:'test',presets:[{id:'behind',layer:'behind',html:'<b class="t">Demo</b>',fields:[{sel:'.t'}]}]});await assert.rejects(behind.insert(base,{...input,presetId:'behind',values:{0:'new'}}),/tách nền/);
 let step=0;const result=await runApiEditor({config:{baseUrl:'https://example.com/v1',model:'fixture'},project:base,instruction:'Chèn chữ mẫu',presetContext:presets,fetcher:async(url,options)=>{step++;const body=JSON.parse(options.body);assert.equal(body.tools.length,9);return Response.json({choices:[step===1?{finish_reason:'tool_calls',message:{tool_calls:[{id:'insert',function:{name:'insert_template_preset',arguments:JSON.stringify(input)}}]}}:{finish_reason:'stop',message:{content:'Đã chèn.'}}]});}});assert.equal(result.project.blocks.length,1);
});

