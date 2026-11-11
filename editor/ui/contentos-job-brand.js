export function jobBrandControls({checked=false,disabled=false,onChange=()=>{}}={}){
 const host=document.createElement('label');host.className='cos-job-brand';host.style.cssText='display:block;margin:8px 0';
 const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.disabled=disabled;input.setAttribute('aria-label','Dùng nhận diện workspace cho lượt AI');
 input.addEventListener('change',()=>onChange(input.checked));
 host.append(input,document.createTextNode(' Dùng nhận diện workspace cho lượt AI'));
 const hint=document.createElement('small');hint.style.display='block';hint.textContent='Màu, font và kiểu phụ đề lưu tại Studio → Thương hiệu. Chốt phiên bản khi giao việc; giữ bố cục/CSS của mẫu. Bỏ chọn để giữ cách dựng hiện tại.';host.append(hint);return host;
}
