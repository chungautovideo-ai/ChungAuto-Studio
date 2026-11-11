import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import test from 'node:test';import assert from 'node:assert/strict';
import {searchSourceTree} from '../src/services/source-search.mjs';
test('recursive source search returns contained media with bounded truthful scan status',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-tree-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'sub','deep'),{recursive:true});fs.writeFileSync(path.join(root,'sub','Cảnh XE.mp4'),'video');fs.writeFileSync(path.join(root,'sub','Cảnh xe.wav'),'audio');fs.writeFileSync(path.join(root,'sub','deep','Cảnh xe.png'),'image');
 const result=await searchSourceTree(root,'',{query:'CẢNH'.normalize('NFD'),kind:'video'});assert.equal(result.entries.length,1);assert.equal(result.entries[0].relative,'sub/Cảnh XE.mp4');assert.equal(result.scan.truncated,false);assert.equal(result.scan.folders,3);
 const depth=await searchSourceTree(root,'',{query:'cảnh',limits:{depth:0}});assert.equal(depth.scan.truncated,true);assert.equal(depth.scan.reason,'depth-limit');
 const limit=await searchSourceTree(root,'',{query:'cảnh',limits:{results:1}});assert.equal(limit.scan.truncated,true);assert.equal(limit.scan.reason,'result-limit');
 await assert.rejects(searchSourceTree(root,'..',{query:'cảnh'}));await assert.rejects(searchSourceTree(root,'',{query:'x'}));
 const controller=new AbortController();controller.abort();await assert.rejects(searchSourceTree(root,'',{query:'cảnh',signal:controller.signal}));
 let checks=0;await assert.rejects(searchSourceTree(root,'',{query:'cảnh',validate:()=>{if(++checks>2)throw new Error('workspace changed');}}),/workspace/);
});
