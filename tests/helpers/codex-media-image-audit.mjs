import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// QA only. A prompt mentioning view_image is not evidence of delivered images.
export function auditCodexMediaImages(sessionFile,sampleDir){
 const expected=fs.readdirSync(sampleDir).filter(n=>/\.jpg$/i.test(n)).sort().map(name=>({name,sha256:sha(fs.readFileSync(path.join(sampleDir,name)))}));
 if(!expected.length)throw Error('No sampled JPEGs to audit.');
 const calls=new Set(),delivered=new Set();let imageBlocks=0;
 for(const line of fs.readFileSync(sessionFile,'utf8').split('\n')){
  if(!line.trim())continue;const item=JSON.parse(line);if(item.type!=='response_item')continue;const p=item.payload||{};
  const input=p.input??p.arguments??'';
  if(['custom_tool_call','function_call'].includes(p.type)&&typeof input==='string'&&/\bview_image\b/.test(input)&&input.includes(path.basename(sampleDir)))calls.add(p.call_id);
  if(!['custom_tool_call_output','function_call_output'].includes(p.type)||!calls.has(p.call_id)||!Array.isArray(p.output))continue;
  for(const block of p.output){if(block.type!=='input_image'||typeof block.image_url!=='string')continue;const match=block.image_url.match(/^data:image\/[^;,]+;base64,([A-Za-z0-9+/=\r\n]+)$/);if(!match)continue;imageBlocks++;delivered.add(sha(Buffer.from(match[1],'base64')));}
 }
 const frames=expected.map(f=>({...f,delivered:delivered.has(f.sha256)}));
 return {sessionFile,viewImageCalls:calls.size,imageBlocks,frames,allDelivered:frames.every(f=>f.delivered),limits:'Verifies exact sampled JPEG bytes delivered to the model, not comprehension, continuous viewing, audio or editorial quality.'};
}

export function findCodexSession(sessionsRoot,sessionId){
 if(!/^[a-f0-9-]{36}$/.test(sessionId))return null;
 const visit=(dir,depth)=>{if(depth>3||!fs.existsSync(dir))return null;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isFile()&&entry.name.endsWith(sessionId+'.jsonl'))return file;if(entry.isDirectory()){const found=visit(file,depth+1);if(found)return found;}}return null;};
 return visit(sessionsRoot,0);
}
