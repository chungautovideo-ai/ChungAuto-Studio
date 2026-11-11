export function newsProjectContext(dir,options={}){
 const host=document.createElement('details');host.className='cos-news-context';
 const summary=document.createElement('summary');summary.textContent='Kịch bản tin của dự án';host.append(summary);
 const status=document.createElement('p'),text=document.createElement('pre');text.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto';status.textContent='Đang đọc kịch bản đã gắn…';host.append(status,text);
 fetch('/api/v1/news/project?dir='+encodeURIComponent(dir)).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}).then(({brief})=>{
  if(!brief){status.textContent='Chưa gắn kịch bản. Chọn và lưu trong thiết lập dự án trên Home.';return;}
  status.textContent=brief.payload.title+' · v'+brief.version+' · đã duyệt. Lượt sửa sẽ giữ bản này; không tự thay lời đọc.';
  text.textContent=brief.payload.script+'\n\nNguồn: '+brief.payload.sources.map(s=>s.url).join('\n');
  const button=document.createElement('button');button.type='button';button.className='link';button.textContent='Mở lời đọc trong Giọng nói AI';button.onclick=async()=>{const {openVoiceTool}=await import('/ui/giong.js');await openVoiceTool({...options,initialText:brief.payload.script,newsBrief:brief});};host.append(button);
 }).catch(error=>{status.textContent=error.message;});return host;
}
