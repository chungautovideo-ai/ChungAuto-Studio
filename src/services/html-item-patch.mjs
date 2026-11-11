import crypto from 'node:crypto';
import {replacePresetFields} from './api-presets.mjs';
const hash=item=>crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex');
const metadata=['name','at','dur','x','y','scale','hidden'];
function find(project,id){
 if(typeof id!=='string'||!id||id.length>200)throw Error('ID khối không hợp lệ.');
 const matches=(project.blocks||[]).filter(item=>item?.id===id);
 if(matches.length!==1)throw Error('ID khối không tồn tại hoặc bị trùng.');
 return matches[0];
}
function fieldsOf(item){
 const fields=item.fields||[];
 if(!Array.isArray(fields)||fields.length>20||fields.some(f=>!f||typeof f.sel!=='string'||!f.sel.trim()||!f.sel.trim().split(/\s+/).every(p=>/^(?:[a-zA-Z][\w-]*)?(?:[.#][\w-]+)+$|^[a-zA-Z][\w-]*$/.test(p))))throw Error('Khối chưa có trường chữ tương thích.');
 return fields;
}
export async function readHTMLItem(project,{id}={}){
 const item=find(project,id),fields=fieldsOf(item);
 const values=fields.length?(await replacePresetFields({html:item.html,fields,readOnly:true})).values:[];
 return {group:'blocks',id,version:hash(item),properties:Object.fromEntries(metadata.filter(k=>Object.hasOwn(item,k)).map(k=>[k,item[k]])),fields:fields.map((f,i)=>({key:String(i),label:f.label||'Chữ '+(i+1),value:values[i],words:!!f.words})),note:'Không gửi HTML/CSS/JS. values theo key; không có fields thì chỉ sửa properties. Giữ ID/mảng khác.'};
}
export async function patchHTMLItem(project,{id,version,values,properties}={}){
 const item=find(project,id);
 if(typeof version!=='string'||version!==hash(item))throw Error('Khối đã đổi. Đọc lại trước khi sửa.');
 if(values===undefined&&properties===undefined)throw Error('Cần values hoặc properties.');
 const next=structuredClone(item);
 if(properties!==undefined){
  if(!properties||Array.isArray(properties)||typeof properties!=='object'||!Object.keys(properties).length||Object.keys(properties).some(k=>!metadata.includes(k)))throw Error('Thuộc tính khối không hỗ trợ.');
  for(const [k,v] of Object.entries(properties)){
   if(k==='name'){if(typeof v!=='string'||v.length>200||/[<>]/.test(v))throw Error('Tên khối không hợp lệ.');}
   else if(k==='hidden'){if(typeof v!=='boolean')throw Error('hidden cần boolean.');}
   else if(!Number.isFinite(v)||(k==='at'&&v<0)||(k==='dur'&&(v<.2||v>120))||(k==='scale'&&(v<.05||v>10))||(['x','y'].includes(k)&&Math.abs(v)>10000))throw Error('Vị trí/thời gian khối không hợp lệ.');
   next[k]=v;
  }
 }
 if(values!==undefined){
  const fields=fieldsOf(item);
  if(!values||Array.isArray(values)||typeof values!=='object'||!Object.keys(values).length||Object.keys(values).some(k=>!/^\d+$/.test(k)||String(Number(k))!==k||!fields[Number(k)])||Object.values(values).some(v=>typeof v!=='string'||v.length>500||/[<>]/.test(v)))throw Error('Chỉ điền văn bản tối đa500ký tự vào key đã có.');
  const indices=Object.keys(values).map(Number);
  next.html=(await replacePresetFields({html:item.html,fields:indices.map(i=>fields[i]),values:indices.map(i=>values[String(i)])})).html;
  for(const i of indices)if(fields[i].words){const prefix=fields[i].sel+' .w:nth-child(';next.anim=(next.anim||[]).filter(a=>!a.sel?.startsWith(prefix));values[String(i)].trim().split(/\s+/).filter(Boolean).forEach((_,n)=>next.anim.push({sel:prefix+(n+1)+')',to:{opacity:1},at:.1+n*.22,dur:.08}));}
 }
 const candidate=structuredClone(project);candidate.blocks=candidate.blocks.map(b=>b.id===id?next:b);
 return {project:candidate,result:{group:'blocks',id,version:hash(next)}};
}
