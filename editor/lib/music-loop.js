// Phase-continuous hard loops with a global linear envelope. Each ramp is a
// constant bed plus a phase-aligned faded layer, understood by HF and CapCut.
export function musicLoopParts(total,mediaDuration,{fadeIn=0,fadeOut=0,endOffset=0,speech=[],duckLevel=1,ramp=.4}={}){
 if(![total,mediaDuration,fadeIn,fadeOut,endOffset].every(Number.isFinite)||total<=0||mediaDuration<=0||fadeIn<0||fadeOut<0||endOffset<0||endOffset>=total)throw new Error('Thời gian lặp/fade nhạc không hợp lệ.');
 if(Math.ceil(total/mediaDuration)>2000)throw new Error('Nhạc quá ngắn: vượt2000vòng lặp.');
 if(!Array.isArray(speech)||speech.length>1000||!Number.isFinite(duckLevel)||duckLevel<0||duckLevel>10||!Number.isFinite(ramp)||ramp<0||speech.some(r=>!Array.isArray(r)||r.length!==2||!r.every(Number.isFinite)||r[0]<0||r[1]<=r[0]))throw new Error('Vùng lời nói/mức hạ nhạc không hợp lệ.');
 const end=total-endOffset,points=new Set([0,total,end]);
 if(fadeIn>0&&fadeIn<end)points.add(fadeIn);
 if(fadeOut>0&&end-fadeOut>0)points.add(end-fadeOut);
 if(fadeIn&&fadeOut){const cross=end*fadeIn/(fadeIn+fadeOut);if(cross>0&&cross<end)points.add(cross);}
 for(let at=mediaDuration;at<total;at+=mediaDuration)points.add(at);
 const half=ramp/2,clamp=n=>Math.max(0,Math.min(1,n));
 for(const [a,b] of speech)for(const t of [a-half,a+half,b-half,b+half,(a+b)/2])if(t>0&&t<total)points.add(t);
 const gain=t=>{
  let duck=0;for(const [a,b] of speech)duck=Math.max(duck,ramp?Math.min(clamp((t-a+half)/ramp),clamp((b+half-t)/ramp)):Number(t>=a&&t<b));
  return Math.max(0,Math.min(1,fadeIn?t/fadeIn:1,fadeOut?(end-t)/fadeOut:1))*(1+(duckLevel-1)*duck);
 };
 const ordered=[...points].sort((a,b)=>a-b),parts=[];
 const emit=(start,finish,depth=0)=>{
  const duration=finish-start;if(duration<1e-8)return;
  const epsilon=ramp?0:Math.min(1e-10,duration/10),ga=gain(start+epsilon),gb=gain(finish-epsilon);
  // Product of global fade and duck ramp can be quadratic. Approximate with
  // bounded linear pieces; quarter samples also detect overlapping ramp turns.
  const error=Math.max(...[.25,.5,.75].map(f=>Math.abs(gain(start+duration*f)-(ga+(gb-ga)*f))));
  if(error>.0005&&duration>.004&&depth<16){const mid=(start+finish)/2;emit(start,mid,depth+1);emit(mid,finish,depth+1);return;}
  if(parts.length>10000)throw new Error('Envelope nhạc vượt giới hạn10000đoạn.');
  const a=ga,b=gb,base=Math.min(a,b),delta=Math.abs(a-b),rawOffset=start%mediaDuration,offset=rawOffset<1e-8||mediaDuration-rawOffset<1e-8?0:rawOffset;
  if(base>1e-9)parts.push({start,duration,offset,gain:base,fadeIn:0,fadeOut:0});
  if(delta>1e-9)parts.push({start,duration,offset,gain:delta,fadeIn:b>a?duration:0,fadeOut:a>b?duration:0});
 };
 for(let i=1;i<ordered.length;i++)emit(ordered[i-1],ordered[i]);
 return parts;
}

// Checkbox uses the same already-probed, visible, nonzero clip windows as VEK
// ducking. Declared ranges remain saved and resume when the checkbox is off.
export function repeatMusicOptions(audio,clipWindows=[]){
 const auto=audio.duckNarration===true||audio.duckSourceSpeech===true;
 return {fadeIn:Number(audio.musicFadeIn??.5),fadeOut:Number(audio.musicFadeOut??1),endOffset:Number(audio.musicFadeEndOffset??0),speech:auto?clipWindows.map(w=>[w.start,w.start+w.duration]):audio.musicSpeech??[],duckLevel:Number(auto?audio.duckLevel??.25:audio.musicSpeechLevel??1),ramp:auto?Number(audio.duckFade??0):.4};
}

