export const END_CARD_DEFAULT={enabled:false,duration:3,title:'Kết nối với chúng tôi',subtitle:'',contact:'',logo:'',background:'#101113',accent:'#FFD21E'};
export function normalizeEndCard(value){
 if(value==null)return null;
 if(typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(END_CARD_DEFAULT,k)))throw new Error('Cấu hình đoạn kết không hợp lệ.');
 const card={...END_CARD_DEFAULT,...value};
 if(typeof card.enabled!=='boolean'||!Number.isFinite(card.duration)||card.duration<1||card.duration>12)throw new Error('Đoạn kết cần bật/tắt rõ ràng và thời lượng1–12giây.');
 for(const [key,max] of Object.entries({title:60,subtitle:140,contact:100,logo:500}))if(typeof card[key]!=='string'||card[key].length>max||/[<>]/.test(card[key]))throw new Error('Nội dung đoạn kết quá dài hoặc không hợp lệ: '+key);
 for(const key of ['title','subtitle','contact'])card[key]=card[key].replace(/\s+/g,' ').trim();
 if(card.enabled&&!card.title.trim())throw new Error('Nhập tiêu đề cho đoạn kết.');
 for(const key of ['background','accent'])if(!/^#[a-f0-9]{6}$/i.test(card[key]))throw new Error('Màu đoạn kết dùng mã HEX6chữ số.');
 if(card.logo&&(!/^(inputs|assets)\/[\p{L}\p{N}_ .\/-]+\.(png|jpe?g|webp)$/iu.test(card.logo)||card.logo.split('/').some(p=>p==='..'||p==='')))throw new Error('Chọn ảnh logo local trong tư liệu dự án.');
 return card;
}
export function endCardDuration(project){const card=normalizeEndCard(project.endCard);return card?.enabled?card.duration:0;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function endCardHtml(project,start,W,H){
 const card=normalizeEndCard(project.endCard);if(!card?.enabled)return '';
 const wide=W>H,titleSize=wide?84:82,subSize=wide?38:40;
 return `<section id="contentos-end-card" data-start="${start}" data-duration="${card.duration}" data-track-index="9900" style="position:absolute;inset:0;z-index:100000;background:${card.background};color:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden"><div class="end-card-content" style="width:80%;max-height:84%;text-align:center;display:flex;flex-direction:column;align-items:center;gap:${wide?24:36}px;overflow:hidden;font-family:var(--f-sub),sans-serif">${card.logo?`<img src="${esc(card.logo)}" style="max-width:65%;height:${wide?140:180}px;object-fit:contain;flex-shrink:0" alt="">`:''}<div style="width:96px;height:8px;background:${card.accent};flex-shrink:0"></div><h1 style="margin:0;font-family:var(--f-title),sans-serif;font-size:${titleSize}px;line-height:1.16;overflow-wrap:anywhere;white-space:pre-wrap;color:${card.accent}">${esc(card.title)}</h1>${card.subtitle?`<p style="margin:0;font-size:${subSize}px;line-height:1.35;overflow-wrap:anywhere;white-space:pre-wrap">${esc(card.subtitle)}</p>`:''}${card.contact?`<p style="margin:0;padding:18px 24px;border:2px solid ${card.accent};border-radius:14px;max-width:100%;box-sizing:border-box;font-size:${wide?30:34}px;line-height:1.3;overflow-wrap:anywhere;white-space:pre-wrap">${esc(card.contact)}</p>`:''}</div></section>`;
}
