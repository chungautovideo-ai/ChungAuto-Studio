import fs from 'node:fs';
import crypto from 'node:crypto';
export function fingerprintArtifact(file){
 const fd=fs.openSync(file,'r'),hash=crypto.createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let bytes=0;
 try{
  const before=fs.fstatSync(fd);if(!before.isFile()||before.size<32)throw new Error('File xuất không hợp lệ.');
  for(;;){const count=fs.readSync(fd,buffer,0,buffer.length,null);if(!count)break;hash.update(buffer.subarray(0,count));bytes+=count;}
  const after=fs.fstatSync(fd),current=fs.statSync(file);
  if(bytes!==before.size||after.size!==before.size||Math.abs(after.mtimeMs-before.mtimeMs)>2||(current.ino&&after.ino&&current.ino!==after.ino)||current.size!==after.size||Math.abs(current.mtimeMs-after.mtimeMs)>2)throw new Error('File xuất thay đổi khi kiểm tra.');
  return {bytes,sha256:hash.digest('hex')};
 }finally{fs.closeSync(fd);}
}
export function verifyArtifact(file,metadata){
 if(!Number.isSafeInteger(metadata?.bytes)||metadata.bytes<32||!/^[a-f0-9]{64}$/.test(metadata.sha256||''))throw new Error('Bản xuất thiếu mã kiểm tra. Kiểm tra hoặc xuất lại trước khi sử dụng.');
 const current=fingerprintArtifact(file);if(current.bytes!==metadata.bytes||current.sha256!==metadata.sha256)throw new Error('Nội dung file xuất đã thay đổi.');return current;
}
let activeChecks=0;
export async function verifyArtifactAsync(file,metadata,{signal,validate=()=>{}}={}){
 signal?.throwIfAborted();validate();
 if(!Number.isSafeInteger(metadata?.bytes)||metadata.bytes<32||!/^[a-f0-9]{64}$/.test(metadata.sha256||''))throw new Error('Bản xuất thiếu mã kiểm tra. Kiểm tra hoặc xuất lại trước khi sử dụng.');
 if(activeChecks>=2)throw Object.assign(new Error('Đang kiểm tra hai bản xuất. Thử tải lại sau.'),{status:429});
 activeChecks++;let handle;
 try{
  handle=await fs.promises.open(file,'r');const before=await handle.stat();if(!before.isFile()||before.size!==metadata.bytes)throw new Error('Nội dung file xuất đã thay đổi.');
  const hash=crypto.createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let bytes=0;
  for(;;){signal?.throwIfAborted();validate();const {bytesRead}=await handle.read(buffer,0,buffer.length,null);if(!bytesRead)break;hash.update(buffer.subarray(0,bytesRead));bytes+=bytesRead;}
  signal?.throwIfAborted();validate();const after=await handle.stat(),current=await fs.promises.stat(file);
  if(bytes!==before.size||after.size!==before.size||Math.abs(after.mtimeMs-before.mtimeMs)>2||(current.ino&&after.ino&&current.ino!==after.ino)||current.size!==after.size||Math.abs(current.mtimeMs-after.mtimeMs)>2||hash.digest('hex')!==metadata.sha256)throw new Error('Nội dung file xuất đã thay đổi.');
  signal?.throwIfAborted();validate();return {bytes,sha256:metadata.sha256};
 }finally{try{await handle?.close();}finally{activeChecks--;}}
}
