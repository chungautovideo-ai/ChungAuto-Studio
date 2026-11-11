import fs from 'node:fs';import vm from 'node:vm';import test from 'node:test';import assert from 'node:assert/strict';
import {mergePersonPromptPoints} from '../editor/ui/contentos-person-prompt-points.js';
const code=fs.readFileSync('editor/ui/contentos-person-selection.js','utf8');
const section=(from,to)=>{const start=code.indexOf(from),end=code.indexOf(to,start);assert.ok(start>=0&&end>start);return code.slice(start,end);};
function mount(){
 const nodes=new Map();const q=key=>{if(!nodes.has(key))nodes.set(key,{value:key==='[data-mode]'?'1':'0'});return nodes.get(key);};
 const context=vm.createContext({readOnly:false,busy:false,loaded:true,result:null,closed:false,generation:0,runtimeReady:true,points:[],pointUndo:[],mergePersonPromptPoints,q,src:'inputs/qa.mp4',canvas:{width:100,height:100,getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})},ctx:{clearRect:()=>{}},validate:()=>{},seek:async()=>{},draw:()=>{},status:()=>{},load:()=>{},request:async()=>({ok:true,json:async()=>({result:{points:[[.4,.2,1],[.5,.5,1],[.6,.8,1]],warning:'Kiểm lại.'}})})});
 vm.runInContext(section('function rememberPoints(){',' const status='),context);
 vm.runInContext(section('function controls(){',' function draw(){'),context);
 vm.runInContext(section('canvas.onpointerdown=',' q(\'[data-frame]\').oninput='),context);
 vm.runInContext(section("q('[data-suggest]').onclick="," q('[data-track]').onclick="),context);
 vm.runInContext(section('function invalidate(){',' for(const s of'),context);
 return {context,q,click:(x,y)=>context.canvas.onpointerdown({clientX:x,clientY:y}),points:()=>JSON.parse(JSON.stringify(context.points)),undo:()=>q('[data-point-undo]').onclick()};
}
test('point undo reverses one manual touch or a complete suggestion batch, preserving earlier prompts',async()=>{
 const v=mount();v.click(40,20);v.q('[data-mode]').value='0';v.click(90,40);const before=v.points();
 await v.q('[data-suggest]').onclick();assert.equal(v.points().length,4);assert.equal(v.context.pointUndo.length,3);
 await v.undo();assert.deepEqual(v.points(),before);await v.undo();assert.deepEqual(v.points(),[[.4,.2,1]]);await v.undo();assert.deepEqual(v.points(),[]);assert.equal(v.q('[data-point-undo]').disabled,true);
});
test('clear can be undone only on the initial frame; failed seek or revision keeps undo state',async()=>{
 const v=mount();v.click(30,40);v.click(50,60);const before=v.points();let seeks=0;v.context.seek=async time=>{assert.equal(time,0);seeks++;};
 await v.q('[data-clear]').onclick();assert.deepEqual(v.points(),[]);await v.undo();assert.deepEqual(v.points(),before);assert.equal(seeks,2);
 const length=v.context.pointUndo.length;v.context.seek=async()=>{throw Error('seek failed');};await v.undo();assert.deepEqual(v.points(),before);assert.equal(v.context.pointUndo.length,length);
 v.context.seek=async()=>{};v.context.validate=()=>{throw Error('stale');};await v.undo();assert.deepEqual(v.points(),before);assert.equal(v.context.pointUndo.length,length);
});
test('readonly, busy and tracking result block undo; changing range drops point history',async()=>{
 const v=mount();v.click(40,20);const before=v.points();for(const [name,value] of [['readOnly',true],['busy',true],['result',{selection:{}}]]){v.context[name]=value;await v.undo();assert.deepEqual(v.points(),before);v.context[name]=name==='result'?null:false;}
 v.context.invalidate();assert.deepEqual(v.points(),[]);assert.equal(v.context.pointUndo.length,0);assert.equal(v.q('[data-point-undo]').disabled,true);
});
test('unchanged suggestions add no undo step and history is bounded and detached',async()=>{
 const v=mount();v.click(40,20);await v.q('[data-suggest]').onclick();const length=v.context.pointUndo.length;await v.q('[data-suggest]').onclick();assert.equal(v.context.pointUndo.length,length);
 for(let i=0;i<90;i++)v.context.rememberPoints();assert.equal(v.context.pointUndo.length,64);const last=v.context.pointUndo.at(-1)[0][0];v.context.points[0][0]=.9;assert.equal(v.context.pointUndo.at(-1)[0][0],last);
});
