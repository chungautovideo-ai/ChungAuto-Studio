import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync,execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
test('legacy tracker rejects lost/cut tracks without writing, retains valid track and refuses multi-source/candidate jobs',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-motion-'));
 try{
  for(const kind of ['stable','lost','segments','candidate','range']){
   const dir=path.join(folder,kind);fs.mkdirSync(path.join(dir,'inputs'),{recursive:true});
   const file=path.join(dir,'project.json'),project={format:'16:9',source:{video:'inputs/raw.mp4',duration:1},blocks:[{id:'label'}]};
   if(kind==='segments')project.source.timeline='segments';
   fs.writeFileSync(file,JSON.stringify(project));const before=fs.readFileSync(file);
   if(kind==='candidate'){fs.mkdirSync(path.join(dir,'work'));fs.writeFileSync(path.join(dir,'work/ai-job.json'),JSON.stringify({status:'working',candidate:'candidate.json'}));}
   if(['stable','lost','range'].includes(kind)){
    const args=kind==='lost'?['-f','lavfi','-i','testsrc=size=1920x1080:rate=6:duration=0.5','-f','lavfi','-i','color=black:size=1920x1080:rate=6:duration=0.5','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0']:['-f','lavfi','-i','testsrc=size=1920x1080:rate=6','-t','1'];
    execFileSync('ffmpeg',['-v','error','-y',...args,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p',path.join(dir,'inputs/raw.mp4')],{windowsHide:true});
   }
   const out=spawnSync(process.execPath,['editor/tools/theo-doi.mjs',dir,'--box','50,50,500,500','--from','0','--to',kind==='range'?'16':'1','--fps','6','--block','label'],{cwd:root,encoding:'utf8',windowsHide:true,timeout:30000});
   if(kind==='stable'){assert.equal(out.status,0,out.stderr);assert.equal(JSON.parse(fs.readFileSync(file)).blocks[0].follow.length,6);}
   else{assert.equal(out.status,1,out.stderr);assert.deepEqual(fs.readFileSync(file),before);if(kind==='lost')assert.match(out.stderr,/Mất dấu/);}
  }
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
});
