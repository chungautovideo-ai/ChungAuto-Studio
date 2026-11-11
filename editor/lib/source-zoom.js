export function normalizeSourceZoom(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['origin','keys','timeOffset'].includes(k))||!Array.isArray(value.keys)||value.keys.length<2||value.keys.length>200)throw new Error('Zoom nguồn cần2–200mốc.');
 if(value.timeOffset!==undefined&&(!Number.isFinite(value.timeOffset)||Math.abs(value.timeOffset)>86400))throw new Error('Độ dời chuyển động zoom không hợp lệ.');
 const origin=value.origin??'50% 38%';if(typeof origin!=='string'||!/^\d+(?:\.\d+)?% \d+(?:\.\d+)?%$/.test(origin)||origin.split(' ').some(v=>parseFloat(v)>100))throw new Error('Tâm zoom cần hai phần trăm từ0đến100.');
 const keys=value.keys.map(k=>{if(!k||typeof k!=='object'||Object.keys(k).some(p=>!['time','scale','ease'].includes(p))||!Number.isFinite(k.time)||k.time<0||k.time>86400||!Number.isFinite(k.scale)||k.scale<=0||k.scale>10||k.ease!==undefined&&!['linear','out','inOut'].includes(k.ease))throw new Error('Mốc zoom không hợp lệ.');return {time:k.time,scale:k.scale,ease:k.ease??'inOut'};}).sort((a,b)=>a.time-b.time);
 if(keys.some((k,i)=>i&&k.time===keys[i-1].time))throw new Error('Mốc zoom phải khác thời gian.');return {origin,keys,...(value.timeOffset!==undefined?{timeOffset:value.timeOffset}:{})};
}
export function shiftSegmentZoom(segment,sourceDelta,projectSpeed=1){
 if(!segment.motionZoom)return;
 const rate=Math.max(.25,Math.min(4,Number(segment.speed)||Number(projectSpeed)||1));
 segment.motionZoom=normalizeSourceZoom({...segment.motionZoom,timeOffset:(segment.motionZoom.timeOffset??0)+sourceDelta/rate});
}
