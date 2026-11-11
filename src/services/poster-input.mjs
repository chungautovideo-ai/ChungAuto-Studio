export const posterDimensions={'9:16':[1080,1920],'16:9':[1920,1080],'1:1':[1080,1080],'4:5':[1080,1350]};
export function normalizePosterInput(value){
 if(!value||!['poster','thumbnail'].includes(value.kind)||!Object.hasOwn(posterDimensions,value.aspect))throw new Error('Chọn Poster/Thumbnail và tỷ lệ hợp lệ.');
 const text=(value,max)=>{if(typeof value!=='string'||value.length>max)throw new Error('Nội dung poster vượt giới hạn.');return value;};
 const color=(value,fallback)=>{const result=value??fallback;if(typeof result!=='string'||!/^#[a-f0-9]{6}$/i.test(result))throw new Error('Màu cần dạng #RRGGBB.');return result.toLowerCase();};
 const id=value=>{if(value==null||value==='')return null;if(typeof value!=='string'||!/^[a-f0-9-]{36}$/i.test(value))throw new Error('Chọn ảnh đã lưu trong workspace.');return value;};
 const position=value.position??'auto';if(!['auto',...['top','middle','bottom'].flatMap(y=>['left','center','right'].map(x=>y+'-'+x))].includes(position))throw new Error('Vị trí chữ không hợp lệ.');
 const stats=value.stats??[];if(!Array.isArray(stats)||stats.length>12)throw new Error('Tối đa 12 chỉ số.');
 const result={kind:value.kind,aspect:value.aspect,title:text(value.title??'',300),subtitle:text(value.subtitle??'',600),cta:text(value.cta??'',200),brandName:text(value.brandName??'',100),position,stats:stats.map(s=>({label:text(s?.label,100),value:text(s?.value,100)})),gradient:value.gradient!==false,liquidGlass:value.liquidGlass!==false,backgroundId:id(value.backgroundId),frameId:id(value.frameId),logoId:id(value.logoId),colors:{}};
 for(const [key,fallback] of Object.entries({primary:'#d3f53c',secondary:'#ffffff',background:'#101014',text:'#ffffff',accent:'#d3f53c'}))result.colors[key]=color(value.colors?.[key],fallback);
 if(result.kind==='thumbnail'&&(result.subtitle||result.cta||result.stats.length||result.position!=='auto'))throw new Error('Thumbnail dùng tiêu đề và khung ảnh; chọn Poster để thêm phụ đề, chỉ số, CTA hoặc vị trí chữ.');
 if(result.kind==='poster'&&result.frameId)throw new Error('Khung ảnh riêng chỉ dùng cho Thumbnail.');
 return result;
}
export function posterProps(input,assets){
 return {aspect:input.aspect,title:input.title,background:assets.background||null,frame:assets.frame||null,overlay:{title:input.title,subtitle:input.subtitle,cta:input.cta,stats:input.stats,position:input.position,showLogo:!!assets.logo},design:{colors:input.colors,fonts:{heading:'Arial',body:'Arial'},fontFiles:{heading:null,body:null},effects:{gradient:input.gradient,liquidGlass:input.liquidGlass},logoFile:assets.logo||null,brandName:input.brandName}};
}
