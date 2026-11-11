import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {parseChatSources,inspectChatSources} from '../src/services/chat-sources.mjs';
test('inline NAS and quoted sources are recognized without line breaks',()=>{
 const input=String.raw`Dựng từ A-roll: "\\ChungAuto\Quay Dựng\Video gốc" dùng mẫu đã chọn, broll ở đây \\ChungAuto\Quay Dựng 2\BROLL\XE ĐỘ COMBO`;
 assert.deepEqual(parseChatSources(input,{platform:'win32'}),[
  {path:String.raw`\\ChungAuto\Quay Dựng\Video gốc`,role:'aroll'},
  {path:String.raw`\\ChungAuto\Quay Dựng 2\BROLL\XE ĐỘ COMBO`,role:'broll'}
 ]);
 assert.equal(parseChatSources('https://example.com/video và ../relative',{platform:'win32'}).length,0);
});
test('inspection resolves prose using existing final component without selecting parent directories',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-inline-'));
 try{
  const folder=path.join(root,'Video gốc có dấu');fs.mkdirSync(folder);fs.writeFileSync(path.join(folder,'a.mp4'),'synthetic');
  const [source]=await inspectChatSources('Dựng từ '+folder+' dựng cho tôi video này');
  assert.equal(source.status,'ready');assert.equal(source.path,folder);assert.ok(source.detectedFrom);assert.equal(source.files.length,1);
  const [missing]=await inspectChatSources('A-roll: '+path.join(root,'không tồn tại')+' dựng cho tôi');assert.equal(missing.status,'error');
  const [quoted]=await inspectChatSources('A-roll: "'+folder+' không tồn tại"');assert.equal(quoted.status,'error');
  assert.equal(fs.readFileSync(path.join(folder,'a.mp4'),'utf8'),'synthetic');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('chat source parsing preserves UNC/local paths, roles, Vietnamese and quoted prose',()=>{
 const text='Dựng quảng cáo\nA-roll: \\\\ChungAuto\\Quay Dựng 2\\A roll\nB-roll: "D:\\Kho cảnh trám" dùng sản phẩm\nhttps://example.com/video\nB-roll: "D:\\Kho cảnh trám"';
 assert.deepEqual(parseChatSources(text,{platform:'win32'}),[{path:'\\\\ChungAuto\\Quay Dựng 2\\A roll',role:'aroll'},{path:'D:\\Kho cảnh trám',role:'broll'}]);
 assert.deepEqual(parseChatSources('A-roll: ../relative',{platform:'win32'}),[]);
});
test('source inspection bounds listings, reports actual errors and leaves original files unchanged',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-nguon-'));
 try{
  fs.writeFileSync(path.join(root,'cảnh trám.mp4'),'synthetic');fs.writeFileSync(path.join(root,'note.txt'),'not media');fs.mkdirSync(path.join(root,'sub'));
  const result=await inspectChatSources('B-roll: '+root+'\nA-roll: '+path.join(root,'missing'),{platform:process.platform});
  assert.equal(result[0].status,'ready');assert.equal(result[0].files.length,1);assert.equal(result[0].subdirectories,1);assert.equal(result[0].recursive,true);
  assert.equal(result[1].status,'error');assert.equal(fs.readFileSync(path.join(root,'cảnh trám.mp4'),'utf8'),'synthetic');
  const limited=await inspectChatSources(root,{maxEntries:1});assert.equal(limited[0].truncated,true);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('B-roll catalogs nested media within a shared entry/depth budget; A-roll stays shallow',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-nested-'));
 try{
  fs.mkdirSync(path.join(root,'one','two','three','four'),{recursive:true});
  fs.writeFileSync(path.join(root,'one','two','b.mp4'),'nested');fs.writeFileSync(path.join(root,'one','two','three','four','deep.mp4'),'deep');
  const [b]=await inspectChatSources('B-roll: "'+root+'"');assert.equal(b.files.length,1);assert.equal(b.recursive,true);assert.equal(b.truncated,true);assert.equal(b.files[0].path,path.join(root,'one','two','b.mp4'));
  const [a]=await inspectChatSources('A-roll: "'+root+'"');assert.equal(a.files.length,0);assert.equal(a.recursive,false);
  const [limited]=await inspectChatSources('B-roll: "'+root+'"',{maxEntries:1});assert.equal(limited.truncated,true);assert.equal(limited.files.length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
