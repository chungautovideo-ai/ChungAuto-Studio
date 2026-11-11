#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {resolveContained} from '../../src/services/storage.mjs';
import {sessionPresets} from '../../src/services/session-presets.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
try{
 const args=process.argv.slice(2),flags=new Map(),known=new Set(['--claim','--request','--revision','--apply']);
 if(!args[0]||args[0].startsWith('--'))throw Error('Dùng: chen-preset.mjs <việc> --claim ID [--request FILE --revision HASH --apply]. Không request: danh mục; không apply: chỉ kiểm.');
 for(let i=1;i<args.length;i++){
  const key=args[i];if(!known.has(key)||flags.has(key))throw Error('Tham số trùng hoặc không hợp lệ: '+key);
  if(key==='--apply')flags.set(key,true);else{const v=args[++i];if(!v||v.startsWith('--'))throw Error('Thiếu '+key);flags.set(key,v);}
 }
 if(!flags.get('--claim')||!flags.has('--request')&&(flags.has('--revision')||flags.has('--apply')))throw Error('Cần claim; request cần revision từ danh mục.');
 let request;
 if(flags.has('--request')){const dir=resolveContained(root,args[0]).file,file=resolveContained(dir,flags.get('--request')).file;if(fs.statSync(file).size>32768)throw Error('Yêu cầu vượt 32KB.');request=JSON.parse(fs.readFileSync(file,'utf8'));if(!request||typeof request!=='object'||Array.isArray(request))throw Error('Yêu cầu cần object JSON.');}
 console.log(JSON.stringify(await sessionPresets(root,args[0],{claimId:flags.get('--claim'),request,expectedRevision:flags.get('--revision'),apply:flags.has('--apply')}),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
