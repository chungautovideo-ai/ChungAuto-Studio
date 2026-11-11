import fs from 'node:fs';
import path from 'node:path';
const from=path.resolve('workspace/content/2026-11-05/contentos-qa-real-codex-preset-batch-3'),to=path.resolve('workspace/content/2026-11-05/contentos-qa-component-routing-3');
if(fs.existsSync(to))throw Error('QA destination exists');
fs.mkdirSync(to,{recursive:true});
const p=JSON.parse(fs.readFileSync(path.join(from,'project.json')));
fs.mkdirSync(path.join(to,'inputs'),{recursive:true});
fs.copyFileSync('workspace/cache/face-q2-sample.mp4',path.join(to,'inputs/raw.mp4'));
p.source={video:'inputs/raw.mp4'};p.segments=[{id:'s',in:0,out:1,keep:true}];p.audio={};p.brolls=[];p.captions={lines:[]};p.camera={};
p.title='QA component routing';
p.texts=[{id:'same',title:'QA Native',at:1,dur:3,fx:'words'}];
p.blocks=[{id:'same',group:'chu',name:'QA HTML text',at:1,dur:3,layer:'front',html:'<div class="qa">HTML TITLE</div>',css:':scope .qa{position:absolute;top:300px;left:100px;color:white;font:700 60px sans-serif}'},{id:'g',group:'dohoa',name:'QA Graphic',at:1,dur:3,layer:'front',html:'<div>GRAPHIC</div>',css:''}];
fs.writeFileSync(path.join(to,'project.json'),JSON.stringify(p,null,2));
console.log(to);

