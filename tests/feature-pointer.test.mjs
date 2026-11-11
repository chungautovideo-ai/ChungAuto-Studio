import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {pointerGeometry} from '../editor/ui/contentos-feature-pointer.js';
import {createApiPresets} from '../src/services/api-presets.mjs';import {buildHtml} from '../editor/lib/build.mjs';
test('pointer geometry rejects invalid coordinates and color injection',()=>{
 assert.deepEqual(pointerGeometry({px:0,py:100,lx:63,ly:85,accent:'#abcdef'}),{px:0,py:100,lx:63,ly:85,accent:'#abcdef'});
 for(const input of [{px:NaN},{py:-1},{lx:90},{ly:100},{accent:'url(secret)'}])assert.throws(()=>pointerGeometry(input));
});
test('automotive pointer presets remain editable through API and compile the real SVG draw animation',async()=>{
 const tpl=JSON.parse(fs.readFileSync(new URL('../editor/templates/chungauto-factory-quang-cao-v50/template.json',import.meta.url))),adapter=createApiPresets(tpl);
 const base={source:{video:'inputs/raw.mp4',duration:3},segments:[{id:'a',in:0,out:3}],blocks:[]};
 for(const direction of ['left','right']){
  const p=await adapter.insert(base,{presetId:'ca-detail-pointer-'+direction,at:.3,dur:2,values:{0:'Màn hình',1:'Thao tác trực tiếp'},minhHoa:'màn hình'});
  assert.equal(base.blocks.length,0);assert.doesNotMatch(p.blocks[0].css,/non-scaling-stroke/,'normalized SVG dash must not repeat in viewport units');assert.equal(p.blocks[0].anim.find(a=>a.draw).len,undefined,'runtime must set canonical pathLength');assert.match(p.blocks[0].html,/Màn hình/);assert.match(p.blocks[0].html,/data-feature-pointer/);
  const html=buildHtml(p,'.');assert.match(html,/pathlength="1"/i);assert.match(html,/"draw":\[0,1\]/);assert.match(html,/Thao tác trực tiếp/);
 }
});
