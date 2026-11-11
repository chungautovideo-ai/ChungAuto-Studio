import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readRenderRuns} from '../src/services/render-run-registry.mjs';

test('CLI revision conflict is a failed Activity run and preserves the prior export before taking a render lock',()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'cli-render-revision-'));
 try{
  const project=path.join(temporary,'project');fs.mkdirSync(path.join(project,'work'),{recursive:true});
  fs.writeFileSync(path.join(project,'project.json'),'{}');
  const prior=path.join(project,'work/render.json');fs.writeFileSync(prior,'previous-export');
  const child=spawnSync(process.execPath,[path.join(root,'editor/tools/xuat-video.mjs'),project,'--revision','outdated-revision'],{cwd:root,windowsHide:true,encoding:'utf8',timeout:15000});
  assert.equal(child.error,undefined);assert.equal(child.status,1);assert.match(child.stderr,/Bản dựng đã thay đổi/);
  assert.equal(fs.readFileSync(prior,'utf8'),'previous-export');
  const runs=readRenderRuns(temporary,[{dir:'project',title:'Revision failure',workspaceId:'qa'}]);
  assert.equal(runs.length,1);assert.equal(runs[0].status,'failed');
  assert.equal(fs.existsSync(path.join(project,'work/render-snapshots')),false);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
