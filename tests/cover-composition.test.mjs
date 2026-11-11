import test from 'node:test';import assert from 'node:assert/strict';
import {coverFromAievImage,normalizeCoverComposition} from '../editor/lib/cover-composition.js';
test('cover maps background AIEV text explicitly and validates optional subtitle/CTA without accepting extra metadata',()=>{
 const item={source:{app:'aiev-image',role:'background',overlay:{title:'Review',subtitle:'Sản phẩm mới',cta:'Xem ngay',position:'bottom-left'}}};
 assert.deepEqual(coverFromAievImage(item),{title:'Review',subtitle:'Sản phẩm mới',cta:'Xem ngay',pos:'bot',align:'left',stats:[]});
 assert.equal(coverFromAievImage({...item,source:{...item.source,role:'final'}}),null);
 const base={title:'Review',size:130,pos:'top',look:'mau'};assert.deepEqual(normalizeCoverComposition(base),base);
 assert.deepEqual(normalizeCoverComposition({...base,subtitle:'sub',cta:'cta',apiKey:'ignored'}),{...base,subtitle:'sub',cta:'cta'});
 for(const fields of [{subtitle:1},{subtitle:'x'.repeat(1001)},{cta:'x'.repeat(201)},{cta:null}])assert.throws(()=>normalizeCoverComposition({...base,...fields}));
});
test('cover retains editable AIEV statistics and all nine text anchors with bounded validation',()=>{
 const base={title:'Review',size:130,pos:'top',look:'mau'},stats=[{label:'Bảo hành',value:'24 tháng'}];
 for(const vertical of ['top','middle','bottom'])for(const align of ['left','center','right']){
  const converted=coverFromAievImage({source:{app:'aiev-image',role:'background',overlay:{position:vertical+'-'+align,stats}}});
  assert.equal(converted.align,align);assert.equal(converted.pos,{top:'top',middle:'mid',bottom:'bot'}[vertical]);assert.deepEqual(converted.stats,stats);
  assert.deepEqual(normalizeCoverComposition({...base,...converted}).stats,stats);
 }
 for(const value of [{align:'start'},{stats:Array(13).fill(stats[0])},{stats:[{value:'x',label:3}]},{stats:[{label:'x',value:'x'.repeat(101)}]}])assert.throws(()=>normalizeCoverComposition({...base,...value}));
 assert.throws(()=>coverFromAievImage({source:{app:'aiev-image',role:'background',overlay:{stats:Array(13).fill(stats[0])}}}),/12/);
});
