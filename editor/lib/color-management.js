export const INPUT_COLOR_PROFILES={auto:'Tự nhận từ metadata',rec709:'SDR · Rec.709',hlg:'HDR · HLG / BT.2020',pq:'HDR · PQ / BT.2020','slog2-sgamut':'Sony · S-Log2 / S-Gamut','slog3-sgamut3cine':'Sony · S-Log3 / S-Gamut3.Cine','slog3-sgamut3':'Sony · S-Log3 / S-Gamut3','dlog-dgamut':'DJI · D-Log / D-Gamut','dlog-m':'DJI · D-Log M',applelog:'Apple Log','vlog-vgamut':'Panasonic · V-Log / V-Gamut','clog2-cgamut':'Canon · C-Log2 / Cinema Gamut','clog3-cgamut':'Canon · C-Log3 / Cinema Gamut'};
export function detectInputColor(meta={}){
 const c=meta.colorMetadata||meta,warnings=[];
 if(c.dolbyVision)warnings.push('Dolby Vision: chỉ chuyển base layer HLG/PQ; chưa tái tạo dynamic metadata Dolby.');
 if(c.primaries==='bt2020'&&c.matrix==='bt2020nc'&&['tv','pc'].includes(c.range)){
  if(c.transfer==='arib-std-b67')return {profile:'hlg',basis:'metadata',warnings};
  if(c.transfer==='smpte2084')return {profile:'pq',basis:'metadata',warnings};
 }
 if(c.primaries==='bt709'&&c.transfer==='bt709'&&c.matrix==='bt709')return {profile:'rec709',basis:'metadata',warnings:[...warnings,'Metadata ghi Rec.709; nếu máy quay ghi Log với tag này, chọn đúng profile và LUT kỹ thuật.']};
 return {profile:'unknown',basis:'insufficient-metadata',warnings:[...warnings,'Metadata chưa đủ để xác định hệ màu. Chọn profile theo thiết lập quay; tên thiết bị/10-bit không chứng minh Log.']};
}
export function applyColorNormalization(project,kind,id,result){
 const next=structuredClone(project),item=next[kind]?.find(x=>x.id===id);if(!item||!['segments','brolls'].includes(kind)||item.colorNormalization||item.platePrivacy)throw new Error('Đoạn đã đổi hoặc đã được xử lý nguồn.');
 const src=kind==='segments'?(item.src||project.source?.video):item.src,from=kind==='segments'?(item.src?(item.mediaStart??0):item.in):(item.mediaStart??0);
 if(result.provenance?.source!==src||result.provenance.from!==from||!result.mediaInfo)throw new Error('Bản màu không khớp nguồn.');
 item.colorNormalization={...result.provenance,originalHadSrc:!!item.src,...(item.mediaInfo?{originalMediaInfo:item.mediaInfo}:{}),originalColor:item.color??null};item.src=result.path;item.mediaStart=0;item.mediaInfo=result.mediaInfo;
 return next;
}
export function restoreColorNormalization(project,kind,id){
 const next=structuredClone(project),item=next[kind]?.find(x=>x.id===id),p=item?.colorNormalization;
 if(!p||item.platePrivacy)throw new Error('Khôi phục bản che trước khi khôi phục màu nguồn.');
 const from=p.from+(item.mediaStart??0);if(kind==='segments'&&!p.originalHadSrc&&Math.abs(from-item.in)<1e-6){delete item.src;delete item.mediaStart;delete item.mediaInfo;}else{item.src=p.source;item.mediaStart=from;if(p.originalMediaInfo)item.mediaInfo=p.originalMediaInfo;else delete item.mediaInfo;}
 delete item.colorNormalization;return next;
}


export function colorReadiness(metadata,{profile='auto',technicalLut=null,lookLut=null,stabilize='off',batch=false}={}){
 const input=profile==='auto'?detectInputColor(metadata).profile:profile;
 if(batch&&profile==='auto')return {ready:true,message:'Từng nguồn sẽ được nhận diện riêng. Nguồn thiếu metadata hoặc LUT phù hợp sẽ bỏ qua và báo lý do; chưa thay timeline.'};
 if(!Object.hasOwn(INPUT_COLOR_PROFILES,input)||input==='auto')return {ready:false,message:'Chọn hệ màu theo thiết lập quay trước. Metadata hiện chưa đủ; tên thiết bị hoặc 10-bit không xác định được Log.'};
 const log=!['rec709','hlg','pq'].includes(input);
 if(log&&(!technicalLut||technicalLut.kind!=='technical'||technicalLut.inputProfile!==input))return {ready:false,message:'Cần LUT kỹ thuật '+INPUT_COLOR_PROFILES[input]+' → Rec.709. Nhận từ kho LUT hoặc nhập .cube đúng hệ màu.'};
 if(!log&&technicalLut)return {ready:false,message:'Bỏ LUT kỹ thuật Log khi nguồn là SDR/HDR đã nhận diện.'};
 if(lookLut&&(lookLut.kind!=='look'||lookLut.inputProfile!=='rec709'))return {ready:false,message:'LUT phong cách phải có đầu vào Rec.709.'};
 if(input==='rec709'&&!lookLut&&stabilize==='off')return {ready:false,message:'Nguồn đã là Rec.709 theo profile hiện tại. Có thể chỉnh sáng người/da trong Làm đẹp; chỉ tạo bản mới khi cần LUT phong cách hoặc chống rung.'};
 return {ready:true,message:(input==='rec709'?'Giữ hệ màu Rec.709':log?'LUT kỹ thuật đưa Log về Rec.709':'Chuyển HDR '+input.toUpperCase()+' về Rec.709 SDR')+(lookLut?' → LUT phong cách':'')+'. Xem bản xử lý trước khi thay nguồn; quét lại người/da trên nguồn mới nếu cần chỉnh riêng nhân vật.'};
}
