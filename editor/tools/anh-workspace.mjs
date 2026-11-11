import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const [jobDir,action,value='']=process.argv.slice(2);
try{
 if(!jobDir||!['list','attach'].includes(action))throw new Error('Dùng: node editor/tools/anh-workspace.mjs <jobDir> list [từ khóa] [offset] hoặc <jobDir> attach <imageId>');
 const relative=path.relative(root,path.resolve(root,jobDir));if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Việc phải thuộc ContentOS.');
 const response=await fetch(`http://127.0.0.1:${Number(process.env.EDITOR_PORT||5180)}/api/v1/images/job`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jobDir:relative,action,...(action==='list'?{query:value,offset:Number(process.argv[5]||0)}:{id:value})})});
 const result=await response.json();if(!response.ok)throw new Error(result.error||'Không dùng được ảnh workspace.');console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exit(1);}
