// Shared text contract for the existing VEK cover canvas and server sidecar.
export function normalizeCoverComposition(value){
 if(!value||typeof value.title!=='string'||value.title.length>2000||!Number.isFinite(value.size)||value.size<60||value.size>240||!['top','mid','bot'].includes(value.pos)||!['mau','vang','trang'].includes(value.look))throw new Error('Cấu hình ảnh bìa không hợp lệ.');
 const out={title:value.title,size:value.size,pos:value.pos,look:value.look};
 if(value.align!==undefined){if(!['left','center','right'].includes(value.align))throw new Error('Căn chữ ảnh bìa không hợp lệ.');out.align=value.align;}
 if(value.stats!==undefined){
  if(!Array.isArray(value.stats)||value.stats.length>12)throw new Error('Ảnh bìa hỗ trợ tối đa 12 chỉ số.');
  out.stats=value.stats.map(item=>{if(!item||typeof item.label!=='string'||typeof item.value!=='string'||item.label.length>100||item.value.length>100)throw new Error('Nhãn và giá trị chỉ số tối đa 100 ký tự.');return {label:item.label,value:item.value};});
 }
 for(const key of ['subtitle','cta']){
  if(value[key]!==undefined&&(typeof value[key]!=='string'||value[key].length>(key==='cta'?200:1000)))throw new Error('Phụ đề tối đa 1000 ký tự, CTA tối đa 200 ký tự.');
  if(value[key]!==undefined)out[key]=value[key];
 }
 return out;
}
export function coverFromAievImage(item){
 const source=item?.source,overlay=source?.overlay;
 if(source?.app!=='aiev-image'||source.role!=='background'||!overlay)return null;
 const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
 const stats=overlay.stats??[];
 if(!Array.isArray(stats)||stats.length>12)throw new Error('Mẫu có hơn 12 chỉ số hoặc dữ liệu chỉ số không hợp lệ.');
 return {title:text(overlay.title,2000),subtitle:text(overlay.subtitle,1000),cta:text(overlay.cta,200),stats:stats.map(item=>({label:text(item?.label,100),value:text(item?.value,100)})),align:typeof overlay.position==='string'&&overlay.position.endsWith('-left')?'left':typeof overlay.position==='string'&&overlay.position.endsWith('-right')?'right':'center',pos:typeof overlay.position==='string'&&overlay.position.startsWith('bottom-')?'bot':typeof overlay.position==='string'&&overlay.position.startsWith('middle-')?'mid':'top'};
}
