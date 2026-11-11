import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeEndCard,END_CARD_DEFAULT,endCardHtml} from '../editor/lib/end-card.js';import {makeTimemap} from '../editor/lib/timemap.js';import {buildHtml,resolveTimeline} from '../editor/lib/build.mjs';import {applyAutomotiveOptions} from '../editor/lib/automotive-options.js';import {runApiEditor,applyEditorFields} from '../src/services/api-editor.mjs';
test('optional end card extends final timeline without shifting source clocks or source overlays',()=>{
 const base={source:{video:'inputs/raw.mp4',duration:4,hasAudio:true},segments:[{id:'s',in:1,out:3,speed:2}],texts:[{id:'t',title:'Keep',at:2,dur:4}],audio:{music:'',sfxLevel:'tat'}},project={...base,endCard:{...END_CARD_DEFAULT,enabled:true,duration:3,title:'Liên hệ tư vấn',contact:'0901 234 567'}};
 const before=makeTimemap(base),tm=makeTimemap(project);assert.equal(before.total,1);assert.equal(tm.contentTotal,1);assert.equal(tm.total,4);assert.equal(tm.srcToOut(3),1);assert.equal(tm.srcToOut(30),1);assert.equal(tm.outToSrc(3),3);assert.equal(tm.srcToOut(2),before.srcToOut(2));
 const resolved=resolveTimeline(project);assert.equal(resolved.texts[0].dur,.5);const html=buildHtml(project,'.');assert.match(html,/id="root"[^>]+data-duration="4"/);assert.match(html,/id="contentos-end-card" data-start="1" data-duration="3"/);assert.match(html,/id="a0"[^>]+data-duration="1"/);assert.ok(html.includes('Liên hệ tư vấn'));assert.ok(html.includes('endCard.start'));assert.ok(!buildHtml(base,'.').includes('id="contentos-end-card"'));
 const off=applyAutomotiveOptions(project,{cta:'off'});assert.equal(off.endCard.enabled,false);assert.equal(makeTimemap(off).total,1);assert.deepEqual(base.segments,project.segments);
 const edited=applyEditorFields(base,{endCard:project.endCard});assert.equal(edited.endCard.duration,3);assert.throws(()=>applyEditorFields(base,{endCard:{...project.endCard,logo:'inputs/logo.png'}}),/inspect_media/);assert.ok(applyEditorFields(base,{endCard:{...project.endCard,logo:'inputs/logo.png'}},{media:[{src:'inputs/logo.png',kind:'image'}]}).endCard.logo);
});
test('end card validates typed fields and local images and escapes text for both frame ratios',()=>{
 for(const value of [{enabled:'yes'},{enabled:true,title:''},{duration:0},{duration:13},{title:'x'.repeat(61)},{accent:'red'},{logo:'inputs/../private.png'},{logo:'https://remote/logo.png'},{html:'<p>'}])assert.throws(()=>normalizeEndCard(value));
 for(const [W,H] of [[1080,1920],[1920,1080]]){const html=endCardHtml({endCard:{enabled:true,title:'Xe & dịch vụ',subtitle:'Chất lượng',contact:'example.vn'}},2,W,H);assert.match(html,/Xe &amp; dịch vụ/);assert.match(html,/overflow-wrap:anywhere/);}
 assert.equal(endCardHtml({},0,1080,1920),'');
});

test('API worker exposes endCard object schema and applies requested ending while preserving footage',async()=>{
 const project={source:{video:'inputs/raw.mp4',duration:2},segments:[{id:'s',in:0,out:2}],audio:{music:''}};let step=0;
 const result=await runApiEditor({project,instruction:'Them doan ket 2 giay',config:{baseUrl:'https://gateway.example/v1',model:'fixture'},fetcher:async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.tools.find(t=>t.function.name==='set_edit_fields').function.parameters.properties.fields.properties.endCard.type,'object');step++;return Response.json({choices:[step===1?{finish_reason:'tool_calls',message:{tool_calls:[{id:'set',type:'function',function:{name:'set_edit_fields',arguments:JSON.stringify({fields:{endCard:{enabled:true,duration:2,title:'Lien he tu van'}}})}}]}}:{finish_reason:'stop',message:{content:'Da them outro'}}]});}});
 assert.equal(makeTimemap(result.project).total,4);assert.deepEqual(result.project.segments,project.segments);assert.equal(project.endCard,undefined);
});
