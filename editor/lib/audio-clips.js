// Shared output timing for VEK audio.clips; at remains anchored to source time.
export function audioClipTiming(clip,tm,mediaDuration){
 const at=Number(clip.at??0),from=Number(clip.from??0),volume=Number(clip.vol??1);
 if(clip.hidden||!clip.src||!Number.isFinite(at)||at<0||!Number.isFinite(from)||from<0||!Number.isFinite(volume)||volume<0)return null;
 const start=tm.srcToOut(at),available=Number(mediaDuration)-from;
 const requested=clip.dur===undefined||clip.dur===''?available:Number(clip.dur);
 const duration=Math.min(requested,available,tm.total-start);
 if(!Number.isFinite(start)||start<0||!Number.isFinite(duration)||duration<=0)return null;
 let fadeIn=Number(clip.fadeIn??0),fadeOut=Number(clip.fadeOut??0);
 if(!Number.isFinite(fadeIn)||!Number.isFinite(fadeOut)||fadeIn<0||fadeOut<0)return null;
 const scale=Math.min(1,duration/(fadeIn+fadeOut||1));fadeIn*=scale;fadeOut*=scale;
 return {start,duration,from,volume:Math.min(2,volume),...(fadeIn||fadeOut?{fadeIn,fadeOut}:{})};
}
