import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const [jobDir,selection]=process.argv.slice(2);
if(!jobDir||selection===undefined){console.error('Dùng: node editor/tools/nhap-nguon-chat.mjs <jobDir> <chỉ số file từ 0>');process.exit(1);}
try{
 const dir=path.resolve(root,jobDir),relative=path.relative(path.join(root,'workspace/content'),dir);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)throw new Error('Sai thư mục việc.');
 const job=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'),'utf8'));
 const files=(job.sources||[]).flatMap(s=>s.status==='ready'?s.files:[]),index=Number(selection);
 if(!Number.isInteger(index)||index<0||!files[index])throw new Error('Chỉ số file không hợp lệ.');
 const response=await fetch(`http://127.0.0.1:${Number(process.env.EDITOR_PORT||5180)}/api/v1/sources/attach-job`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobDir,path:files[index].path})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Không nhập được nguồn.');
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exit(1);}
