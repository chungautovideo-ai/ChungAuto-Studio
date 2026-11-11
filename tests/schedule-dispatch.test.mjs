import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {scheduleDispatch,scheduleJobState} from '../src/services/schedule-dispatch.mjs';

test('schedule dispatch survives recreation without replacing running or terminal jobs',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-dispatch-'));
 try{
  const first=scheduleDispatch(root,'schedule-a').commit({status:'waiting',createdAt:'2026-11-04',channels:[{id:'fixture'}]});
  assert.equal(first.created,true);
  const file=path.join(root,first.job.dir,'work/ai-job.json');
  assert.deepEqual(fs.readdirSync(path.dirname(file)),['ai-job.json']);
  for(const status of ['waiting','working','done','error','cancelled']){
   const expected={...first.job,status,error:status==='error'?'fixture failure':undefined};
   fs.writeFileSync(file,JSON.stringify(expected));
   const recovered=scheduleDispatch(root,'schedule-a').commit({status:'waiting',channels:[]});
   assert.equal(recovered.created,false);assert.deepEqual(recovered.job,JSON.parse(JSON.stringify(expected)));
   assert.equal(scheduleJobState(recovered.job).status,status==='done'?'xong':['error','cancelled'].includes(status)?'loi':'dang');
  }
  assert.throws(()=>scheduleJobState({status:'unknown'}),/không xác định/);
  assert.throws(()=>scheduleDispatch(root,'../escape'),/không hợp lệ/);
  fs.writeFileSync(file,'{broken');assert.throws(()=>scheduleDispatch(root,'schedule-a').commit({status:'waiting'}));assert.equal(fs.readFileSync(file,'utf8'),'{broken');
  fs.writeFileSync(file,JSON.stringify({...first.job,scheduleId:'other'}));assert.throws(()=>scheduleDispatch(root,'schedule-a').commit({status:'waiting'}),/không khớp/);
 }finally{await fs.promises.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});

test('simultaneous processes publish one complete schedule job without overwrite',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-dispatch-race-'));
 try{
  const moduleUrl=new URL('../src/services/schedule-dispatch.mjs',import.meta.url).href;
  const script=`import {scheduleDispatch} from ${JSON.stringify(moduleUrl)};while(Date.now()<Number(process.argv[2])){};const result=scheduleDispatch(process.argv[1],'same-schedule').commit({status:'waiting',writer:process.pid,payload:'x'.repeat(100000)});console.log(JSON.stringify({created:result.created,writer:result.job.writer}));`;
  const start=String(Date.now()+900);
  const run=()=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',script,root,start],{windowsHide:true});let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);child.on('error',reject);child.on('close',code=>{if(code!==0)return reject(new Error(err));try{resolve(JSON.parse(out));}catch(error){reject(error);}});});
  const results=await Promise.all([run(),run(),run(),run()]);
  assert.equal(results.filter(item=>item.created).length,1);assert.equal(new Set(results.map(item=>item.writer)).size,1);
  const job=scheduleDispatch(root,'same-schedule').read();assert.equal(job.payload.length,100000);assert.equal(job.writer,results[0].writer);
  assert.deepEqual(fs.readdirSync(path.join(root,job.dir,'work')),['ai-job.json']);
 }finally{await fs.promises.rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
});
