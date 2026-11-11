import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {resolveCompletionOutput} from '../src/services/completion-output.mjs';
import {fingerprintArtifact,verifyArtifactAsync} from '../src/services/artifact-integrity.mjs';
test('completion download binds job, workspace, snapshot, local artifact and integrity',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-completion-output-')),dir='workspace/content/day/project',project=path.join(root,dir),snapshotId='11111111-1111-4111-8111-111111111111',snapshot=path.join(project,'work/render-snapshots',snapshotId);
 try{
 fs.mkdirSync(snapshot,{recursive:true});fs.mkdirSync(path.join(project,'renders'));const write=(file,data)=>fs.writeFileSync(file,JSON.stringify(data));
 const output=path.join(project,'renders/final.mp4');fs.writeFileSync(output,Buffer.alloc(100,7));
 const metadata={...fingerprintArtifact(output),output,ok:true,quality:'final',snapshotId,revision:'r1'};write(output+'.json',metadata);write(path.join(snapshot,'result.json'),metadata);write(path.join(project,'project.json'),{workspaceId:'a'});
 const file=path.join(project,'work/ai-job.json'),job={status:'done',completionState:'exported',exportSnapshotId:snapshotId,appliedRevision:'r1'};write(file,job);
 const artifact=resolveCompletionOutput(root,dir,'a');assert.equal(artifact.output,fs.realpathSync(output));await verifyArtifactAsync(artifact.output,artifact.metadata,{validate:artifact.validate});
 assert.throws(()=>resolveCompletionOutput(root,dir,'b'),/workspace/);assert.throws(()=>resolveCompletionOutput(root,'../outside','a'),/đường dẫn/);
 assert.throws(()=>resolveCompletionOutput(root,dir,'a','old-snapshot'),/đã đổi/);
 write(file,{...job,appliedRevision:'r2'});assert.throws(artifact.validate,/đã đổi/);assert.throws(()=>resolveCompletionOutput(root,dir,'a'),/không khớp/);write(file,job);
 fs.appendFileSync(output,'changed');await assert.rejects(verifyArtifactAsync(output,metadata),/thay đổi/);
 write(path.join(snapshot,'result.json'),{...metadata,output:path.join(root,'foreign.mp4')});fs.writeFileSync(path.join(root,'foreign.mp4'),Buffer.alloc(100));assert.throws(()=>resolveCompletionOutput(root,dir,'a'),/ngoài kho/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
