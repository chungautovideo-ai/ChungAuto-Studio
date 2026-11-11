import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {buildHtml} from '../editor/lib/build.mjs';

test('image PiP pins intrinsic frame height for portrait/wide without overriding phone and strip',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-image-pip-'));
 try{
  execFileSync('ffmpeg',['-v','error','-f','lavfi','-i','color=c=red:s=320x180','-frames:v','1',path.join(root,'red.png')],{windowsHide:true});
  const base={source:{video:'fixture.mp4',duration:3},segments:[{in:0,out:3}],brolls:[{id:'test-image',src:'red.png',at:0,dur:3,mode:'pip',frame:'glow'}],audio:{autoSfx:false}};
  const tag=p=>buildHtml(p,root).match(/<img id="test-image"[^>]+>/)[0];
  assert.match(tag(base),/height:450px/);
  assert.match(tag({...base,format:'16:9'}),/height:461.25px/);
  for(const [frame,height] of [['polaroid',481.25],['tilt',460.5],['plain',450]])assert.match(tag({...base,brolls:[{...base.brolls[0],frame}]}),new RegExp('height:'+height+'px'));
  for(const frame of ['phone','strip'])assert.doesNotMatch(tag({...base,brolls:[{...base.brolls[0],frame}]}),/height:/);
  assert.throws(()=>tag({...base,brolls:[{...base.brolls[0],src:'../red.png'}]}),/thuộc dự án/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
