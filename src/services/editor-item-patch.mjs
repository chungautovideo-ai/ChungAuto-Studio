import crypto from 'node:crypto';
export const patchGroups=Object.freeze(['texts','segments','zooms','scenes','brolls','audio.clips']);
const items=(project,group)=>group==='audio.clips'?project.audio?.clips||[]:project[group]||[];
const hash=item=>crypto.createHash('sha256').update(JSON.stringify(item)).digest('hex');
export function resolveEditSelection(project,context){
 const selection=context?.selection;
 // Accept the inherited VEK tab/item shape, but never forward client item properties.
 const group=selection?.group??context?.tab,id=selection?.id??context?.item?.id;
 if(id===undefined||id===null)return null;
 if(group==='blocks'){
  if(typeof id!=='string'||!id||id.length>200)throw new Error('ID thành phần không hợp lệ.');
  const matches=(project.blocks||[]).filter(item=>item?.id===id);
  if(matches.length!==1)throw new Error('ID thành phần không tồn tại hoặc bị trùng.');
  const version=hash(matches[0]);
  if(selection?.version!==undefined&&selection.version!==version)throw new Error('Lựa chọn đã đổi. Chọn lại thành phần trước khi giao AI.');
  return {group,id,version,supported:true,note:'Khối HTML: API dùng read_html_item/patch_html_item, chỉ sửa trường chữ đã khai báo và metadata; không thay HTML/CSS/JS.'};
 }
 if(!patchGroups.includes(group))return {group:String(group||'').slice(0,40),supported:false,note:'Nhóm đang chọn chưa hỗ trợ sửa riêng bằng API; không suy diễn đối tượng.'};
 const current=readEditItem(project,{group,id});
 if(selection?.version!==undefined&&selection.version!==current.version)throw new Error('Lựa chọn đã đổi. Chọn lại thành phần trước khi giao AI.');
 return {group:current.group,id:current.id,version:current.version,supported:true};
}
export function readEditItem(project,{group,id}={}){
 if(!patchGroups.includes(group)||typeof id!=='string'||!id||id.length>200)throw new Error('Nhóm hoặc ID thành phần không hợp lệ.');
 const matches=items(project,group).filter(item=>item?.id===id);if(matches.length!==1)throw new Error('ID thành phần không tồn tại hoặc bị trùng.');
 const item=structuredClone(matches[0]);return {group,id,item,version:hash(item),note:'Sửa bằng patch_edit_item với version này; giữ nguyên ID và những thuộc tính không yêu cầu đổi.'};
}
export function patchEditItem(project,{group,id,version,changes}={},apply){
 const current=readEditItem(project,{group,id});
 if(typeof version!=='string'||version!==current.version)throw new Error('Thành phần đã đổi. Đọc lại trước khi sửa.');
 if(!changes||typeof changes!=='object'||Array.isArray(changes)||!Object.keys(changes).length||Object.keys(changes).some(k=>['id','__proto__','prototype','constructor'].includes(k)))throw new Error('Chỉ gửi thuộc tính cần đổi, không thay ID.');
 const next={...current.item,...structuredClone(changes)};
 const list=items(project,group).map(item=>item.id===id?next:item);
 const updated=apply(project,group==='audio.clips'?{audio:{...project.audio,clips:list}}:{[group]:list});
 return {project:updated,result:readEditItem(updated,{group,id})};
}
