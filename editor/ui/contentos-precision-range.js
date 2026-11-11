// Same VEK .range layout, with one validated value shared by slider and number.
// h is supplied by the editor so styles, event wiring and DOM creation stay shared.
export function precisionRangeControl({h,label,value=0,disabled=false,commitEqualValue=false,onChange}){
 let current=Number.isFinite(Number(value))?Math.round(Math.max(0,Math.min(100,Number(value)))):0;
 let needsCommit=commitEqualValue;
 const attributes={min:0,max:100,step:1,value:current,disabled};
 const slider=h('input',{...attributes,type:'range','aria-label':label});
 const number=h('input',{...attributes,type:'number',inputmode:'numeric','aria-label':'Giá trị · '+label});
 const invalid=()=>number.setAttribute('aria-invalid','true');
 const sync=()=>{slider.value=String(current);number.value=String(current);number.removeAttribute('aria-invalid');};
 const apply=raw=>{
  if(disabled)return;
  if(String(raw).trim()===''||!Number.isFinite(Number(raw))){invalid();return;}
  const next=Math.round(Math.max(0,Math.min(100,Number(raw))));
  if(next!==current||needsCommit){onChange(next);current=next;needsCommit=false;}
  sync();
 };
 slider.addEventListener('input',()=>apply(slider.value));
 number.addEventListener('input',()=>apply(number.value));
 number.addEventListener('blur',sync);
 number.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();sync();}});
 return h('div',{class:'range'},slider,number);
}
