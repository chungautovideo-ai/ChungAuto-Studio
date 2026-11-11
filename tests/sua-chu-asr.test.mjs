import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {docTuDien,promptArgs,suaChu} from '../editor/lib/sua-chu-asr.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),tuDien=docTuDien(ROOT);
const W=text=>text.split(' ').map((word,i)=>({word,start:i,end:i+0.8}));
const text=r=>r.words.map(w=>w.word).join(' ');
test('sửa từ riêng ChungAuto, giữ mốc từng từ và dấu câu',()=>{
 const input=W('liên hệ ở Trung Auto, cảm ơn anh em'),r=suaChu(input,tuDien);
 assert.equal(text(r),'liên hệ ở Chung Auto, cảm ơn anh em');
 assert.deepEqual(r.words.map(w=>[w.start,w.end]),input.map(w=>[w.start,w.end]));
 assert.equal(input[3].word,'Trung');assert.deepEqual(r.fixes,[{tu:'Trung Auto,',thanh:'Chung Auto,',start:3}]);
});
test('gộp/tách từ chia lại thời gian trong khoảng gốc',()=>{
 const r=suaChu(W('xe Vin Fast đẹp và đèn bi lét'),tuDien);
 assert.equal(text(r),'xe VinFast đẹp và đèn bi LED');
 assert.deepEqual(r.words[1],{word:'VinFast',start:1,end:2.8});
});
test('không sửa cụm có nghĩa khác hoặc từ nằm trong từ khác',()=>{
 for(const s of['ngồi trong ô tô','dùng chung ô tô','Trungautomatic','Chung cư'])assert.equal(text(suaChu(W(s),tuDien)),s);
});
test('xoá câu Whisper bịa khi im lặng, không ảnh hưởng lời thật',()=>{
 const r=suaChu(W('Cảm ơn anh em. Hãy subscribe cho kênh Ghiền Mì Gõ Để không bỏ lỡ những video hấp dẫn'),tuDien);
 assert.equal(text(r),'Cảm ơn anh em.');assert.equal(r.fixes.length,1);
});
test('gợi từ vựng chỉ cho tiếng Việt; từ điển trống không đổi gì',()=>{
 assert.equal(promptArgs(tuDien,'vi')[0],'--prompt');assert.match(promptArgs(tuDien,'vi')[1],/Chung Auto/);
 assert.deepEqual(promptArgs(tuDien,'en'),[]);assert.deepEqual(suaChu(W('Trung Auto'),{}).words,W('Trung Auto'));
 assert.throws(()=>suaChu([],{sua:[['(','x']]}),/Quy tắc từ điển/);
});
