const readable=['title','format','source','template','brand','camera','transitions','segments','texts','zooms','scenes','brolls','blocks','captions','audio','watermark','endCard'];
export const projectReadableFields=Object.freeze(readable);
export function selectProjectContext(project,{fields}={}){
 if(fields===undefined)return {project:structuredClone(project),partial:false};
 if(!Array.isArray(fields)||!fields.length||fields.length>readable.length||new Set(fields).size!==fields.length||fields.some(f=>!readable.includes(f)))throw new Error('Chọn các nhóm dữ liệu dự án hợp lệ, không trùng nhau.');
 const selected={};for(const field of fields)if(Object.hasOwn(project,field))selected[field]=structuredClone(project[field]);
 return {project:selected,partial:true,selectedFields:[...fields],omittedFields:Object.keys(project).filter(key=>!fields.includes(key)),note:'Chỉ là bản đọc các nhóm được chọn. set_edit_fields thay toàn bộ mỗi nhóm đã gửi; đọc đầy đủ nhóm trước khi thay, giữ item không liên quan. Nhóm không gửi vào set_edit_fields được giữ nguyên.'};
}
