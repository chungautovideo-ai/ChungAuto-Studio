import fs from 'node:fs';import path from 'node:path';
const decode=value=>value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function capcutAudioTags(html,re,projectDir){
 return [...html.matchAll(/<audio\s[^>]*>/g)].map(m=>m[0]).filter(t=>{re.lastIndex=0;return re.test(t);}).map(t=>{
  const at=key=>t.match(new RegExp('\\b'+key+'="([^"]*)"'))?.[1];
  const number=(key,fallback)=>{const value=at(key);return value===undefined?fallback:Number(value);};
  return {id:decode(at('id')||''),src:decode(at('src')||''),start:number('data-start',0),dur:number('data-duration',0),from:number('data-media-start',0),vol:number('data-volume',1),fadeIn:number('data-fade-in',0),fadeOut:number('data-fade-out',0),rate:number('data-playback-rate',1)};
 }).filter(x=>{const file=path.resolve(projectDir,x.src),relative=path.relative(projectDir,file);return x.src&&!path.isAbsolute(x.src)&&relative&&!relative.startsWith('..')&& !path.isAbsolute(relative)&&fs.existsSync(file);});
}
export function capcutAudioMix(tags,total){
 if(!Number.isFinite(total)||total<=0)throw new Error('Invalid audio duration');
 const inputs=[],parts=[];
 tags.forEach((x,i)=>{
  if(![x.start,x.dur,x.from,x.vol,x.fadeIn??0,x.fadeOut??0,x.rate??1].every(Number.isFinite)||x.start<0||x.dur<=0||x.from<0||x.vol<0||(x.rate??1)<=0)throw new Error('Invalid audio clip timing');
  inputs.push('-i',x.src);const rate=x.rate??1;let fadeIn=Math.max(0,x.fadeIn||0),fadeOut=Math.max(0,x.fadeOut||0);const scale=Math.min(1,x.dur/(fadeIn+fadeOut||1));fadeIn*=scale;fadeOut*=scale;
  const filters=[`atrim=start=${x.from}:duration=${x.dur*rate}`,'asetpts=PTS-STARTPTS'];
  let remaining=rate;while(remaining>2){filters.push('atempo=2');remaining/=2;}while(remaining<.5){filters.push('atempo=0.5');remaining/=.5;}if(remaining!==1)filters.push('atempo='+remaining);
  filters.push('volume='+x.vol);if(fadeIn)filters.push(`afade=t=in:st=0:d=${fadeIn}`);if(fadeOut)filters.push(`afade=t=out:st=${Math.max(0,x.dur-fadeOut)}:d=${fadeOut}`);
  const delay=Math.round(x.start*1000);filters.push(`adelay=${delay}|${delay}`);parts.push(`[${i}:a]${filters.join(',')}[a${i}]`);
 });
 return {inputs,script:parts.join(';')+`;${tags.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${tags.length}:normalize=0:dropout_transition=0,apad,atrim=duration=${total}[out]`};
}

export function capcutAudioGroups(html,projectDir){
 const tags=capcutAudioTags(html,/id="(?:music[^" ]*|aclip[^" ]*|sfx\d[^" ]*|[^" ]+-a)"/,projectDir);
 return [
  {kind:'music',file:'nhac-nen.m4a',label:'Nhạc nền',tags:tags.filter(t=>t.id.startsWith('music'))},
  {kind:'narration',file:'thuyet-minh.m4a',label:'Thuyết minh / audio riêng',tags:tags.filter(t=>t.id.startsWith('aclip'))},
  {kind:'sfx',file:'tieng-hieu-ung.m4a',label:'Hiệu ứng âm thanh',tags:tags.filter(t=>/^sfx\d/.test(t.id))},
  {kind:'broll',file:'tieng-canh-tram.m4a',label:'Tiếng cảnh trám',tags:tags.filter(t=>t.id.endsWith('-a')&&!/^(music|aclip|sfx\d)/.test(t.id))}
 ].filter(group=>group.tags.length);
}
