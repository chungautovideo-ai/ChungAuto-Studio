import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createImageService} from '../src/services/images.mjs';
test('image adapter persists workspace artifacts and style request, rejects malformed and failed output',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-images-'));
 try{
  let captured;const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64');
  const env={CONTENTOS_IMAGE_BASE_URL:'http://127.0.0.1:9999/v1',CONTENTOS_IMAGE_MODEL:'test-image'};
  const service=createImageService(root,{env,fetcher:async(url,options)=>{captured={url,body:JSON.parse(options.body)};return new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')}]}));}});
  const image=await service.generate('one',{prompt:'Ô tô',aspect:'9:16',style:{id:'style',art:'studio',avoid:'text'}});
  assert.equal(captured.url,'http://127.0.0.1:9999/v1/images/generations');assert.match(captured.body.prompt,/studio/);assert.equal(captured.body.size,'1024x1536');
  const override=await service.generate('override',{prompt:'Model riêng',model:'vendor/image-v2'});
  assert.equal(captured.body.model,'vendor/image-v2');assert.equal(override.model,'vendor/image-v2');assert.equal(env.CONTENTOS_IMAGE_MODEL,'test-image');assert.equal(service.status('override').model,'test-image');
  await service.generate('override',{prompt:'Mặc định',model:'  '});assert.equal(captured.body.model,'test-image');
  for(const model of [null,{},12,'bad model','x\nheader','x'.repeat(129)])await assert.rejects(service.generate('override',{prompt:'Invalid model',model}),/Model ảnh/);
  assert.equal(service.list('one').length,1);assert.deepEqual(service.list('two'),[]);assert.deepEqual(fs.readFileSync(service.assetFile('one',image.id).file),bytes);assert.equal(image.sha256.length,64);
  const fail=createImageService(root,{env,fetcher:async()=>new Response('denied',{status:401})});await assert.rejects(fail.generate('one',{prompt:'test'}),/401/);
  const variants=createImageService(root,{env:{...env,CONTENTOS_IMAGE_REFERENCES:'1'},fetcher:async(url,options)=>{
   const n=options.body instanceof FormData?Number(options.body.get('n')):JSON.parse(options.body).n;
   assert.equal(n,3);return new Response(JSON.stringify({data:Array.from({length:n},()=>({b64_json:bytes.toString('base64')}))}));
  }});
  const batch=await variants.generate('variants',{prompt:'Three options',count:3});
  assert.equal(batch.images.length,3);assert.equal(variants.list('variants').length,3);
  assert.equal(new Set(batch.images.map(i=>i.batchId)).size,1);
  assert.deepEqual(batch.images.map(i=>i.variantIndex),[1,2,3]);
  const referenceBatch=await variants.generate('one',{prompt:'Reference variants',count:3,referenceIds:[image.id]});
  assert.equal(referenceBatch.images.length,3);assert.ok(referenceBatch.images.every(i=>i.references[0].sha256===image.sha256));
  for(const count of [0,5,1.5,'2'])await assert.rejects(variants.generate('variants',{prompt:'Invalid',count}),/1 đến 4/);
  await assert.rejects(service.generate('variants',{prompt:'Short response',count:2}),/số ảnh/);
  assert.equal(variants.list('variants').length,3);
  const malformedBatch=createImageService(root,{env,fetcher:async()=>new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')},{b64_json:'SGVsbG8='}]}))});
  await assert.rejects(malformedBatch.generate('variants',{prompt:'Invalid second',count:2}),/PNG/);
  assert.equal(variants.list('variants').length,3);
  const invalid=createImageService(root,{env,fetcher:async()=>new Response(JSON.stringify({data:[{b64_json:'SGVsbG8='}]}))});await assert.rejects(invalid.generate('one',{prompt:'test'}),/PNG/);
  await assert.rejects(createImageService(root,{env:{}}).generate('one',{prompt:'test'}),/Chưa cấu hình/);
  await assert.rejects(service.generate('one',{prompt:'reference',referenceIds:[image.id]}),/chưa khai báo/);
  const references=createImageService(root,{env:{...env,CONTENTOS_IMAGE_REFERENCES:'1'},fetcher:async(url,options)=>{
   assert.equal(url,'http://127.0.0.1:9999/v1/images/edits');assert.ok(options.body instanceof FormData);assert.equal(options.headers['Content-Type'],undefined);
   assert.equal(options.body.get('prompt'),'Reference prompt');assert.equal(options.body.get('model'),'reference-model');assert.deepEqual(Buffer.from(await options.body.get('image').arrayBuffer()),bytes);
   return new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')}]}));
  }});
  const derived=await references.generate('one',{prompt:'Reference prompt',model:'reference-model',referenceIds:[image.id]});assert.equal(derived.model,'reference-model');assert.equal(derived.operation,'reference-generation');assert.equal(derived.references[0].sha256,image.sha256);assert.equal(derived.references[0].dimensions.width,1);
  await assert.rejects(references.generate('two',{prompt:'x',referenceIds:[image.id]}));
  await assert.rejects(references.generate('one',{prompt:'x',referenceIds:[image.id,image.id]}),/khác nhau/);
  const original=references.assetFile('one',image.id).file;fs.appendFileSync(original,'changed');await assert.rejects(references.generate('one',{prompt:'x',referenceIds:[image.id]}),/đã đổi/);fs.writeFileSync(original,bytes);
  let validations=0;await assert.rejects(references.generate('one',{prompt:'x',referenceIds:[image.id],validate:()=>{if(++validations>1)throw new Error('workspace stale');}}),/workspace stale/);
  const uploaded=await references.importImage('one',bytes,{name:'C:\\images\\sản phẩm.png'});assert.equal(uploaded.operation,'import');assert.equal(uploaded.originalName,'sản phẩm.png');assert.equal(uploaded.sha256,image.sha256);assert.deepEqual(fs.readFileSync(references.assetFile('one',uploaded.id).file),bytes);
  await assert.rejects(references.importImage('one',Buffer.from('<svg>bad</svg>')),/PNG/);
  await assert.rejects(references.importImage('one',bytes.subarray(0,30)));
  const count=references.list('one').length;let importChecks=0;await assert.rejects(references.importImage('one',bytes,{validate:()=>{if(++importChecks>1)throw new Error('changed workspace');}}),/changed workspace/);assert.equal(references.list('one').length,count);
  assert.equal(fs.readdirSync(path.join(root,'workspace/contentos/images/one')).some(n=>n.endsWith('.part')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('generated image batch decodes all outputs before publish and cleans staged files on failure or context change',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-image-decode-'));
 try{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64');
 const env={CONTENTOS_IMAGE_BASE_URL:'http://127.0.0.1:9999/v1',CONTENTOS_IMAGE_MODEL:'fixture'};
 let calls=0;const service=createImageService(root,{env,fetcher:async()=>{calls++;return new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')},{b64_json:bytes.subarray(0,33).toString('base64')}]}));}});
 await assert.rejects(service.generate('one',{prompt:'mixed batch',count:2}),/không giải mã/);assert.equal(calls,1);assert.deepEqual(service.list('one'),[]);
 assert.deepEqual(fs.readdirSync(path.join(root,'workspace/contentos/images/one')),[]);
 const good=createImageService(root,{env,fetcher:async()=>new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')}]}))});
 const image=await good.generate('one',{prompt:'valid'});assert.deepEqual(image.dimensions,{width:1,height:1});
 let checks=0;await assert.rejects(good.generate('one',{prompt:'stale',validate:()=>{if(++checks===4)throw new Error('workspace changed');}}),/workspace changed/);
 assert.equal(good.list('one').length,1);assert.equal(fs.readdirSync(path.join(root,'workspace/contentos/images/one')).some(f=>f.endsWith('.part')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('image cancellation aborts gateway wait, releases workspace and never publishes late results',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-image-cancel-'));
 try{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aQ1EAAAAASUVORK5CYII=','base64');
 const env={CONTENTOS_IMAGE_BASE_URL:'http://127.0.0.1:9999/v1',CONTENTOS_IMAGE_MODEL:'fixture'};
 let started,seenSignal;const ready=new Promise(r=>started=r);let calls=0;
 const service=createImageService(root,{env,fetcher:async(_url,options)=>{calls++;seenSignal=options.signal;if(calls===1){started();return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));}return new Response(JSON.stringify({data:[{b64_json:bytes.toString('base64')}]}));}});
 const controller=new AbortController(),pending=service.generate('one',{prompt:'wait',signal:controller.signal});await ready;
 controller.abort();await assert.rejects(pending,{name:'AbortError'});assert.equal(seenSignal.aborted,true);assert.deepEqual(service.list('one'),[]);
 const retry=await service.generate('one',{prompt:'explicit second request'});assert.equal(retry.dimensions.width,1);assert.equal(calls,2);
 const pre=new AbortController();pre.abort();await assert.rejects(service.generate('one',{prompt:'never sent',signal:pre.signal}),{name:'AbortError'});assert.equal(calls,2);
 const decoded=new AbortController();let checks=0;await assert.rejects(service.generate('one',{prompt:'abort before publish',signal:decoded.signal,validate:()=>{if(++checks===4)decoded.abort();}}));
 assert.equal(service.list('one').length,1);assert.equal(fs.readdirSync(path.join(root,'workspace/contentos/images/one')).some(f=>f.endsWith('.part')),false);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
