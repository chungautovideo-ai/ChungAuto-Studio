import fs from 'node:fs';import path from 'node:path';import {probeMediaMetadata} from './media-metadata.mjs';
import {inspectChatSources} from './chat-sources.mjs';import {resolveContained} from './storage.mjs';
export async function sourceMediaInfo(text,selected){
 const sources=await inspectChatSources(String(text||'').slice(0,10000));
 const source=sources.find(s=>s.status==='ready'&&s.files?.some(f=>f.path===selected));
 if(!source)throw new Error('File không nằm trong nguồn đã kiểm tra.');
 if(fs.lstatSync(selected).isSymbolicLink())throw new Error('Chọn file nguồn gốc.');
 const item=source.kind==='file'?resolveContained(path.dirname(source.path),path.basename(source.path)):resolveContained(source.path,path.relative(source.path,selected));
 const info=await probeMediaMetadata(item.file);
 if(info.kind!=='video')throw new Error('Không đọc được video hợp lệ.');
 return {path:selected,role:source.role,...info};
}
