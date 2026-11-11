import test from 'node:test';import assert from 'node:assert/strict';import {readNarrationResponse} from '../editor/ui/contentos-narration-stream.js';
test('narration progress stream handles split Vietnamese UTF8, terminal result and interrupted/error responses',async()=>{
 const events=[],text=JSON.stringify({type:'progress',pct:25,phase:'Đang nghe lời nói'})+'\n'+JSON.stringify({type:'result',result:{words:[{word:'Xin'}]}})+'\n',bytes=new TextEncoder().encode(text);
 const response=new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=3)controller.enqueue(bytes.slice(i,i+3));controller.close();}}),{headers:{'content-type':'application/x-ndjson'}});
 const result=await readNarrationResponse(response,p=>events.push(p));assert.equal(events[0].phase,'Đang nghe lời nói');assert.equal(result.result.words[0].word,'Xin');
 await assert.rejects(readNarrationResponse(new Response('{"type":"error","error":"stale"}\n',{headers:{'content-type':'application/x-ndjson'}})),/stale/);
 await assert.rejects(readNarrationResponse(new Response('{"type":"progress","pct":5}\n',{headers:{'content-type':'application/x-ndjson'}})),/kết thúc/);
});
