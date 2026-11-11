import {visionPythonStatus} from '../src/services/vision-python.mjs';
import {presetPythonStatus} from '../src/services/preset-python.mjs';
import {personRuntimeStatus} from '../src/services/person-runtime.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import os from 'node:os';
import {prepareTools} from '../editor/lib/system.mjs';
import {whisperStatus} from '../editor/lib/whisper.mjs';
import {HF} from '../editor/lib/hf.mjs';
import {findRenderBrowser} from '../src/services/render-browser.mjs';
import {remotionRuntime} from '../src/services/remotion-scenes.mjs';

// Read-only diagnostics: never install, start services or change startup settings.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--person')||args.filter(arg=>arg==='--person').length>1){console.error('Dùng: node installer/doctor.mjs [--person]');process.exit(1);}
const personRequested=args.includes('--person');
const require=createRequire(path.join(root,'editor/package.json'));
const checks=[];
const add=(id,ready,required,detail)=>checks.push({id,ready,required,detail});
add('node',Number(process.versions.node.split('.')[0])>=22,true,process.versions.node);
const media=prepareTools(root);
for(const name of ['ffmpeg','ffprobe']){
 const result=spawnSync(name,['-version'],{encoding:'utf8',windowsHide:true,timeout:5000,maxBuffer:65536});
 add(name,media[name]&&result.status===0,true,(result.stdout||'').split(/\r?\n/)[0]||'Không chạy được công cụ');
}
for(const name of ['@anthropic-ai/sdk','qrcode']){
 try{add(name,true,true,require.resolve(name));}catch{add(name,false,true,'Thiếu thư viện editor');}
}
const browserRoot=path.join(os.homedir(),'.cache','hyperframes','chrome');
const browser=findRenderBrowser(path.join(root,'engines','hyperframes','chrome'))||findRenderBrowser(browserRoot);
add('render-browser',!!browser,true,browser||'Chưa tìm thấy Chrome render (engines/hyperframes/chrome kèm app hoặc cache HyperFrames)');
const hfPkg=path.join(root,'engines','hyperframes','node_modules','hyperframes','package.json');
add('hyperframes-cli',fs.existsSync(hfPkg)&&JSON.parse(fs.readFileSync(hfPkg,'utf8')).version===HF.slice(HF.lastIndexOf('@')+1),true,fs.existsSync(hfPkg)?hfPkg:'Chưa có HyperFrames kèm app ở engines/hyperframes; xuất video sẽ phải tải qua npx (cần mạng)');
try{const engine=remotionRuntime(root);add('remotion',engine.independent,true,{version:engine.version,modules:engine.modules,browser:engine.browserExecutable,independent:engine.independent});}catch(error){add('remotion',false,true,error.message);}
const vision=visionPythonStatus(root);
add('plate-vision-python',vision.ready,true,vision);
const presetPython=presetPythonStatus(root);add('graphic-preset-python',presetPython.ready,true,presetPython);
const whisper=whisperStatus(root);
add('whisper',whisper.ready,false,whisper);
if(personRequested){
 const person=await personRuntimeStatus(root,{refresh:true});
 add('person-tracking-sam2',person.ready,true,person);
}else add('person-tracking-sam2',null,false,{checked:false,help:'Chạy doctor.ps1 -Person để kiểm Python, Torch CUDA và model SAM2. Setup cơ bản chưa cài bộ theo dõi người.'});
// Trình phát xem trước phải đi kèm app (node_modules/hyperframes), không phụ thuộc bộ nhớ đệm npx của từng máy
const player=path.join(root,'node_modules/hyperframes/dist/hyperframes-player.global.js');
add('preview-player',fs.existsSync(player)&&fs.existsSync(path.join(path.dirname(player),'hyperframe.runtime.iife.js')),true,fs.existsSync(player)?player:'Thiếu trình phát xem trước trong node_modules/hyperframes/dist — xem trước video/hình sẽ trống');
// Kho NAS của workspace đang chọn: vào được thật không, lỗi gì, sửa thế nào
try{
 const store=JSON.parse(fs.readFileSync(path.join(root,'workspace','contentos','workspaces.json'),'utf8'));const active=store.workspaces?.find(w=>w.id===store.activeId);
 const {diagnoseNas}=await import('../src/services/nas-check.mjs');const nas=await diagnoseNas(active?.nasRoot||'');add('nas',nas.ok,false,nas);
}catch(error){add('nas',false,false,'Không đọc được cấu hình workspace: '+error.message);}
add('launch-path',!/^\\\\/.test(root),false,/^\\\\/.test(root)?`App đang chạy từ đường dẫn mạng ${root}: lệnh nền có thể chậm/lỗi. Nên gán ổ (vd X:) cho share NAS rồi mở app từ ổ đó.`:root);
let runtime;
try{
 const response=await fetch('http://127.0.0.1:5180/api/ping',{signal:AbortSignal.timeout(2000)});
 const ping=await response.json();
 runtime={running:response.ok&&ping.app==='contentos',port:5180,conflict:ping.app!=='contentos'};
}catch{runtime={running:false,port:5180};}
const report={app:'contentos',checkedAt:new Date().toISOString(),root,ready:checks.every(c=>!c.required||c.ready),checks,runtime,limitations:['Kiểm tra browser là sự tồn tại executable, chưa render thử.','Whisper là kiểm tra file, chưa nhận giọng thử.','SAM2 chỉ kiểm runtime khi dùng --person; phép thử CUDA/hash không phải inference hoặc nghiệm thu chất lượng mask.','Kiểm NAS là đọc thư mục gốc kho của workspace đang chọn; không kiểm provider AI hoặc đăng mạng xã hội.']};
console.log(JSON.stringify(report,null,2));
process.exitCode=report.ready?0:1;
