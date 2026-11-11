// Serial intake reuses the single-file endpoint and its checksum/provenance guards.
export async function importSourceSelection({paths,dir,workspaceId,request=fetch,shouldStop=()=>false,onResult=()=>{}}){
 if(!Array.isArray(paths)||!paths.length||paths.length>50||new Set(paths).size!==paths.length||paths.some(p=>typeof p!=='string'||!p))throw new Error('Chọn từ 1 đến 50 file khác nhau.');
 if(!dir||dir==='__new__')throw new Error('Chọn dự án đã có để nhận nhiều tư liệu.');
 const results=[];
 for(const relative of paths){
  if(shouldStop())break;
  let result;
  try{
   const response=await request('/api/v1/storage/attach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir,workspaceId,relative})});
   const body=await response.json();
   result=response.ok?{relative,status:body.duplicate?'duplicate':'imported',asset:body.asset}:{relative,status:'error',error:body.error||'Không nhập được file.'};
  }catch(error){
   // Lost response can mean the server already committed. Do not replay automatically.
   result={relative,status:'uncertain',error:'Mất phản hồi. Kiểm tra tư liệu dự án trước khi thử lại: '+error.message};
  }
  results.push(result);await onResult(result);
  if(result.status==='uncertain')break;
 }
 return {results,pending:paths.slice(results.length)};
}
