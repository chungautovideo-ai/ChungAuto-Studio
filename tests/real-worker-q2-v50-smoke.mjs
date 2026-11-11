import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

// Explicit opt-in: launches the configured Codex CLI; its provider/account settings remain unchanged.
assert.ok(process.argv.includes('--run-local-codex'),'Pass --run-local-codex to launch the real local worker.');
const root=process.cwd(),base='http://127.0.0.1:5193',source='workspace/content/2026-11-04/contentos-qa-realworkerq2',expectPreflightFailure=process.argv.includes('--expect-preflight-failure'),freshAsr=process.argv.includes('--fresh-asr');
const fullBroll=process.argv.includes('--full-broll');
const helperPass=process.argv.includes('--helper-pass');
const brollRoot=path.resolve(root,'../source/broll');
const fullFiles={den:'broll_den.mp4',man:'broll_manhinh.mp4',ghe:'broll_gheda.mp4',mau:'broll_danphim.mp4'};
if(fullBroll)for(const name of Object.values(fullFiles))assert.ok(fs.existsSync(path.join(brollRoot,name)),`Missing authorized local source: ${name}`);
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5193'],{windowsHide:true,stdio:'ignore'});
let original,dir,terminal;
async function call(route,body){const response=await fetch(base+route,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await response.json();assert.ok(response.ok,JSON.stringify(value));return value;}
try{
 for(let n=0;n<80;n++){try{await call('/api/ping');break;}catch{await delay(100);}}
 original=(await call('/api/v1/workspaces')).activeId;
 await call('/api/v1/workspaces',{name:'Real Codex Q2 QA '+Date.now()});
 const response=await fetch(base+'/api/new-project?file=qa.mp4&name=ContentOS-QA-Real-Codex-Q2&noasr=1',{method:'POST',body:fs.readFileSync(path.join(source,'inputs/raw.mp4'))});
 const created=await response.json();assert.ok(response.ok,JSON.stringify(created));dir=created.dir;
 for(const name of Object.keys(fullFiles))fs.copyFileSync(fullBroll?path.join(brollRoot,fullFiles[name]):path.join(source,'inputs',name+'.mp4'),path.join(dir,'inputs',name+'.mp4'));
 if(!freshAsr)fs.copyFileSync(path.join(source,'work/transcript.json'),path.join(dir,'work/transcript.json'));
 const inputTranscriptMissing=!fs.existsSync(path.join(dir,'work/transcript.json'));
 const startedAt=new Date().toISOString();
 await call('/api/ai-job',{dir,template:'chungauto-factory-quang-cao-v50',execution:{mode:'cli',agent:'codex'},background:true,completionMode:'review',trim:true,fx:'vua',sfxLevel:'vua',automotiveOptions:{color:'keep',beauty:'off',watermark:'off',cta:'off',music:'keep',sfx:'vua'},assets:['den','man','ghe','mau'].map(name=>({path:'inputs/'+name+'.mp4',note:'QA local; xem hình thật trước khi chọn, không suy từ tên.'})),note:(freshAsr?'Chưa có transcript: tự nhận giọng tiếng Việt local bằng công cụ app trước khi dựng, không dùng transcript từ dự án khác. ':'Transcript nhập sẵn từ QA cũ, không nhận là đã tự ASR. ')+'QA local video ChungAuto Q2 giới thiệu3mảng theo lời nguồn. Dựng khoảng90–110giây tùy bỏ vấp/lặp, hook/chữ nhấn/graphic theo mẫu. Khảo sát hình thật tư liệu đèn/màn/ghế/đổi màu trước chèn đúng ý. Không dùng cảnh để chứng minh khác sản phẩm. Nhạc kit ambient-pad nhẹ, duck theo giọng, SFX ít. Không làm đẹp/màu/logo/outro/CTA; không tải stock/tạo AI/đăng/xuất. Chỉ sửa candidate dự án này, không sửa code app hoặc dự án khác; không gọi model/agent phụ. Đọc skill snapshot và dùng preset có sẵn, hoàn tất đúng claim hoặc fail rõ lý do.'});
 console.log(JSON.stringify({dir,startedAt,state:'submitted',scope:freshAsr?'real local Codex, fresh local Vietnamese ASR, copied QA assets':'real local Codex, imported transcript, copied QA assets'}));
 const started=Date.now();
 while(true){
  terminal=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json')));
  if(['done','error','cancelled'].includes(terminal.status))break;
  if(Date.now()-started>30*60*1000)throw Error('Observation limit reached; inspect the live worker before any stop or restart.');
  if(Math.floor((Date.now()-started)/1000)%30===0)console.log(JSON.stringify({dir,status:terminal.status,elapsedSeconds:Math.floor((Date.now()-started)/1000)}));
  await delay(1000);
 }
 const project=JSON.parse(fs.readFileSync(path.join(dir,'project.json')));
 const transcript=freshAsr?JSON.parse(fs.readFileSync(path.join(dir,'work/transcript.json'))):null;if(freshAsr){assert.equal(inputTranscriptMissing,true);assert.equal(transcript.engine,'whisper.cpp');assert.equal(transcript.language,'vi');assert.ok(transcript.words.length>40);assert.ok(Date.parse(transcript.createdAt)>=Date.parse(startedAt));}
 const logFile=path.join(dir,'work/ai-run.log'),log=fs.existsSync(logFile)?fs.readFileSync(logFile,'utf8'):'';
 const evidence={helperPass,fullBroll,freshAsr,inputTranscriptMissing,...(transcript?{transcript:{engine:transcript.engine,language:transcript.language,words:transcript.words.length,createdAt:transcript.createdAt}}:{}),dir,startedAt,finishedAt:new Date().toISOString(),status:terminal.status,error:terminal.error||null,completionState:terminal.completionState||null,template:terminal.template,segments:project.segments?.length,texts:project.texts?.length,blocks:project.blocks?.length,brolls:project.brolls?.length,audio:project.audio,helperMentions:{presets:log.includes('chen-preset.mjs'),timing:log.includes('kiem-ban-dung.mjs')},scope:freshAsr?'Real Codex worker with fresh Vietnamese local ASR and copied QA sources. Not NAS intake or full audiovisual acceptance.':'Real local Codex worker with imported transcript/local copied assets; not autonomous ASR/NAS or full audiovisual acceptance.'};
 if(expectPreflightFailure){
  assert.equal(terminal.status,'error');assert.equal(terminal.errorCode,'CLI_EXEC_UNAVAILABLE');assert.equal(fs.existsSync(path.join(dir,'work/ai-run.log')),false);
  evidence.errorCode=terminal.errorCode;evidence.noModelLog=true;evidence.preflightOnly=true;
 }
 fs.writeFileSync(helperPass?'docs/REAL_WORKER_Q2_V50_HELPERS.json':fullBroll?'docs/REAL_WORKER_Q2_V50_FULL_BROLL.json':expectPreflightFailure?'docs/CLI_SANDBOX_PREFLIGHT_HTTP_SMOKE.json':freshAsr?'docs/REAL_WORKER_Q2_V50_FRESH_ASR.json':'docs/REAL_WORKER_Q2_V50_EXECUTION.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
 if(!expectPreflightFailure){assert.equal(terminal.status,'done',terminal.error);assert.equal(terminal.completionState,'awaiting-review');}
 assert.equal(fs.existsSync(path.join(dir,'work/render.json')),false);
}finally{
 // Never stop a live model worker just because observation timed out.
 const current=dir&&fs.existsSync(path.join(dir,'work/ai-job.json'))?JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'))):null;
 if(!current||['done','error','cancelled'].includes(current.status)){
  if(original)await call('/api/v1/workspaces/active',{id:original}).catch(()=>{});
  server.kill();
 }else console.error('Worker still live; keep QA server and workspace for follow-up: '+dir);
}
