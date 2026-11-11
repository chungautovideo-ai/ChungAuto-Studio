#!/usr/bin/env node
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {sampleSessionMedia} from '../../src/services/session-media-sample.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
try{
 const [dir,...args]=process.argv.slice(2),flags=new Map();
 if(!dir||args.length!==6)throw Error('Dùng: node editor/tools/khao-sat-media.mjs <việc> --claim ID --src inputs/FILE.mp4 --times 1,2,3. Tối đa3mốc giây nguồn, chỉ tạo ảnh local trong candidate.');
 for(let i=0;i<args.length;i+=2){if(!['--claim','--src','--times'].includes(args[i])||flags.has(args[i])||!args[i+1]?.trim())throw Error('Tham số không hợp lệ hoặc trùng.');flags.set(args[i],args[i+1]);}
 if(!flags.has('--claim')||!flags.has('--src')||!flags.has('--times'))throw Error('Cần claim/src/times.');
 const raw=flags.get('--times').split(',');if(raw.some(s=>!s.trim()))throw Error('Mốc giây không được trống.');
 console.log(JSON.stringify(await sampleSessionMedia(root,dir,{claimId:flags.get('--claim'),src:flags.get('--src'),times:raw.map(Number)}),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
