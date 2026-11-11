import {plateGeometry} from '../lib/plate-regions.js';
export function hitPlateCorner(quad,at,width,height,radius=14){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return -1;
 let nearest=-1,distance=radius;
 quad.forEach(([x,y],i)=>{const d=Math.hypot((x-at[0])*width,(y-at[1])*height);if(d<=distance){nearest=i;distance=d;}});
 return nearest;
}
export function movePlateCorner(quad,index,at){
 if(!Number.isInteger(index)||index<0||index>3)throw new Error('Chọn một trong 4 góc.');
 const next=quad.map(p=>[...p]);next[index]=[...at];
 const geometry=plateGeometry({quads:[next]});plateGeometry({roi:geometry.rois[0]});
 return {quad:geometry.quads[0],roi:geometry.rois[0]};
}
