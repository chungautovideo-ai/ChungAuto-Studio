// A soft chroma selection, not face/person segmentation. Runs after conversion to Rec.709.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export function validateSkinLift(value=0){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>.3)throw new Error('Nâng sáng sắc da cần mức0–0.30.');
 return value;
}
export function liftSkinRgb(rgb,strength=0){
 validateSkinLift(strength);
 const [r,g,b]=rgb,y=.299*r+.587*g+.114*b,cb=128/255-.168736*r-.331264*g+.5*b,cr=128/255+.5*r-.418688*g-.081312*b;
 const band=(x,lo,hi,feather)=>smooth(lo,lo+feather,x)*(1-smooth(hi-feather,hi,x));
 const chroma=band(cb,77/255,127/255,6/255)*band(cr,137/255,173/255,6/255);
 const luminance=smooth(.06,.16,y)*(1-smooth(.55,.88,y));
 const headroom=clamp((.97-Math.max(r,g,b))/.15);
 const gain=1+strength*chroma*luminance*headroom;
 return rgb.map(v=>clamp(v*gain));
}
export function skinLiftCube(strength){
 validateSkinLift(strength);const size=33,lines=['TITLE "ContentOS soft skin chroma lift v1"','LUT_3D_SIZE '+size];
 for(let b=0;b<size;b++)for(let g=0;g<size;g++)for(let r=0;r<size;r++)lines.push(liftSkinRgb([r/(size-1),g/(size-1),b/(size-1)],strength).map(x=>x.toFixed(7)).join(' '));
 return lines.join('\n')+'\n';
}
