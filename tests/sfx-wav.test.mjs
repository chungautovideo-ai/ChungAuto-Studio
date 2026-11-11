import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {readSfxWav,paddedSfxWav} from '../editor/lib/sfx-wav.mjs';
import {buildHtml} from '../editor/lib/build.mjs';

function wave({frames=123,rate=1000,bits=16,junk=true}={}){
 const align=bits/8,data=Buffer.alloc(frames*align,bits===8?132:17),fmt=Buffer.alloc(16);
 fmt.writeUInt16LE(1,0);fmt.writeUInt16LE(1,2);fmt.writeUInt32LE(rate,4);fmt.writeUInt32LE(rate*align,8);fmt.writeUInt16LE(align,12);fmt.writeUInt16LE(bits,14);
 function chunk(id,body){const out=Buffer.alloc(8+body.length+(body.length&1));out.write(id);out.writeUInt32LE(body.length,4);body.copy(out,8);return out;}
 const body=Buffer.concat([Buffer.from('WAVE'),chunk('fmt ',fmt),...(junk?[chunk('JUNK',Buffer.from([7,8,9]))]:[]),chunk('data',data)]),out=Buffer.alloc(8+body.length);
 out.write('RIFF');out.writeUInt32LE(body.length,4);body.copy(out,8);return out;
}

test('SFX padding preserves samples/cue offset, reads noncanonical chunks and fills actual silence',()=>{
 for(const bits of [8,16])for(const frames of [123,1527]){
  const source=wave({bits,frames}),before=Buffer.from(source),input=readSfxWav(source),output=readSfxWav(paddedSfxWav(source));
  const lead=250*input.align;
  assert.deepEqual(source,before);assert.deepEqual(output.data.subarray(lead,lead+input.data.length),input.data);
  assert.ok(output.data.subarray(0,lead).every(v=>v===input.silence));
  assert.ok(output.data.subarray(lead+input.data.length).every(v=>v===input.silence));
  assert.ok(output.duration>=.25+Math.max(.8,input.duration)+.001-1e-9);
 }
 assert.throws(()=>paddedSfxWav(Buffer.from('bad')),/Invalid/);
 assert.throws(()=>paddedSfxWav(wave().subarray(0,55)),/Truncated/);
 assert.throws(()=>paddedSfxWav(wave(),{lead:NaN}),/Invalid/);
});

test('built early/middle/end SFX slots fit ffprobe duration and refresh legacy assets without moving cues',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cos-sfx-tail-'));
 try{
  const sourcePath=new URL('../editor/assets/sfx/pop.wav',import.meta.url),source=fs.readFileSync(sourcePath),input=readSfxWav(source);
  const legacy=path.join(dir,'assets/sfx/pop-d.wav');fs.mkdirSync(path.dirname(legacy),{recursive:true});
  fs.writeFileSync(legacy,wave({frames:370}));fs.utimesSync(legacy,new Date('2030-01-01'),new Date('2030-01-01'));
  const project={source:{video:'a.mp4',hasAudio:false},segments:[{id:'a',in:0,out:3}],captions:{enabled:false},audio:{autoSfx:false,sfxVolume:.25,sfx:[{kind:'pop',at:0},{kind:'pop',at:1.5},{kind:'pop',at:2.98}]}};
  const before=structuredClone(project),html=buildHtml(project,dir),bytes=fs.readFileSync(legacy),output=readSfxWav(bytes);
  assert.deepEqual(project,before);assert.deepEqual(fs.readFileSync(sourcePath),source);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',legacy],{encoding:'utf8',windowsHide:true}));
  assert.ok(Math.abs(Number(probe.format.duration)-output.duration)<.00001);
  const cues=[...html.matchAll(/<audio id="sfx\d+"[^>]*>/g)].map(([tag])=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,k,v])=>[k,v])));
  assert.equal(cues.length,3);
  cues.forEach((cue,i)=>{
   const start=Number(cue['data-start']),skip=Number(cue['data-media-start']||0),duration=Number(cue['data-duration']);
   assert.ok(skip+duration<=output.duration+.000001);
   assert.ok(Math.abs(start+.25-skip-project.audio.sfx[i].at)<.00001);
   assert.ok(duration>0);assert.ok(start+duration<=3+.000001);
  });
  assert.deepEqual(output.data.subarray(Math.round(output.rate*.25)*output.align,Math.round(output.rate*.25)*output.align+input.data.length),input.data);
  // Repeat build is stable and does not rewrite the generated asset.
  const timestamp=fs.statSync(legacy).mtimeMs;assert.equal(buildHtml(project,dir),html);assert.equal(fs.statSync(legacy).mtimeMs,timestamp);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('all bundled SFX can be padded without changing the recorded sound',()=>{
 const dir=new URL('../editor/assets/sfx/',import.meta.url);
 const names=fs.readdirSync(dir).filter(name=>name.endsWith('.wav'));assert.ok(names.length>0);
 for(const name of names){
  const source=fs.readFileSync(new URL(name,dir)),input=readSfxWav(source),output=readSfxWav(paddedSfxWav(source));
  const prefix=Math.round(input.rate*.25)*input.align;
  assert.deepEqual(output.data.subarray(prefix,prefix+input.data.length),input.data,name);
  assert.ok(output.duration>=.25+Math.max(.8,Math.round(input.duration*1000)/1000),name);
 }
});
