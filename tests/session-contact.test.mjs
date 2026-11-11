import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {reportSessionContact,readSessionContact} from '../src/services/session-contact.mjs';
import {projectActivity} from '../src/services/activity.mjs';
test('session contact requires current working claimant, expires without releasing ownership and ignores previous job contact',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-contact-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const file=path.join(root,'ai-job.json'),job={workspaceId:'w',dir:'fixture',status:'working',claimedBy:{mode:'session',id:'secret',sessionId:'chat'}};
 fs.writeFileSync(file,JSON.stringify(job));const bytes=fs.readFileSync(file);
 assert.throws(()=>reportSessionContact(file,'wrong',{now:1000}),/phiên khác/);
 reportSessionContact(file,'secret',{now:1000});assert.deepEqual(fs.readFileSync(file),bytes);
 const contact=readSessionContact(file,job,{now:2000});assert.deepEqual(contact,{at:1000,state:'recent'});
 const row=projectActivity({workspaceId:'w',jobs:[{...job,sessionContact:contact}]}).entries[0];assert.equal(row.runtime,'reported');assert.doesNotMatch(JSON.stringify(row),/secret/);
 const stale=readSessionContact(file,job,{now:301001});assert.equal(stale.state,'stale');assert.equal(projectActivity({workspaceId:'w',jobs:[{...job,sessionContact:stale}]}).entries[0].runtime,'unverified');
 assert.equal(readSessionContact(file,{...job,claimedBy:{...job.claimedBy,id:'replacement'}},{now:2000}),null);
 assert.equal(readSessionContact(file,job,{now:999}),null);
 for(const updated of [{...job,status:'cancelled'},{...job,status:'done'},{...job,claimedBy:{...job.claimedBy,mode:'cli'}}]){fs.writeFileSync(file,JSON.stringify(updated));assert.throws(()=>reportSessionContact(file,'secret'));assert.equal(readSessionContact(file,updated),null);}
});
test('session contact never writes while claim/cancel gate is held',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-contact-gate-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const file=path.join(root,'ai-job.json');fs.writeFileSync(file,JSON.stringify({status:'working',claimedBy:{mode:'session',id:'claim'}}));fs.writeFileSync(file+'.claim.lock','owner');assert.throws(()=>reportSessionContact(file,'claim'),{code:'EEXIST'});assert.equal(fs.readFileSync(file+'.claim.lock','utf8'),'owner');assert.equal(fs.existsSync(path.join(root,'session-contact.json')),false);
});
