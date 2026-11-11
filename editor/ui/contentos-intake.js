// Shared project intake used by Home, setup and the editor.
export async function openIntake({dir, onReceived,onProjectCreated,source='nas'} = {}) {
  document.querySelector('#contentosIntake')?.dispatchEvent(new Event('intake-close'));
  const dialog = document.createElement('dialog');
  dialog.id = 'contentosIntake';
  dialog.setAttribute('aria-label','Thêm tư liệu');
  dialog.style.cssText = 'width:min(860px,94vw);max-height:88vh;overflow:auto;background:var(--surface,#131315);color:var(--ink,#fff);border:1px solid var(--line);border-radius:16px;padding:22px';
  dialog.innerHTML = `<header style="display:flex;justify-content:space-between;align-items:center"><h2>Thêm tư liệu</h2><button data-close aria-label="Đóng thêm tư liệu">✕</button></header><p>Nhận file vào dự án từ kho dùng chung hoặc điện thoại.</p><nav aria-label="Nguồn tư liệu" style="display:flex;gap:8px;margin-bottom:16px"><button data-source="nas">NAS / Thư mục chung</button><button data-source="phone">Điện thoại</button></nav><section data-body></section>`;
  document.body.append(dialog);
  let version = 0, closed = false;
  const mobile = await import('/ui/contentos-mobile.js');
  const close = () => { if(closed)return; closed=true;version++;dialog.querySelector('[data-body]').dispatchEvent(new Event('source-dispose'));mobile.leaveMobile();dialog.close();dialog.remove(); };
  dialog.addEventListener('intake-close', close);
  dialog.addEventListener('cancel', e => {e.preventDefault();close();});
  dialog.querySelector('[data-close]').onclick=close;
  async function select(source) {
    const request=++version;
    await mobile.leaveMobile();
    if(closed||request!==version)return;
    const host=dialog.querySelector('[data-body]');host.dispatchEvent(new Event('source-dispose'));host.replaceChildren();
    dialog.querySelectorAll('[data-source]').forEach(b=>{b.classList.toggle('primary',b.dataset.source===source);b.setAttribute('aria-pressed',String(b.dataset.source===source));});
    const options={host,dir,onReceived,onProjectCreated:onProjectCreated?async result=>{close();await onProjectCreated(result);}:undefined};
    if(source==='phone') await mobile.loadMobile(options);
    else {const sources=await import('/ui/contentos-sources.js');if(!closed&&request===version)await sources.loadSources(options);}
  }
  dialog.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>select(b.dataset.source));
  dialog.showModal();
  await select(source);
}
