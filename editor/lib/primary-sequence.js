// Rebase virtual source windows while retaining independent file clocks.
export function reorderPrimaryClips(project,ids){
 const original=(project.segments??[]).slice().sort((a,b)=>a.in-b.in);
 if(!original.length||!Array.isArray(ids)||ids.length!==original.length||new Set(ids).size!==ids.length||ids.some(id=>!original.some(s=>s.id===id)))throw new Error('Thứ tự phải chứa đủ mỗi đoạn đúng một lần.');
 if(project.source?.timeline!=='segments'||original.some((s,i)=>!s.src||!Number.isFinite(s.mediaStart)||!Number.isFinite(s.in)||!Number.isFinite(s.out)||s.in<0||s.out<=s.in||i&&s.in<original[i-1].out))throw new Error('Sắp xếp cần timeline nhiều nguồn hợp lệ.');
 if(project.camera?.matte||project.audio?.clean||project.vfx?.some(v=>v.type==='freeze')||project.transitions?.cut==='dissolve'||original.some(s=>s.tIn==='dissolve'))throw new Error('Matte/lọc giọng/freeze/dissolve nhiều nguồn chưa có adapter sắp xếp.');
 const next=structuredClone(project),byId=new Map(next.segments.map(s=>[s.id,s])),deltas=new Map();let cursor=0;
 for(const id of ids){const s=byId.get(id),length=s.out-s.in;deltas.set(id,cursor-s.in);s.in=cursor;s.out=cursor+length;cursor=s.out;}
 const owner=t=>original.find(s=>t>=s.in&&t<s.out)??(t===original.at(-1).out?original.at(-1):null);
 const delta=t=>{if(!Number.isFinite(t))throw new Error('Mốc thời gian không hợp lệ.');const s=owner(t);if(!s)throw new Error('Có nội dung neo ngoài đoạn nguồn; kiểm tra mốc trước khi sắp xếp.');return deltas.get(s.id);};
 const shift=item=>{const d=delta(item.at??0);item.at=(item.at??0)+d;if(Array.isArray(item.cues))item.cues=item.cues.map(t=>t+d);if(Array.isArray(item.follow))item.follow=item.follow.map(k=>[k[0]+d,...k.slice(1)]);};
 for(const group of ['texts','zooms','scenes','brolls','blocks','vfx'])for(const item of next[group]??[])shift(item);
 for(const group of ['clips','sfx'])for(const item of next.audio?.[group]??[])shift(item);
 const lines=[],lineIds=new Set((next.captions?.lines??[]).map(l=>l.id));
 for(const line of next.captions?.lines??[]){
  const groups=new Map();for(const word of line.words??[]){if(!owner(word.s)||!Number.isFinite(word.e)||word.e<=word.s)throw new Error('Phụ đề có mốc ngoài nguồn.');for(const s of original){const start=Math.max(word.s,s.in),end=Math.min(word.e,s.out);if(end<=start)continue;const d=deltas.get(s.id);if(!groups.has(s.id))groups.set(s.id,[]);groups.get(s.id).push({...word,s:start+d,e:end+d});}}
  let i=0;for(const words of groups.values()){let id=line.id;if(i++){let n=2;while(lineIds.has(id=line.id+'-move-'+n))n++;lineIds.add(id);}lines.push({...line,id,words});}
 }
 if(next.captions)next.captions.lines=lines.sort((a,b)=>a.words[0].s-b.words[0].s);
 next.segments=ids.map(id=>byId.get(id));next.source.duration=cursor;
 return next;
}
