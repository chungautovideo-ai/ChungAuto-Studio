const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, body, method = 'POST') {
  const r = await fetch('/api/v1/' + url, body === undefined ? {} : { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const value = await r.json();
  if (!r.ok) throw new Error(value.error || 'Không thực hiện được yêu cầu.');
  return value;
}
export async function loadContentOS() {
  const host = document.querySelector('#vContentOS');
  host.innerHTML = '<h1>Không gian làm việc</h1><p>Đang đọc cấu hình…</p>';
  try {
    const [state, integration, completion, dispatch] = await Promise.all([api('workspaces'), api('capabilities'), api('completion-policy'),api('background-dispatch')]);
    const w = state.workspaces.find(x => x.id === state.activeId);
    if(completion.workspaceId!==w.id)throw new Error('Workspace đã đổi. Mở lại cài đặt.');
    host.innerHTML = `<h1>Không gian làm việc</h1><p>Quản lý thương hiệu, ngành và kho dùng chung cho các dự án trên máy này.</p>
    <label>Workspace đang dùng<select id="cosWorkspace">${state.workspaces.map(x=>`<option value="${esc(x.id)}" ${x.id===w.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
    <form id="cosSettings"><label>Thương hiệu<input name="brand" value="${esc(w.brand)}" maxlength="100"></label><label>Ngành<input name="industry" value="${esc(w.industry)}" maxlength="100"></label><label>Kho NAS / thư mục dùng chung<input name="nasRoot" value="${esc(w.nasRoot)}" placeholder="Đường dẫn UNC hoặc thư mục tuyệt đối"></label><p>Chọn tư liệu từ kho này tại Thêm tư liệu → NAS / Thư mục chung. Chỉ những file bạn chọn mới được sao chép vào dự án.</p><button class="primary">Lưu cấu hình</button></form>
        <details><summary>Tạo workspace cho doanh nghiệp / khách hàng khác</summary><form id="cosCreate"><label>Tên workspace<input name="name" required maxlength="100"></label><label>Thương hiệu<input name="brand" maxlength="100"></label><label>Ngành<input name="industry" maxlength="100"></label><button class="primary">Tạo workspace</button></form></details>
    <p id="cosStatus" role="status" aria-live="polite"></p><details><summary>Thông tin phát triển và phạm vi tích hợp</summary><h2>Trạng thái tích hợp thật</h2><p>Đã giữ code nền ≠ đã kiểm hồi quy toàn bộ. Các module chưa tích hợp chưa mở thành nút thao tác giả.</p>
    ${integration.modules.map(m=>`<article style="padding:14px;border:1px solid var(--line);border-radius:12px;margin:10px 0"><b>${esc(m.name)}</b><p>${esc(m.status)}</p><small>${esc(m.description)}</small></article>`).join('')}
    <h2>Danh mục phạm vi</h2><p>${integration.featureCount} nhóm từ VEK/AIEV/Studio được giữ trong danh mục phát triển, chưa phải ${integration.featureCount} nhóm đã hoạt động.</p></details>`;
    const status = (message, error = false) => { const el = host.querySelector('#cosStatus'); el.textContent = message; el.style.color = error ? '#ff8585' : 'var(--lime)'; };
    const dispatchForm=document.createElement('form');dispatchForm.id='cosDispatch';
    dispatchForm.innerHTML=`<h2>Dựng song song trên máy này</h2><label>Worker CLI/API tối đa<input name="maxWorkers" type="number" min="1" max="8" required value="${dispatch.maxWorkers}"></label><label><input name="paused" type="checkbox" ${dispatch.paused?'checked':''}> Ngừng nhận thêm việc nền</label><p>Áp dụng chung các workspace trên máy này. Không dừng việc đang chạy và không giới hạn số phiên chat bạn tự mở. ASR/render có giới hạn riêng của công cụ; chưa được điều phối tại đây.</p><button class="primary">Lưu giới hạn worker</button><p data-dispatch-status role="status">${dispatch.active} worker đang chạy · ${dispatch.queued} việc chờ điều phối.</p>`;
    host.querySelector('#cosCreate').closest('details').before(dispatchForm); // chỗ cũ của mục "Sau khi AI dựng xong" (đã bỏ)
    const pauseLabel=dispatchForm.elements.paused.parentElement;pauseLabel.style.display='flex';pauseLabel.style.alignItems='center';pauseLabel.style.gap='10px';dispatchForm.elements.paused.style.width='auto';dispatchForm.elements.paused.style.margin='0';
    dispatchForm.onsubmit=async event=>{event.preventDefault();const button=dispatchForm.querySelector('button'),message=dispatchForm.querySelector('[data-dispatch-status]');button.disabled=true;try{const saved=await api('background-dispatch',{workspaceId:w.id,maxWorkers:Number(dispatchForm.elements.maxWorkers.value),paused:dispatchForm.elements.paused.checked});message.textContent=`Đã lưu · ${saved.active} worker đang chạy · ${saved.queued} việc chờ.`;}catch(error){message.textContent=error.message;}finally{button.disabled=false;}};
    const migration=document.createElement('details');
    migration.innerHTML='<summary>Nhập dữ liệu từ ứng dụng cũ</summary><p>Khảo sát dự án VEK, AIEV và Studio. Giữ nguyên các ứng dụng nguồn.</p><button type="button" class="outline" id="cosMigrationScan">Khảo sát dự án nguồn</button><div id="cosMigrationPreview" role="status"></div>';
    host.querySelector('#cosCreate').closest('details').after(migration);
    migration.querySelector('button').onclick=async event=>{
      const button=event.currentTarget,preview=migration.querySelector('#cosMigrationPreview');button.disabled=true;preview.textContent='Đang kiểm kê metadata dự án…';
      try{
        const result=await api('migration/preview');if(result.workspaceId!==w.id)throw new Error('Workspace đã đổi. Mở lại cài đặt.');
        const images=result.imageProjects||{entries:[],issues:[]};
        result.sources.push({app:'AIEV · Ảnh',...images});
        const renderPreview=()=>{
        const existing=new Map([...preview.querySelectorAll('[data-import-project]')].map(button=>[button.dataset.importProject,button.closest('article')]));
        preview.innerHTML=result.sources.map(source=>`<h3>${esc(source.app.toUpperCase())} · ${source.entries.length} ${source.app.includes('Ảnh')?'ảnh':'dự án'}${source.truncated?' · Kết quả giới hạn':''}</h3>${source.issues.map(issue=>`<p>${esc(issue)}</p>`).join('')}${source.entries.map(entry=>`<article style="padding:10px;border:1px solid var(--line);margin:6px 0;overflow-wrap:anywhere"><b>${esc(entry.title)}</b><p>${esc(entry.relative)} · ${esc(entry.format)}</p><p>${esc(entry.message)} Chưa chuyển vào ContentOS.</p>${entry.canImport?`<button type="button" data-import-project="${esc(entry.id)}">${entry.format==='aiev-image'?'Nhập ảnh AIEV':entry.format==='vek-project'?'Sao chép dự án VEK':entry.format==='studio-composition'?'Sao chép composition Studio':'Chuyển timeline AIEV'} vào workspace</button><p data-import-result role="status"></p>`:''}</article>`).join('')}`).join('')+'<p>'+result.limitations.map(esc).join('<br>')+'</p>';
        for(const button of preview.querySelectorAll('[data-import-project]')){const saved=existing.get(button.dataset.importProject);if(saved)button.closest('article').replaceWith(saved);}
        if(result.imageProjects?.nextCursor){const more=document.createElement('button');more.type='button';more.textContent='Xem thêm ảnh AIEV';more.onclick=async()=>{more.disabled=true;try{const page=await api('migration/preview?imageCursor='+encodeURIComponent(result.imageProjects.nextCursor));if(page.workspaceId!==w.id||!host.isConnected)throw new Error('Workspace đã đổi. Mở lại cài đặt.');if(page.imageProjects.issues.length&&!page.imageProjects.entries.length&&!page.imageProjects.nextCursor)throw new Error(page.imageProjects.issues.join(' '));const source=result.sources.find(s=>s.app==='AIEV · Ảnh'),known=new Set(source.entries.map(e=>e.id));source.entries.push(...page.imageProjects.entries.filter(e=>!known.has(e.id)));source.issues.push(...page.imageProjects.issues);source.truncated=page.imageProjects.truncated;result.imageProjects=page.imageProjects;renderPreview();}catch(error){more.textContent=error.message;more.disabled=false;}};preview.append(more);}
        };
        renderPreview();
        preview.onclick=async event=>{
          const importButton=event.target.closest('[data-import-project]');if(!importButton)return;
          const entry=result.sources.flatMap(s=>s.entries).find(e=>e.id===importButton.dataset.importProject);if(!entry)return;
          const message=importButton.parentElement.querySelector('[data-import-result]');
          importButton.disabled=true;message.textContent='Đang sao chép tư liệu và tạo bản dựng riêng…';
          if(entry.format==='aiev-image'){
            message.textContent='Đang kiểm tra và sao chép ảnh vào thư viện workspace…';
            try{const imported=await api('migration/import-aiev-image',{workspaceId:w.id,id:entry.id,metadataHash:entry.metadataHash,imageHash:entry.imageHash});message.textContent=imported.reused?'Ảnh đã nhập trước đó, file vẫn khớp. ':'Đã nhập ảnh và prompt. ';const open=document.createElement('button');open.textContent='Mở thư viện ảnh';open.onclick=async()=>{const {openImageTool}=await import('/ui/contentos-images.js');await openImageTool();};message.append(open);}
            catch(error){message.textContent=error.message;importButton.disabled=false;}
            return;
          }
          try{const imported=await api('migration/'+(entry.format==='vek-project'?'import-vek':entry.format==='studio-composition'?'import-studio':'import-aiev'),{workspaceId:w.id,id:entry.id,metadataHash:entry.metadataHash,projectHash:entry.projectHash});message.textContent=`Đã nhập ${imported.files} file. Kiểm tra bản dựng trước khi xuất. `;const link=document.createElement('a');link.href='/home?pick='+encodeURIComponent(imported.dir);link.textContent='Mở dự án đã nhập';message.append(link);}
          catch(error){message.textContent=error.message;importButton.disabled=false;}
        };
      }catch(error){preview.textContent=error.message;}finally{button.disabled=false;}
    };
    host.querySelector('#cosWorkspace').onchange = async e => {
      try { await api('workspaces/active', {id:e.target.value}); location.reload(); } catch(e) { status(e.message,true); }
    };
    host.querySelector('#cosSettings').onsubmit = async e => {
      e.preventDefault();
      try { await api('workspaces/' + encodeURIComponent(w.id), Object.fromEntries(new FormData(e.target)), 'PATCH'); status('Đã lưu cấu hình trên máy này.'); } catch(e) { status(e.message,true); }
    };
    host.querySelector('#cosCreate').onsubmit = async e => {
      e.preventDefault();
      try { await api('workspaces', Object.fromEntries(new FormData(e.target))); await loadContentOS(); } catch(e) { status(e.message,true); }
    };
  } catch(e) { host.textContent = 'Không đọc được cấu hình: ' + e.message; }
}
