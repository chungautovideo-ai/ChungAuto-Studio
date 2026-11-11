export const SOURCE_COLOR_PRESETS={
 'tu-nhien':{contrast:1.06,saturation:1.12},'tuoi-sang':{brightness:.03,contrast:1.08,saturation:1.22,vibrance:.15},vivid:{contrast:1.12,saturation:1.3,vibrance:.25},cinematic:{contrast:1.08,saturation:1.05,temperature:6300},'teal-orange':{contrast:1.1,saturation:1.15,temperature:6100},'film-vintage':{contrast:.9,saturation:.85,temperature:6000},'mau-phim':{brightness:.01,contrast:.97,saturation:.9},'golden-hour':{brightness:.02,saturation:1.1,temperature:4800},am:{saturation:1.08,temperature:5200},lanh:{saturation:1.05,temperature:8200},'dem-xanh':{brightness:-.03,contrast:1.1,saturation:.95,temperature:9000},moody:{brightness:-.04,contrast:1.18,saturation:.8,temperature:6900},pastel:{brightness:.05,contrast:.92,saturation:.85},'den-trang':{contrast:1.15,saturation:0}
};
export const SOURCE_COLOR_RANGES={brightness:[-1,1],contrast:[-1,1],saturation:[-1,1],temperature:[-1,1],tint:[-1,1],hue:[-180,180],blur:[0,20],vignette:[0,1]};
export function normalizeSourceColor(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>k!=='preset'&&!Object.hasOwn(SOURCE_COLOR_RANGES,k)))throw new Error('Màu cảnh có thuộc tính chưa hỗ trợ.');
 if(value.preset!==undefined&&(typeof value.preset!=='string'||value.preset!==''&&!Object.hasOwn(SOURCE_COLOR_PRESETS,value.preset)))throw new Error('Preset màu cảnh chưa hỗ trợ.');
 for(const [k,v] of Object.entries(value))if(k!=='preset'){const [min,max]=SOURCE_COLOR_RANGES[k];if(!Number.isFinite(v)||v<min||v>max)throw new Error('Thông số màu cảnh ngoài phạm vi.');}return {...value};
}
const fx=n=>String(Math.round(n*1000)/1000);
export function sourceColorEffects(value,id){
 const c=normalizeSourceColor(value)||{},parts=[],p=SOURCE_COLOR_PRESETS[c.preset];
 if(p){if(p.brightness)parts.push(`brightness(${(1+p.brightness).toFixed(3)})`);if(p.contrast!==undefined)parts.push(`contrast(${p.contrast.toFixed(3)})`);if(p.saturation!==undefined)parts.push(`saturate(${(p.saturation*(1+(p.vibrance??0)*.6)).toFixed(3)})`);if(p.temperature){const k=(6500-p.temperature)/2500;parts.push(k>0?`sepia(${Math.min(.45,k*.45).toFixed(3)})`:`hue-rotate(${(Math.max(-1.2,k)*-10).toFixed(1)}deg)`);}}
 for(const [key,filter] of [['brightness','brightness'],['contrast','contrast'],['saturation','saturate']])if(c[key])parts.push(`${filter}(${fx(1+c[key])})`);
 if(c.hue)parts.push(`hue-rotate(${fx(c.hue)}deg)`);
 let defs='';if(c.temperature||c.tint){if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('ID màu không hợp lệ.');const t=c.temperature??0,m=c.tint??0,r=fx(1+.15*t+.05*m),g=fx(1-.12*m),b=fx(1-.15*t+.05*m);defs=`<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 1 0"/></filter></defs></svg>`;parts.push(`url(#${id})`);}
 if(c.blur)parts.push(`blur(${fx(c.blur)}px)`);
 return {filter:parts.join(' '),defs,vignette:c.vignette?`radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(0,0,0,${fx(c.vignette*.85)}) 100%)`:''};
}
