export async function showProjectSources({host,dir,workspaceId,isCurrent=()=>true}){
 host.replaceChildren();host.hidden=false;
 const title=document.createElement('h3');title.textContent='Nguồn đã nhập vào dự án';const status=document.createElement('p');status.setAttribute('role','status');
 const list=document.createElement('div'),next=document.createElement('button');next.textContent='Xem thêm nguồn';next.hidden=true;host.append(title,status,list,next);
 async function load(offset=0){
  next.disabled=true;status.textContent='Đang đọc lịch sử nguồn…';
  try{
   const response=await fetch('/api/v1/storage/project-sources?'+new URLSearchParams({dir,workspaceId,offset}));const result=await response.json();if(!isCurrent()||!host.isConnected)return;if(!response.ok)throw new Error(result.error);
   for(const asset of result.entries){
    const card=document.createElement('article');card.style.cssText='padding:12px;border-bottom:1px solid var(--line);overflow-wrap:anywhere';
    const name=document.createElement('b');name.textContent=asset.name;const detail=document.createElement('pre');detail.style.whiteSpace='pre-wrap';
    const annotations=asset.annotations,rights={unknown:'Chưa xác minh',owned:'Tự sở hữu (khai báo)',licensed:'Được cấp phép (khai báo)',restricted:'Hạn chế (khai báo)'};
    detail.textContent=[asset.path,'Loại nguồn: '+(asset.sourceKinds||['source']).map(k=>({source:'NAS / Chat',phone:'Điện thoại',voice:'Voice',image:'Ảnh AI / nhập ảnh'}[k]||k)).join(', '),asset.provenance?'Tham chiếu kết quả: '+asset.provenance.resultId+' · '+asset.provenance.origin:null,asset.voiceVersions?.length?'Các bản voice: '+asset.voiceVersions.map(v=>v.voiceResultId+(v.narration?.scriptId?' · kịch bản '+v.narration.scriptId:'')).join(', '):null,'Bản local: '+({present:'Có file, khớp dung lượng',missing:'Thiếu file','size-unknown':'Có file, thiếu dung lượng đối chiếu','size-changed':'Dung lượng đã đổi',invalid:'Đường dẫn không hợp lệ'}[asset.localState]),'Nguồn: '+[asset.source?.root,asset.source?.relative].filter(Boolean).join('/'),'SHA256 khi nhập: '+(asset.sha256||'Không có'),'Quyền tại lúc nhập: '+(rights[annotations?.rights]||'Chưa ghi nhận'),annotations?.sourceChanged?'Nguồn đã thay đổi từ lần khai báo trước khi nhập.':null,'Nhãn: '+(annotations?.tags?.join(', ')||'Chưa có'),annotations?.notes,annotations?.evidence?'Căn cứ: '+annotations.evidence:null,annotations?.version?'Phiên bản thông tin: '+annotations.version:null].filter(Boolean).join('\n');
    const verify=document.createElement('button'),verification=document.createElement('p');verify.textContent='Kiểm tra SHA256';verification.setAttribute('role','status');
    verify.disabled=!asset.sha256||!Number.isSafeInteger(asset.bytes)||asset.bytes<32;
    verify.onclick=async()=>{verify.disabled=true;verification.textContent='Đang kiểm tra nội dung…';try{
      const response=await fetch('/api/v1/storage/verify-source',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dir,workspaceId,path:asset.path})});const result=await response.json();if(!isCurrent()||!card.isConnected)return;if(!response.ok)throw new Error(result.error);verification.textContent='Khớp SHA256 tại '+result.verifiedAt+'; không phải xác nhận quyền sử dụng.';
    }catch(error){if(isCurrent()&&card.isConnected)verification.textContent=error.message;}finally{verify.disabled=false;}};
    card.append(name,detail,verify,verification);list.append(card);
   }
   status.textContent='Tổng '+result.total+' nguồn đã nhập. Chỉ kiểm sự tồn tại/dung lượng; chưa hash lại. Quyền là bản khai báo tại lúc nhập, chưa xác minh.';
   next.hidden=result.nextOffset===null;next.onclick=()=>load(result.nextOffset);
  }catch(error){if(isCurrent()&&host.isConnected)status.textContent=error.message;}finally{next.disabled=false;}
 }
 await load();
}
