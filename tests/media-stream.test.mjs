import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import test from 'node:test';import assert from 'node:assert/strict';
import {mediaRange,streamMedia} from '../src/services/media-stream.mjs';
test('preview streams exact byte ranges and HEAD without copying, rejects invalid ranges',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-stream-')),file=path.join(root,'clip.mp4'),bytes=Buffer.alloc(1024,42);fs.writeFileSync(file,bytes);
 const server=http.createServer((req,res)=>streamMedia(req,res,file).catch(()=>{res.writeHead(400);res.end();}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));fs.rmSync(root,{recursive:true,force:true});});
 const url='http://127.0.0.1:'+server.address().port;
 for(const [range,start,end] of [['bytes=10-19',10,19],['bytes=-12',1012,1023],['bytes=1020-',1020,1023]]){
  const response=await fetch(url,{headers:{Range:range}});assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),`bytes ${start}-${end}/1024`);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes.subarray(start,end+1));
 }
 const head=await fetch(url,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'1024');assert.equal(head.headers.get('content-type'),'video/mp4');assert.equal((await head.arrayBuffer()).byteLength,0);
 for(const value of ['bytes=1024-','bytes=8-2','bytes=-0','bytes=0-1,3-4','other'])assert.equal((await fetch(url,{headers:{Range:value}})).status,416);
 assert.deepEqual(mediaRange('bytes=-9999',1024),{start:0,end:1023});
 assert.equal((await fetch(url)).headers.get('cache-control'),'no-store');
});
