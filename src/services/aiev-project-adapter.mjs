import {normalizeSourceZoom} from '../../editor/lib/source-zoom.js';
import {normalizeSourceColor} from '../../editor/lib/source-color.js';
import {normalizeSourceTransform} from '../../editor/lib/source-transform.js';
import {normalizeSourceCrop} from '../../editor/lib/source-crop.js';
// Convert explicit AIEV cuts only. Unsupported visual/audio tracks must not disappear silently.
import {normalizeWatermark} from '../../editor/lib/watermark.js';
export function convertAievProject(meta){
 const issues=[];
 if(!meta||typeof meta!=='object')throw new Error('Metadata AIEV không hợp lệ.');
 const fps=meta.fps??30;
 if(!Number.isFinite(fps)||fps<=0||fps>120)issues.push('FPS không hợp lệ');
 if(!Array.isArray(meta.scenes)||!meta.scenes.length||meta.scenes.length>500)issues.push('Cần từ 1 đến 500 cảnh footage có cấu trúc');
 for(const key of ['captions','overlays','layers'])if(meta[key]!=null&&(!Array.isArray(meta[key])||meta[key].length))issues.push('Chưa chuyển track '+key);
 const watermark=normalizeWatermark(meta.watermark);
 if(meta.subtitleStyle&&Object.keys(meta.subtitleStyle).length)issues.push('Chưa chuyển subtitleStyle tùy chỉnh');
 if(meta.audio!=null&&(typeof meta.audio!=='object'||Array.isArray(meta.audio)))issues.push('Audio AIEV phải là object');
 if(meta.audio?.sfx!=null&&!Array.isArray(meta.audio.sfx))issues.push('SFX AIEV phải là mảng');
 if(meta.audio?.voice!=null&&typeof meta.audio.voice!=='string')issues.push('Voice AIEV phải là đường dẫn file');
 if(meta.audio&&Object.keys(meta.audio).some(k=>!['voice','music','sfx'].includes(k)))issues.push('Audio AIEV có thuộc tính chưa hỗ trợ');
 const scenes=Array.isArray(meta.scenes)?meta.scenes:[],sources=new Set(scenes.map(s=>s?.srcVideo));
 const multi=sources.size>1;
 if(scenes.some(s=>typeof s?.srcVideo!=='string'||!s.srcVideo))issues.push('Mỗi cảnh phải có video nguồn.');
 const segments=[];
 for(const [index,s] of scenes.entries()){
  if(!s||typeof s!=='object'){issues.push('Cảnh không hợp lệ');continue;}
  const known=new Set(['id','srcVideo','from','to','durationInFrames','src','render','srcImage','zoom','transform','crop','color','speed','transitionOverlap','transition','muted','volume','fadeInSec','fadeOutSec','fit']);
  if(Object.keys(s).some(key=>!known.has(key)))issues.push('Cảnh '+(index+1)+' có thuộc tính chưa được ánh xạ');
  if(s.src||s.render||s.srcImage||(s.transitionOverlap??0)!==0||(s.transition?.type&&s.transition.type!=='none'))issues.push('Cảnh '+(index+1)+' có composition/hiệu ứng/âm thanh chưa hỗ trợ');
  if(s.fit!==undefined&&!['cover','contain'].includes(s.fit))issues.push('Cách đặt hình cảnh '+(index+1)+' chưa hỗ trợ');
  if(s.muted!==undefined&&typeof s.muted!=='boolean'||!Number.isFinite(s.volume??1)||(s.volume??1)<0||(s.volume??1)>2)issues.push('Mức tiếng cảnh không hợp lệ');
  const speed=s.speed??1;
  if(!Number.isFinite(speed)||speed<.25||speed>4)issues.push('Tốc độ cảnh '+(index+1)+' phải từ0.25đến4');
  const from=s.from??0,to=s.to??(Number.isFinite(s.durationInFrames)?from+s.durationInFrames/fps*speed:NaN);
  if(!Number.isFinite(from)||from<0||!Number.isFinite(to)||to<=from)issues.push('Thời gian cảnh '+(index+1)+' không hợp lệ');
  if(s.durationInFrames!==undefined&&(!Number.isInteger(s.durationInFrames)||Math.abs(s.durationInFrames-(to-from)/speed*fps)>1))issues.push('Thời lượng cảnh '+(index+1)+' khác khoảng cắt');
  // VEK uses continuous seconds; do not silently shift AIEV frame-rounded scenes.
  if(speed!==1&&[from*fps,to*fps,(to-from)/speed*fps].some(v=>Math.abs(v-Math.round(v))>1e-7))issues.push('Tốc độ cảnh '+(index+1)+' tạo mốc frame lẻ; chưa chuyển chính xác timeline đã làm tròn.');
  if(speed!==1&&s.durationInFrames!==undefined&&Math.abs(s.durationInFrames-(to-from)/speed*fps)>1e-7)issues.push('Thời lượng cảnh tốc độ khác với khoảng nguồn/tốc độ.');
  let motionZoom;if(s.zoom!=null){if(typeof s.zoom!=='object'||Object.keys(s.zoom).some(k=>!['origin','keys'].includes(k))||!Array.isArray(s.zoom.keys))throw new Error('Zoom AIEV không hợp lệ.');motionZoom=normalizeSourceZoom({origin:s.zoom.origin,keys:s.zoom.keys.map(k=>{if(!k||Object.keys(k).some(p=>!['frame','scale','ease'].includes(p))||!Number.isFinite(k.frame))throw new Error('Mốc zoom AIEV không hợp lệ.');return {time:k.frame/fps,scale:k.scale,ease:k.ease};})});}
  const fadeIn=s.fadeInSec??0,fadeOut=s.fadeOutSec??0;
  if(![fadeIn,fadeOut].every(v=>Number.isFinite(v)&&v>=0&&v<=10)||fadeIn+fadeOut>(to-from)/speed+1e-9)issues.push('Fade tiếng cảnh '+(index+1)+' không hợp lệ hoặc chồng nhau');
  segments.push({id:'aiev-'+(index+1),in:from,out:to,keep:true,text:'',...(motionZoom?{motionZoom}:{}),...(s.color!=null?{color:normalizeSourceColor(s.color)}:{}),...(s.transform!=null?{transform:normalizeSourceTransform(s.transform)}:{}),...(s.crop!=null?{crop:normalizeSourceCrop(s.crop)}:{}),...(s.fit!==undefined?{fit:s.fit}:{}),...(s.speed!==undefined?{speed}:{}),...((s.fadeInSec!==undefined||s.fadeOutSec!==undefined)?{audioFadeIn:fadeIn,audioFadeOut:fadeOut}:{})});
 }
 const format=meta.width===1080&&meta.height===1920?'9:16':meta.width===1920&&meta.height===1080?'16:9':null;
 // VEK source-time addressing sorts segments; importing a reversed/repeated
 // AIEV composition would silently change playback and attached audio timing.
 for(let i=1;i<segments.length;i++)if(!multi&&segments[i].in<segments[i-1].out-1e-9)issues.push('Timeline AIEV có khoảng nguồn lặp hoặc đảo thứ tự tại cảnh '+(i+1)+'; chưa chuyển được đúng trình tự.');
 if(multi){let cursor=0;for(const [i,s] of segments.entries()){const length=s.out-s.in;s.src=scenes[i].srcVideo;s.mediaStart=s.in;s.in=cursor;s.out=cursor+length;cursor=s.out;}}
 const sourceVolumes=scenes.map(s=>s?.muted?0:s?.volume??1);
 const varyingVolume=new Set(sourceVolumes).size>1;
 if(varyingVolume)segments.forEach((s,i)=>s.audioVolume=sourceVolumes[i]);
 if(!format)issues.push('Khung hình chưa hỗ trợ; cần1080×1920 hoặc1920×1080');
 if(issues.length)throw Object.assign(new Error([...new Set(issues)].join('; ')),{status:400});
 const texts=convertAievSubtitles(meta.subtitles,segments,fps,meta.height);
 const clips=meta.audio?.voice?[{id:'aiev-voice',src:meta.audio.voice,at:segments[0].in,from:0,dur:segments.reduce((sum,s)=>sum+(s.out-s.in)/(s.speed??1),0),vol:1}]:[];
 clips.push(...convertAievSfx(meta.audio?.sfx,segments,fps));
 const music=convertAievMusic(meta.audio?.music,fps);
 return {version:1,title:String(meta.name||meta.title||meta.id||'Dự án AIEV').slice(0,160),format,source:{video:scenes[0].srcVideo,...(multi?{timeline:'segments'}:{})},segments,camera:{scale:1,x:0,y:0,faceY:.5},texts,zooms:[],scenes:[],brolls:[],captions:{enabled:false,lines:[]},audio:{voice:varyingVolume?1:sourceVolumes[0],music:'',autoSfx:false,sfxLevel:'tat',sfx:[],clips,...music},...(watermark?{watermark}:{})};
}

