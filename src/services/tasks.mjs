import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const failure = (message,status=409) => Object.assign(new Error(message),{status});
// One local server owns the store. Workers use lease tokens rather than editing it.
export function createTaskStore(root,{now=()=>Date.now()}={}) {
  const folder=path.join(root,'workspace','contentos','tasks'),file=path.join(folder,'queue.json');
  const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schemaVersion:1,tasks:[]};
  function write(data){
    fs.mkdirSync(folder,{recursive:true});
    const temp=file+'.'+crypto.randomUUID()+'.tmp';
    try{fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}
    finally{fs.rmSync(temp,{force:true});}
  }
  function recover(data){
    let changed=false;
    for(const task of data.tasks)if(task.status==='running'&&task.leaseUntil<=now()){
      task.status='interrupted';task.error='Worker mất lease; kiểm tra đầu ra trước khi thử lại.';
      task.updatedAt=now();delete task.leaseToken;delete task.leaseUntil;changed=true;
    }
    if(changed)write(data);
    return data;
  }
  const getData=()=>recover(read());
  const publicTask=task=>{const {leaseToken,...rest}=task;return structuredClone(rest);};
  function find(data,id,workspaceId){const task=data.tasks.find(t=>t.id===id&&t.workspaceId===workspaceId);if(!task)throw failure('Không tìm thấy công việc.',404);return task;}
  function leased(data,id,workspaceId,token){const task=find(data,id,workspaceId);if(task.status!=='running'||!token||task.leaseToken!==token)throw failure('Lease không còn hiệu lực.');return task;}
  return {
    enqueue({workspaceId,project,revision,snapshot,instruction,kind='revise',idempotencyKey}){
      if(!workspaceId||!project||!revision||!snapshot||!['edit','revise','news-draft','variant-batch','render-batch','intake-batch','native-still'].includes(kind)||!String(instruction||'').trim()||!idempotencyKey||String(idempotencyKey).length>160)throw failure('Thiếu đầu vào hoặc khóa chống tạo lặp.',400);
      const data=getData(),input={workspaceId,project,revision,snapshot,instruction,kind},fingerprint=digest(input);
      const old=data.tasks.find(t=>t.workspaceId===workspaceId&&t.idempotencyKey===idempotencyKey);
      if(old){if(old.fingerprint!==fingerprint)throw failure('Khóa chống tạo lặp đã dùng cho yêu cầu khác.');return publicTask(old);}
      const task={...structuredClone(input),id:crypto.randomUUID(),idempotencyKey,fingerprint,status:'queued',attempt:0,createdAt:now(),updatedAt:now(),checkpoint:null};
      data.tasks.push(task);write(data);return publicTask(task);
    },
    list(workspaceId){return getData().tasks.filter(t=>t.workspaceId===workspaceId).map(publicTask);},
    reconcileKind(kind,findResult,{interruptedMessage='Ứng dụng đã khởi động lại; chưa tự gửi lại API. Kiểm tra bản nháp trước khi tạo lượt mới.'}={}){
      const data=read();let changed=false;
      for(const task of data.tasks)if(task.kind===kind&&['queued','running','interrupted'].includes(task.status)){
        const result=findResult(publicTask(task));
        task.status=result?'succeeded':'interrupted';task.result=result||null;
        task.error=result?null:interruptedMessage;
        task.updatedAt=now();delete task.leaseToken;delete task.leaseUntil;changed=true;
      }
      if(changed)write(data);
    },
    get(id,workspaceId){return publicTask(find(getData(),id,workspaceId));},
    claim(id,workspaceId,worker){
      const data=getData(),task=find(data,id,workspaceId);
      if(task.status!=='queued')throw failure('Công việc chưa sẵn sàng để nhận.');
      if(!worker)throw failure('Thiếu worker.',400);
      Object.assign(task,{status:'running',worker,leaseToken:crypto.randomUUID(),leaseUntil:now()+60000,updatedAt:now(),attempt:task.attempt+1});
      write(data);return {task:publicTask(task),leaseToken:task.leaseToken};
    },
    heartbeat(id,workspaceId,token,checkpoint){
      const data=getData(),task=leased(data,id,workspaceId,token);
      task.leaseUntil=now()+60000;task.updatedAt=now();if(checkpoint!==undefined)task.checkpoint=structuredClone(checkpoint);
      write(data);return publicTask(task);
    },
    finish(id,workspaceId,token,{result,error}={}){
      const data=getData(),task=leased(data,id,workspaceId,token);
      task.status=error?'failed':'succeeded';task.updatedAt=now();task.error=error?String(error):null;task.result=structuredClone(result??null);
      delete task.leaseToken;delete task.leaseUntil;write(data);return publicTask(task);
    },
    cancel(id,workspaceId){
      const data=getData(),task=find(data,id,workspaceId);
      if(!['queued','running','interrupted'].includes(task.status))throw failure('Công việc đã kết thúc.');
      task.status='cancelled';task.updatedAt=now();delete task.leaseToken;delete task.leaseUntil;write(data);return publicTask(task);
    },
    retry(id,workspaceId){
      const data=getData(),task=find(data,id,workspaceId);
      if(!['failed','interrupted','cancelled'].includes(task.status))throw failure('Không thể thử lại trạng thái này.');
      task.status='queued';task.updatedAt=now();task.error=null;write(data);return publicTask(task);
    }
  };
}
