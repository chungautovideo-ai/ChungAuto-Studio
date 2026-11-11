import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {buildHtml} from '../editor/lib/build.mjs';import {createRenderSnapshot} from '../src/services/render-snapshots.mjs';
test('per-title font loads local font into render snapshot while inherited title stays unchanged',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-text-font-'));
 try{
  fs.mkdirSync(path.join(root,'inputs'));fs.writeFileSync(path.join(root,'inputs/a.mp4'),'fixture');
  const project={source:{video:'inputs/a.mp4',duration:2,width:360,height:640,hasAudio:false},segments:[{id:'s',in:0,out:2,keep:true}],texts:[{id:'a',title:'ĐẸP',at:0,dur:1,fontTitle:'iCiel Panton',fontTitleVariant:'900-italic'},{id:'b',title:'GIỮ MẪU',at:1,dur:1}],audio:{autoSfx:false,sfxLevel:'tat'},brand:{fontTitle:'Anton',fontSub:'Montserrat',fontLabel:'Montserrat'}};
  const html=buildHtml(project,root);assert.match(html,/font-family:'iCiel Panton',sans-serif/);assert.match(html,/font-weight:900;font-style:italic/);assert.match(html,/assets\/fonts\/panton-black-italic.otf/);assert.match(html,/--f-title:'Anton'/);assert.equal(project.texts[1].fontTitle,undefined);
  fs.writeFileSync(path.join(root,'project.json'),JSON.stringify(project));const snapshot=await createRenderSnapshot(root);assert.ok(snapshot.manifest.assets.some(a=>a.path==='assets/fonts/panton-black-italic.otf'));assert.ok(fs.existsSync(path.join(snapshot.directory,'assets/fonts/panton-black-italic.otf')));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
