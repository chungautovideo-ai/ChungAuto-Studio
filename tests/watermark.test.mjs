import test from 'node:test';import assert from 'node:assert/strict';import {normalizeWatermark,watermarkStyle} from '../editor/lib/watermark.js';import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';
test('watermark preserves AIEV proportional placement and rejects unsafe or unsupported values',()=>{
 const w=normalizeWatermark({file:'assets/logo.png',position:'bottom-right',heightPercent:5,marginPercent:4,opacity:.7});assert.match(watermarkStyle(w,1080,1920),/bottom:43px;right:43px;height:96px;width:auto;opacity:0.7/);assert.match(watermarkStyle(w,1920,1080),/bottom:77px;right:77px;height:54px/);assert.equal(watermarkStyle({...w,hidden:true},1080,1920),'');
 const meta={width:1080,height:1920,scenes:[{srcVideo:'raw.mp4',from:0,to:3}],watermark:w};assert.deepEqual(convertAievProject(meta).watermark,w);
 for(const patch of [{file:'../logo.png'},{file:'https://example.com/logo.png'},{file:'logo.svg'},{position:'center'},{heightPercent:31},{opacity:2},{other:true}])assert.throws(()=>normalizeWatermark({...w,...patch}));
});