// Crossfade loops for any source length: overlap adapts to short files (<=1/3
// source, max 2s) so each pass stays inside the file and the last ends at total.
export function crossfadeMusicParts(total,source){
 if(![total,source].every(Number.isFinite)||total<=0||source<=0)throw new Error('Thời lượng nhạc/video không hợp lệ.');
 if(total<=source)return [{start:0,duration:total,offset:0,fadeIn:0,fadeOut:0,track:0}];
 const xf=Math.min(2,source/3),step=source-xf;
 if(Math.ceil((total-source)/step)+1>2000)throw new Error('Nhạc quá ngắn: vượt 2000 vòng lặp.');
 const parts=[];
 for(let k=0;;k++){const start=k*step,last=start+source>=total;parts.push({start,duration:last?total-start:source,offset:0,fadeIn:k?xf:0,fadeOut:last?0:xf,track:k%2});if(last)return parts;}
}

// Crossfade loops x global fade (1.2s in, 2s out) x clip ducking, as linear
// pieces: constant bed plus one full-length fade layer, offsets inside each pass.
export function crossfadeMusicMixParts(total,source,windows=[],{enabled=false,level=.25,fade=0}={}){
 const loops=crossfadeMusicParts(total,source),fi=Math.min(1.2,total/2),fo=Math.min(2,total/2),clamp=n=>Math.max(0,Math.min(1,n));
 const low=Number.isFinite(Number(level))?clamp(Number(level)):.25,ramp=Math.max(0,Math.min(2,Number(fade)||0));
 const ranges=enabled?(windows||[]).filter(w=>Number.isFinite(w?.start)&&Number.isFinite(w?.duration)&&w.duration>0).map(w=>[w.start,w.start+w.duration]):[];
 const duck=t=>{let d=0;for(const [a,b] of ranges)d=Math.max(d,ramp?Math.min(clamp((t-a+ramp)/ramp),clamp((b+ramp-t)/ramp)):Number(t>=a&&t<b));return 1-(1-low)*d;};
 const env=t=>Math.max(0,Math.min(1,t/fi,(total-t)/fo)),parts=[];
 for(const loop of loops){
  const end=loop.start+loop.duration,gain=t=>env(t)*duck(t)*clamp(Math.min(loop.fadeIn?(t-loop.start)/loop.fadeIn:1,loop.fadeOut?(end-t)/loop.fadeOut:1));
  const points=new Set([loop.start,end,loop.start+loop.fadeIn,end-loop.fadeOut,fi,total-fo]);
  for(const [a,b] of ranges)for(const t of [a-ramp,a,b,b+ramp])points.add(t);
  const ordered=[...points].filter(t=>t>=loop.start&&t<=end).sort((a,b)=>a-b);
  const emit=(start,finish,depth=0)=>{
   const duration=finish-start;if(duration<1e-9)return;
   const epsilon=Math.min(1e-9,duration/10),ga=gain(start+epsilon),gb=gain(finish-epsilon);
   // Products and overlapping duck ramps are not linear: split until close.
   const error=Math.max(...[.25,.5,.75].map(f=>Math.abs(gain(start+duration*f)-(ga+(gb-ga)*f))));
   if(error>.001&&duration>1e-4&&depth<24){const mid=(start+finish)/2;emit(start,mid,depth+1);emit(mid,finish,depth+1);return;}
   if(parts.length>20000)throw new Error('Envelope nhạc vượt giới hạn 20000 đoạn.');
   const base=Math.min(ga,gb),delta=Math.abs(ga-gb),offset=start-loop.start;
   if(base>1e-4)parts.push({start,duration,offset,gain:base,fadeIn:0,fadeOut:0,track:loop.track});
   if(delta>1e-4)parts.push({start,duration,offset,gain:delta,fadeIn:gb>ga?duration:0,fadeOut:ga>gb?duration:0,track:loop.track,layer:true});
  };
  for(let i=1;i<ordered.length;i++)emit(ordered[i-1],ordered[i]);
 }
 return parts;
}
