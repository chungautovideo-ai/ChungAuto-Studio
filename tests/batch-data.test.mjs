import test from 'node:test';import assert from 'node:assert/strict';
import {parseBatchCsv,applyBatchVariables,normalizeVariables} from '../editor/lib/batch-data.mjs';
test('CSV handles quoted commas/newlines/escaped quotes and validates schema before batch dispatch',()=>{
 const rows=parseBatchCsv('\uFEFFtitle,format,product,cta\r\n"Mẫu, A",9:16,"Xe ""A""","Gọi\nngay"\r\nMẫu B,16:9,Xe B,Đặt lịch');
 assert.equal(rows.length,2);assert.equal(rows[0].variables.product,'Xe "A"');assert.equal(rows[0].variables.cta,'Gọi\nngay');
 for(const input of ['title,format\na,1:1','title,title,format\na,b,9:16','title,format\n"bad,9:16','title,format\na,9:16,extra','title,format,bad-key\na,9:16,x'])assert.throws(()=>parseBatchCsv(input));
 assert.throws(()=>normalizeVariables({name:9}));
});
test('batch data changes editable text only and rejects missing/unused variables without mutating source',()=>{
 const project={texts:[{id:'a',title:'{{product}}',label:'{{cta}}',sub:'{{product}}'}],blocks:[{html:'{{product}}'}],captions:{lines:[{text:'{{product}}'}]}};
 const next=applyBatchVariables(project,{product:'Sản phẩm A',cta:'Gọi ngay'});assert.equal(next.texts[0].title,'Sản phẩm A');assert.equal(next.texts[0].label,'Gọi ngay');assert.equal(next.blocks[0].html,'{{product}}');assert.equal(project.texts[0].title,'{{product}}');
 assert.throws(()=>applyBatchVariables(project,{product:'A'}),/Thiếu biến cta/);assert.throws(()=>applyBatchVariables(project,{product:'A',cta:'B',other:'C'}),/Không tìm thấy/);
});
