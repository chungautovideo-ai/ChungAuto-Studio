import {makeTimemap,round3} from './timemap.js';
export function narrationCaptionWords(project,clip,words){
 if(!clip||clip.hidden)throw new Error('Chọn clip voice đang dùng trên timeline.');
 const tm=makeTimemap(project),start=tm.srcToOut(Number(clip.at)||0),from=Number(clip.from)||0,sourceDuration=Number(clip.sourceDuration),duration=clip.dur===undefined?sourceDuration-from:Math.min(Number(clip.dur),sourceDuration-from);
 if(!Number.isFinite(duration)||duration<=0||start>=tm.total||from<0)throw new Error('Clip voice không có thời lượng dùng hợp lệ.');
 if(!Array.isArray(words)||words.length>100000)throw new Error('Lời nhận dạng không hợp lệ.');
 const output=[];let previous=-1;
 for(const item of words){
  const word=String(item.word??item.text??'').trim(),s=Number(item.start),e=Number(item.end);
  if(!word||word.length>300||!Number.isFinite(s)||!Number.isFinite(e)||s<0||e<=s||s<previous)throw new Error('Mốc lời nhận dạng không hợp lệ.');previous=s;
  const os=start+Math.max(s,from)-from,oe=Math.min(start+Math.min(e,from+duration)-from,tm.total);
  if(e<=from||s>=from+duration||oe<=os)continue;
  output.push({w:word,s:round3(tm.outToSrc(os)),e:round3(tm.outToSrc(oe))});
 }
 return output;
}
