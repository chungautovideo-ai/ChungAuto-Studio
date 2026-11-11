import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';

async function mount({code='COLOR_NORMALIZATION_REQUIRED',normalize=true}={}){
 const nodes=[];let allowed=true,opened=0;
 function element(tag){const listeners=new Map(),n={tag,children:[],style:{},isConnected:true,disabled:false,append(...items){this.children.push(...items);},setAttribute(k,v){this[k]=v;},addEventListener(k,v){listeners.set(k,v);},showModal(){this.open=true;},close(){this.open=false;listeners.get('close')?.();},remove(){this.isConnected=false;}};nodes.push(n);return n;}
 const source=fs.readFileSync('editor/ui/contentos-shot-color.js','utf8').replace(/^import[^\n]+\n/,'').replace('export async function','async function');
 const globals={document:{createElement:element,body:element('body')},AbortController,sourceColorEffects:()=>{throw Error('No suggestions on error');}};
 vm.runInNewContext(source+'\nthis.run=openShotColor;',globals);
 await globals.run({kind:'segments',id:'s',request:async()=>({ok:false,json:async()=>({code,error:'Cần chuẩn hóa Rec.709'})}),validate:()=>{if(!allowed)throw Error('Revision đã đổi');},onApply(){throw Error('Must not apply');},...(normalize?{onNormalize:async()=>{opened++;}}:{})});
 return {nodes,setStale(){allowed=false;},opened:()=>opened};
}

test('HDR error offers explicit normalization without applying or opening it until clicked',async()=>{
 const view=await mount(),button=view.nodes.find(n=>n.textContent==='Chuẩn hóa màu nguồn…'),dialog=view.nodes.find(n=>n.tag==='dialog');
 assert.ok(button);assert.equal(view.opened(),0);assert.equal(dialog.open,true);assert.equal(view.nodes.find(n=>n.textContent==='Thay màu riêng bằng gợi ý').disabled,true);
 await button.onclick();assert.equal(view.opened(),1);assert.equal(dialog.isConnected,false);
});
test('stale project keeps recovery dialog open and does not dispatch normalization',async()=>{
 const view=await mount();view.setStale();await view.nodes.find(n=>n.textContent==='Chuẩn hóa màu nguồn…').onclick();
 assert.equal(view.opened(),0);assert.equal(view.nodes.find(n=>n.tag==='dialog').open,true);assert.ok(view.nodes.some(n=>n.textContent==='Revision đã đổi'));
});
test('other errors and callers without recovery have no normalization action',async()=>{
 for(const options of [{code:'PROJECT_CONTEXT_CONFLICT'},{normalize:false}]){const view=await mount(options);assert.equal(view.nodes.some(n=>n.textContent==='Chuẩn hóa màu nguồn…'),false);assert.equal(view.opened(),0);}
});
