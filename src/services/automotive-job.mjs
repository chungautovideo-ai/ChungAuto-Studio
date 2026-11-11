import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {normalizeAutomotiveOptions,applyAutomotiveOptions} from '../../editor/lib/automotive-options.js';
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function pinAutomotiveJob(dir,base,options,sfxLevel){
 const bytes=JSON.stringify({options:normalizeAutomotiveOptions(options),base,sfxLevel});
 fs.writeFileSync(path.join(dir,'work/automotive-snapshot.json'),bytes,{flag:'wx'});
 return {sha256:hash(bytes)};
}
export function enforceAutomotiveJob(candidate,job,dir){
 if(!job.automotiveOptions)return candidate;
 const bytes=fs.readFileSync(path.join(dir,'work/automotive-snapshot.json'));
 if(!job.automotiveSnapshot?.sha256||hash(bytes)!==job.automotiveSnapshot.sha256)throw new Error('Lựa chọn dựng ngành xe đã đổi; chưa áp bản dựng.');
 const snapshot=JSON.parse(bytes);
 if(JSON.stringify(normalizeAutomotiveOptions(job.automotiveOptions))!==JSON.stringify(normalizeAutomotiveOptions(snapshot.options)))throw new Error('Lựa chọn ngành xe không khớp bản đã chốt.');
 return applyAutomotiveOptions(candidate,snapshot.options,{base:snapshot.base,sfxLevel:snapshot.sfxLevel});
}
