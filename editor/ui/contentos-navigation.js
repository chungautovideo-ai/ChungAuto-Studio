// One route map for existing Home tools. No duplicate stores or AI dispatch.
export const HOME_ROUTES=[
 ['home','navHome','vHome','Sản xuất'],
 ['projects','navProjects','vProjects','Sản xuất'],
 ['activity','navActivity','vActivity','Sản xuất'],
 ['library','navSourceLibrary','vLibrary','Tài nguyên'],
 ['effects','navKho','vKho','Tài nguyên'],
 ['templates','navAdmin','vAdmin','Tài nguyên'],
 ['skills','navSkills','vSkills','Tài nguyên'],
 ['images','navImages',null,'Công cụ AI'],
 ['voice','navGiong','vGiong','Công cụ AI'],
 ['news','navNews',null,'Nội dung'],
 ['social','navSocial','vSocial','Phân phối'],
 ['analysis','navPhanTich','vPhanTich','Phân phối'],
 ['connections','navKetNoi','vConnections','Hệ thống'],
 ['browser-tools','navTichHop','vTichHop','Hệ thống'],
 ['settings','navContentOS','vContentOS','Hệ thống'],
];
// Shared 20px outline icons keep labels and account badges intact.
const NAV_ICONS={
 home:'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
 projects:'M3 7h7l2 2h9v11H3z M3 7V4h7l2 3',
 activity:'M3 12h4l3-8 4 16 3-8h4',
 library:'M4 4h6v16H4z M10 4h5v16h-5 M17 5l4 14',
 effects:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
 templates:'M4 4h16v16H4z M8 8l8 4-8 4z',
 skills:'M12 3 4 7l8 4 8-4z M4 12l8 4 8-4 M4 17l8 4 8-4',
 images:'M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6 M15 8h.01',
 voice:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z M5 10v2a7 7 0 0 0 14 0v-2 M12 19v3 M8 22h8',
 news:'M4 3h13v18H4z M17 8h4v11a2 2 0 0 1-4 0 M7 7h7 M7 11h7 M7 15h7 M7 18h4',
 social:'M8 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M22 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 11l8-5 M8 13l8 5',
 analysis:'M3 21h18 M6 17v-6 M12 17V4 M18 17V8',
 connections:'M9 3v5 M15 3v5 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4',
 'browser-tools':'M3 4h18v16H3z M3 9h18 M7 6.5h.01 M10 6.5h.01',
 settings:'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6'
};
export async function mountHomeNavigation({show,onProjects,toast}){
 const nav=document.querySelector('.side-nav'),byId=id=>document.getElementById(id);
 nav.setAttribute('aria-label','Điều hướng ContentOS');
 for(const group of [...new Set(HOME_ROUTES.map(r=>r[3]))]){
  const section=document.createElement('div');section.className='cos-nav-group';
  const title=document.createElement('span');title.className='cos-nav-label';title.textContent=group;section.append(title);
  for(const [,id,,g] of HOME_ROUTES)if(g===group&&byId(id))section.append(byId(id));nav.append(section);
 }
 const workspace=document.createElement('label');workspace.className='cos-shell-workspace';workspace.textContent='Không gian làm việc';
 const select=document.createElement('select');select.setAttribute('aria-label','Workspace ContentOS');workspace.append(select);nav.before(workspace);
 try{
  const response=await fetch('/api/v1/workspaces');if(!response.ok)throw new Error('Không đọc được workspace');const state=await response.json();
  for(const w of state.workspaces)select.append(new Option(w.name,w.id,false,w.id===state.activeId));
  select.onchange=async()=>{select.disabled=true;try{const r=await fetch('/api/v1/workspaces/active',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:select.value})});if(!r.ok)throw new Error((await r.json()).error||'Không đổi được workspace');location.reload();}catch(e){select.value=state.activeId;select.disabled=false;toast(e.message,true);}};
 }catch(e){select.disabled=true;select.append(new Option(e.message,''));}
 const connectionButton=byId('navKetNoi');if(connectionButton){const label=connectionButton.querySelector('span');if(label)label.textContent='Kết nối';}
 byId('navTichHop').hidden=true;byId('navKho').hidden=true;byId('navSourceLibrary').textContent='Thư viện';
 for(const [route,id] of HOME_ROUTES){const button=byId(id);if(!button)continue;
  for(const svg of button.querySelectorAll(':scope > svg'))svg.remove();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('cos-nav-icon');
  const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',NAV_ICONS[route]);svg.append(line);button.prepend(svg);
 }
 const mobile=matchMedia('(max-width:760px)'),side=byId('side'),open=byId('sideOn'),close=byId('sideOff');
 const backdrop=document.createElement('button');backdrop.className='cos-nav-backdrop';backdrop.setAttribute('aria-label','Đóng menu điều hướng');document.body.append(backdrop);
 function syncSidebar(){const expanded=!document.body.classList.contains('side-off');open?.setAttribute('aria-expanded',String(expanded));open?.setAttribute('aria-controls','side');side.inert=!expanded;backdrop.hidden=!mobile.matches||!expanded;}
 function closeMobile(){if(mobile.matches){close?.click();syncSidebar();}}
 backdrop.onclick=()=>{closeMobile();open?.focus();};
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobile.matches&&!document.body.classList.contains('side-off')&&!document.querySelector('dialog[open]')){closeMobile();open?.focus();}});
 new MutationObserver(syncSidebar).observe(document.body,{attributes:true,attributeFilter:['class']});
 mobile.addEventListener('change',()=>{if(mobile.matches)close?.click();syncSidebar();});syncSidebar();
 const aliases={'ket-noi-ai':'connections','tich-hop':'browser-tools','phan-tich':'analysis','kho':'effects'};
 let epoch=0;
 const setActive=id=>{if(id==='navTichHop')id='navKetNoi';if(id==='navKho')id='navSourceLibrary';for(const [,button] of HOME_ROUTES){byId(button)?.classList.toggle('on',button===id);if(button===id)byId(button)?.setAttribute('aria-current','page');else byId(button)?.removeAttribute('aria-current');}};
 const wrappers=new Map();
 for(const [route,id,view] of HOME_ROUTES){const button=byId(id);if(!button)continue;const original=button.onclick;
  const run=async(write=true)=>{const token=++epoch;if(write&&location.hash!=='#'+route)history.pushState(null,'','#'+route);setActive(id);
   try{if(id==='navProjects'){show('vProjects');await onProjects();}else if(id==='navImages'||id==='navNews'){
    // Dialog tools retain the underlying page and close before a route switch.
    show('vHome');setActive(id);const module=await import(id==='navImages'?'/ui/contentos-images.js':'/ui/contentos-news.js');if(token!==epoch)return;
    if(id==='navImages')await module.openImageTool();else await module.openNewsDesk();
   }else if(original)await original.call(button);else if(view)show(view);
   if(token===epoch)setActive(id);
   }catch(e){toast(e.message,true);}
  };wrappers.set(route,run);button.onclick=()=>{closeMobile();return run();};
 }
 const routeFromLocation=()=>{const key=location.hash.slice(1);return aliases[key]||key;};
 const route=()=>{for(const dialog of document.querySelectorAll('dialog[open]')){dialog.close();dialog.remove();}const run=wrappers.get(routeFromLocation().split('/')[0]);if(run)run(false);};
 window.addEventListener('popstate',route);window.addEventListener('hashchange',route);
 if(wrappers.has(routeFromLocation().split('/')[0]))route();
 return {sync(view){const row=HOME_ROUTES.find(r=>r[2]===view);if(row)setActive(row[1]);}};
}
