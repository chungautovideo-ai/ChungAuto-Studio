import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {normalizeSourceCrop,sourceCropStyle,croppedMediaStyle} from '../editor/lib/source-crop.js';import {convertAievProject} from '../src/services/aiev-project-adapter.mjs';import {makeTimemap,mergeContiguous} from '../editor/lib/timemap.js';import {buildHtml} from '../editor/lib/build.mjs';import {applyEditorFields} from '../src/services/api-editor.mjs';
test('source crop validates fractional insets, survives import/API and does not merge differing crops',()=>{
 assert.equal(sourceCropStyle({}), '');assert.equal(sourceCropStyle({left:.2,top:.1}),'object-view-box:inset(10% 0% 0% 20%);');
 for(const c of [{top:-.1},{left:.5},{right:'0.1'},[],{code:1}])assert.throws(()=>normalizeSourceCrop(c));
 const p=convertAievProject({width:1080,height:1920,scenes:[{srcVideo:'source.mp4',from:0,to:1,crop:{left:.2}},{srcVideo:'source.mp4',from:1,to:2}]});assert.equal(p.segments[0].crop.left,.2);assert.equal(mergeContiguous(makeTimemap(p).segs,p).length,2);
 p.source.width=640;p.source.height=360;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-crop-'));try{assert.match(buildHtml(p,dir),/clip-path:inset\(0% 0% 0% 20%\)/);const segments=structuredClone(p.segments);segments[0].crop={top:.15};assert.equal(applyEditorFields(p,{segments}).segments[0].crop.top,.15);segments[0].crop={left:.9};assert.throws(()=>applyEditorFields(p,{segments}));assert.throws(()=>buildHtml({...p,segments},dir));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('cropped source geometry fits retained region and clips excluded margins',()=>{
 const style=croppedMediaStyle({left:.4},{width:640,height:360},{width:1080,height:1920},'contain');assert.match(style,/left:-720px;top:453.75px;width:1800px;height:1012.5px/);assert.match(style,/clip-path:inset\(0% 0% 0% 40%\)/);
 assert.equal(croppedMediaStyle({}, {}, {}),null);assert.throws(()=>croppedMediaStyle({left:.2},{width:0,height:360},{width:1080,height:1920}));
});
