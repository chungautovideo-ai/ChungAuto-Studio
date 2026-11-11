import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {readNewsArticle} from '../src/services/news-ingest.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('Studio reader extracts Vietnamese article and cited sentences without executing HTML',async()=>{
 const text='Sản phẩm thử nghiệm được giới thiệu hôm nay. Nhóm nghiên cứu công bố có 20 mẫu được kiểm tra trong tháng này.';
 const result=await readNewsArticle(root,{url:'https://example.com/news',html:'<!doctype html><html><head><title>Tin sản phẩm</title></head><body><article><h1>Tin sản phẩm mới</h1><p>'+text+'</p><p>Nội dung minh họa có nhiều đoạn để kiểm tra tính đầy đủ của bộ trích xuất bài báo. Người biên tập vẫn phải đọc lại nguồn và đối chiếu thông tin trước khi duyệt kịch bản. Đây là dữ liệu tổng hợp dành riêng cho kiểm tra, không phải tin thực tế về bất kỳ sản phẩm nào.</p><script>throw new Error("do not execute")</script></article></body></html>'});
 assert.ok(result.article.text.includes(text));assert.ok(!result.article.text.includes('do not execute'));assert.ok(result.facts.count>0);
 for(const fact of result.facts.facts.filter(f=>f.span))assert.equal(result.article.text.slice(...fact.span),fact.text);
 assert.ok(result.article.warnings.some(w=>w.includes('HTML do người dùng')));
 await assert.rejects(readNewsArticle(root,{url:'file:///secret'}));
 await assert.rejects(readNewsArticle(root,{url:'https://user:password@example.com'}));
 await assert.rejects(readNewsArticle(root,{url:'http://127.0.0.1:5180/'}));
 await assert.rejects(readNewsArticle(root,{url:'https://example.com',html:'x'.repeat(2*1024**2+1)}));
});
