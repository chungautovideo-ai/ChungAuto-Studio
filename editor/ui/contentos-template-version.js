export function jobTemplateVersion(job){
 const snapshot=job?.templateSnapshot;
 if(!snapshot)return null;
 const details=document.createElement('details');details.className='cos-template-version';details.style.cssText='margin:10px 0;overflow-wrap:anywhere;text-align:left';
 const add=(tag,text)=>{const el=document.createElement(tag);el.textContent=text;return el;};
 details.append(add('summary','Mẫu đã chốt: '+(snapshot.name||snapshot.id||'Mẫu dựng')));
 details.append(add('p','Việc này dùng bản quy tắc và preset đã lưu lúc giao AI. Sửa mẫu trong thư viện không thay đổi bản này.'));
 details.append(add('p','Mã mẫu: '+snapshot.id));
 if(snapshot.createdAt){const date=new Date(snapshot.createdAt);details.append(add('p','Đã chốt: '+(Number.isNaN(date.getTime())?snapshot.createdAt:date.toLocaleString('vi-VN'))));}
 const hashes=add('details','');hashes.append(add('summary','Thông tin kiểm tra phiên bản'),add('p','Thông số: '+snapshot.templateHash),add('p',snapshot.skillHash?'Quy tắc: '+snapshot.skillHash:'Mẫu không có file quy tắc riêng.'));details.append(hashes);
 details.append(add('small','Bản chốt chưa bao gồm toàn bộ font, media và các skill được tham chiếu bên ngoài.'));
 return details;
}
