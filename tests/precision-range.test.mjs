import test from 'node:test';import assert from 'node:assert/strict';
import {precisionRangeControl} from '../editor/ui/contentos-precision-range.js';
function element(tag,attrs={},...children){
 const listeners=new Map(),attributes=new Map(Object.entries(attrs));
 return {tag,children,value:String(attrs.value??''),attrs:attributes,setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k),addEventListener:(name,fn)=>listeners.set(name,fn),fire(name,event={}){listeners.get(name)?.(event);}};
}
test('precision control synchronizes numeric and slider values without writing blank/NaN or no-op values',()=>{
 const values=[],control=precisionRangeControl({h:element,label:'Sáng da',value:25,onChange:n=>values.push(n)}),[slider,number]=control.children;
 number.value='';number.fire('input');assert.deepEqual(values,[]);assert.equal(number.attrs.get('aria-invalid'),'true');number.fire('blur');assert.equal(number.value,'25');
 number.value='NaN';number.fire('input');assert.deepEqual(values,[]);let prevented=false;number.fire('keydown',{key:'Escape',preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(number.value,'25');
 number.value='45';number.fire('input');assert.deepEqual(values,[45]);assert.equal(slider.value,'45');assert.equal(number.attrs.has('aria-invalid'),false);
 slider.value='60';slider.fire('input');assert.equal(number.value,'60');assert.deepEqual(values,[45,60]);number.fire('input');assert.deepEqual(values,[45,60]);
 number.value='999';number.fire('input');assert.equal(number.value,'100');number.value='-1';number.fire('input');assert.equal(slider.value,'0');number.value='20.6';number.fire('input');assert.equal(number.value,'21');
 assert.deepEqual(values,[45,60,100,0,21]);assert.equal(number.attrs.get('aria-label'),'Giá trị · Sáng da');
});
test('precision control disables both input paths when mask is missing and does not mutate before callback succeeds',()=>{
 let calls=0;const [slider,number]=precisionRangeControl({h:element,label:'Người',disabled:true,value:17,onChange:()=>calls++}).children;
 assert.equal(slider.attrs.get('disabled'),true);assert.equal(number.attrs.get('disabled'),true);number.value='30';number.fire('input');slider.value='25';slider.fire('input');assert.equal(calls,0);
 const [s,n]=precisionRangeControl({h:element,label:'Người',value:17,onChange(){throw Error('revision đổi');}}).children;n.value='25';assert.throws(()=>n.fire('input'),/revision/);n.fire('blur');assert.equal(n.value,'17');assert.equal(s.value,'17');
});

test('a deliberate zero creates an inherited scope override even if the displayed inherited level is already zero',()=>{
 const calls=[],[slider,number]=precisionRangeControl({h:element,label:'Da',value:0,commitEqualValue:true,onChange:n=>calls.push(n)}).children;
 number.value='';number.fire('input');assert.deepEqual(calls,[]);number.value='0';number.fire('input');assert.deepEqual(calls,[0]);assert.equal(slider.value,'0');number.fire('input');assert.deepEqual(calls,[0]);
});
