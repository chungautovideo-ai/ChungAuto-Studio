import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:5180';
const request=async(url,body,headers={})=>{
  const response=await fetch(base+url,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
};
const original=(await request('/api/v1/workspaces')).body;
const dir='workspace/content/2026-11-03/contentos-smoke-4';
const snapshot=JSON.parse(fs.readFileSync(new URL('../'+dir+'/project.json',import.meta.url),'utf8'));
assert.match(snapshot.title,/ContentOS/);
const evidence={};
try{
  await request('/api/v1/workspaces/active',{id:snapshot.workspaceId});
  assert.equal((await request('/api/open',{dir})).status,200);
  const project=(await request('/api/project')).body;
  const headers={'X-ContentOS-Project':dir,'X-ContentOS-Revision':project.revision};
  const input={instruction:'QA queue only; do not run AI',idempotencyKey:'queue-smoke-'+Date.now()};
  const created=await request('/api/v1/tasks',input,headers);assert.equal(created.status,201);
  evidence.created={id:created.body.id,status:created.body.status,revision:created.body.revision};
  assert.equal(created.body.snapshot.title,snapshot.title);
  assert.equal((await request('/api/v1/tasks',input,headers)).body.id,created.body.id);
  evidence.dedup=true;
  assert.equal((await request('/api/v1/tasks',{...input,instruction:'different'},headers)).status,409);
  assert.equal((await request('/api/v1/tasks',{...input,idempotencyKey:'stale'},{...headers,'X-ContentOS-Revision':'stale'})).status,409);
  evidence.staleRejected=true;
  assert.equal((await request('/api/v1/tasks/'+created.body.id+'/cancel',{})).body.status,'cancelled');
  assert.equal((await request('/api/v1/tasks/'+created.body.id+'/retry',{})).body.status,'queued');
  await request('/api/v1/tasks/'+created.body.id+'/cancel',{});
  evidence.cancelRetry=true;
  assert.deepEqual(JSON.parse(fs.readFileSync(new URL('../'+dir+'/project.json',import.meta.url),'utf8')),snapshot);
  evidence.projectUnchanged=true;
}finally{await request('/api/v1/workspaces/active',{id:original.activeId});}
fs.writeFileSync(new URL('../docs/TASK_QUEUE_API_SMOKE.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
console.log(evidence);
