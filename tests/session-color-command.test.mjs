import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {sessionColorCommand} from '../src/services/session-color-command.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'session-color-')),dir=path.join(root,'project'),work=path.join(dir,'work');fs.mkdirSync(path.join(work,'build-candidates','token','work'),{recursive:true});const live=path.join(dir,'project.json'),candidate=path.join(work,'build-candidates','token','work','candidate-project.json'),jobFile=path.join(work,'ai-job.json');fs.writeFileSync(live,JSON.stringify({segments:[]}));fs.writeFileSync(candidate,JSON.stringify({segments:[],title:'candidate'}));const job={status:'working',candidate:'project/work/build-candidates/token/work/candidate-project.json',completionToken:'token',baseRevision:projectRevision(live),claimedBy:{id:'claim'}};fs.writeFileSync(jobFile,JSON.stringify(job));return {root,dir,live,candidate,job,jobFile,close:()=>fs.rmSync(root,{recursive:true,force:true})};}
const adapter=(project)=>({project:{...project,converted:true},result:{path:'inputs/color/normalized.mp4',warnings:[]}});
test('session color writes only claimed candidate with apply; listing and dry processing leave both JSONs intact',async()=>{
 const f=fixture();try{const before=fs.readFileSync(f.live),original=fs.readFileSync(f.candidate);const createContext=()=>({list:()=>[{path:'assets/luts/a.cube'}],apply:async p=>adapter(p)}),options={createContext};
 assert.equal((await sessionColorCommand(f.root,'project',{claimId:'claim',list:true},options)).luts.length,1);
 assert.equal((await sessionColorCommand(f.root,'project',{claimId:'claim'},options)).appliedToCandidate,false);assert.deepEqual(fs.readFileSync(f.candidate),original);
 const done=await sessionColorCommand(f.root,'project',{claimId:'claim',apply:true},options);assert.equal(done.appliedToCandidate,true);assert.equal(JSON.parse(fs.readFileSync(f.candidate)).converted,true);assert.deepEqual(fs.readFileSync(f.live),before);assert.ok(!fs.existsSync(f.candidate+'.color-command.lock'));
 }finally{f.close();}
});
test('session color refuses missing/wrong owner, stale live revision and candidate outside staged location',async()=>{
 const f=fixture();try{const opts={createContext:()=>{throw Error('must not call renderer');}};await assert.rejects(sessionColorCommand(f.root,'project',{claimId:'other'},opts),/phiên khác/);await assert.rejects(sessionColorCommand(f.root,'project',{},opts),/claim/);
 fs.appendFileSync(f.live,' ');await assert.rejects(sessionColorCommand(f.root,'project',{claimId:'claim'},opts),/thay đổi/);
 f.job.baseRevision=projectRevision(f.live);f.job.candidate='project/project.json';fs.writeFileSync(f.jobFile,JSON.stringify(f.job));await assert.rejects(sessionColorCommand(f.root,'project',{claimId:'claim'},opts),/Sai candidate/);
 }finally{f.close();}
});
test('cancel, candidate change and competing command cannot overwrite work during conversion',async()=>{
 for(const change of ['cancel','candidate','abort']){const f=fixture();try{const controller=new AbortController(),original=fs.readFileSync(f.candidate);const options={createContext:()=>({apply:async p=>{if(change==='cancel')fs.writeFileSync(f.jobFile,JSON.stringify({...f.job,status:'cancelled'}));if(change==='candidate')fs.writeFileSync(f.candidate,JSON.stringify({newer:true}));if(change==='abort')controller.abort();return adapter(p);}})};
 await assert.rejects(sessionColorCommand(f.root,'project',{claimId:'claim',apply:true,signal:controller.signal},options));assert.ok(!fs.existsSync(f.candidate+'.color-command.lock'));assert.deepEqual(fs.readFileSync(f.candidate),change==='candidate'?Buffer.from(JSON.stringify({newer:true})):original);
 }finally{f.close();}}
 const f=fixture();let release,started;const begun=new Promise(r=>started=r);try{const options={createContext:()=>({apply:async p=>{started();await new Promise(r=>release=r);return adapter(p);}})};const first=sessionColorCommand(f.root,'project',{claimId:'claim',apply:true},options);await begun;await assert.rejects(sessionColorCommand(f.root,'project',{claimId:'claim',apply:true},options),/đang có lượt/);release();await first;}finally{f.close();}
});
