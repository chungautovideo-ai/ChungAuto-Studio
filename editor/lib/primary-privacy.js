export function primaryPrivacyRequest(project,segmentId){
 const item=project.segments?.find(s=>s.id===segmentId);
 if(!item||item.keep===false||!Number.isFinite(item.in)||!Number.isFinite(item.out)||item.in<0||item.out<=item.in)throw new Error('Chọn đoạn Video đang giữ.');
 if(project.camera?.matte||project.audio?.clean||project.vfx?.some(v=>v.type==='freeze')||project.transitions?.cut==='dissolve'||project.segments?.some(s=>s.tIn==='dissolve'))throw new Error('Tắt matte/lọc giọng/freeze/dissolve trước khi che A-roll; chưa hỗ trợ thay nguồn với các hiệu ứng này.');
 if(item.platePrivacy)throw new Error('Đoạn đã có bản che; khôi phục nguồn trước khi đánh dấu lại.');
 const src=item.src??project.source?.video,from=item.src?item.mediaStart:item.in,duration=item.out-item.in;
 if(!/\.(mp4|mov|m4v|webm)$/i.test(src||'')||!Number.isFinite(from)||from<0||duration<.2||duration>15)throw new Error('Che A-roll hỗ trợ0.2–15giây nguồn liên tục; chia đoạn dài trước.');
 return {item,from,duration,src};
}
export function applyPrimaryPrivacy(project,segmentId,result){
 const selected=primaryPrivacyRequest(project,segmentId),next=structuredClone(project),item=next.segments.find(s=>s.id===segmentId);
 if(result.provenance.source!==selected.src||result.provenance.from!==selected.from||result.duration<selected.duration-.01||!result.mediaInfo)throw new Error('Bản che không khớp đoạn nguồn hoặc thiếu thời lượng.');
 item.platePrivacy={...result.provenance,originalHadSrc:!!selected.item.src,originalMediaInfo:selected.item.mediaInfo??result.sourceMediaInfo};
 if(item.colorNormalization){item.platePrivacy.originalColorNormalization=item.colorNormalization;delete item.colorNormalization;}
 item.src=result.path;item.mediaStart=0;item.mediaInfo=result.mediaInfo;
 return next;
}
export function restorePrimaryPrivacy(project,segmentId){
 const next=structuredClone(project),item=next.segments?.find(s=>s.id===segmentId),privacy=item?.platePrivacy;
 if(!privacy||privacy.kind!=='plate-privacy')throw new Error('Đoạn chưa có bản che để khôi phục.');
 const from=privacy.from+(item.mediaStart??0);
 if(!privacy.originalHadSrc&&Math.abs(from-item.in)<.000001){delete item.src;delete item.mediaStart;delete item.mediaInfo;}
 else{item.src=privacy.source;item.mediaStart=from;item.mediaInfo=privacy.originalMediaInfo;}
 if(privacy.originalColorNormalization)item.colorNormalization=privacy.originalColorNormalization;
 delete item.platePrivacy;return next;
}
export function applyBrollPrivacy(project,brollId,result){
 const next=structuredClone(project),item=next.brolls?.find(b=>b.id===brollId);
 if(!item||item.platePrivacy||result.provenance?.source!==item.src||Math.abs(result.provenance.from-(item.mediaStart??0))>1e-6||!result.mediaInfo)throw new Error('Bản che không khớp cảnh trám.');
 item.platePrivacy={...result.provenance,originalMediaStart:item.mediaStart??0,originalDuration:item.dur,...(item.mediaInfo?{originalMediaInfo:item.mediaInfo}:{})};
 if(item.colorNormalization){item.platePrivacy.originalColorNormalization=item.colorNormalization;delete item.colorNormalization;}
 item.src=result.path;item.mediaStart=0;item.mediaInfo=result.mediaInfo;item.dur=Math.min(item.dur,result.duration/(Number(item.speed)||1));
 return next;
}
export function restoreBrollPrivacy(project,brollId){
 const next=structuredClone(project),item=next.brolls?.find(b=>b.id===brollId),privacy=item?.platePrivacy;
 if(!privacy||privacy.kind!=='plate-privacy')throw new Error('Cảnh chưa có bản che để khôi phục.');
 item.src=privacy.source;item.mediaStart=privacy.from+(item.mediaStart??0);
 if(privacy.originalMediaInfo)item.mediaInfo=privacy.originalMediaInfo;else delete item.mediaInfo;
 if(privacy.originalColorNormalization)item.colorNormalization=privacy.originalColorNormalization;
 delete item.platePrivacy;return next;
}
