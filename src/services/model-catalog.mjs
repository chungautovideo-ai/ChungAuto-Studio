import {validateImageConnection} from './connections.mjs';

// Listing models is not proof of vision/tool calling or editor capability.
export async function discoverModels(config,{fetcher=fetch,validate=()=>{}}={}){
 validate();const {baseUrl}=validateImageConnection(config);
 const response=await fetcher(baseUrl+'/models',{redirect:'error',signal:AbortSignal.timeout(15000),headers:config.apiKey?{Authorization:'Bearer '+config.apiKey}:{}});
 if(!response.ok)throw new Error('Danh sách model trả HTTP '+response.status+'. Kiểm tra gateway và quyền truy cập.');
 const chunks=[];let size=0;
 for await(const chunk of response.body){size+=chunk.length;if(size>2*1024**2){throw new Error('Danh sách model quá lớn.');}chunks.push(chunk);}
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8')).data;
 if(!Array.isArray(data)||data.length>2000)throw new Error('Gateway chưa trả danh sách model được hỗ trợ.');
 const ids=[...new Set(data.map(item=>item?.id).filter(id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(id)))].sort();
 validate();return {models:ids.map(id=>({id,capability:'unverified'})),capabilitiesVerified:false,checkedAt:new Date().toISOString()};
}
