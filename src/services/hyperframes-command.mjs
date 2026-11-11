import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {HF} from '../../editor/lib/hf.mjs';

// Resolve the pinned installed CLI and launch with the same Node runtime as the
// app. This avoids a Windows cmd/npm wrapper and its separate shutdown path.
export function hyperframesCommand(root,args,{environment=process.env,platform=process.platform,home=os.homedir(),node=process.execPath}={}){
 const version=HF.slice(HF.lastIndexOf('@')+1),candidates=[path.join(root,'engines/hyperframes/node_modules/hyperframes'),path.join(root,'node_modules/hyperframes')];
 const cache=environment.npm_config_cache||environment.NPM_CONFIG_CACHE||(platform==='win32'?path.join(home,'AppData/Local/npm-cache'):path.join(home,'.npm'));
 const folder=path.join(cache,'_npx');
 try{for(const entry of fs.readdirSync(folder,{withFileTypes:true}).slice(0,300))if(entry.isDirectory())candidates.push(path.join(folder,entry.name,'node_modules/hyperframes'));}catch{}
 for(const candidate of candidates){
  try{
   const pkg=JSON.parse(fs.readFileSync(path.join(candidate,'package.json'),'utf8'));
   if(pkg.name!=='hyperframes'||pkg.version!==version)continue;
   const bin=typeof pkg.bin==='string'?pkg.bin:pkg.bin?.hyperframes;
   if(typeof bin!=='string'||!bin.endsWith('.mjs'))continue;
   const base=fs.realpathSync(candidate),file=fs.realpathSync(path.resolve(candidate,bin)),relative=path.relative(base,file);
   if(!relative||relative.startsWith('..')||path.isAbsolute(relative)||!fs.statSync(file).isFile())continue;
   return {command:node,args:[file,...args],shell:false,source:'installed-cli',version};
  }catch{}
 }
 // Preserve existing first-install behavior; npx obtains the exact pinned
 // version when no local installation/cache is available yet.
 return {command:platform==='win32'?'npx.cmd':'npx',args:[HF,...args],shell:platform==='win32',source:'npx-fallback',version};
}
