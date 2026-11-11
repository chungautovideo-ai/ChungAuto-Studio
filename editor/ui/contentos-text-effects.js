import {TEXT_STYLES,TEXT_ANIMS,ANIM_DUR,LOOP_SPEED,cleanTextAnim} from '/lib/text-effects.js';

// Kiểu chữ + Hoạt ảnh Vào/Ra/Lặp kiểu CapCut cho 1 mục chữ. Inspector giữ lịch sử/lưu: snapshot() trước, commit(redraw) sau.
const GROUPS=[['in','Vào'],['out','Ra'],['loop','Lặp']];
let tab='in'; // giữ tab đang mở khi inspector vẽ lại

export function textEffectsControls(it,{h,field,snapshot,commit}){
 const wrap=h('div',{class:'txfx'});
 const cur=it.style||'none';
 const styles=h('div',{class:'txfx-styles',role:'group','aria-label':'Kiểu chữ'});
 for(const s of TEXT_STYLES){
  const b=h('button',{type:'button',class:'txfx-sw','data-style':s.id,'aria-pressed':String(cur===s.id),'aria-label':'Kiểu chữ '+s.label,title:s.label},h('b',{},'Aa'),h('small',{},s.label));
  b.onclick=()=>{snapshot();if(s.id==='none')delete it.style;else it.style=s.id;commit(true);};
  styles.append(b);
 }
 wrap.append(field('Kiểu chữ',styles));

 const anim=cleanTextAnim(it.anim)||{};
 const tabs=h('div',{class:'txfx-tabs',role:'tablist','aria-label':'Nhóm hoạt ảnh'});
 for(const [g,label] of GROUPS){
  const b=h('button',{type:'button',role:'tab','aria-selected':String(tab===g),class:tab===g?'on':''},label+(anim[g]?' •':''));
  b.onclick=()=>{tab=g;commit(true,false);};
  tabs.append(b);
 }
 const set=(edit,redraw)=>{snapshot();const a=structuredClone(cleanTextAnim(it.anim)||{});edit(a);const c=cleanTextAnim(a);if(c)it.anim=c;else delete it.anim;commit(redraw);};
 const grid=h('div',{class:'txfx-grid',role:'group','aria-label':'Hoạt ảnh '+GROUPS.find(x=>x[0]===tab)[1]});
 const none=h('button',{type:'button',class:'chip','aria-pressed':String(!anim[tab])},tab==='in'?'Theo hiệu ứng vào':tab==='out'?'Mặc định':'Không');
 none.onclick=()=>set(a=>delete a[tab],true);grid.append(none);
 for(const o of TEXT_ANIMS[tab]){
  const b=h('button',{type:'button',class:'chip','aria-pressed':String(anim[tab]?.type===o.id)},o.label);
  b.onclick=()=>set(a=>{a[tab]=tab==='loop'?{type:o.id,speed:a.loop?.speed??LOOP_SPEED.def}:{type:o.id,dur:a[tab]?.dur??ANIM_DUR.def};},true);
  grid.append(b);
 }
 wrap.append(field('Hoạt ảnh',h('div',{},tabs,grid),tab==='in'?'Chọn Vào sẽ thay "Hiệu ứng vào" phía dưới.':tab==='loop'?'Chạy giữa lúc vào xong và lúc ra bắt đầu.':'Kết thúc đúng lúc chữ hết.'));
 if(anim[tab]){
  const loop=tab==='loop',R=loop?LOOP_SPEED:ANIM_DUR,key=loop?'speed':'dur',val=anim[tab][key];
  const out=h('output',{},(loop?'×':'')+val+(loop?'':'s'));
  const range=h('input',{type:'range',min:R.min,max:R.max,step:.05,value:val,'aria-label':loop?'Tốc độ lặp':'Thời lượng hoạt ảnh '+GROUPS.find(x=>x[0]===tab)[1]});
  range.oninput=()=>{const v=Number(range.value);out.textContent=(loop?'×':'')+v+(loop?'':'s');set(a=>a[tab][key]=v,false);};
  wrap.append(field(loop?'Tốc độ':'Thời lượng',h('div',{class:'txfx-range'},range,out)));
 }
 return wrap;
}
