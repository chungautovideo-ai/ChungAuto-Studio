export function normalizeVariables(value){
 if(value===undefined)return undefined;
 if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).length>30)throw new Error('Mỗi bản tối đa 30 biến dữ liệu.');
 const result={};for(const key of Object.keys(value).sort()){
  if(!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key)||typeof value[key]!=='string'||value[key].length>2000)throw new Error('Biến phải có tên chữ/số/gạch dưới, giá trị tối đa 2000 ký tự.');
  result[key]=value[key];
 }return result;
}
export function applyBatchVariables(project,value){
 const variables=normalizeVariables(value);if(!variables||!Object.keys(variables).length)return project;
 const result=structuredClone(project),used=new Set();
 for(const item of result.texts||[])for(const key of ['title','label','sub'])if(typeof item[key]==='string')item[key]=item[key].replace(/\{\{([A-Za-z][A-Za-z0-9_]{0,39})\}\}/g,(match,name)=>{
  if(!Object.hasOwn(variables,name))throw new Error('Thiếu biến '+name+' trong dữ liệu phiên bản.');used.add(name);return variables[name];
 });
 for(const key of Object.keys(variables))if(!used.has(key))throw new Error('Không tìm thấy {{'+key+'}} trong chữ title/label/sub của dự án.');
 return result;
}
export function parseBatchCsv(input){
 if(typeof input!=='string'||input.length>200000)throw new Error('CSV tối đa 200.000 ký tự.');
 const rows=[];let row=[],cell='',quoted=false,closed=false;
 const push=()=>{row.push(cell);cell='';closed=false;};
 const source=input.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 for(let i=0;i<source.length;i++){
  const c=source[i];if(quoted){if(c==='"'){if(source[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c===','||c==='\n'){push();if(c==='\n'){if(row.some(v=>v!==''))rows.push(row);row=[];}continue;}
  if(closed)throw new Error('CSV có ký tự sau dấu đóng ngoặc kép.');
  if(c==='"'){if(cell)throw new Error('CSV có dấu ngoặc kép sai vị trí.');quoted=true;}else cell+=c;
 }if(quoted)throw new Error('CSV thiếu dấu đóng ngoặc kép.');push();if(row.some(v=>v!==''))rows.push(row);
 const headers=rows.shift()?.map(v=>v.trim());if(!headers||!headers.includes('title')||!headers.includes('format')||new Set(headers).size!==headers.length)throw new Error('CSV cần cột title,format và tên cột không trùng.');
 const keys=headers.filter(k=>!['title','format'].includes(k));if(!rows.length||rows.length>20)throw new Error('CSV cần 1–20 dòng dữ liệu.');
 return rows.map((values,index)=>{if(values.length!==headers.length)throw new Error('Sai số cột ở dòng '+(index+2));const data=Object.fromEntries(headers.map((key,i)=>[key,values[i]]));if(!data.title.trim()||data.title.length>160||!['9:16','16:9'].includes(data.format.trim()))throw new Error('Tên/tỷ lệ không hợp lệ ở dòng '+(index+2));return {title:data.title.trim(),format:data.format.trim(),...(keys.length?{variables:normalizeVariables(Object.fromEntries(keys.map(key=>[key,data[key]])))}:{})};});
}
