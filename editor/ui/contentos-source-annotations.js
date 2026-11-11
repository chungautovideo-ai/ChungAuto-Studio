export async function showSourceAnnotations({host,relative,workspaceId,isCurrent=()=>true}){
 host.replaceChildren();host.hidden=false;
 const title=document.createElement('h3');title.textContent='Nhãn và quyền dùng · '+relative;
 const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Đang đọc…';host.append(title,status);
 try{
  const response=await fetch('/api/v1/storage/annotations?relative='+encodeURIComponent(relative)+'&workspaceId='+encodeURIComponent(workspaceId));const current=await response.json();if(!isCurrent()||!host.isConnected)return;if(!response.ok)throw new Error(current.error);
  const form=document.createElement('form');form.setAttribute('aria-label','Nhãn và quyền dùng tư liệu');
  const input=(label,value,multiline=false)=>{const wrapper=document.createElement('label');wrapper.textContent=label;const field=document.createElement(multiline?'textarea':'input');field.value=value;field.setAttribute('aria-label',label);wrapper.append(field);form.append(wrapper);return field;};
  const tags=input('Nhãn (phân cách bằng dấu phẩy)',current.tags.join(', ')),notes=input('Ghi chú tư liệu',current.notes,true),evidence=input('Căn cứ quyền sử dụng',current.evidence,true);
  const rights=document.createElement('select');rights.setAttribute('aria-label','Quyền sử dụng tư liệu');for(const [value,label] of [['unknown','Chưa xác minh'],['owned','Tự sở hữu'],['licensed','Được cấp phép'],['restricted','Hạn chế sử dụng']]){const option=document.createElement('option');option.value=value;option.textContent=label;rights.append(option);}rights.value=current.rights;form.append(rights);
  const hint=document.createElement('p');hint.textContent='Thông tin do người dùng khai báo; chưa tự xác minh hoặc chặn xuất/đăng. Nguồn đổi thì cần kiểm tra lại quyền. Lưu trên máy này theo workspace.';form.append(hint);
  const save=document.createElement('button');save.textContent='Lưu thông tin tư liệu';form.append(save);
  status.textContent=current.sourceChanged?'Nguồn đã thay đổi từ lần ghi thông tin trước. Kiểm tra lại quyền sử dụng.':'';
  let version=current.version;
  form.onsubmit=async event=>{event.preventDefault();save.disabled=true;status.textContent='Đang lưu…';try{
   const result=await fetch('/api/v1/storage/annotations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({relative,workspaceId,expectedVersion:version,tags:tags.value.split(',').map(t=>t.trim()).filter(Boolean),notes:notes.value,evidence:evidence.value,rights:rights.value})});const value=await result.json();if(!isCurrent()||!host.isConnected)return;if(!result.ok)throw new Error(value.error);version=value.version;status.textContent='Đã lưu thông tin tư liệu.';
  }catch(error){if(isCurrent()&&host.isConnected)status.textContent=error.message;}finally{save.disabled=false;}};
  host.append(form);
 }catch(error){if(isCurrent()&&host.isConnected)status.textContent=error.message;}
}
