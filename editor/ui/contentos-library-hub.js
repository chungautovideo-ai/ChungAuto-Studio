const TABS=[['templates','Mẫu & Skill'],['effects','Kho hiệu ứng'],['references','Phong cách & Prompt'],['media','Tư liệu']];
let epoch=0;
export async function loadLibraryHub(tab='templates',{loadEffects}={}){
 const host=document.getElementById('vLibrary');if(!TABS.some(([id])=>id===tab))tab='templates';const token=++epoch;
 if(!host.querySelector('[data-library-tabs]')){
  host.innerHTML='<h1>Thư viện</h1><p>Mẫu dựng có quy tắc/skill, hiệu ứng editor và nội dung tham khảo được quản lý trong các tab riêng.</p><nav data-library-tabs aria-label="Loại tài nguyên"></nav><div data-library-content></div>';
  const nav=host.querySelector('[data-library-tabs]'),content=host.querySelector('[data-library-content]');
  for(const [id,name] of TABS){const button=document.createElement('button');button.type='button';button.dataset.libraryTab=id;button.textContent=name;button.onclick=()=>{if(location.hash!=='#library/'+id)history.pushState(null,'','#library/'+id);loadLibraryHub(id,{loadEffects});};nav.append(button);}
  for(const id of ['homeTemplateShelf','vKho','vSourceLibrary'])content.append(document.getElementById(id));
  const media=document.createElement('section');media.dataset.libraryMedia='';media.innerHTML='<h2>Tư liệu local / NAS / Điện thoại</h2><p>Chọn nguồn qua công cụ tiếp nhận dùng chung. File chỉ được sao chép khi bạn chọn thao tác nhập; mở công cụ chưa giao AI dựng.</p><button class="outline" data-library-intake>Chọn nguồn NAS / Điện thoại</button> <button class="outline" data-library-images>Kho ảnh workspace</button><p>Ảnh workspace nằm trong công cụ ảnh AI. Danh mục tìm kiếm toàn bộ file NAS chưa được cung cấp ở tab này.</p>';
  media.querySelector('[data-library-intake]').onclick=()=>document.getElementById('homeIntake').click();
  media.querySelector('[data-library-images]').onclick=()=>document.getElementById('navImages').click();content.append(media);
  const back=document.createElement('button');back.type='button';back.className='outline';back.textContent='Quay về giao việc';back.onclick=()=>document.getElementById('navHome').click();host.append(back);
 }
 for(const button of host.querySelectorAll('[data-library-tab]')){button.classList.toggle('primary',button.dataset.libraryTab===tab);button.setAttribute('aria-pressed',String(button.dataset.libraryTab===tab));}
 host.querySelector('[data-library-content]').prepend(document.getElementById('homeTemplateShelf'));
 document.getElementById('homeTemplateShelf').hidden=tab!=='templates';document.getElementById('vKho').hidden=tab!=='effects';document.getElementById('vSourceLibrary').hidden=tab!=='references';host.querySelector('[data-library-media]').hidden=tab!=='media';
 if(host.hidden)restoreHomeTemplateShelf();
 if(tab==='effects')await loadEffects?.();
 if(tab==='references'){const module=await import('/ui/contentos-library.js');if(token===epoch)await module.loadSourceLibrary();}
}

export function restoreHomeTemplateShelf(){const shelf=document.getElementById('homeTemplateShelf'),dock=document.getElementById('homeTemplateDock');if(shelf&&dock){dock.append(shelf);shelf.hidden=false;}}
