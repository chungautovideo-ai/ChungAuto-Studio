import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5180';
async function request(url, body, method = 'POST') {
  const r = await fetch(base + url, body === undefined ? {} : {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const value = await r.json(); assert.ok(r.ok, JSON.stringify(value)); return value;
}
assert.equal((await request('/api/ping')).app, 'contentos');
const original = await request('/api/v1/workspaces');
const w = await request('/api/v1/workspaces', {name:'Kiểm thử editor ' + Date.now(),industry:'Kiểm thử',brand:'ContentOS QA'});
const upload = await fetch(base + '/api/new-project?file=fixture.mp4&name=ContentOS-Smoke&noasr=1', {method:'POST',body:fs.readFileSync(new URL('./fixture.mp4',import.meta.url))});
const created = await upload.json(); assert.ok(upload.ok, JSON.stringify(created));
assert.ok(created.ok);
const project = await request('/api/project');
assert.equal(project.project.workspaceId, w.id);
assert.equal(project.project.contentos.brandSnapshot, 'ContentOS QA');
assert.ok(project.project.source.duration > 0);
assert.ok((await request('/api/projects')).projects.some(p => p.dir === created.dir));
project.project.title = 'ContentOS · kiểm thử sửa và lưu';
const save=await fetch(base+'/api/project',{method:'PUT',headers:{'Content-Type':'application/json','X-ContentOS-Project':created.dir,'X-ContentOS-Revision':project.revision},body:JSON.stringify(project.project)});
assert.ok(save.ok,await save.text());
assert.equal((await request('/api/project')).project.title, project.project.title);
const composition = await (await fetch(base + '/p/index.html')).text();
assert.ok(composition.includes('<html'));
const runtime = await fetch(base + '/hf/runtime.js'); assert.ok(runtime.ok);
await request('/api/v1/workspaces/active',{id:original.activeId});
assert.ok(!(await request('/api/projects')).projects.some(p=>p.dir === created.dir));
await request('/api/v1/workspaces/active',{id:w.id});
console.log(JSON.stringify({ok:true,dir:created.dir,workspaceId:w.id,checks:['upload/probe','workspace stamp','open editor API','save/reload','composition build','HyperFrames runtime served','workspace list filter']},null,2));
