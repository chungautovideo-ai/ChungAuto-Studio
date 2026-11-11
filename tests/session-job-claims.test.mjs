import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {claimSessionJob,assertClaimOwner,reserveProjectJob,retireTerminalProjectJob} from '../src/services/session-job-claims.mjs';
const run=promisify(execFile);
test('new first-build retires only its terminal guard before replacing same-path job',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-terminal-guard-'));try{
  const dir=path.join(root,'project/work');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'ai-job.json');
  const job={status:'working',claimedBy:{id:'owner'}};fs.writeFileSync(file,JSON.stringify(job));
  assert.equal(reserveProjectJob(root,file,job,job.claimedBy),true);
  assert.equal(retireTerminalProjectJob(root,file),false);assert.ok(fs.existsSync(path.join(dir,'.ai-execution.lock')));
  fs.writeFileSync(file,JSON.stringify({...job,status:'done'}));assert.equal(retireTerminalProjectJob(root,file),true);
  fs.writeFileSync(file,JSON.stringify({status:'waiting'}));assert.equal(reserveProjectJob(root,file,{}, {id:'next'}),true);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('independent sessions contend for one job without duplicate claims, then take distinct jobs',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-claims-'));
 try{
  const file=path.join(root,'ai-job.json');const waiting={status:'waiting',execution:{mode:'session',agent:'codex'},candidate:'keep',baseRevision:'base'};
  fs.writeFileSync(file,JSON.stringify(waiting));
  const module=new URL('../src/services/session-job-claims.mjs',import.meta.url).href;
  const script=`import {claimSessionJob} from ${JSON.stringify(module)};const j=claimSessionJob(process.argv[1],{agent:'codex',sessionId:process.argv[2]});console.log(JSON.stringify(j));`;
  const results=await Promise.all(Array.from({length:6},(_,i)=>run(process.execPath,['--input-type=module','-e',script,file,'session-'+i],{windowsHide:true})));
  const winners=results.map(r=>JSON.parse(r.stdout)).filter(Boolean);assert.equal(winners.length,1);
  const saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.status,'working');assert.equal(saved.candidate,'keep');assert.equal(saved.baseRevision,'base');assert.equal(saved.claimedBy.id,winners[0].claimedBy.id);
  const other=path.join(root,'other.json');fs.writeFileSync(other,JSON.stringify(waiting));
  const second=claimSessionJob(other,{agent:'codex',sessionId:'second-session'});assert.ok(second);assert.notEqual(second.claimedBy.id,saved.claimedBy.id);
  assert.equal(claimSessionJob(file,{agent:'codex'}),null);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('different job files targeting one project share exclusion across session and API; terminal owner releases',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-project-claims-'));
 try{
  const project=path.join(root,'projects','one');fs.mkdirSync(project,{recursive:true});
  const make=(name)=>{const dir=path.join(root,'jobs',name,'work');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'ai-job.json');fs.writeFileSync(file,JSON.stringify({status:'waiting',project:'projects/one',execution:{mode:'session',agent:'codex'}}));return file;};
  const first=make('first'),second=make('second');
  const claimed=claimSessionJob(first,{root,agent:'codex',sessionId:'one'});assert.ok(claimed);
  assert.equal(claimSessionJob(second,{root,agent:'codex',sessionId:'two'}),null);
  assert.equal(reserveProjectJob(root,second,JSON.parse(fs.readFileSync(second)),{id:'api-other',mode:'api'}),false);
  assert.throws(()=>assertClaimOwner(claimed),/phiên khác/);assert.throws(()=>assertClaimOwner(claimed,'wrong'),/phiên khác/);assert.doesNotThrow(()=>assertClaimOwner(claimed,claimed.claimedBy.id));
  fs.writeFileSync(first,JSON.stringify({...claimed,status:'done'}));
  const next=claimSessionJob(second,{root,agent:'codex',sessionId:'two'});assert.ok(next);assert.notEqual(next.claimedBy.id,claimed.claimedBy.id);
  assert.throws(()=>assertClaimOwner(next,claimed.claimedBy.id));
  const independent=path.join(root,'projects','two');fs.mkdirSync(independent,{recursive:true});const third=make('third');const job=JSON.parse(fs.readFileSync(third));job.project='projects/two';fs.writeFileSync(third,JSON.stringify(job));assert.ok(claimSessionJob(third,{root,agent:'codex'}));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('claim respects agent, explicit background selection, API exclusion and existing lock',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-claims-')),file=path.join(root,'job.json');
 try{
  const write=j=>fs.writeFileSync(file,JSON.stringify(j));
  write({status:'waiting',execution:{mode:'session',agent:'claude'}});assert.equal(claimSessionJob(file,{agent:'codex'}),null);
  write({status:'waiting',background:true,execution:{mode:'cli',agent:'codex'}});assert.equal(claimSessionJob(file,{agent:'codex'}),null);
  const claimed=claimSessionJob(file,{agent:'codex',explicit:true,sessionId:'cli-one'});assert.equal(claimed.claimedBy.mode,'cli');
  write({status:'waiting',execution:{mode:'api',agent:'gateway'}});assert.equal(claimSessionJob(file,{agent:'codex',explicit:true}),null);
  write({status:'waiting'});fs.writeFileSync(file+'.claim.lock','');assert.equal(claimSessionJob(file,{agent:'codex'}),null);assert.equal(JSON.parse(fs.readFileSync(file)).status,'waiting');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('cross-process project gate excludes separate job files and preserves replaced owner uncertainty',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-project-race-'));
 try{
  fs.mkdirSync(path.join(root,'project'),{recursive:true});
  const files=Array.from({length:6},(_,i)=>{const file=path.join(root,'job-'+i+'.json');fs.writeFileSync(file,JSON.stringify({status:'waiting',project:'project'}));return file;});
  const module=new URL('../src/services/session-job-claims.mjs',import.meta.url).href;
  const script=`import {claimSessionJob} from ${JSON.stringify(module)};console.log(JSON.stringify(claimSessionJob(process.argv[1],{root:process.argv[2],agent:'codex',sessionId:process.argv[3]})));`;
  const results=await Promise.all(files.map((file,i)=>run(process.execPath,['--input-type=module','-e',script,file,root,'chat-'+i],{windowsHide:true})));
  assert.equal(results.filter(r=>JSON.parse(r.stdout)).length,1);
  const winner=files.find(file=>JSON.parse(fs.readFileSync(file)).status==='working');
  fs.writeFileSync(winner,JSON.stringify({status:'done',claimedBy:{id:'replacement'}}));
  const loser=files.find(file=>file!==winner);assert.equal(claimSessionJob(loser,{root,agent:'codex'}),null);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
