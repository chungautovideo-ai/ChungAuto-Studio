import {normalizeAutomotiveOptions} from '/lib/automotive-options.js';
export function automotiveOptionsControl({value,onChange,enabled=false}={}){
 const root=document.createElement('details');root.className='setup-options cos-automotive-options';root.dataset.automotiveOptions='';
 const summary=document.createElement('summary');summary.textContent='Tùy chọn dựng ngành xe';root.append(summary);
 const body=document.createElement('div');body.className='setup-options-body';root.append(body);
 const label=document.createElement('label'),toggle=document.createElement('input');label.className='cos-auto-toggle';toggle.type='checkbox';toggle.checked=enabled;toggle.setAttribute('aria-label','Dùng tùy chọn dựng ngành xe');label.append(toggle,document.createTextNode('Áp dụng lựa chọn riêng cho lượt dựng này'));body.append(label);
 const fields=document.createElement('div');fields.className='cos-auto-fields';body.append(fields);
 const current=normalizeAutomotiveOptions(value||{}),controls={};
 const groups=[['color','Màu hình',[['keep','Giữ màu đang có'],['natural','Preset tự nhiên nhẹ · A-roll và B-roll'],['off','Không dùng grade']]],['beauty','Làm đẹp',[['keep','Giữ thiết lập đang có'],['off','Không dùng làm đẹp']]],['watermark','Watermark / logo',[['keep','Giữ logo đã chốt'],['off','Không thêm watermark']]],['cta','Outro / CTA',[['keep','Theo yêu cầu và mẫu'],['off','Không thêm CTA / end-card']]],['music','Nhạc nền',[['keep','Giữ bài đã chọn / theo mẫu'],['off','Không dùng nhạc nền']]],['sfx','Hiệu ứng âm thanh',[['keep','Theo mức chung bên dưới'],['tat','Tắt toàn bộ SFX'],['vua','Vừa'],['nhieu','Nhiều']]]];
 const emit=()=>{fields.hidden=!toggle.checked;onChange?.(toggle.checked?normalizeAutomotiveOptions(Object.fromEntries(Object.entries(controls).map(([key,el])=>[key,el.value]))):null);};
 for(const [key,title,values] of groups){const l=document.createElement('label');l.append(document.createTextNode(title));const select=document.createElement('select');select.dataset.automotiveField=key;select.setAttribute('aria-label',title+' ngành xe');for(const [v,t] of values){const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o);}select.value=current[key];select.onchange=emit;controls[key]=select;l.append(select);fields.append(l);}
 const hint=document.createElement('p');hint.textContent='Màu tự nhiên là preset nhẹ. Chuẩn hóa HDR/Log ở inspector Video/Cảnh trám; vùng người và da ở Bộ lọc → Làm đẹp. Che biển số theo vùng ở đoạn Video hoặc Cảnh trám, cần đánh dấu và kiểm lại. Đoạn kết / CTA ở Thương hiệu.';fields.append(hint);
 toggle.onchange=emit;fields.hidden=!enabled;return root;
}
