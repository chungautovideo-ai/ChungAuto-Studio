import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {previewAievImages,importAievImage} from '../src/services/image-migration.mjs';import {createImageService} from '../src/services/images.mjs';
test('AIEV image migration preserves prompt/provenance, deduplicates verified bytes and rejects changed source/context',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-img-migrate-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const root=path.join(base,'contentos'),source=path.join(base,'AIEVv2/image-projects/product');fs.mkdirSync(root);fs.mkdirSync(source,{recursive:true});
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64');fs.writeFileSync(path.join(source,'background.png'),bytes);fs.writeFileSync(path.join(source,'final.png'),bytes);
 const data={name:'Sản phẩm',prompt:'Xe ở studio',model:'gemini-image',background:'background.png',final:'final.png',overlay:{title:'Giá tốt',stats:[{label:'Bảo hành',value:'2 năm'}]},apiKey:'DO-NOT-COPY'};const meta=path.join(source,'meta.json');fs.writeFileSync(meta,JSON.stringify(data));
 let active='one';const store={active:()=>({id:active})},service=createImageService(root);const report=previewAievImages(root);assert.equal(report.entries.length,2);assert.ok(!JSON.stringify(report).includes('DO-NOT-COPY'));
 const body={workspaceId:active,...report.entries[0]},first=await importAievImage(root,store,service,body);assert.equal(first.reused,false);assert.equal(first.image.prompt,data.prompt);assert.equal(first.image.origin,'aiev-migration');assert.equal(first.image.source.overlay.title,'Giá tốt');assert.ok(!JSON.stringify(first).includes('DO-NOT-COPY'));assert.deepEqual(fs.readFileSync(service.assetFile(active,first.image.id).file),bytes);
 assert.equal((await importAievImage(root,store,service,body)).reused,true);assert.equal(service.list(active).length,1);
 const importedFile=service.assetFile(active,first.image.id).file;fs.appendFileSync(importedFile,'tamper');assert.equal((await importAievImage(root,store,service,body)).reused,false);assert.equal(service.list(active).length,2);
 fs.appendFileSync(path.join(source,'background.png'),'changed');await assert.rejects(importAievImage(root,store,service,body),/đã đổi/);fs.writeFileSync(path.join(source,'background.png'),bytes);
 active='two';await assert.rejects(importAievImage(root,store,service,body),/Workspace/);active='one';
 fs.writeFileSync(meta,JSON.stringify({...data,background:'../escape.png'}));assert.equal(previewAievImages(root).entries.length,1);assert.match(previewAievImages(root).issues[0],/PNG/);await assert.rejects(importAievImage(root,store,service,body),/đã đổi/);
 fs.writeFileSync(meta,JSON.stringify(data));const controller=new AbortController();controller.abort();await assert.rejects(importAievImage(root,store,service,body,{signal:controller.signal}));
 const finalBody={workspaceId:'one',...previewAievImages(root).entries.find(e=>e.role==='final')},before=service.list('one').length;
 const changedService={...service,importImage:(workspace,bytes,options)=>service.importImage(workspace,bytes,{...options,validate:()=>{options.validate();active='two';options.validate();}})};
 await assert.rejects(importAievImage(root,store,changedService,finalBody),/Workspace/);active='one';assert.equal(service.list('one').length,before);
 const importedFinal=await importAievImage(root,store,service,finalBody);assert.equal(importedFinal.image.source.role,'final');assert.equal(service.list('one').length,before+1);
 assert.deepEqual(JSON.parse(fs.readFileSync(meta)),data);assert.deepEqual(fs.readFileSync(path.join(source,'final.png')),bytes);
});
test('AIEV image pages preserve both roles, import later pages and reject stale catalog cursors',async t=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'cos-img-pages-'));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));const root=path.join(base,'contentos'),source=path.join(base,'AIEVv2/image-projects');fs.mkdirSync(root);fs.mkdirSync(source,{recursive:true});
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64');
 for(let i=0;i<103;i++){const dir=path.join(source,String(i).padStart(3,'0'));fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'image.png'),bytes);fs.writeFileSync(path.join(dir,'meta.json'),JSON.stringify({background:'image.png',final:'image.png'}));}
 const first=previewAievImages(root);assert.equal(first.entries.length,200);assert.ok(first.nextCursor);const second=previewAievImages(root,{cursor:first.nextCursor});assert.equal(second.entries.length,6);assert.equal(second.nextCursor,null);assert.equal(new Set([...first.entries,...second.entries].map(e=>e.id)).size,206);
 const single=previewAievImages(root,{limit:1}),next=previewAievImages(root,{limit:1,cursor:single.nextCursor});assert.equal(single.entries[0].role,'background');assert.equal(next.entries[0].role,'final');assert.equal(single.entries[0].relative,next.entries[0].relative);
 const imported=await importAievImage(root,{active:()=>({id:'one'})},createImageService(root),{workspaceId:'one',...second.entries.at(-1)});assert.equal(imported.image.source.id,second.entries.at(-1).id);
 fs.mkdirSync(path.join(source,'new'));assert.match(previewAievImages(root,{cursor:first.nextCursor}).issues[0],/đã đổi/);assert.throws(()=>previewAievImages(root,{limit:0}),/Giới hạn/);
});
