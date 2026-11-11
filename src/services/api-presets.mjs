import crypto from 'node:crypto';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
import path from 'node:path';import {presetPythonStatus} from './preset-python.mjs';
const helper=fileURLToPath(new URL('./preset-fields.py',import.meta.url));
export function replacePresetFields(input){return new Promise((resolve,reject)=>{
 const runtime=presetPythonStatus(path.resolve(path.dirname(helper),'../..'));if(!runtime.ready)return reject(Error(runtime.detail));
 const child=spawn(runtime.command,[...runtime.args,'-X','utf8',helper],{windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',error='',done=false;
 const finish=(err,value)=>{if(done)return;done=true;clearTimeout(timer);err?reject(err):resolve(value);};
 const timer=setTimeout(()=>{child.kill();finish(new Error('Chỉnh trường mẫu quá thời gian.'));},10000);
 child.stdout.on('data',chunk=>{output+=chunk;if(output.length>1024*1024){child.kill();finish(new Error('Mẫu quá lớn.'));}});child.stderr.on('data',chunk=>{error+=chunk.toString().slice(0,2000);});child.on('error',()=>finish(new Error('Chưa chạy được Python/lxml để điền preset.')));child.on('close',code=>{if(code!==0)return finish(new Error('Không điền được trường preset; kiểm selector/Python lxml.'));try{finish(null,JSON.parse(output));}catch{finish(new Error('Kết quả điền preset không hợp lệ.'));}});child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input));
 });}
function supported(p){return p.kind==='texts'||!!p.html&&Array.isArray(p.fields)&&p.fields.length>0&&p.fields.length<=20&&p.fields.every(f=>typeof f.sel==='string'&&f.sel.trim().split(/\s+/).every(part=>/^(?:[a-zA-Z][\w-]*)?(?:[.#][\w-]+)+$|^[a-zA-Z][\w-]*$/.test(part)));}
export function createApiPresets(template){
 if(!template||!Array.isArray(template.presets)||template.presets.length>500)return null;
 const snapshot=structuredClone(template),hash=crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
 return {
  list(){return {id:snapshot.id,name:snapshot.name,hash,presets:snapshot.presets.map(p=>({id:p.id,name:p.name,description:p.desc,kind:p.kind||'blocks',supported:supported(p),requiresMatte:p.layer==='behind',fields:p.kind==='texts'?[{key:'title',label:'Chữ chính'},{key:'label',label:'Nhãn'},{key:'sub',label:'Chữ phụ'}]:(p.fields||[]).map((f,i)=>({key:String(i),label:f.label,words:!!f.words}))}))};},
  async insert(project,{presetId,at,dur,values,minhHoa}){
   const preset=snapshot.presets.find(p=>p.id===presetId);if(!preset||!supported(preset))throw new Error('Preset chưa có adapter điền nội dung.');
   if(!Number.isFinite(at)||at<0||!Number.isFinite(dur)||dur<.2||dur>120||typeof minhHoa!=='string'||!minhHoa.trim()||minhHoa.length>300)throw new Error('Cần at/dur và từ khóa minhHoa hợp lệ.');
   if(preset.layer==='behind'&&!project.camera?.matte)throw new Error('Preset sau người cần tách nền camera.matte trước.');
   if(!values||typeof values!=='object'||Array.isArray(values)||Object.values(values).some(v=>typeof v!=='string'||v.length>500||/[<>]/.test(v)))throw new Error('Chỉ điền văn bản tối đa500ký tự/trường.');
   const provenance={templateId:snapshot.id,presetId,templateHash:hash},next=structuredClone(project);
   if(preset.kind==='texts'){
    if(!values.title?.trim()||Object.keys(values).some(k=>!['title','label','sub'].includes(k)))throw new Error('Preset chữ cần title; hỗ trợ label/sub.');
    const item={...structuredClone(preset.text||{}),...values,id:'t-'+crypto.randomUUID(),at,dur,minhHoa,apiPreset:provenance};
    next.texts=[...(next.texts||[]),item];return next;
   }
   const fields=preset.fields;if(Object.keys(values).length!==fields.length||fields.some((f,i)=>!Object.hasOwn(values,String(i))))throw new Error('Điền đủ mọi trường chữ của preset theo key.');
   const result=await replacePresetFields({html:preset.html,fields,values:fields.map((f,i)=>values[String(i)])});
   const item={id:'k-'+crypto.randomUUID(),name:preset.name,at,dur,layer:'front',fx:preset.fx||'none',out:preset.out||'fade',sfx:preset.sfx||'none',html:result.html,css:preset.css||'',anim:structuredClone(preset.anim||[]),cues:[],fields:structuredClone(fields),preset:preset.id,group:preset.group,minhHoa,apiPreset:provenance};
   for(const key of ['x','y','scale','layer','bg'])if(preset[key]!=null)item[key]=structuredClone(preset[key]);
   for(const [i,field] of fields.entries())if(field.words){const prefix=field.sel+' .w:nth-child(';item.anim=item.anim.filter(a=>!a.sel?.startsWith(prefix));values[String(i)].trim().split(/\s+/).forEach((word,k)=>item.anim.push({sel:prefix+(k+1)+')',to:{opacity:1},at:.1+k*.22,dur:.08}));}
   next.blocks=[...(next.blocks||[]),item];return next;
  }
 };
}
