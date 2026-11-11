import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {createApiUsageStore} from '../src/services/api-usage.mjs';
test('API ledger reserves calls before network, keeps uncertainty and enforces persistent local-day policy',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-usage-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));let time=new Date('2026-11-03T16:59:00Z'),store=createApiUsageStore(root,{now:()=>time}),calls=0;
 store.savePolicy('one',{dailyCalls:2});const options={body:JSON.stringify({model:'fixture',messages:[{content:'private prompt'}]}),headers:{Authorization:'Bearer private-key'}};
 const send=store.fetcher('one','revise',{fetcher:async()=>{calls++;return Response.json({choices:[],usage:{total_tokens:10}});}});
 await send('https://example.com/v1/chat/completions',options);assert.equal(store.status('one').tokens.total_tokens,10);assert.equal(store.status('one').calls,1);
 const fail=store.fetcher('one','news-draft',{fetcher:async()=>{calls++;throw new Error('network failed');}});await assert.rejects(fail('url',options));assert.equal(store.status('one').unknownUsage,1);assert.equal(store.status('one').recent[0].status,'uncertain');
 await assert.rejects(send('url',options),/giới hạn/);assert.equal(calls,2);store=createApiUsageStore(root,{now:()=>time});assert.equal(store.status('one').calls,2);assert.equal(store.status('two').calls,0);
 const contents=fs.readFileSync(path.join(root,'workspace/contentos/api-usage/one/2026-11-03.json'),'utf8');assert.equal(contents.includes('private'),false);
 time=new Date('2026-11-03T17:01:00Z');assert.equal(store.status('one').calls,0);assert.equal(store.status('one').day,'2026-11-04');
 for(const dailyCalls of [-1,1.5,'2',10001])assert.throws(()=>store.savePolicy('one',{dailyCalls}));
 let release;const concurrent=store.fetcher('one','revise',{fetcher:()=>new Promise(resolve=>release=()=>resolve(Response.json({}))) });store.savePolicy('one',{dailyCalls:1});const pending=concurrent('url',options);await assert.rejects(concurrent('url',options),/giới hạn/);release();await pending;assert.equal(store.status('one').unknownUsage,1);
});
