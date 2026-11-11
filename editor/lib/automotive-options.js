// Shared explicit per-run choices. This is a preset policy, not AI color analysis.
const MODES={color:['keep','natural','off'],beauty:['keep','off'],watermark:['keep','off'],cta:['keep','off'],music:['keep','off'],sfx:['keep','tat','vua','nhieu']};
export function normalizeAutomotiveOptions(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(MODES,k)))throw new Error('Tùy chọn ngành xe chưa hợp lệ.');
 const result={};for(const [key,modes] of Object.entries(MODES)){const mode=value[key]??'keep';if(!modes.includes(mode))throw new Error('Tùy chọn ngành xe không hỗ trợ: '+key);result[key]=mode;}return result;
}
const clone=value=>value===undefined?undefined:structuredClone(value);
function restore(target,key,source){if(source?.[key]===undefined)delete target[key];else target[key]=clone(source[key]);}
function matching(item,items){
 const exact=items.find(x=>x.id===item.id&&x.src===item.src);if(exact)return exact;
 // Preserve color when the agent splits a source window rather than copying IDs.
 if(Number.isFinite(item.in))return items.find(x=>x.src===item.src&&item.in>=x.in-1e-6&&item.out<=x.out+1e-6);
 return null;
}
export function applyAutomotiveOptions(project,value,{base=project,sfxLevel}={}){
 const options=normalizeAutomotiveOptions(value);if(!options)return project;
 const p=clone(project);p.automotiveOptions=options;p.camera={...(p.camera||{})};
 // Beauty is independent of color. First-build must not introduce unrequested beauty.
 if(options.beauty==='off')delete p.camera.beauty;else restore(p.camera,'beauty',base.camera);
 if(options.color==='keep')restore(p.camera,'color',base.camera);else delete p.camera.color;
 for(const key of ['segments','brolls'])for(const item of p[key]||[]){
  if(options.color==='natural')item.color={preset:'tu-nhien'};
  else if(options.color==='off')delete item.color;
  else restore(item,'color',matching(item,base[key]||[]));
 }
 if(options.watermark==='off'){if(p.watermark)p.watermark.hidden=true;}
 else p.watermark=clone(base.watermark)??null;
 if(options.cta==='off'&&p.endCard)p.endCard.enabled=false;
 if(options.cta==='off')for(const key of ['texts','blocks'])p[key]=(p[key]||[]).filter(item=>!isAutomotiveCta(item));
 p.audio={...(p.audio||{})};if(options.music==='off')p.audio.music='';else if(base.audio?.music!==undefined)p.audio.music=base.audio.music;
 const level=options.sfx==='keep'?sfxLevel:options.sfx;if(level)p.audio.sfxLevel=level;
 if(options.sfx==='tat'){p.audio.sfxLevel='tat';p.audio.sfxVolume=0;}
 else if(options.sfx!=='keep'&&!(p.audio.sfxVolume>0))p.audio.sfxVolume=.25;
 return p;
}
export function isAutomotiveCta(item){return item?.role==='cta'||item?.preset==='ca-cta'||item?.apiPreset?.presetId==='ca-cta'||item?.templatePreset?.presetId==='ca-cta';}
export function automotiveInstructions(value){
 const o=normalizeAutomotiveOptions(value);if(!o)return '';
 return 'TÙY CHỌN DỰNG NGÀNH XE (đã chốt, thắng mẫu): '+JSON.stringify(o)+'\nMàu natural là preset tự nhiên nhẹ áp từng A-roll/B-roll, không phân tích Log/WB/da; keep giữ màu đang có, off bỏ grade. Làm đẹp beauty keep giữ thiết lập đã chốt, off xóa camera.beauty kể cả vùng người/da; không tự bật hoặc quét beauty. Watermark keep giữ logo đã chốt, off không thêm logo. CTA off không chèn preset CTA hoặc end-card; không đổi lời nói. Music off không thêm nhạc; keep giữ bài đã chốt. SFX tat tắt toàn bộ tiếng hiệu ứng. Giữ provenance preset/role=cta để editor cho tắt đúng lớp. Không nhận đã có che biển số/tracking khi chưa dùng công cụ hợp lệ.';
}
