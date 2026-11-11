// Display-referred luma statistics; not camera exposure, skin tone or Log detection.
export function measurePersonExposure(rgba,w,h,mask){
 if(!rgba||rgba.length!==w*h*4||!mask||mask.w<2||mask.h<2)return null;
 const hist=[new Uint32Array(256),new Uint32Array(256)],counts=[0,0];let index=0;
 for(let r=0;r<mask.runs.length;r+=2){const end=index+mask.runs[r],label=mask.runs[r+1];for(;index<end;index++){
  if(!label)continue;const x=Math.min(w-1,Math.floor((index%mask.w+.5)*w/mask.w)),y=Math.min(h-1,Math.floor((Math.floor(index/mask.w)+.5)*h/mask.h)),i=(y*w+x)*4;
  const l=Math.min(255,Math.max(0,Math.round(.2126*rgba[i]+.7152*rgba[i+1]+.0722*rgba[i+2])));hist[0][l]++;counts[0]++;if(label===2){hist[1][l]++;counts[1]++;}
 }}
 if(index!==mask.w*mask.h)return null;
 const quantile=(values,count,q)=>{let n=0;for(let i=0;i<256;i++){n+=values[i];if(n>=count*q)return i/255;}return 1;};
 return {person:counts[0]>=Math.max(16,mask.w*mask.h*.01)?{median:quantile(hist[0],counts[0],.5),highlight:quantile(hist[0],counts[0],.95)}:null,skin:counts[1]>=Math.max(16,mask.w*mask.h*.002)?{median:quantile(hist[1],counts[1],.5),highlight:quantile(hist[1],counts[1],.95)}:null};
}

export function summarizePersonExposure(samples){
 const summarize=key=>{const list=samples.map(v=>v?.[key]).filter(Boolean);if(!list.length)return null;const values=list.map(v=>v.median).sort((a,b)=>a-b);return {samples:list.length,median:values[Math.floor(values.length/2)],spread:values[Math.floor((values.length-1)*.9)]-values[Math.floor((values.length-1)*.1)],highlight:Math.max(...list.map(v=>v.highlight))};};
 return {version:1,method:'display-luma-semantic-mask',person:summarize('person'),skin:summarize('skin')};
}

export function suggestPersonExposure(summary,{selectedPerson=false}={}){
 if(selectedPerson)return {available:false,reason:'Số đo hiện có gồm tất cả người; đo lại trong vùng người được chọn trước khi áp gợi ý.'};
 if(summary?.version!==1||summary.method!=='display-luma-semantic-mask')return {available:false,reason:'Quét lại người/da để có số đo độ sáng.'};
 const valid=v=>v&&Number.isInteger(v.samples)&&v.samples>=3&&v.samples<=120&&[v.median,v.spread,v.highlight].every(n=>Number.isFinite(n)&&n>=0&&n<=1);
 const p=summary.person,s=summary.skin;if(!valid(p))return {available:false,reason:'Chưa đủ ít nhất 3 mẫu có vùng người rõ để gợi ý.'};
 if(p.spread>.25||valid(s)&&s.spread>.25)return {available:false,reason:'Ánh sáng thay đổi nhiều; chia đoạn hoặc chỉnh tay.'};
 // Keep the two lifts mutually exclusive to avoid stacking skin brightening.
 const personLight=p.median<.3&&p.highlight<.85?Math.min(30,Math.max(0,Math.round(Math.log2(.32/Math.max(.02,p.median))/.7*100))):0;
 const bodyWhite=!personLight&&valid(s)&&s.median<.3&&s.highlight<.85?25:0;
 return {available:true,personLight,bodyWhite,bodySmooth:0,samples:p.samples,reason:personLight||bodyWhite?'Nguồn có vùng người/da tối; đề xuất nâng nhẹ, kiểm lại màu da trước khi giữ.':'Không đề xuất nâng thêm từ số đo hiện có.'};
}

export function normalizePersonExposureSummary(value){
 if(value==null)return undefined;
 if(value.version!==1||value.method!=='display-luma-semantic-mask')throw new Error('Sai kiểu số đo độ sáng người/da.');
 const out={version:1,method:value.method};
 for(const key of ['person','skin']){const v=value[key];if(v===null){out[key]=null;continue;}if(!v||!Number.isInteger(v.samples)||v.samples<1||v.samples>120||!['median','spread','highlight'].every(k=>Number.isFinite(v[k])&&v[k]>=0&&v[k]<=1)||v.highlight<v.median)throw new Error('Số đo độ sáng người/da không hợp lệ.');out[key]={samples:v.samples,median:v.median,spread:v.spread,highlight:v.highlight};}
 return out;
}
