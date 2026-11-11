// Insets are fractions of the original media, applied before object-fit.
export function normalizeSourceCrop(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['top','right','bottom','left'].includes(k)))throw new Error('Vùng cắt nguồn không hợp lệ.');
 const crop={};for(const k of ['top','right','bottom','left']){const v=value[k]??0;if(!Number.isFinite(v)||v<0||v>.45)throw new Error('Cắt mỗi cạnh nguồn phải từ0đến45%.');crop[k]=v;}return crop;
}
export function sourceCropStyle(value){
 const c=normalizeSourceCrop(value);if(!c||!Object.values(c).some(Boolean))return '';
 return `object-view-box:inset(${['top','right','bottom','left'].map(k=>Math.round(c[k]*10000)/100+'%').join(' ')});`;
}
export function croppedMediaStyle(value,source,frame,fit='cover'){
 const c=normalizeSourceCrop(value);if(!c||!Object.values(c).some(Boolean))return null;
 if(![source.width,source.height,frame.width,frame.height].every(v=>Number.isFinite(v)&&v>0)||!['contain','cover'].includes(fit))throw new Error('Cần kích thước nguồn/khung hợp lệ để cắt hình.');
 const w=source.width*(1-c.left-c.right),h=source.height*(1-c.top-c.bottom),scale=Math[fit==='contain'?'min':'max'](frame.width/w,frame.height/h);
 const left=(frame.width-w*scale)/2-c.left*source.width*scale,top=(frame.height-h*scale)/2-c.top*source.height*scale;
 // Clip away source margins even when the retained image has letterboxing.
 return `position:absolute;left:${left}px;top:${top}px;width:${source.width*scale}px;height:${source.height*scale}px;object-fit:fill;clip-path:inset(${['top','right','bottom','left'].map(k=>c[k]*100+'%').join(' ')});`;
}
