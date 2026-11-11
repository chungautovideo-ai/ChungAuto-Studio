import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {previewMigration} from '../src/services/migration-preview.mjs';
test('migration inventory recognizes three metadata formats without leaking credentials or changing source',t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-migration-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const root=path.join(base,'contentos');fs.mkdirSync(root);
 fs.mkdirSync(path.join(root,'config'));fs.writeFileSync(path.join(root,'config/sources.local.json'),JSON.stringify({studioJobsRoot:path.join(base,'chungauto-studio/studio/data/jobs')}));
 const fixtures=[['video-edit-kit','workspace/content/2026-11-04/one/project.json',{title:'VEK <title>',source:{video:'inputs/raw.mp4'},segments:[],apiKey:'private'}],['AIEVv2','video-projects/two/meta.json',{name:'AIEV',brief:{secret:'private'}}],['chungauto-studio','studio/data/jobs/three/job.json',{title:'Studio',token:'private'}]];
 for(const [app,relative,data] of fixtures){const file=path.join(base,app,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data));}
 const report=previewMigration(root,'one');assert.deepEqual(report.sources.map(s=>s.entries.length),[1,1,1]);assert.equal(report.readOnly,true);assert.equal(report.sources[0].entries[0].canImport,true);assert.ok(report.sources.slice(1).every(s=>s.entries[0].canImport===false));assert.equal(report.sources[0].entries[0].format,'vek-project');assert.ok(!JSON.stringify(report).includes('private'));
 for(const [app,relative,data] of fixtures)assert.deepEqual(JSON.parse(fs.readFileSync(path.join(base,app,relative),'utf8')),data);
 fs.writeFileSync(path.join(base,fixtures[1][0],fixtures[1][1]),'{broken');assert.equal(previewMigration(root,'one').sources[1].issues.length,1);
 assert.throws(()=>previewMigration(root,'../bad'));
});
