import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

assert.ok(process.argv.includes('--run-local-codex'),'Pass --run-local-codex to launch the configured local worker.');
const source='workspace/content/2026-11-05/contentos-qa-broll-timing';
const base='http://127.0.0.1:5193',delay=ms=>new Promise(r=>setTimeout(r,ms));
// Isolated server and copied QA inputs; never mutate a user project.
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5193'],{windowsHide:true,stdio:'ignore'});
let original,jobDir,dir;
async function call(route,body,headers={}){
 const r=await fetch(base+route,body===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
 const j=await r.json();assert.ok(r.ok,JSON.stringify(j));return j;
}
try{
 for(let i=0;i<80;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 original=(await call('/api/v1/workspaces')).activeId;
 await call('/api/v1/workspaces',{name:'Real Codex preset QA '+Date.now()});
 const r=await fetch(base+'/api/new-project?file=qa.mp4&name=ContentOS-QA-Real-Codex-Preset&noasr=1',{method:'POST',body:fs.readFileSync(path.join(source,'inputs/raw.mp4'))});
 const created=await r.json();assert.ok(r.ok);dir=created.dir;
 for(const name of ['den','man','ghe','mau'])fs.copyFileSync(path.join(source,'inputs',name+'.mp4'),path.join(dir,'inputs',name+'.mp4'));
 fs.copyFileSync(path.join(source,'work/transcript.json'),path.join(dir,'work/transcript.json'));
 const live=path.join(dir,'project.json'),createdProject=JSON.parse(fs.readFileSync(live)),old=JSON.parse(fs.readFileSync(path.join(source,'project.json')));
 const before={...old,workspaceId:createdProject.workspaceId,contentos:createdProject.contentos};
 assert.equal(before.template.id,'chungauto-factory-quang-cao-v50');
 fs.writeFileSync(live,JSON.stringify(before));
 const current=await call('/api/project'),startedAt=new Date().toISOString();
 const queued=await call('/api/ai-revise',{instruction:'Bài QA bản copy: chỉ thêm đúng một preset ca-hook tại at=3, dur=2, values.title="NÂNG CẤP XE", values.sub="Chọn đúng nhu cầu", minhHoa="xe". Bắt buộc dùng node editor/tools/chen-preset.mjs <việc> --claim ID: đọc danh mục lấy candidateRevision, ghi work/preset-request.json, dryrun rồi --apply với revision đó. Không tự tạo text/HTML bằng tay, không đọc renderer hay toàn template.json để điền mẫu. Sau chèn dùng kiem-ban-dung kiểm cấu trúc. Giữ nguyên tất cả camera, nguồn, brolls, nhạc, SFX, captions, segments và mọi text/block cũ. Không chạy model/agent phụ, không xuất/đăng. Hoàn tất đúng claim ở review; báo rõ chưa xem/nghe nếu chưa kiểm được.',execution:{mode:'cli',agent:'codex'},completionMode:'review'},{'X-ContentOS-Project':dir,'X-ContentOS-Revision':current.revision});
 jobDir=queued.job.dir;console.log(JSON.stringify({project:dir,job:jobDir,startedAt,state:'submitted'}));
 let state;const start=Date.now();
 while(true){
  state=JSON.parse(fs.readFileSync(path.join(jobDir,'work/ai-job.json')));
  if(['done','error','cancelled'].includes(state.status))break;
  if(Date.now()-start>15*60*1000)throw Error('Observation limit: preserve live worker/server.');
  await delay(1000);
 }
 assert.equal(state.status,'done');assert.equal(state.completionState,'awaiting-review');
 const saved=JSON.parse(fs.readFileSync(live));assert.equal(saved.texts.length,before.texts.length+1);
 assert.deepEqual(saved.texts.slice(0,-1),before.texts);
 const added=saved.texts.at(-1);assert.equal(added.title,'NÂNG CẤP XE');assert.equal(added.sub,'Chọn đúng nhu cầu');assert.equal(added.at,3);assert.equal(added.dur,2);
 const baseline=structuredClone(before),comparison=structuredClone(saved);delete baseline.texts;delete comparison.texts;assert.deepEqual(comparison,baseline);
 const log=fs.readFileSync(path.join(jobDir,'work/ai-run.log'),'utf8');
 assert.ok(log.includes('chen-preset.mjs'));assert.ok(log.includes('--apply'));
 const evidence={project:dir,job:jobDir,startedAt,finishedAt:new Date().toISOString(),status:state.status,completion:state.completionState,modelTested:true,helperUsed:true,exactlyOneTextAdded:true,existingFieldsUnchanged:true,added:{id:added.id,title:added.title,sub:added.sub,at:added.at,dur:added.dur,apiPreset:added.apiPreset},rendered:fs.existsSync(path.join(dir,'work/render.json')),limits:'Targeted real Codex insertion only; no measured token benchmark, continuous video/audio review or final render acceptance.'};
 assert.equal(evidence.rendered,false);
 fs.writeFileSync('docs/REAL_CODEX_PRESET_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{
 const jf=jobDir&&path.join(jobDir,'work/ai-job.json'),state=jf&&fs.existsSync(jf)?JSON.parse(fs.readFileSync(jf)):null;
 if(!state||['done','error','cancelled'].includes(state.status)){
  if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});
  server.kill();
 }else console.error('Live worker preserved: '+jobDir);
}
