import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {buildHtml,resolveTimeline} from '../editor/lib/build.mjs';import {CUT_TRANSITIONS,VFX_TYPES} from '../editor/lib/brand.js';import {applyTemplate} from '../editor/lib/template.js';
test('VEK1079 effects compile with ContentOS source zoom extensions retained',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-vek1079-'));
 try{
  const tpl=JSON.parse(fs.readFileSync('editor/templates/review-06/template.json'));
  let p=applyTemplate({title:'QA',format:'9:16',source:{video:'inputs/source.mp4',width:1080,height:1920,duration:4,hasAudio:false},segments:[{id:'a',in:0,out:1,keep:true},{id:'b',in:2,out:3,keep:true,tIn:'spin'}],camera:{scale:1,x:0,y:0},vfx:[{id:'pixel',type:'pixel',at:.2,dur:.4,amount:.7}],texts:[],blocks:[],brolls:[],scenes:[],zooms:[],audio:{autoSfx:false,sfxLevel:'tat',music:'',sfx:[]}},tpl,{restyle:false});p.captions.enabled=false;p.audio.autoSfx=false;p.audio.sfxLevel='tat';
  const html=buildHtml(p,root);assert.match(html,/id="fxPix"/);assert.match(html,/id="fxPixP"/);assert.match(html,/c.type === "glare"/);assert.match(html,/c.type === "spin"/);assert.match(html,/c.type === "zoomblur"/);assert.match(html,/E.sourceZooms/);
  assert.equal(resolveTimeline(p).vfx[0].type,'pixel');assert.equal(p.template.id,'review-06');for(const key of ['spin','zoomblur','glare'])assert.ok(CUT_TRANSITIONS.some(([id])=>id===key));assert.ok(VFX_TYPES.some(([id])=>id==='pixel'));
  p.vfx=[];assert.doesNotMatch(buildHtml(p,root),/id="fxPix"/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