function convertAievMusic(music,fps){
 if(music==null)return {};
 const fail=message=>{throw Object.assign(new Error('Nhạc AIEV: '+message),{status:400});};
 if(typeof music!=='object'||Array.isArray(music)||Object.keys(music).some(k=>!['file','volume','duckVolume','speech','fadeInSec','fadeOutSec'].includes(k)))fail('cấu trúc chưa hỗ trợ.');
 if(typeof music.file!=='string'||!music.file.trim()||![music.volume??.35,music.duckVolume??.12].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||![music.fadeInSec??.5,music.fadeOutSec??1].every(n=>Number.isFinite(n)&&n>=0&&n<=10))fail('file, gain hoặc fade không hợp lệ.');
 if(music.speech!==undefined&&(!Array.isArray(music.speech)||music.speech.length>1000||music.speech.some(r=>!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<0||r[1]<=r[0])))fail('vùng lời nói không hợp lệ.');
 const volume=music.volume??.35,duck=music.duckVolume??.12;
 if(volume===0&&duck>0&&music.speech?.length)fail('nhạc nền0 với mức thoại lớn hơn0 chưa hỗ trợ.');
 return {music:music.file,musicVolume:volume,musicLoop:'repeat',musicFadeIn:music.fadeInSec??.5,musicFadeOut:music.fadeOutSec??1,musicFadeEndOffset:1/fps,musicSpeech:structuredClone(music.speech??[]),musicSpeechLevel:volume?duck/volume:0};
}

