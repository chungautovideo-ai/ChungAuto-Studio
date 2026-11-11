import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {registerRenderRun,readRenderRuns} from '../src/services/render-run-registry.mjs';import {projectActivity} from '../src/services/activity.mjs';
test('CLI export registry keeps prior render status, scopes projections and never equates missing PID with completion',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'render-run-'));try{
  const dir=path.join(root,'project');fs.mkdirSync(path.join(dir,'work'),{recursive:true});const prior=path.join(dir,'work/render.json');fs.writeFileSync(prior,'previous-export');
  const r=registerRenderRun(dir,{quality:'draft'});const projects=[{dir:'project',workspaceId:'a',title:'Car'}];let runs=readRenderRuns(root,projects);assert.equal(runs.length,1);assert.equal(fs.readFileSync(prior,'utf8'),'previous-export');
  const project=(options={})=>projectActivity({workspaceId:'a',renderRuns:runs,isPidAlive:()=>true,...options}).entries[0];assert.equal(project().runtime,'queued');assert.equal(project().waitReason,'cli-render-capacity');
  assert.equal(project({isPidAlive:()=>false}).runtime,'unverified');r.update({status:'running',progress:42});runs=readRenderRuns(root,projects);assert.equal(project().runtime,'unverified');assert.equal(project({renderOwner:{pid:process.pid,ownerAlive:true}}).runtime,'active');
  assert.equal(project({renderOwner:{pid:process.pid,ownerAlive:true}}).progress,42);assert.equal(project().progress,null);assert.equal(project({isPidAlive:()=>false,renderOwner:{pid:process.pid,ownerAlive:true}}).progress,null);
  for(const value of [NaN,Infinity,'42']){runs[0].progress=value;assert.equal(project({renderOwner:{pid:process.pid,ownerAlive:true}}).progress,null);}runs[0].progress=120;assert.equal(project({renderOwner:{pid:process.pid,ownerAlive:true}}).progress,99);
  r.update({status:'succeeded'});runs=readRenderRuns(root,projects);assert.equal(project({isPidAlive:()=>false}).runtime,'terminal');assert.doesNotMatch(JSON.stringify(project()),/"pid"|quality|render-runs/);
  assert.equal(projectActivity({workspaceId:'b',renderRuns:runs}).entries.length,0);registerRenderRun(dir,{quality:'final',managed:true});assert.equal(readRenderRuns(root,projects).length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
