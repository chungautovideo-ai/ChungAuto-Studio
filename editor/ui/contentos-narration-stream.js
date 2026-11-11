export async function readNarrationResponse(response,onProgress=()=>{}){
 if(!response.ok){const data=await response.json();throw new Error(data.error||'Không nhận được lời đọc.');}
 if(!response.headers.get('content-type')?.includes('application/x-ndjson'))return response.json();
 const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',result,bytes=0;
 const consume=line=>{if(!line.trim())return;const data=JSON.parse(line);if(data.type==='error')throw new Error(data.error);if(data.type==='progress')onProgress(data);if(data.type==='result')result=data.result;};
 try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>16*1024*1024)throw new Error('Kết quả nhận giọng quá lớn.');pending+=decoder.decode(value,{stream:true});let index;while((index=pending.indexOf('\n'))>=0){consume(pending.slice(0,index));pending=pending.slice(index+1);}}pending+=decoder.decode();if(pending)consume(pending);}
 catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 if(!result)throw new Error('Kết nối nhận giọng kết thúc trước khi có kết quả.');return {ok:true,result};
}
