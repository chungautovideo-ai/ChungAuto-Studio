import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
assert.ok(process.argv.includes('--run-local-codex'),'Explicit --run-local-codex required.');
const base='http://127.0.0.1:5193',delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5193'],{windowsHide:true,stdio:'ignore'});
let original,dir,jobDir;
async function call(route,body,headers={}){
 const r=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{'Connection':'close',...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const value=await r.json();assert.ok(r.ok,JSON.stringify(value));return value;
}
try{
 for(let i=0;i<80;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 original=(await call('/api/v1/workspaces')).activeId;
 await call('/api/v1/workspaces',{name:'Selected HTML CLI QA '+Date.now()});
 const r=await fetch(base+'/api/new-project?file=qa.mp4&name=ContentOS-QA-Selected-HTML&noasr=1',{method:'POST',headers:{Connection:'close'},body:fs.readFileSync('workspace/cache/face-q2-sample.mp4')});
 const created=await r.json();assert.ok(r.ok);dir=created.dir;
 const live=path.join(dir,'project.json'),before=JSON.parse(fs.readFileSync('workspace/content/2026-11-05/contentos-qa-component-routing-3/project.json')),shell=JSON.parse(fs.readFileSync(live));
 before.workspaceId=shell.workspaceId;before.contentos=shell.contentos;before.template={id:'chungauto-factory-quang-cao-v50',name:'Creative v50',version:50};
 before.blocks[0].name='Lợi ích ngành xe';before.blocks[0].html='<div class="qa">NÂNG CẤP XE</div>';
 fs.writeFileSync(live,JSON.stringify(before));
 const current=await call('/api/project');
 const startedAt=new Date().toISOString();
 const queued=await call('/api/ai-revise',{instruction:'Chỉ đổi chữ hiển thị của mục đang chọn thành AN TÂM MỖI CHUYẾN ĐI. Giữ nguyên markup và class, CSS, name, ID, mốc thời gian và mọi dữ liệu khác. Không sửa chữ ở mảng khác dù trùng ID. Không thêm thành phần, không xuất/đăng. Dự án QA đã đủ thông tin, không cần đọc media/renderer hoặc chạy agent phụ. Kiểm candidate rồi hoàn tất ở chế độ review.',context:{selection:{group:'blocks',id:'same'}},execution:{mode:'cli',agent:'codex'},completionMode:'review'},{'X-ContentOS-Project':dir,'X-ContentOS-Revision':current.revision});
 jobDir=queued.job.dir;console.log(JSON.stringify({project:dir,job:jobDir,state:'submitted',startedAt}));
 const file=path.join(jobDir,'work/ai-job.json');let state;const started=Date.now();
 while(true){state=JSON.parse(fs.readFileSync(file));if(['done','error','cancelled'].includes(state.status))break;if(Date.now()-started>900000)throw Error('Observation limit; preserve live worker/server.');await delay(1000);}
 assert.equal(state.status,'done');assert.equal(state.completionState,'awaiting-review');
 assert.equal(state.selectedItem.group,'blocks');assert.equal(state.selectedItem.id,'same');assert.match(state.selectedItem.version,/^[a-f0-9]{64}$/);
 const saved=JSON.parse(fs.readFileSync(live)),expected=structuredClone(before);expected.blocks[0].html='<div class="qa">AN TÂM MỖI CHUYẾN ĐI</div>';
 assert.deepEqual(saved,expected);assert.equal(fs.existsSync(path.join(dir,'work/render.json')),false);
 const evidence={project:dir,job:jobDir,startedAt,finishedAt:new Date().toISOString(),status:state.status,completion:state.completionState,actualCodex:true,selectedItem:state.selectedItem,duplicateCrossArrayId:true,onlySelectedHTMLTextChanged:true,noRender:true,scope:'One selected HTML text revision on copied1sQA; not fullvideo/editor UI/paid API validation.'};
 fs.writeFileSync('docs/REAL_CODEX_SELECTED_HTML_SMOKE.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
}finally{
 const file=jobDir&&path.join(jobDir,'work/ai-job.json'),state=file&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;
 if(!state||['done','error','cancelled'].includes(state.status)){if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});server.kill();}
 else console.error('Live worker preserved: '+jobDir);
}
