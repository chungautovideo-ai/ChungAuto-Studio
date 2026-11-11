import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {resolveContained} from './storage.mjs';
export function voiceAssetContext(projectDir,src,brief){
 const file=path.join(projectDir,'work/voice-assets.json');if(!fs.existsSync(file))return null;
 const entries=JSON.parse(fs.readFileSync(file,'utf8')).entries||[],record=entries.filter(e=>e.path===src).at(-1);if(!record)return null;
 const actual=resolveContained(projectDir,src).file,hash=crypto.createHash('sha256').update(fs.readFileSync(actual)).digest('hex');
 if(hash!==record.sha256)throw new Error('Audio đã thay đổi so với bản đã nhập. Nhập lại trước khi dùng.');
 const status=!record.narration?'unlinked':!brief?'no-script':record.narration.scriptId===brief.id&&record.narration.scriptHash===brief.hash&&record.textHash===crypto.createHash('sha256').update(brief.payload.script.trim()).digest('hex')?'match':'different-script';
 return {voiceResultId:record.voiceResultId,narration:record.narration,textHash:record.textHash,status};
}
export async function attachVoiceResult(root,storage,news,{workspaceId,dir,id,expectedNewsId,validate=()=>{}}){
 validate();
 if(!/^[a-zA-Z0-9-]+$/.test(workspaceId)||!/^[a-f0-9]{12}$/.test(id))throw new Error('Sai audio hoặc workspace.');
 const data=path.join(root,'workspace/contentos/voice',workspaceId,'ket-qua');
 const file=resolveContained(data,id+'.mp3').file,metadata=JSON.parse(fs.readFileSync(resolveContained(data,id+'.json').file,'utf8'));
 if(metadata.id!==id||metadata.workspaceId!==workspaceId)throw new Error('Audio không thuộc workspace.');
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(hash!==metadata.sha256)throw new Error('Audio đã đổi. Tạo hoặc kiểm tra lại kết quả giọng nói.');
 const check=()=>{
  validate();
  if(expectedNewsId!==undefined){const brief=news.projectBrief(workspaceId,dir);
   if(!brief||brief.id!==expectedNewsId||metadata.narration?.scriptId!==brief.id||metadata.narration?.scriptHash!==brief.hash||metadata.textHash!==crypto.createHash('sha256').update(brief.payload.script.trim()).digest('hex'))throw new Error('Audio không khớp kịch bản đang gắn với dự án. Mở lại đúng bản voice.');
  }
 };
 check();const imported=await storage.attachSelected(dir,[{status:'ready',kind:'file',path:file,role:'voice',files:[{path:file}]}],file,{workspaceId,validate:check});check();
 const project=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,dir))).file;
 const manifestFile=path.join(project,'work/voice-assets.json');const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{schemaVersion:1,entries:[]};
 const record={voiceResultId:id,assetId:imported.asset.id,path:imported.asset.path,sha256:imported.asset.sha256,textHash:metadata.textHash||null,narration:metadata.narration||null,duration:metadata.duration,importedAt:new Date().toISOString()};
 if(!manifest.entries.some(e=>e.voiceResultId===id&&e.sha256===record.sha256)){
  manifest.entries.push(record);const temp=manifestFile+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,manifestFile);
 }
 return {...imported,voice:record};
}
