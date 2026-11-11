import {installVisionPython} from './vision-python.mjs';
import {installPresetPython} from './preset-python.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {prepareTools,installFfmpeg} from '../editor/lib/system.mjs';
import {whisperStatus,installWhisper} from '../editor/lib/whisper.mjs';
import {HF} from '../editor/lib/hf.mjs';
import {remotionRuntime} from '../src/services/remotion-scenes.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const npmCli=process.argv[process.argv.indexOf('--npm-cli')+1];
if(!process.argv.includes('--npm-cli')||!fs.existsSync(npmCli))throw new Error('Missing npm CLI');
const require=createRequire(path.join(root,'editor/package.json'));
const run=(args,cwd=root)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[npmCli,...args],{cwd,stdio:'inherit',windowsHide:true,shell:false});
 child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('npm exited '+code)));
});
const problems=[];
async function step(name,action){try{console.log(name);await action();}catch(error){problems.push({component:name,error:error.message});console.error(name+': '+error.message);}}
await step('Editor dependencies',async()=>{
 let ready=true;for(const name of ['@anthropic-ai/sdk','qrcode'])try{require.resolve(name);}catch{ready=false;}
 if(!ready)await run(['ci','--omit=dev','--no-audit','--no-fund'],path.join(root,'editor'));
});
await step('FFmpeg and FFprobe',async()=>{const status=prepareTools(root);if(!status.ffmpeg||!status.ffprobe)await installFfmpeg(root,p=>console.log(p.phase));});
await step('Local plate tracking Python/OpenCV',()=>installVisionPython(root));
await step('Local graphic preset Python/lxml',()=>installPresetPython(root));
await step('Vietnamese transcription',async()=>{if(!whisperStatus(root).ready)await installWhisper(root,p=>console.log(p.phase));});
// HyperFrames owns its browser cache; no upstream VEK startup/update scripts invoked.
await step('HyperFrames browser',async()=>{await run(['exec','--yes','--package='+HF,'--','hyperframes','browser','ensure']);});
await step('Independent Remotion runtime',async()=>{
 let ready=false;try{ready=remotionRuntime(root).independent;}catch{}
 if(!ready)await run(['ci','--ignore-scripts','--no-audit','--no-fund','--cache='+path.join(root,'workspace/cache/npm-remotion')],path.join(root,'engines/remotion'));
 if(!remotionRuntime(root).independent)throw new Error('Remotion còn trỏ runtime ngoài ContentOS. Kiểm tra CONTENTOS_REMOTION_RUNTIME.');
});
console.log(JSON.stringify({app:'contentos',completedAt:new Date().toISOString(),problems,sharedBrowserCache:path.join(os.homedir(),'.cache/hyperframes')},null,2));
process.exitCode=problems.length?1:0;
