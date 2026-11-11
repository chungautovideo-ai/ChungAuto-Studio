import fs from 'node:fs';import crypto from 'node:crypto';
const table=new Uint32Array(256).map((_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
// ZIP store with data descriptors: stream large video without loading it into RAM.
export async function writeStoredZip(destination,files,{validate=()=>{},signal}={}){
 if(files.length>1000)throw new Error('Quá nhiều file trong gói.');
 const max=3*1024**3;let offset=0;const central=[],seen=new Set(),archiveHash=crypto.createHash('sha256'),output=await fs.promises.open(destination,'wx');
 const check=()=>{signal?.throwIfAborted();validate();};
 const write=async buffer=>{check();if(offset+buffer.length>max)throw new Error('Gói phát hành vượt 3 GB.');await output.writeFile(buffer);archiveHash.update(buffer);offset+=buffer.length;};
 try{for(const item of files){
  if(!/^[a-zA-Z0-9_./-]+$/.test(item.name)||item.name.startsWith('/')||item.name.split('/').includes('..')||seen.has(item.name))throw new Error('Tên file trong gói không hợp lệ.');seen.add(item.name);
  const name=Buffer.from(item.name),start=offset,header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x0808,6);header.writeUInt16LE(33,12);header.writeUInt16LE(name.length,26);await write(header);await write(name);
  let crc=0xffffffff,size=0;const hash=crypto.createHash('sha256');
  const chunks=item.data?[item.data]:fs.createReadStream(item.file,{highWaterMark:1024*1024});
  for await(const chunk of chunks){for(const b of chunk)crc=table[(crc^b)&255]^(crc>>>8);hash.update(chunk);size+=chunk.length;await write(chunk);}
  const sha256=hash.digest('hex');if(!item.data&&(size!==item.bytes||sha256!==item.sha256))throw new Error('File trong gói đã thay đổi hoặc không khớp mã kiểm tra.');
  crc=(crc^0xffffffff)>>>0;const descriptor=Buffer.alloc(16);descriptor.writeUInt32LE(0x08074b50);descriptor.writeUInt32LE(crc,4);descriptor.writeUInt32LE(size,8);descriptor.writeUInt32LE(size,12);await write(descriptor);
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x0808,8);entry.writeUInt16LE(33,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(size,20);entry.writeUInt32LE(size,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(start,42);central.push(entry,name);
 }
 const start=offset;for(const chunk of central)await write(chunk);const size=offset-start,end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(size,12);end.writeUInt32LE(start,16);await write(end);
 }finally{await output.close();}
 return {bytes:offset,sha256:archiveHash.digest('hex')};
}
