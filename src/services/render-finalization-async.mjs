import {Worker} from 'node:worker_threads';

// Keep CPU work, synchronous filesystem/hash operations and FFmpeg waits off
// the HTTP event loop. The caller retains its render lock until this resolves.
export function finalizeRenderArtifactAsync(options){
 return new Promise((resolve,reject)=>{
  let result,reported=false;
  const worker=new Worker(new URL('./render-finalization-worker.mjs',import.meta.url),{workerData:options,execArgv:[]});
  worker.once('message',message=>{reported=true;result=message;});
  worker.once('error',reject);
  worker.once('exit',code=>{if(code!==0||!reported)reject(Error('Tiến trình hoàn tất bản xuất kết thúc trước khi trả kết quả.'));else if(result.error)reject(Error(result.error));else resolve(result.result);});
 });
}
