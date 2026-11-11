import {validateBrollEntrance} from '../lib/broll-transition.js';

export function brollEntranceControls({h,field,item,snapshot,changed}) {
  const type=h('select',{'aria-label':'Hiệu ứng vào cảnh trám'},
    ...[['none','Không'],['fade','Mờ dần'],['slide','Trượt lên'],['zoom','Phóng vào'],['drop','Rơi xuống'],['wipe','Mở khung']].map(([value,label])=>h('option',{value},label)));
  // Preserve older/custom values until the user explicitly chooses a style.
  if(item.tIn&&!['none','fade','slide','zoom','drop','wipe'].includes(item.tIn))type.append(h('option',{value:item.tIn},item.tIn));
  type.value=item.tIn||'none';
  const input=h('input',{type:'number',min:0,max:2,step:.05,placeholder:'Mặc định',value:item.tInDuration??'','aria-label':'Thời lượng hiệu ứng vào cảnh trám (giây)'});
  const help=h('div',{class:'help'});
  const reset=h('button',{class:'link',type:'button',onclick:()=>{if(item.tInDuration===undefined)return;snapshot();delete item.tInDuration;input.value='';input.setCustomValidity('');refresh();changed();}},'Dùng thời lượng mặc định');
  function refresh(){input.disabled=type.value==='none';reset.hidden=item.tInDuration===undefined;help.textContent=type.value==='none'?'Cắt thẳng, không chạy hiệu ứng vào.':'0 = cắt thẳng; để trống dùng mặc định. Hiệu ứng không vượt thời lượng cảnh. Cảnh ngắn nên giữ đủ thời gian nhìn rõ sản phẩm.';}
  type.oninput=()=>{snapshot();item.tIn=type.value;refresh();changed();};
  input.oninput=()=>{const raw=input.value,value=raw===''?undefined:Number(raw);try{if(input.validity?.badInput)throw Error('Nhập số từ 0 đến 2 giây.');validateBrollEntrance({tInDuration:value});input.setCustomValidity('');}catch(error){input.setCustomValidity(error.message);input.reportValidity();return;}if(item.tInDuration===value)return;snapshot();if(value===undefined)delete item.tInDuration;else item.tInDuration=value;refresh();changed();};
  refresh();
  return h('div',{},h('div',{class:'row'},field('Hiệu ứng vào',type),field('Thời lượng vào (s)',input)),help,reset);
}
