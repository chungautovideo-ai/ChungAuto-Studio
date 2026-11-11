import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export function createApiUsageStore(root,{now=()=>new Date()}={}){
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
 const folder=id=>{if(!/^[a-zA-Z0-9-]+$/.test(id))throw new Error('Workspace không hợp lệ.');return path.join(root,'workspace/contentos/api-usage',id);};
 const read=(file,fallback)=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):fallback;
 const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';try{fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);}finally{fs.rmSync(temp,{force:true});}};
 const policy=id=>read(path.join(folder(id),'policy.json'),{dailyCalls:0});
 function status(id){const date=day(),entries=read(path.join(folder(id),date+'.json'),{entries:[]}).entries,tokens={};for(const item of entries)for(const key of ['prompt_tokens','completion_tokens','total_tokens'])if(Number.isSafeInteger(item.usage?.[key]))tokens[key]=(tokens[key]||0)+item.usage[key];return {day:date,timeZone:'Asia/Ho_Chi_Minh',policy:policy(id),calls:entries.length,unknownUsage:entries.filter(e=>e.usage?.total_tokens===undefined).length,tokens,recent:entries.slice(-20).reverse(),scope:'llm-api-on-this-install'};}
 return {
  status,
  savePolicy(id,{dailyCalls}){if(!Number.isInteger(dailyCalls)||dailyCalls<0||dailyCalls>10000)throw new Error('Giới hạn lượt/ngày cần từ0đến10000 (0=không giới hạn).');write(path.join(folder(id),'policy.json'),{dailyCalls});return status(id);},
  fetcher(id,operation,{fetcher=fetch}={}){return async(url,options)=>{
   const date=day(),file=path.join(folder(id),date+'.json'),ledger=read(file,{entries:[]}),limit=policy(id).dailyCalls;
   if(limit&&ledger.entries.length>=limit)throw Object.assign(new Error('Đã chạm giới hạn lượt gọi LLM API hôm nay. Xem Kết nối API → Mức dùng.'),{status:429});
   const body=JSON.parse(options.body),entry={id:crypto.randomUUID(),operation,model:String(body.model||'').slice(0,128),status:'dispatched',startedAt:now().toISOString()};ledger.entries.push(entry);write(file,ledger);
   function finish(value){const current=read(file,{entries:[]}),item=current.entries.find(e=>e.id===entry.id);if(!item)throw new Error('Mất bản ghi mức dùng API.');Object.assign(item,value,{finishedAt:now().toISOString()});write(file,current);}
   try{
    const response=await fetcher(url,options),chunks=[];let size=0;
    for await(const chunk of response.body){size+=chunk.length;if(size>2*1024**2)throw new Error('Phản hồi API quá lớn.');chunks.push(chunk);}
    const bytes=Buffer.concat(chunks);let result;try{result=JSON.parse(bytes.toString('utf8'));}catch{}
    const usage={};for(const key of ['prompt_tokens','completion_tokens','total_tokens'])if(Number.isSafeInteger(result?.usage?.[key])&&result.usage[key]>=0)usage[key]=result.usage[key];
    finish({status:response.ok?'responded':'http-error',httpStatus:response.status,usage});
    return new Response(bytes,{status:response.status,headers:{'Content-Type':'application/json'}});
   }catch(error){finish({status:'uncertain'});throw error;}
  };}
 };
}
