// Mở file dự án .cosproj (kiểu "Open Project" của Premiere): chọn file → kiểm media → chọn lại media thiếu → mở.
// Dùng chung cho editor (menu ⋯) và màn Dự án (home).
const post=async(url,body)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const j=await r.json().catch(()=>({}));if(!r.ok&&!j.missing)throw new Error(j.error||r.statusText);return j;};
const el=(tag,props={},...kids)=>{const n=Object.assign(document.createElement(tag),props);n.append(...kids.flat().filter(k=>k!=null&&k!==false));return n;};
// Icon nét mảnh cùng kiểu editor, luôn đi kèm chữ
const P={folder:'<path d="M1.5 4.5a1 1 0 011-1h3.2l1.5 1.5h6.3a1 1 0 011 1v6.5a1 1 0 01-1 1h-11a1 1 0 01-1-1z"/>',save:'<path d="M2.5 2.5h8.5l2.5 2.5v8.5h-11z"/><path d="M5 2.5v3h5v-3M5 13.5v-4h6v4"/>',link:'<path d="M6.5 9.5l3-3"/><path d="M7 4.5l1.5-1.5a2.5 2.5 0 013.5 3.5L10.5 8M9 11.5L7.5 13A2.5 2.5 0 014 9.5L5.5 8"/>'};
const icon=n=>el('span',{className:'ico',ariaHidden:'true',innerHTML:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+P[n]+'</svg>'});
const DIALOG='width:calc(100% - 32px);max-width:600px;max-height:85vh;overflow:auto;padding:24px;background:var(--surface,#17191f);color:var(--ink,#eee);border:1px solid var(--line,#444);border-radius:16px';
const ROW='display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid var(--line,#333)';

// Hỏi khi còn chỉnh sửa chưa lưu: 'save' | 'discard' | 'cancel'
export function askUnsaved(message='Dự án đang mở có chỉnh sửa chưa lưu.'){
 return new Promise(resolve=>{
  const done=v=>{d.close();resolve(v);};
  const d=el('dialog',{style:DIALOG},el('h2',{},'Lưu thay đổi?'),el('p',{},message),
   el('div',{className:'btns',style:'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap'},
    el('button',{className:'ghost',onclick:()=>done('cancel')},'Hủy'),
    el('button',{className:'outline',onclick:()=>done('discard')},'Không lưu'),
    el('button',{className:'primary',onclick:()=>done('save')},icon('save'),'Lưu')));
  d.oncancel=e=>{e.preventDefault();done('cancel');};d.onclose=()=>d.remove();
  document.body.append(d);d.showModal();d.querySelector('.primary').focus();
 });
}

// beforeOpen(): trả false để dừng (vd người dùng Hủy ở hộp chưa lưu). Mở xong chuyển sang editor.
export async function openProjectFile({beforeOpen=async()=>true,toast=m=>alert(m)}={}){
 const picked=await post('/api/project-file/pick',{});
 if(!picked.ok)return;
 const file=picked.file,relinks={};
 let plan=await post('/api/project-file/inspect',{file,relinks});
 const open=async keepDisk=>{
  if(!await beforeOpen())return false;
  const r=await post('/api/project-file/open',{file,relinks,keepDisk});
  if(!r.ok){toast(r.error||'Không mở được dự án.',true);return false;}
  location.href='/';return true;
 };
 if(!plan.missing.length&&!plan.newerOnDisk)return open(false);
 const d=el('dialog',{style:DIALOG,ariaLabel:'Mở dự án'}),list=el('div'),status=el('p',{role:'status'});
 const keep=el('input',{type:'checkbox'});
 const go=el('button',{className:'primary',onclick:async()=>{go.disabled=true;try{if(await open(keep.checked))d.close();}catch(e){status.textContent=e.message;}finally{go.disabled=false;}}},icon('folder'),'Mở dự án');
 const paint=()=>{
  list.replaceChildren(...plan.missing.map(m=>el('div',{style:ROW},
   el('div',{style:'min-width:0'},el('b',{style:'display:block;overflow-wrap:anywhere'},m.ref.split('/').pop()),el('small',{className:'muted',style:'overflow-wrap:anywhere'},'Không thấy: '+m.expected)),
   el('button',{className:'outline small',onclick:async e=>{e.target.disabled=true;try{const r=await post('/api/project-file/pick',{media:m.ref,start:m.expected});if(r.ok){relinks[m.ref]=r.file;plan=await post('/api/project-file/inspect',{file,relinks});paint();}}catch(err){status.textContent=err.message;}finally{e.target.disabled=false;}}},icon('link'),'Chọn lại…'))));
  status.textContent=plan.missing.length?`Thiếu ${plan.missing.length} file media (đã bị di chuyển hoặc xoá). Chọn lại từng file để mở dự án.`:'Đã tìm đủ media.';
  go.disabled=plan.missing.length>0;
 };
 d.append(el('h2',{},'Mở dự án: '+(plan.title||plan.name)),el('p',{className:'muted',style:'overflow-wrap:anywhere'},file),
  plan.newerOnDisk?el('label',{style:'display:flex;gap:8px;align-items:flex-start;margin:12px 0'},keep,el('span',{},'Thư mục dự án có chỉnh sửa mới hơn file này. Giữ bản mới hơn trong thư mục (bỏ chọn: dùng bản trong file; bản kia vẫn còn trong Lịch sử bản lưu).')):null,
  list,status,el('div',{style:'display:flex;gap:8px;justify-content:flex-end;margin-top:16px'},el('button',{className:'ghost',onclick:()=>d.close()},'Hủy'),go));
 d.onclose=()=>d.remove();document.body.append(d);paint();d.showModal();
}
