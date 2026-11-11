import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';
import {fingerprintArtifact} from '../src/services/artifact-integrity.mjs';
const root=process.cwd(),base='http://127.0.0.1:5197',folder='workspace/content/ContentOS-Smoke-Output-'+crypto.randomUUID(),dir=folder+'/fixture',project=path.join(root,dir),snapshotId=crypto.randomUUID(),snapshot=path.join(project,'work/render-snapshots',snapshotId),delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5197'],{windowsHide:true,stdio:'ignore'});
try{
 for(let i=0;i<80;i++){try{if((await fetch(base+'/api/ping')).ok)break;}catch{}await delay(100);}
 const workspaceId=(await (await fetch(base+'/api/v1/workspaces')).json()).activeId;
 fs.mkdirSync(snapshot,{recursive:true});fs.mkdirSync(path.join(project,'renders'));const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data));
 const output=path.join(project,'renders/final.mp4'),bytes=Buffer.alloc(128,5);fs.writeFileSync(output,bytes);const metadata={...fingerprintArtifact(output),output,ok:true,quality:'final',snapshotId,revision:'fixture-revision'};write(output+'.json',metadata);write(path.join(snapshot,'result.json'),metadata);write(path.join(project,'project.json'),{workspaceId});write(path.join(project,'work/ai-job.json'),{status:'done',completionState:'exported',exportSnapshotId:snapshotId,appliedRevision:metadata.revision});
 const url=base+'/api/v1/activity/output?dir='+encodeURIComponent(dir)+'&snapshot='+snapshotId;
 const downloaded=await fetch(url);assert.equal(downloaded.status,200);assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()),bytes);
 assert.equal((await fetch(url.replace(snapshotId,crypto.randomUUID()))).status,409);
 fs.appendFileSync(output,'changed');assert.equal((await fetch(url)).status,409);fs.writeFileSync(output,bytes);
 write(path.join(project,'project.json'),{workspaceId:'different-workspace'});assert.equal((await fetch(url)).status,409);
 assert.equal((await fetch(base+'/api/v1/activity/output?dir=..%2Foutside&snapshot='+snapshotId)).status,409);
 fs.writeFileSync('docs/COMPLETION_OUTPUT_API_SMOKE.json',JSON.stringify({actualHttpEndpoint:true,syntheticBytesOnly:true,downloadMatches:true,staleSnapshotRejected:true,corruptFileRejected:true,foreignWorkspaceRejected:true,traversalRejected:true,noProviderOrRender:true},null,2));console.log('PASS: completion download and stale/corrupt/workspace/path guards.');
}finally{server.kill();fs.rmSync(path.join(root,folder),{recursive:true,force:true});}
