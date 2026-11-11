import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {precisionRangeControl} from '../editor/ui/contentos-precision-range.js';
import {normalizePersonSourceAdjustments,resolvePersonSourceAdjustment} from '../editor/lib/person-source-adjustments.js';

// Exercise production form wiring without claiming native browser/focus coverage.
function mount(rangeScope,to,sourceFields={}){
 const p={camera:{beauty:{}},segments:[],brolls:[]},b=p.camera.beauty,src='inputs/person.mp4',sha256='a'.repeat(64);
 if(rangeScope)b.personSelections=[{src,sha256,from:0,...(to===undefined?{}:{to}),fps:1,f:[1,1]}];
 const range=b.personSelections?.[0],nodes=[];
 function h(tag,attrs={},...children){
  const listeners=new Map(),node={tag,...attrs,children:children.flat().filter(v=>v!=null),value:String(attrs.value??''),hidden:!!attrs.hidden,append(...items){this.children.push(...items.flat());},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];},addEventListener(k,v){listeners.set(k,v);},fire(k){listeners.get(k)?.({});}};
  Object.defineProperty(node,'options',{get(){return this.children.filter(v=>v?.tag==='option');}});nodes.push(node);return node;
 }
 let snapshots=0,updates=0,renders=0;
 const S={dir:'qa',revision:1,faceContext:JSON.stringify(['qa',1,[],[]]),face:{scanned:true,bodySources:1,bodySourceDetails:[{src,sha256,...sourceFields}]},beautySource:src,beautyRange:range?`${src}|${sha256}|0|${to??2}`:''};
 const globals={scanFaceNow:()=>{},S,P:()=>p,h,personCoverageControls:()=>h('coverage'),field:(label,control)=>h('field',{label},control),BEAUTY:[['Người & da toàn thân',[['personLight','Sáng riêng người'],['bodyWhite','Sáng da'],['bodySmooth','Mịn da']]]],LIP_COLORS:[],precisionRangeControl,normalizePersonSourceAdjustments,resolvePersonSourceAdjustment,suggestPersonExposure:()=>({available:false,reason:'QA'}),snapshot:()=>snapshots++,beautyChanged:()=>updates++,renderList:()=>renders++};
 const code=fs.readFileSync('editor/ui/app.js','utf8'),start=code.indexOf('function beautyForm(box) {'),end=code.indexOf('// ===================== Lịch sử',start);
 vm.runInNewContext(code.slice(start,end)+'\nbeautyForm(h("box"));',globals);
 return {b,range,nodes,stats:()=>({snapshots,updates,renders})};
}

for(const rangeScope of [false,true])test(`beauty ${rangeScope?'range':'source'} reset appears on first edit without replacing controls`,()=>{
 const view=mount(rangeScope),reset=view.nodes.find(n=>n.tag==='button'&&n.children.includes(rangeScope?'Dùng mức nguồn cho khoảng này':'Dùng mức chung cho nguồn này'));
 assert.ok(reset);assert.equal(reset.hidden,true);
 const input=view.nodes.find(n=>n.tag==='input'&&n.type==='number'&&n['aria-label']==='Giá trị · Sáng da');
 input.value='0';input.fire('input');assert.equal(reset.hidden,false);assert.deepEqual(view.stats(),{snapshots:1,updates:1,renders:0});
 if(rangeScope){assert.equal(view.range.adjustments.bodyWhite,0);const option=view.nodes.find(n=>n.tag==='option'&&n.value.endsWith('|0|2'));assert.match(option.textContent,/mức riêng/);assert.equal(view.b.sourceAdjustments,undefined);}
 else assert.equal(view.b.sourceAdjustments[0].bodyWhite,0);
 input.value='30';input.fire('input');assert.equal(reset.hidden,false);assert.deepEqual(view.stats(),{snapshots:2,updates:2,renders:0});
 reset.onclick();assert.deepEqual(view.stats(),{snapshots:3,updates:3,renders:1});
 if(rangeScope)assert.equal(view.range.adjustments,undefined);else assert.equal(view.b.sourceAdjustments.length,0);
});

test('beauty form displays and edits the explicit endpoint without rounding up to sample coverage',()=>{
 const view=mount(true,1.8),option=view.nodes.find(n=>n.tag==='option'&&n.value.endsWith('|0|1.8'));
 assert.ok(option);assert.match(option.children.join(''),/0.00–1.80/);
 const input=view.nodes.find(n=>n.tag==='input'&&n.type==='number'&&n['aria-label']==='Giá trị · Sáng da');
 input.value='25';input.fire('input');assert.equal(view.range.to,1.8);assert.equal(view.range.adjustments.bodyWhite,25);
 assert.match(option.textContent,/0.00–1.80.*mức riêng/);
});

test('beauty form uses verified server suggestions and never rebuilds them from saved unverified luma',()=>{
 const exposure={version:1,method:'display-luma-semantic-mask',person:{samples:10,median:.1,spread:0,highlight:.2},skin:null};
 for(const source of [{exposure},{exposure,suggestion:{available:false,code:'COLOR_NORMALIZATION_REQUIRED',reason:'Chuẩn hóa HDR trước'}}]){
  const view=mount(false,undefined,source);assert.ok(!view.nodes.some(n=>n.tag==='button'&&n.children.some(c=>typeof c==='string'&&c.startsWith('Áp dụng gợi ý'))));assert.deepEqual(view.stats(),{snapshots:0,updates:0,renders:0});
 }
 const view=mount(false,undefined,{exposure,suggestion:{available:true,personLight:20,bodyWhite:0,samples:10,reason:'Verified SDR'}}),apply=view.nodes.find(n=>n.tag==='button'&&n.children.some(c=>typeof c==='string'&&c.startsWith('Áp dụng gợi ý')));assert.ok(apply);apply.onclick();assert.equal(view.b.sourceAdjustments[0].personLight,20);assert.deepEqual(view.stats(),{snapshots:1,updates:1,renders:1});
});
