const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function loadSourceLibrary() {
  const host = document.querySelector('#vSourceLibrary');
  const imageButton=document.createElement('button');imageButton.textContent='Tạo ảnh AI';imageButton.onclick=async()=>{const {openImageTool}=await import('/ui/contentos-images.js');await openImageTool();};
  host.innerHTML='<h1>Thư viện từ AIEV</h1><p>Đang đọc catalog…</p>';
  async function request(url,method='GET',body) {
    const r=await fetch('/api/v1/catalogs/'+url,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const j=await r.json();if(!r.ok)throw new Error(j.error);return j;
  }
  try {
    const local=await request('local');
    host.innerHTML=`<h1>Phong cách & Prompt</h1><p>Nhập dữ liệu AIEV vào workspace đang chọn. Chọn phong cách/prompt tại bước thiết lập dựng để gửi định hướng cho AI cùng mẫu VEK. Catalog không tự áp hiệu ứng lên timeline hoặc chạy như skill.</p><button id="cosScan" class="outline">Xem trước dữ liệu nguồn</button> <button id="cosImport" class="primary" disabled>Nhập catalog vào workspace</button><p id="cosImportStatus" role="status"></p><div id="cosSourcePreview"></div><details id="cosCatalogEditor"><summary>Tạo phong cách / prompt riêng</summary><form id="cosCatalogForm"><p id="cosCatalogParent">Tạo mục mới trong workspace.</p><label>Loại<select id="cosCatalogKind"><option value="prompt">Prompt</option><option value="style">Phong cách</option></select></label><label>Tên<input id="cosCatalogName" required maxlength="150"></label><div data-fields="prompt"><label>Nội dung prompt<textarea id="cosCatalogContent" maxlength="30000" rows="5"></textarea></label></div><div data-fields="style" hidden><label>Mỹ thuật / hình ảnh<textarea id="cosCatalogArt" maxlength="30000" rows="3"></textarea></label><label>Bảng màu<textarea id="cosCatalogPalette" maxlength="30000" rows="2"></textarea></label><label>Chuyển động<textarea id="cosCatalogMotion" maxlength="30000" rows="2"></textarea></label><label>Tránh<textarea id="cosCatalogAvoid" maxlength="30000" rows="2"></textarea></label></div><p>Đây là nội dung định hướng cho AI; không lưu khóa API hoặc mật khẩu vào đây.</p><button type="submit" class="primary" id="cosCatalogSave">Lưu vào thư viện</button><button type="button" class="outline" id="cosCatalogReset">Tạo mục khác</button><p id="cosCatalogSaveStatus" role="status"></p></form></details><label>Tìm trong kho đã nhập<input id="cosCatalogSearch" placeholder="Tên phong cách / prompt"></label><div id="cosCatalogRows"></div>`;
    const rows=host.querySelector('#cosCatalogRows');
    host.querySelector('h1').after(imageButton);
    function draw(q='') {
      const matches=local.entries.filter(x=>x.name.toLocaleLowerCase().includes(q.toLocaleLowerCase()));
      rows.innerHTML=matches.length?matches.map(x=>`<details style="padding:14px;border:1px solid var(--line);border-radius:12px;margin:8px 0"><summary>${esc(x.name)} · ${x.kind==='style'?'Phong cách':'Prompt'}</summary><p>Nguồn ${esc(x.source.app==='contentos'?'ContentOS':'AIEV')} · ${esc(x.source.sourceId)}${x.version?' · phiên bản '+x.version:''}</p><pre style="white-space:pre-wrap;word-break:break-word">${esc(x.payload.content||[x.payload.art,x.payload.palette,x.payload.avoid,x.payload.motion].filter(Boolean).join('\n\n'))}</pre><button type="button" data-version="${esc(x.id)}">Tạo phiên bản chỉnh sửa</button></details>`).join(''):'<p>Chưa có mục phù hợp. Tạo mục riêng hoặc xem trước dữ liệu nguồn để nhập.</p>';
    }
    draw(); host.querySelector('#cosCatalogSearch').oninput=e=>draw(e.target.value);
    let parentId=null;
    const fieldIds={content:'Content',art:'Art',palette:'Palette',motion:'Motion',avoid:'Avoid'};
    const kind=host.querySelector('#cosCatalogKind'),form=host.querySelector('#cosCatalogForm');
    function updateKind(){for(const group of form.querySelectorAll('[data-fields]'))group.hidden=group.dataset.fields!==kind.value;}
    kind.onchange=updateKind;
    host.querySelector('#cosCatalogReset').onclick=()=>{parentId=null;form.reset();kind.disabled=false;host.querySelector('#cosCatalogParent').textContent='Tạo mục mới trong workspace.';host.querySelector('#cosCatalogSaveStatus').textContent='';updateKind();};
    rows.onclick=event=>{const button=event.target.closest('[data-version]');if(!button)return;const entry=local.entries.find(e=>e.id===button.dataset.version);if(!entry)return;
      parentId=entry.id;kind.value=entry.kind;kind.disabled=true;host.querySelector('#cosCatalogName').value=entry.name;
      for(const [field,id] of Object.entries(fieldIds))host.querySelector('#cosCatalog'+id).value=entry.payload[field]||'';
      host.querySelector('#cosCatalogEditor').open=true;host.querySelector('#cosCatalogParent').textContent='Tạo phiên bản từ '+entry.name+'. Bản cũ và việc AI đã giao được giữ nguyên.';updateKind();host.querySelector('#cosCatalogName').focus();
    };
    form.onsubmit=async event=>{event.preventDefault();const button=host.querySelector('#cosCatalogSave'),status=host.querySelector('#cosCatalogSaveStatus');button.disabled=true;status.textContent='Đang lưu…';
      const body={workspaceId:local.workspaceId,kind:kind.value,name:host.querySelector('#cosCatalogName').value,parentId};
      for(const [field,id] of Object.entries(fieldIds))body[field]=host.querySelector('#cosCatalog'+id).value;
      try{const result=await request('local','POST',body);local.entries=(await request('local')).entries;draw(host.querySelector('#cosCatalogSearch').value);parentId=result.entry.id;kind.disabled=true;status.textContent=result.unchanged?'Nội dung không đổi.':'Đã lưu phiên bản '+result.entry.version+'. Có thể chọn khi dựng mới hoặc Nhờ AI sửa.';host.querySelector('#cosCatalogParent').textContent='Đang chỉnh tiếp từ '+result.entry.name;}
      catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    };

    const status=host.querySelector('#cosImportStatus');
    let importPlan=null;
    const previewHost=host.querySelector('#cosSourcePreview'),importButton=host.querySelector('#cosImport'),scanButton=host.querySelector('#cosScan');
    const selectedIds=()=>[...previewHost.querySelectorAll('[data-import-id]:checked')].map(input=>input.dataset.importId);
    const updateSelection=()=>{const count=selectedIds().length;importButton.disabled=!importPlan||!count;status.textContent=`Đã chọn ${count} mục để nhập.`;};
    scanButton.onclick=async()=>{
      scanButton.disabled=true;importButton.disabled=true;importPlan=null;status.textContent='Đang kiểm tra nguồn…';
      try{
        const p=await request('preview');
        if(p.workspaceId!==local.workspaceId)throw new Error('Workspace đã đổi. Mở lại thư viện.');
        importPlan=p;
        previewHost.innerHTML=`<p>${p.entries.length} mục nguồn; ${p.entries.filter(x=>x.duplicate).length} bản đã có. Chỉ nhập nội dung/metadata, giữ nguyên nguồn.</p><button type="button" id="cosSelectNew">Chọn mục chưa có</button> <button type="button" id="cosSelectNone">Bỏ chọn tất cả</button><div style="max-height:320px;overflow:auto">${p.entries.map(x=>`<label style="display:block;padding:6px"><input type="checkbox" data-import-id="${esc(x.id)}" ${x.duplicate?'':'checked'}> ${esc(x.name)} · ${x.kind==='style'?'Phong cách':'Prompt'}${x.duplicate?' · Đã có':''}</label>`).join('')}</div>`;
        previewHost.onchange=updateSelection;
        previewHost.querySelector('#cosSelectNew').onclick=()=>{for(const input of previewHost.querySelectorAll('[data-import-id]'))input.checked=!p.entries.find(x=>x.id===input.dataset.importId)?.duplicate;updateSelection();};
        previewHost.querySelector('#cosSelectNone').onclick=()=>{for(const input of previewHost.querySelectorAll('[data-import-id]'))input.checked=false;updateSelection();};
        updateSelection();
      }catch(error){status.textContent=error.message;}finally{scanButton.disabled=false;}
    };
    importButton.onclick=async()=>{
      const ids=selectedIds();if(!importPlan||!ids.length)return;
      importButton.disabled=true;scanButton.disabled=true;
      try{
        const result=await request('import','POST',{workspaceId:importPlan.workspaceId,fingerprint:importPlan.fingerprint,ids});
        const refreshed=await request('local');if(refreshed.workspaceId!==local.workspaceId)throw new Error('Workspace đã đổi. Mở lại thư viện.');
        local.entries=refreshed.entries;draw();status.textContent=`Đã nhập ${result.imported}, bỏ qua ${result.skipped} bản trùng; tổng ${result.total} mục. Xem trước lại để nhập tiếp.`;
      }catch(error){status.textContent=error.message;}
      finally{importPlan=null;importButton.disabled=true;scanButton.disabled=false;}
    };
  } catch(e) {host.textContent='Không đọc được kho: '+e.message;}
}
