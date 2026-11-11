import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
export function createCatalogService(root) {
  const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  function preview() {
    const config = JSON.parse(fs.readFileSync(path.join(root,'config','sources.local.json'),'utf8'));
    const assets = path.join(config.aievRoot,'assets');
    const entries = [];
    for (const [kind, rel, key, fields] of [
      ['style','video-styles/video-styles.json','styles',['id','name','art','avoid','palette','motion']],
      ['prompt','prompts/prompts.json',null,['id','name','content']],
    ]) {
      const sourcePath = path.join(assets,rel);
      const data = JSON.parse(fs.readFileSync(sourcePath,'utf8'));
      const rows = key ? data[key] : data;
      if (!Array.isArray(rows)) throw new Error('Catalog nguồn không đúng schema: '+rel);
      for (const row of rows) {
        if (!row.id || !row.name) continue;
        const payload = Object.fromEntries(fields.filter(k=>row[k]!=null).map(k=>[k,String(row[k]).slice(0,30000)]));
        const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
        entries.push({id:'aiev:'+kind+':'+payload.id+':'+hash.slice(0,12),kind,name:payload.name,payload,hash,source:{app:'aiev',sourceId:payload.id,relativeFile:rel}});
      }
    }
    return entries;
  }
  function fileFor(workspaceId) {
    if (!/^[a-zA-Z0-9-]+$/.test(workspaceId)) throw new Error('Workspace ID không hợp lệ.');
    return path.join(root,'workspace','contentos','catalogs',workspaceId+'.json');
  }
  function list(workspaceId) {
    const f=fileFor(workspaceId);
    return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{schemaVersion:1,entries:[]};
  }
  return {
    preview, list,
    plan(workspaceId){
      const entries=preview(),existing=new Set(list(workspaceId).entries.map(e=>e.id));
      return {workspaceId,fingerprint:digest(entries),entries:entries.map(e=>({...e,duplicate:existing.has(e.id)}))};
    },
    save(workspaceId,body={}) {
      const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
      if(!['style','prompt'].includes(body.kind))fail('Chọn phong cách hoặc prompt.');
      const name=typeof body.name==='string'?body.name.trim():'';
      if(!name||name.length>150)fail('Tên cần từ 1 đến 150 ký tự.');
      const current=list(workspaceId),parent=body.parentId?current.entries.find(e=>e.id===body.parentId):null;
      if(body.parentId&&!parent)fail('Không tìm thấy bản nguồn trong workspace.',409);
      if(parent&&parent.kind!==body.kind)fail('Không đổi loại khi tạo phiên bản.');
      if(parent&&current.entries.some(e=>e.parentId===parent.id))fail('Đã có phiên bản mới hơn. Tải lại kho trước khi sửa.',409);
      const fields=body.kind==='style'?['art','palette','motion','avoid']:['content'];
      const values={};
      for(const field of fields){const value=body[field]??'';if(typeof value!=='string'||value.length>30000)fail('Nội dung phải là văn bản, tối đa 30.000 ký tự mỗi trường.');values[field]=value.trim();}
      if(!Object.values(values).some(Boolean))fail('Nhập nội dung phong cách hoặc prompt.');
      const sourceId=parent?.source?.app==='contentos'?parent.source.sourceId:crypto.randomUUID();
      const payload={id:sourceId,name,...values},hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
      if(parent?.hash===hash)return {entry:parent,unchanged:true};
      const entry={id:'contentos:'+body.kind+':'+crypto.randomUUID(),kind:body.kind,name,payload,hash,source:{app:'contentos',sourceId},parentId:parent?.id||null,version:parent?.source?.app==='contentos'?(parent.version||1)+1:1,createdAt:new Date().toISOString()};
      current.entries.push(entry);
      const file=fileFor(workspaceId);fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(current,null,2)+'\n',{flag:'wx'});fs.renameSync(temp,file);
      return {entry,unchanged:false};
    },
    brief(workspaceId,selection={}) {
      if(!selection||typeof selection!=='object'||Array.isArray(selection))throw new Error('Lựa chọn phong cách/prompt không hợp lệ.');
      const entries=list(workspaceId).entries, result={workspaceId,entries:[]};
      for(const [key,kind] of [['styleId','style'],['promptId','prompt']]){
        const id=selection[key];if(id===undefined||id==='')continue;
        if(typeof id!=='string')throw new Error('Sai mã phong cách/prompt.');
        const entry=entries.find(e=>e.id===id&&e.kind===kind);
        if(!entry)throw new Error('Phong cách/prompt không có trong workspace đang chọn.');
        const hash=crypto.createHash('sha256').update(JSON.stringify(entry.payload)).digest('hex');
        if(hash!==entry.hash)throw new Error('Nội dung catalog đã đổi ngoài luồng nhập. Nhập lại dữ liệu trước khi dùng.');
        result.entries.push(JSON.parse(JSON.stringify({id:entry.id,kind:entry.kind,name:entry.name,payload:entry.payload,hash,source:entry.source})));
      }
      return result;
    },
    import(workspaceId,selection) {
      let source=preview();
      if(selection!==undefined){
        const fail=(message,status=409)=>{throw Object.assign(new Error(message),{status});};
        if(!selection||typeof selection!=='object'||Array.isArray(selection))fail('Yêu cầu nhập không hợp lệ.',400);
        if(selection.workspaceId!==workspaceId)fail('Workspace đã đổi. Xem trước lại dữ liệu nguồn.');
        if(selection.fingerprint!==digest(source))fail('Dữ liệu nguồn đã đổi sau khi xem trước. Xem trước lại trước khi nhập.');
        if(!Array.isArray(selection.ids)||!selection.ids.length||selection.ids.length>2000||selection.ids.some(id=>typeof id!=='string')||new Set(selection.ids).size!==selection.ids.length)fail('Chọn danh sách mục hợp lệ để nhập.',400);
        const wanted=new Set(selection.ids);
        if(selection.ids.some(id=>!source.some(e=>e.id===id)))fail('Mục đã chọn không có trong nguồn đã xem.');
        source=source.filter(e=>wanted.has(e.id));
      }
      const current=list(workspaceId), ids=new Set(current.entries.map(x=>x.id));
      const added=source.filter(x=>!ids.has(x.id)).map(x=>({...x,importedAt:new Date().toISOString()}));
      current.entries.push(...added);
      const file=fileFor(workspaceId);fs.mkdirSync(path.dirname(file),{recursive:true});
      const temp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(temp,JSON.stringify(current,null,2));fs.renameSync(temp,file);
      return {imported:added.length,skipped:source.length-added.length,total:current.entries.length};
    }
  };
}