function convertAievSfx(entries,segments,fps){
 if(!entries?.length)return [];
 const fail=message=>{throw Object.assign(new Error('SFX AIEV: '+message),{status:400});};
 if(entries.length>1000)fail('tối đa1000clip.');
 for(let i=1;i<segments.length;i++)if(segments[i].in<segments[i-1].out)fail('chưa hỗ trợ khoảng nguồn lặp hoặc đảo thứ tự.');
 let total=0;const windows=segments.map(s=>{const w={start:total,end:total+(s.out-s.in)/(s.speed??1),source:s.in,rate:s.speed??1};total=w.end;return w;});
 return entries.map((e,i)=>{
  if(!e||typeof e!=='object'||Array.isArray(e)||Object.keys(e).some(k=>!['file','atFrame','volume','mediaStart','fadeInSec','fadeOutSec','mediaDurationSec'].includes(k)))fail('thuộc tính chưa được ánh xạ.');
  if(typeof e.file!=='string'||!e.file.trim()||!Number.isInteger(e.atFrame)||e.atFrame<0||!Number.isFinite(e.volume??.3)||(e.volume??.3)<0||(e.volume??.3)>1||!Number.isFinite(e.mediaStart??0)||(e.mediaStart??0)<0)fail('file, thời gian hoặc âm lượng không hợp lệ.');
  if(![e.fadeInSec??0,e.fadeOutSec??0].every(n=>Number.isFinite(n)&&n>=0&&n<=10))fail('fade không hợp lệ.');
  const start=e.atFrame/fps,w=windows.find(w=>start>=w.start-1e-9&&start<w.end-1e-9);
  if(!w)fail('mốc phát vượt timeline.');
  return {id:'aiev-sfx-'+(i+1),src:e.file,at:w.source+(start-w.start)*w.rate,from:Math.round((e.mediaStart??0)*fps)/fps,dur:total-start,vol:e.volume??.3,...(e.fadeInSec?{fadeIn:e.fadeInSec}:{}),...(e.fadeOutSec?{fadeOut:e.fadeOutSec}:{})};
 });
}

function convertAievSubtitles(cues,segments,fps,height){
 if(cues==null)return [];
 const fail=message=>{throw Object.assign(new Error('Phụ đề AIEV: '+message),{status:400});};
 if(!Array.isArray(cues)||cues.length>2000)fail('tối đa2000cue có cấu trúc.');
 if(!cues.length)return [];
 // Source-time cues cannot distinguish two appearances of the same source interval.
 for(let i=1;i<segments.length;i++)if(segments[i].in<segments[i-1].out)fail('chưa hỗ trợ lặp hoặc đảo thứ tự các khoảng nguồn.');
 let output=0;const windows=segments.map(s=>{const entry={start:output,end:output+(s.out-s.in)/(s.speed??1),source:s.in,rate:s.speed??1};output=entry.end;return entry;});
 let previousEnd=0;
 return cues.map((cue,index)=>{
  if(!cue||typeof cue!=='object'||Object.keys(cue).some(k=>!['from','durationInFrames','text'].includes(k)))fail('cue có transform/thuộc tính chưa hỗ trợ.');
  if(!Number.isInteger(cue.from)||cue.from<0||!Number.isInteger(cue.durationInFrames)||cue.durationInFrames<1||typeof cue.text!=='string'||!cue.text.trim()||cue.text.length>2000)fail('nội dung hoặc thời gian cue không hợp lệ.');
  const at=cue.from/fps,dur=cue.durationInFrames/fps;
  if(dur<.2)fail('cue dưới0.2giây chưa được editor hỗ trợ chính xác.');
  if(at+dur>output+.00001||at<previousEnd-.00001)fail('cue chồng nhau, sai thứ tự hoặc vượt thời lượng.');
  previousEnd=at+dur;
  const window=windows.find(w=>at>=w.start-.000001&&at<w.end-.000001);if(!window)fail('không tìm được đoạn nguồn cho cue.');
  return {id:'aiev-subtitle-'+(index+1),title:cue.text,at:window.source+(at-window.start)*window.rate,dur,fx:'none',size:height===1920?54:42,y:height*.85,x:0};
 });
}
