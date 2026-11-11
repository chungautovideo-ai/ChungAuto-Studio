import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {hitPlateCorner,movePlateCorner} from '../editor/ui/contentos-plate-corners.js';
const quad=[[.2,.3],[.7,.25],[.75,.5],[.25,.55]];
test('corner hit testing uses CSS pixels across mobile and desktop, with nearest corner',()=>{
 for(const width of [180,390,1280]){assert.equal(hitPlateCorner(quad,[.2+10/width,.3],width,320),0);assert.equal(hitPlateCorner(quad,[.2+16/width,.3],width,320),-1);}
 assert.equal(hitPlateCorner(quad,[.5,.4],0,320),-1);
});
test('corner move returns independent valid tilted geometry and rejects crossed or outside',()=>{
 const before=structuredClone(quad),result=movePlateCorner(quad,0,[.15,.32]);assert.deepEqual(quad,before);assert.deepEqual(result.quad[0],[.15,.32]);assert.deepEqual(result.quad.slice(1),quad.slice(1));assert.equal(result.roi[0],.15);
 for(const at of [[.9,.8],[-.1,.3],[NaN,.3]])assert.throws(()=>movePlateCorner(quad,0,at));assert.throws(()=>movePlateCorner(quad,4,[.1,.2]));
});
test('production pointer callbacks drag one corner, reject invalid moves, ignore other pointers and restore on cancel',()=>{
 const code=fs.readFileSync('editor/ui/contentos-plate-privacy.js','utf8'),start=code.indexOf(' canvas.onpointerdown='),end=code.indexOf(' const dispose=',start);assert.ok(start>0&&end>start);
 const roi=[.2,.25,.55,.3],original=[...roi],quadMap=new Map([[roi,structuredClone(quad)]]);let synced=0,captured=false;
 const canvas={getBoundingClientRect:()=>({width:200,height:320}),setPointerCapture:()=>captured=true,hasPointerCapture:()=>captured,releasePointerCapture:()=>captured=false};
 const context=vm.createContext({canvas,roi,quadMap,ready:true,busy:false,drag:null,quadDetails:{open:true},corners:r=>quadMap.get(r),point:e=>e.at,hitPlateCorner,movePlateCorner,sync:()=>synced++,state:{textContent:''}});
 vm.runInContext(code.slice(start,end),context);
 const event=(at,pointerId=1)=>({at,pointerId,button:0,isPrimary:true});
 canvas.onpointerdown(event(quad[0]));canvas.onpointermove(event([.1,.35],2));assert.equal(synced,0);
 canvas.onpointermove(event([.15,.32]));assert.equal(synced,1);assert.deepEqual(quadMap.get(roi)[0],[.15,.32]);
 const valid=structuredClone(quadMap.get(roi));canvas.onpointermove(event([.9,.8]));assert.deepEqual(quadMap.get(roi),valid);assert.equal(synced,1);
 canvas.onpointercancel(event([.9,.8]));assert.deepEqual(roi,original);assert.deepEqual(JSON.parse(JSON.stringify(quadMap.get(roi))),quad);assert.equal(captured,false);
 canvas.onpointerdown(event(quad[0]));canvas.onpointermove(event([.16,.31]));canvas.onpointerup(event([.16,.31]));assert.deepEqual(quadMap.get(roi)[0],[.16,.31]);assert.equal(captured,false);
 context.busy=true;canvas.onpointerdown(event([.16,.31]));assert.equal(context.drag,null);
});
test('production pointer callbacks retain drawing a rectangle and restore it if capture is lost',()=>{
 const code=fs.readFileSync('editor/ui/contentos-plate-privacy.js','utf8'),start=code.indexOf(' canvas.onpointerdown='),end=code.indexOf(' const dispose=',start);
 const roi=[.1,.1,.3,.2],original=[...roi],quadMap=new Map(),canvas={getBoundingClientRect:()=>({width:200,height:320}),setPointerCapture:()=>{},hasPointerCapture:()=>false};let changes=0;
 const context=vm.createContext({canvas,roi,quadMap,ready:true,busy:false,drag:null,quadDetails:{open:false},corners:()=>[[.1,.1],[.4,.1],[.4,.3],[.1,.3]],point:e=>e.at,hitPlateCorner,movePlateCorner,sync:()=>changes++,state:{textContent:''}});
 vm.runInContext(code.slice(start,end),context);
 const e=(at)=>({at,pointerId:1,button:0,isPrimary:true});
 canvas.onpointerdown({...e([.2,.3]),button:2});assert.equal(context.drag,null);
 canvas.onpointerdown(e([.2,.3]));canvas.onpointermove(e([.6,.7]));assert.equal(changes,1);assert.deepEqual(roi,[.2,.3,.6-.2,.7-.3]);assert.equal(quadMap.size,0);
 canvas.onlostpointercapture(e([.6,.7]));assert.deepEqual(roi,original);assert.equal(context.drag,null);
});
