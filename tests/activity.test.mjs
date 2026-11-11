import test from 'node:test';import assert from 'node:assert/strict';
import {projectActivity,projectResourceActivity} from '../src/services/activity.mjs';
test('activity projects workspace-safe state and requires current worker evidence, never reveals job input',()=>{
 const tasks=[{id:'one',workspaceId:'a',kind:'render-batch',status:'running',updatedAt:20,project:'workspace/content/day/one',snapshot:{secret:'private',items:[{title:'Bản một'}]},checkpoint:{progress:45,completed:[{index:0,dir:'workspace/content/day/one',output:'private'}]},leaseToken:'secret-token'},{id:'two',workspaceId:'a',kind:'revise',status:'running',updatedAt:10},{id:'other',workspaceId:'b',status:'running'}];
 const result=projectActivity({workspaceId:'a',tasks,jobs:[{workspaceId:'a',dir:'work/old',status:'working',note:'private',createdAt:'2026-11-01'},{workspaceId:'b',dir:'hidden'}],isActive:(kind,id)=>id==='one',limit:2,now:0});
 assert.equal(result.total,3);assert.equal(result.truncated,true);assert.equal(result.entries[0].runtime,'unverified');assert.equal(result.entries[1].runtime,'active');assert.equal(result.entries[1].progress,45);assert.equal(result.entries[1].outputs[0].download,'/api/v1/tasks/one/output?index=0');assert.deepEqual(result.entries[1].actions,['cancel']);assert.doesNotMatch(JSON.stringify(result),/secret-token|private|hidden/);
 assert.equal(projectActivity({workspaceId:'a',tasks:[tasks[1]]}).entries[0].runtime,'unverified');
 const waiting=projectActivity({workspaceId:'a',jobs:[{workspaceId:'a',dir:'job',status:'waiting'}]}).entries[0];assert.equal(waiting.runtime,'queued');assert.deepEqual(waiting.actions,[]);
});
test('activity exposes execution identity without claiming session liveness or leaking extra fields',()=>{
 const result=projectActivity({workspaceId:'a',jobs:[{workspaceId:'a',dir:'job',status:'working',execution:{mode:'session',agent:'codex',key:'secret'},claimedBy:{mode:'session',agent:'codex',sessionId:'chat-one',id:'private-claim',token:'private-token'}}]});
 assert.equal(result.entries[0].runtime,'unverified');assert.deepEqual(result.entries[0].execution,{mode:'session',agent:'codex',model:null,sessionId:'chat-one'});assert.doesNotMatch(JSON.stringify(result),/secret|private-claim|private-token/);
 const agy=projectActivity({workspaceId:'a',jobs:[{workspaceId:'a',dir:'job-agy',status:'working',execution:{mode:'session',agent:'antigravity'},claimedBy:{mode:'session',agent:'antigravity',sessionId:'agy-conv-1',id:'private-claim'}}]});
 assert.deepEqual(agy.entries[0].execution,{mode:'session',agent:'antigravity',model:null,sessionId:'agy-conv-1'});
});

test('activity exposes only verified allowlisted waiting reasons and distinguishes chat sessions',()=>{
 const jobs=['capacity','paused','project-busy','recovery','dispatch','secret','session','working'].map(dir=>({workspaceId:'a',dir,status:dir==='working'?'working':'waiting',execution:{mode:dir==='session'?'session':'api'}}));
 const result=projectActivity({workspaceId:'a',jobs,waitingReason:dir=>dir==='secret'?'private-path-key':dir});
 for(const reason of ['capacity','paused','project-busy','recovery','dispatch','session'])assert.equal(result.entries.find(item=>item.project===reason).waitReason,reason);
 assert.equal(result.entries.find(item=>item.project==='secret').waitReason,null);
 assert.equal(result.entries.find(item=>item.project==='working').waitReason,null);
 assert.doesNotMatch(JSON.stringify(result),/private-path-key/);
});
test('activity reports bounded API phase only for a verified active worker',()=>{
 const job={workspaceId:'a',dir:'job',status:'working',apiProgress:{phase:'Nhận lời thoại: Đang chờ lượt nhận giọng trên máy…',private:'hidden'}};
 assert.equal(projectActivity({workspaceId:'a',jobs:[job]}).entries[0].phase,null);
 const row=projectActivity({workspaceId:'a',jobs:[job],isActive:()=>true}).entries[0];assert.match(row.phase,/chờ lượt nhận giọng/);assert.doesNotMatch(JSON.stringify(row),/hidden/);
 assert.equal(projectActivity({workspaceId:'a',jobs:[{...job,apiProgress:{phase:'x'.repeat(300)}}],isActive:()=>true}).entries[0].phase.length,180);
});
test('completion export stays queued/running until verified final result; errors require attention',()=>{
 const job={workspaceId:'a',dir:'job',status:'done',completionState:'export-started',exportPid:123,apiProgress:{phase:'old phase'}};
 const row=options=>projectActivity({workspaceId:'a',jobs:[job],...options}).entries[0];
 assert.equal(row({}).runtime,'unverified');
 assert.equal(row({isActive:()=>true}).runtime,'active');assert.doesNotMatch(row({isActive:()=>true}).phase,/old/);
 assert.equal(row({isActive:()=>true,exportWaiting:()=>true}).runtime,'queued');assert.equal(row({isActive:()=>true,exportWaiting:()=>true}).waitReason,'render-capacity');
 const failed=projectActivity({workspaceId:'a',jobs:[{...job,completionState:'export-error',exportError:'Render failed'}]}).entries[0];assert.equal(failed.status,'export-error');assert.equal(failed.error,'Render failed');
 assert.equal(projectActivity({workspaceId:'a',jobs:[{...job,completionState:'awaiting-review'}]}).entries[0].status,'awaiting-review');
 const held=projectActivity({workspaceId:'a',jobs:[{...job,completionState:'awaiting-review',completionReviewReason:'Cần kiểm bản che'}]}).entries[0];assert.equal(held.phase,'Cần kiểm bản che');assert.equal(held.runtime,'terminal');
});
test('resource summary exposes only workspace project title, never lock identity or host paths',()=>{
 const root=process.cwd(),render={ownerAlive:true,projectDir:root+'/workspace/content/day/p',pid:123,id:'private-token'};
 const result=projectResourceActivity({root,render,asr:{initializing:true},projects:[{dir:'workspace/content/day/p',title:'Video A'}]});assert.deepEqual(result,{render:{state:'busy',projectTitle:'Video A'},asr:{state:'unverified'}});assert.doesNotMatch(JSON.stringify(result),/private-token|workspace|123/);
 assert.equal(projectResourceActivity({root,render,projects:[]}).render.projectTitle,null);assert.equal(projectResourceActivity({root}).asr.state,'idle');
});
