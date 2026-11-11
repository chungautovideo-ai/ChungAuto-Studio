import {TEXT_LOOKS,normalizeTextAppearance,textAppearanceStyle} from '/lib/brand.js';

// Inspector owns history/persistence; this component only edits the selected text.
export function textAppearanceControls(it,key,label,{h,field,snapshot,commit}){
 const host=h('details',{class:'text-appearance'},h('summary',{},label));
 const body=h('div',{});host.append(body);
 const current=()=>normalizeTextAppearance(it[key])||normalizeTextAppearance(TEXT_LOOKS.white.value);
 const update=(edit,redraw=false)=>{snapshot();const value=structuredClone(current());edit(value);it[key]=value;commit();if(redraw)draw();};
 function number(label,value,min,max,step,edit){const input=h('input',{type:'number',value,min,max,step,'aria-label':label});input.oninput=()=>{if(input.value!==''&&input.validity.valid)update(a=>edit(a,Number(input.value)));};return field(label,input);}
 function color(label,value,edit){const picker=h('input',{type:'color',value,'aria-label':label});const hex=h('input',{type:'text',value,maxlength:7,'aria-label':label+' HEX',placeholder:'#FFFFFF'});picker.oninput=()=>{hex.value=picker.value;update(a=>edit(a,picker.value));};hex.onchange=()=>{if(/^#[\da-f]{6}$/i.test(hex.value)){picker.value=hex.value;update(a=>edit(a,hex.value));}else hex.value=picker.value;};return field(label,h('div',{class:'ta-color'},picker,hex));}
 let category='all';
 function draw(){body.replaceChildren();const a=current();
  const filter=h('select',{'aria-label':label+' · Nhóm mẫu'},[['all',`Tất cả (${Object.keys(TEXT_LOOKS).length})`],...['Viền & bóng','Gradient','Phát sáng'].map(g=>[g,g])].map(([value,name])=>h('option',{value,selected:category===value},name)));
  filter.onchange=()=>{category=filter.value;draw();};body.append(field('Mẫu kiểu chữ',filter));
  const gallery=h('div',{class:'ta-presets'});
  for(const [id,look] of Object.entries(TEXT_LOOKS)){if(category!=='all'&&look.group!==category)continue;const sample=h('span',{class:'ta-sample',style:textAppearanceStyle(look.value)},'ART');const button=h('button',{type:'button',title:look.label,'data-look':id,'aria-pressed':!!it[key]&&textAppearanceStyle(it[key])===textAppearanceStyle(look.value),'aria-label':'Mẫu chữ '+look.label},sample,h('small',{},look.label));button.onclick=()=>{snapshot();it[key]=structuredClone(look.value);commit();draw();};gallery.append(button);}
  body.append(gallery);
  const mode=h('select',{'aria-label':label+' · Kiểu màu'},[['inherit','Theo mẫu'],['solid','Một màu'],['gradient','Gradient']].map(([value,name])=>h('option',{value,selected:(it[key]?a.mode:'inherit')===value},name)));
  mode.oninput=()=>{if(mode.value==='inherit'){snapshot();delete it[key];commit();draw();}else update(a=>a.mode=mode.value,true);};body.append(field('Kiểu màu',mode));
  if(!it[key])return;
  if(a.mode==='solid')body.append(color('Màu chữ',a.color,(a,v)=>a.color=v));
  else{
   const strip=h('div',{class:'ta-gradient',style:'background:'+a.gradient});body.append(strip);
   body.append(number('Góc gradient (°)',a.angle,0,360,1,(a,v)=>{a.angle=v;strip.style.background=normalizeTextAppearance(a).gradient;}));
   a.stops.forEach((stop,index)=>{const row=h('div',{class:'ta-stop'},color('Màu '+(index+1),stop.color,(a,v)=>{a.stops[index].color=v;strip.style.background=normalizeTextAppearance(a).gradient;}),number('Vị trí '+(index+1)+' (%)',stop.at,0,100,1,(a,v)=>{a.stops[index].at=v;strip.style.background=normalizeTextAppearance(a).gradient;}));const remove=h('button',{type:'button',disabled:a.stops.length<=2,'aria-label':'Xóa màu '+(index+1)},'×');remove.onclick=()=>update(a=>a.stops.splice(index,1),true);row.append(remove);body.append(row);});
   const plus=h('button',{type:'button',disabled:a.stops.length>=8},'+ Thêm màu');plus.onclick=()=>update(a=>a.stops.push({color:'#ffffff',at:50}),true);body.append(plus);
  }
  const advanced=h('details',{},h('summary',{},'Viền & đổ bóng'));
  advanced.append(h('div',{class:'row2'},color('Màu viền',a.strokeColor,(a,v)=>a.strokeColor=v),number('Độ dày viền (px)',a.strokeWidth,0,16,.5,(a,v)=>a.strokeWidth=v)),h('div',{class:'row2'},color('Màu viền ngoài',a.outerStrokeColor,(a,v)=>a.outerStrokeColor=v),number('Độ dày viền ngoài (px)',a.outerStrokeWidth,0,10,.5,(a,v)=>a.outerStrokeWidth=v)),color('Màu bóng',a.shadowColor,(a,v)=>a.shadowColor=v),h('div',{class:'row3'},number('Bóng ngang (px)',a.shadowX,-50,50,1,(a,v)=>a.shadowX=v),number('Bóng dọc (px)',a.shadowY,-50,50,1,(a,v)=>a.shadowY=v),number('Độ mờ bóng (px)',a.shadowBlur,0,80,1,(a,v)=>a.shadowBlur=v)),number('Độ đậm bóng (%)',a.shadowOpacity,0,100,1,(a,v)=>a.shadowOpacity=v));body.append(advanced);
  const reset=h('button',{type:'button'},'Khôi phục kiểu theo mẫu');reset.onclick=()=>{snapshot();delete it[key];commit();draw();};body.append(reset);
 }
 draw();return host;
}
