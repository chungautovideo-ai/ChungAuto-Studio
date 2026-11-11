// Keep short cues audible in the preview without asking the renderer to play
// beyond EOF. Source samples stay intact between leading/trailing silence.
export function readSfxWav(buffer) {
  if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WAVE')throw Error('Invalid SFX WAV');
  if(buffer.readUInt32LE(4)+8>buffer.length)throw Error('Truncated SFX WAV');
  let format,data;
  for(let offset=12;offset+8<=buffer.length;){
    const size=buffer.readUInt32LE(offset+4),end=offset+8+size;
    if(end>buffer.length)throw Error('Truncated SFX WAV');
    const id=buffer.toString('ascii',offset,offset+4);
    if(id==='fmt ')format=buffer.subarray(offset+8,end);
    if(id==='data')data=buffer.subarray(offset+8,end);
    offset=end+(size&1);
  }
  if(!format||format.length<16||!data)throw Error('Missing SFX WAV chunks');
  const encoding=format.readUInt16LE(0),rate=format.readUInt32LE(4),align=format.readUInt16LE(12),bits=format.readUInt16LE(14);
  if(![1,3].includes(encoding)||!rate||!align||data.length%align||format.readUInt32LE(8)!==rate*align)throw Error('Unsupported SFX WAV format');
  return {format,data,rate,align,duration:data.length/(rate*align),silence:encoding===1&&bits===8?128:0};
}

export function paddedSfxWav(buffer,{lead=.25,minSoundDuration=.8}={}) {
  if(!Number.isFinite(lead)||lead<0||!Number.isFinite(minSoundDuration)||minSoundDuration<0)throw Error('Invalid SFX padding');
  const wav=readSfxWav(buffer),prefix=Math.round(wav.rate*lead)*wav.align;
  // One millisecond headroom covers duration rounding in timeline metadata.
  const size=prefix+Math.ceil(wav.rate*(Math.max(wav.duration,minSoundDuration)+.001))*wav.align;
  const fmtSize=wav.format.length,fmtPad=fmtSize&1,dataPad=size&1,dataHeader=20+fmtSize+fmtPad;
  const output=Buffer.alloc(dataHeader+8+size+dataPad);
  output.write('RIFF',0);output.writeUInt32LE(output.length-8,4);output.write('WAVE',8);
  output.write('fmt ',12);output.writeUInt32LE(fmtSize,16);wav.format.copy(output,20);
  output.write('data',dataHeader);output.writeUInt32LE(size,dataHeader+4);
  output.fill(wav.silence,dataHeader+8,dataHeader+8+size);
  wav.data.copy(output,dataHeader+8+prefix);
  return output;
}
