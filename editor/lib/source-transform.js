export function normalizeSourceTransform(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['x','y','scale','rotate','flipH','flipV'].includes(k)))throw new Error('Biến đổi khung nguồn không hợp lệ.');
 const t={x:0,y:0,scale:1,rotate:0,flipH:false,flipV:false,...value};
 if(![t.x,t.y,t.scale,t.rotate].every(Number.isFinite)||Math.abs(t.x)>1||Math.abs(t.y)>1||t.scale<.1||t.scale>5||Math.abs(t.rotate)>180||typeof t.flipH!=='boolean'||typeof t.flipV!=='boolean')throw new Error('Vị trí/cỡ/góc/lật khung nguồn không hợp lệ.');return t;
}
export function sourceTransformStyle(value){
 const t=normalizeSourceTransform(value);if(!t||t.x===0&&t.y===0&&t.scale===1&&t.rotate===0&&!t.flipH&&!t.flipV)return '';
 return `translate(${Math.round(t.x*100000)/1000}%, ${Math.round(t.y*100000)/1000}%) rotate(${t.rotate}deg) scale(${t.scale*(t.flipH?-1:1)}, ${t.scale*(t.flipV?-1:1)})`;
}
