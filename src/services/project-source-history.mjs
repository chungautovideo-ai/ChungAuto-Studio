import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
export function readProjectSourceHistory(project){
 const combined=new Map();
 function read(name,key){
  const relative='work/'+name;if(!fs.existsSync(path.join(project,relative)))return [];
  const file=resolveContained(project,relative).file;if(fs.statSync(file).size>4*1024*1024)throw new Error('Danh sách nguồn quá lớn.');
  const items=JSON.parse(fs.readFileSync(file,'utf8'))[key];if(!Array.isArray(items)||items.length>10000)throw new Error('Danh sách nguồn không hợp lệ.');return items;
 }
 for(const asset of read('source-assets.json','assets')){
  if(typeof asset.path!=='string')throw new Error('Nguồn thiếu đường dẫn.');
  combined.set(asset.path,{...asset,sourceKinds:[asset.provenance?.kind|| (asset.source?.role==='voice'?'voice':'source')],voiceVersions:[]});
 }
 for(const asset of read('phone-assets.json','assets')){
  if(typeof asset.path!=='string')throw new Error('Nguồn điện thoại thiếu đường dẫn.');
  const current=combined.get(asset.path);
  if(current){if(!current.sourceKinds.includes('phone'))current.sourceKinds.push('phone');}
  else combined.set(asset.path,{...asset,importedAt:asset.receivedAt,sourceKinds:['phone'],annotations:null,voiceVersions:[]});
 }
 for(const voice of read('voice-assets.json','entries')){
  if(typeof voice.path!=='string')throw new Error('Voice thiếu đường dẫn.');
  let current=combined.get(voice.path);
  if(!current){current={id:voice.assetId,name:path.basename(voice.path),path:voice.path,sha256:voice.sha256,importedAt:voice.importedAt,sourceKinds:['voice'],voiceVersions:[]};combined.set(voice.path,current);}
  if(!current.sourceKinds.includes('voice'))current.sourceKinds.push('voice');
  current.voiceVersions.push({voiceResultId:voice.voiceResultId,textHash:voice.textHash,narration:voice.narration,duration:voice.duration,sha256:voice.sha256});
 }
 return [...combined.values()];
}
