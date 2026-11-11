import path from 'node:path';import {spawn} from 'node:child_process';import {presetPythonStatus} from './preset-python.mjs';
let active=0,python=null;
// Dùng Python có lxml (bản nhúng của app); `python` trần trên Windows thường là lối tắt Microsoft Store.
const pythonFor=root=>{if(process.env.CONTENTOS_PYTHON)return {command:process.env.CONTENTOS_PYTHON,args:[]};if(!python?.ready)python=presetPythonStatus(root);return python.ready?python:{command:'python',args:[]};};
export async function readNewsArticle(root,{url,html}={}){
 let parsed;try{parsed=new URL(url);}catch{throw Object.assign(new Error('URL nguồn không hợp lệ.'),{status:400});}
 if(!['http:','https:'].includes(parsed.protocol)||parsed.username||parsed.password)throw Object.assign(new Error('Dùng URL HTTP(S) không chứa thông tin đăng nhập.'),{status:400});
 if(html!==undefined&&(typeof html!=='string'||Buffer.byteLength(html)>2*1024**2))throw Object.assign(new Error('HTML tối đa 2 MiB.'),{status:400});
 if(active>=2)throw Object.assign(new Error('Đang đọc hai nguồn tin. Đợi rồi thử lại.'),{status:409});
 active++;
 try{return await new Promise((resolve,reject)=>{
  const py=pythonFor(root),child=spawn(py.command,[...py.args,path.join(root,'src/adapters/studio-news/read.py')],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,PYTHONIOENCODING:'utf-8'}});
  child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
  let stdout='',stderr='',settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>{child.kill();finish(new Error('Đọc bài quá thời gian. Thử lại hoặc dán trích đoạn.'));},30000);
  child.on('error',error=>finish(new Error('Không chạy được Python đọc tin: '+error.message)));
  child.stdout.on('data',chunk=>{stdout+=chunk.toString('utf8');if(Buffer.byteLength(stdout)>8*1024**2){child.kill();finish(new Error('Bài trích quá lớn.'));}});
  child.stderr.on('data',chunk=>{if(stderr.length<4000)stderr+=chunk.toString('utf8');});
  child.on('close',code=>{try{const result=JSON.parse(stdout);if(code!==0||result.error)finish(Object.assign(new Error(result.error?.message||'Không đọc được bài.'),{status:400,code:result.error?.error||result.error?.code}));else finish(null,result);}catch{finish(new Error('Công cụ đọc tin lỗi. Kiểm tra Python/lxml. '+stderr.slice(0,500)));}});
  child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify({url:parsed.href,...(html!==undefined?{html}:{})}));
 });}finally{active--;}
}
