import test from 'node:test';import assert from 'node:assert/strict';
import {discoverModels} from '../src/services/model-catalog.mjs';
import {createConnectionStore} from '../src/services/connections.mjs';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
test('LLM connections isolate secrets from image connections; model listing never assumes tool capability',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-models-'));
 try{
 const options={secretDir:path.join(root,'keys'),env:{},protect:v=>Buffer.from(v).toString('base64'),unprotect:v=>Buffer.from(v,'base64').toString()};
 const image=createConnectionStore(root,options),llm=createConnectionStore(root,{...options,kind:'llm'});
 image.save('one',{baseUrl:'https://images.example/v1',model:'image',apiKey:'image-secret'});
 llm.save('one',{baseUrl:'https://llm.example/v1',model:'chat',apiKey:'llm-secret'});
 assert.equal(image.get('one').apiKey,'image-secret');assert.equal(llm.get('one').apiKey,'llm-secret');assert.equal(llm.status('one').apiKey,undefined);assert.equal(llm.get('one').supportsVision,false);llm.save('one',{baseUrl:'https://llm.example/v1',model:'chat',supportsVision:true});assert.equal(llm.status('one').supportsVision,true);assert.equal(llm.get('one').supportsVision,true);assert.equal(image.status('one').supportsVision,false);
 let calls=0;
 const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://llm.example/v1/models');assert.equal(options.headers.Authorization,'Bearer llm-secret');assert.equal(options.redirect,'error');return Response.json({data:[{id:'chat'},{id:'vision'},{id:'chat'},{id:'invalid\nmodel'}]});};
 const result=await discoverModels(llm.get('one'),{fetcher});assert.equal(calls,1);assert.deepEqual(result.models.map(m=>m.id),['chat','vision']);assert.ok(result.models.every(m=>m.capability==='unverified'));assert.equal(result.capabilitiesVerified,false);
 await assert.rejects(discoverModels(llm.get('one'),{fetcher:async()=>new Response('secret provider error',{status:401})}),/HTTP 401/);
 await assert.rejects(discoverModels(llm.get('one'),{fetcher:async()=>Response.json({data:{}})}),/danh sách/);
 await assert.rejects(discoverModels(llm.get('one'),{fetcher:async()=>new Response('x'.repeat(2*1024**2+1))}),/quá lớn/);
 await assert.rejects(discoverModels({...llm.get('one'),baseUrl:'http://remote.example/v1'},{fetcher:()=>{throw new Error('must not send');}}),/HTTPS/);
 let checks=0;await assert.rejects(discoverModels(llm.get('one'),{fetcher,validate:()=>{if(++checks===2)throw new Error('workspace changed');}}),/workspace changed/);
 llm.save('one',{baseUrl:'https://other.example/v1',model:'chat'});assert.equal(llm.status('one').hasKey,false);assert.equal(image.get('one').apiKey,'image-secret');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
