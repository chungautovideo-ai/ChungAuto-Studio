export function normalizeWatermark(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['file','position','heightPercent','marginPercent','opacity','hidden'].includes(k)))throw new Error('Watermark có thuộc tính chưa hỗ trợ.');
 const w={position:'top-left',heightPercent:3,marginPercent:4,opacity:.9,...value};
 if(typeof w.file!=='string'||!w.file.trim()||/^(?:[a-z]+:|[\\/])/i.test(w.file)||w.file.split(/[\\/]/).includes('..')||! /\.(png|jpe?g|webp)$/i.test(w.file))throw new Error('Watermark cần đường dẫn ảnh PNG/JPEG/WebP trong dự án.');
 if(!['top-left','top-right','bottom-left','bottom-right'].includes(w.position)||!Number.isFinite(w.heightPercent)||w.heightPercent<=0||w.heightPercent>30||!Number.isFinite(w.marginPercent)||w.marginPercent<0||w.marginPercent>30||!Number.isFinite(w.opacity)||w.opacity<0||w.opacity>1||w.hidden!==undefined&&typeof w.hidden!=='boolean')throw new Error('Vị trí/kích thước/độ trong suốt watermark không hợp lệ.');
 return w;
}
export function watermarkStyle(value,width,height){
 const w=normalizeWatermark(value);if(!w||w.hidden)return '';
 const margin=Math.round(w.marginPercent/100*width),size=Math.round(w.heightPercent/100*height);
 return `position:absolute;${w.position.startsWith('top')?'top':'bottom'}:${margin}px;${w.position.endsWith('left')?'left':'right'}:${margin}px;height:${size}px;width:auto;opacity:${w.opacity};z-index:2147483646;pointer-events:none;max-width:none;object-fit:contain`;
}
