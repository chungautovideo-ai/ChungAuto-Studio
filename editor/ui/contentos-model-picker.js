// Shared discovery UI; selecting a model changes only this run's input.
export function runModelPicker({input,request=(...args)=>fetch(...args),disabled=false,isCurrent=()=>true,kind='llm'}={}){
 if(!['llm','image'].includes(kind))throw new Error('Loại model không hợp lệ.');
 const host=document.createElement('div');host.className='cos-run-model-picker';host.style.cssText='margin:8px 0;min-width:0';
 const button=document.createElement('button');button.type='button';button.textContent='Lấy model từ gateway';button.disabled=disabled;
 const select=document.createElement('select');select.setAttribute('aria-label','Chọn model API cho lượt này');select.hidden=true;select.style.maxWidth='100%';
 const note=document.createElement('small');note.setAttribute('role','status');host.append(button,select,note);let pending=false;
 const valid=()=>host.isConnected&&input.isConnected&&isCurrent();
 select.onchange=()=>{if(!valid()||input.disabled)return;input.value=select.value;input.dispatchEvent(new Event('input',{bubbles:true}));};
 button.onclick=async()=>{
  if(pending||!valid())return;pending=true;button.disabled=true;select.hidden=true;note.textContent='Đang đọc danh sách từ kết nối đã lưu…';
  try{
   const stateResponse=await request('/api/v1/workspaces'),state=await stateResponse.json();if(!stateResponse.ok)throw new Error(state.error||'Không đọc được workspace.');
   if(!valid())return;const response=await request('/api/v1/connections/'+kind+'/models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workspaceId:state.activeId})}),result=await response.json();
   if(!response.ok)throw new Error(result.error||'Không lấy được model.');
   const latest=await request('/api/v1/workspaces'),current=await latest.json();if(!latest.ok||current.activeId!==state.activeId||result.workspaceId!==state.activeId)throw new Error('Workspace đã đổi. Đọc lại danh sách.');
   if(!valid())return;select.replaceChildren(new Option('Dùng mặc định kết nối',''),...result.models.map(model=>new Option(model.id,model.id)));select.value=result.models.some(model=>model.id===input.value)?input.value:'';select.hidden=false;note.textContent=`Đã đọc ${result.models.length} model. Chỉ chọn mới đổi model của lượt này; `+(kind==='image'?'khả năng tạo/sửa ảnh chưa được kiểm chứng.':'tools/vision chưa được kiểm chứng.');
  }catch(error){if(valid())note.textContent=error.message;}finally{pending=false;if(valid())button.disabled=disabled;}
 };
 return host;
}
